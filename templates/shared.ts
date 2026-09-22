import type { Comment } from '../src/comments.js'
import type { Config } from '../src/config.js'
import { escape } from '../src/comments.js'
import { formatDate, fullDate } from '../src/time.js'

export type Asset = { path: string; content: string }

export type Rendered = { markdown: string; assets: Asset[] }

export type View = {
  config: Config
  comments: Comment[]
  discussionUrl: string
  totalCount: number
}

export function avatar(c: Comment, size: number) {
  return `<a href="${escape(c.profileUrl)}"><img src="${escape(c.avatarUrl)}" width="${size}" height="${size}" alt="${escape(c.login)}"></a>`
}

export function name(c: Comment) {
  return `<a href="${escape(c.profileUrl)}"><b>${escape(c.login)}</b></a>`
}

export function when(c: Comment) {
  return `<span title="${fullDate(c.createdAt)}">${formatDate(c.createdAt)}</span>`
}

export function body(c: Comment) {
  if (!c.truncated) return c.html
  return `${c.html}\u2026 <a href="${escape(c.url)}">read the rest</a>`
}

export function leave(view: View, label: string) {
  return `<a href="${escape(view.discussionUrl)}">${label}</a>`
}

export function older(view: View) {
  const hidden = view.totalCount - view.comments.length
  if (hidden <= 0) return ''
  return `<a href="${escape(view.discussionUrl)}">older messages (${hidden})</a>`
}

export function heading(config: Config) {
  return { title: escape(config.title), subtitle: escape(config.subtitle) }
}

export function plain(lines: string[]): Rendered {
  return { markdown: lines.join('\n'), assets: [] }
}
