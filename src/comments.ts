import type { Config } from './config.js'
import type { RawComment } from './github.js'
import { buildFilter } from './profanity.js'

export type Comment = {
  id: string
  login: string
  profileUrl: string
  avatarUrl: string
  url: string
  createdAt: Date
  html: string
  text: string
  truncated: boolean
  avatarData?: string
}

export function normalize(raw: RawComment[], config: Config, owner: string): Comment[] {
  const blocked = new Set(config.blockedUsers)
  const filtered = buildFilter(config.blockedWords, config.filterProfanity)
  const out: Comment[] = []

  for (const c of raw) {
    if (c.isMinimized) continue
    if (!c.author) continue
    if (blocked.has(c.author.login.toLowerCase())) continue
    if (needsApproval(c, config) && !approvedBy(c, owner)) continue
    if (filtered(c.body ?? '')) continue

    const { html, truncated } = sanitize(c.body, config.messageMaxLength)
    if (!html) continue

    out.push({
      id: c.id,
      login: c.author.login,
      profileUrl: c.author.url,
      avatarUrl: c.author.avatarUrl,
      url: c.url,
      createdAt: new Date(c.createdAt),
      html,
      text: plainText(c.body, config.messageMaxLength),
      truncated,
    })
  }

  out.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  return out.slice(0, config.maxComments)
}

function needsApproval(c: RawComment, config: Config) {
  if (config.moderation !== 'approved') return false
  if (!config.approvedSince) return true
  return new Date(c.createdAt) >= new Date(config.approvedSince)
}

function approvedBy(c: RawComment, owner: string) {
  const target = owner.toLowerCase()
  return (c.reactions?.nodes ?? []).some(n => n?.user?.login.toLowerCase() === target)
}

const maxLines = 8

export function plainText(body: string, maxLength: number) {
  return clamp(flatten(strip(body ?? '')), maxLength).text
}

function flatten(text: string) {
  return text
    .replace(linkPattern, (whole, label: string, href: string) => (safeUrl(href) ? label : whole))
    .replace(urlPattern, url => (safeUrl(url) ? shorten(url) : url))
    .replace(codePattern, '$1')
    .replace(/\*\*(?!\s)([^*]+?)(?<!\s)\*\*/g, '$1')
    .replace(/~~(?!\s)([^~]+?)(?<!\s)~~/g, '$1')
    .replace(/(?<![\w*])\*(?!\s)([^*\n]+?)(?<!\s)\*(?![\w*])/g, '$1')
    .replace(/(?<![\w_])_(?!\s)([^_\n]+?)(?<!\s)_(?![\w_])/g, '$1')
}

export function sanitize(body: string, maxLength: number): { html: string; truncated: boolean } {
  const plain = strip(body ?? '')
  if (!plain) return { html: '', truncated: false }

  const cut = clamp(plain, maxLength)
  return { html: inline(cut.text), truncated: cut.truncated }
}

function strip(body: string) {
  return body
    .replace(/\r\n?/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, '')
    .replace(/[\u200b\u200e\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff\ue000-\uf8ff]/g, '')
    .replace(/!\[([^\]\n]*)\]\([^)\n]*\)/g, '$1')
    .replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
    .replace(/^[ \t]*>[ \t]?/gm, '')
    .replace(/^[ \t]*(?:[-*_][ \t]*){3,}$/gm, '')
    .replace(/```+/g, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function clamp(text: string, maxLength: number) {
  let truncated = false
  let out = text

  const lines = out.split('\n')
  if (lines.length > maxLines) {
    out = lines.slice(0, maxLines).join('\n')
    truncated = true
  }

  if ([...out].length > maxLength) {
    const chars = [...out].slice(0, maxLength)
    const space = chars.lastIndexOf(' ')
    out = chars.slice(0, space > maxLength * 0.6 ? space : chars.length).join('')
    truncated = true
  }

  return { text: out.replace(/[\s]+$/, ''), truncated }
}

const urlPattern = /\bhttps?:\/\/[^\s<>()\[\]"']+/gi
const linkPattern = /\[([^\]\n]{1,120})\]\(\s*([^)\s]{1,500})\s*\)/g
const codePattern = /`([^`\n]{1,200})`/g

function inline(text: string) {
  const slots: string[] = []
  const hold = (html: string) => {
    slots.push(html)
    return `\u0001${slots.length - 1}\u0001`
  }

  let out = text
    .replace(codePattern, (_, code: string) => hold(`<code>${escape(code)}</code>`))
    .replace(linkPattern, (whole, label: string, href: string) => {
      const safe = safeUrl(href)
      return safe ? hold(anchor(safe, escape(label))) : whole
    })
    .replace(urlPattern, url => {
      const safe = safeUrl(url)
      return safe ? hold(anchor(safe, escape(shorten(url)))) : url
    })

  out = escape(out)
  out = out
    .replace(/\*\*(?!\s)([^*]+?)(?<!\s)\*\*/g, '<b>$1</b>')
    .replace(/~~(?!\s)([^~]+?)(?<!\s)~~/g, '<s>$1</s>')
    .replace(/(?<![\w*])\*(?!\s)([^*\n]+?)(?<!\s)\*(?![\w*])/g, '<i>$1</i>')
    .replace(/(?<![\w_])_(?!\s)([^_\n]+?)(?<!\s)_(?![\w_])/g, '<i>$1</i>')

  out = breakLongWords(out)
  out = out.replace(/\n/g, '<br>')
  return out.replace(/\u0001(\d+)\u0001/g, (_, i: string) => slots[Number(i)] ?? '')
}

function anchor(href: string, label: string) {
  return `<a href="${escape(href)}">${label}</a>`
}

function safeUrl(raw: string): string | null {
  const trimmed = raw.replace(/[.,;:!?]+$/, '')
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  return url.toString()
}

function shorten(url: string) {
  const bare = url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return bare.length > 48 ? `${bare.slice(0, 47)}\u2026` : bare
}

function breakLongWords(html: string) {
  return html.replace(/[^\s<>&\u0001]{40,}/g, run => run.replace(/(.{24})/g, '$1<wbr>'))
}

const entities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}

export function escape(text: string) {
  return text.replace(/[&<>"]/g, ch => entities[ch]!)
}
