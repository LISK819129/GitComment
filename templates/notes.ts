import { caveat } from '../src/font.js'
import type { Comment } from '../src/comments.js'
import { relative } from '../src/time.js'
import { hash, jitter, sans, wrapText, xml } from './svg.js'
import type { Rendered, View } from './shared.js'
import { escape } from '../src/comments.js'

const width = 880
const cardW = 300
const colX = [110, 456]
const pad = 18
const lineH = 18
const perLine = 38
const maxLines = 5

export function notes(view: View): Rendered {
  const svg = board(view)
  const path = '.github/gitcomment/comments.svg'
  const src = `${path}?v=${hash(svg)}`

  const names = view.comments
    .map(c => `<a href="${escape(c.profileUrl)}">@${escape(c.login)}</a>`)
    .join(' \u00b7 ')

  const footer = [
    `<a href="${escape(view.discussionUrl)}">leave a message</a>`,
    view.totalCount > view.comments.length
      ? `<a href="${escape(view.discussionUrl)}">older messages (${view.totalCount - view.comments.length})</a>`
      : '',
  ]
    .filter(Boolean)
    .join(' \u00b7 ')

  const markdown = [
    `<a href="${escape(view.discussionUrl)}"><img src="${escape(src)}" alt="${escape(view.config.title)}" width="${width}"></a>`,
    '',
    `<sub>${names ? `${names} \u00b7 ` : ''}${footer}</sub>`,
  ].join('\n')

  return { markdown, assets: [{ path, content: svg }] }
}

const maxLogin = 21

function shortLogin(login: string) {
  return login.length > maxLogin ? `${login.slice(0, maxLogin - 1)}…` : login
}

function card(c: Comment, x: number, y: number, i: number, rand: () => number, now: Date) {
  const lines = wrapText(c.text, perLine, maxLines)
  const h = 74 + lines.length * lineH
  const tilt = (rand() - 0.5) * 6.5
  const cx = x + cardW / 2
  const cy = y + h / 2
  const tape = rand() > 0.45

  const avatar = c.avatarData
    ? `<image href="${xml(c.avatarData)}" x="${pad}" y="${pad}" width="26" height="26" clip-path="url(#av${i})" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="${pad + 13}" cy="${pad + 13}" r="13" fill="#e4e0d4"/>`

  return `<g transform="rotate(${tilt.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)}) translate(${x.toFixed(1)} ${y})">
<rect x="2" y="4" width="${cardW}" height="${h}" rx="3" fill="#000" opacity="0.32" filter="url(#soft)"/>
<rect width="${cardW}" height="${h}" rx="3" fill="#fbfaf5"/>
${tape ? `<rect x="${cardW / 2 - 28}" y="-9" width="56" height="18" rx="1" fill="#f2d98a" opacity="0.7" transform="rotate(${tilt > 0 ? -6 : 7} ${cardW / 2} 0)"/>` : ''}
<clipPath id="av${i}"><circle cx="${pad + 13}" cy="${pad + 13}" r="13"/></clipPath>
${avatar}
<circle cx="${pad + 13}" cy="${pad + 13}" r="13" fill="none" stroke="#ddd8c9"/>
<text x="${pad + 36}" y="${pad + 17}" class="who">${xml(shortLogin(c.login))}</text>
<text x="${cardW - pad}" y="${pad + 16}" class="ago" text-anchor="end">${xml(relative(c.createdAt, now))}</text>
${lines.map((l, n) => `<text x="${pad}" y="${pad + 46 + n * lineH}" class="msg">${xml(l)}</text>`).join('\n')}
<line x1="${pad}" y1="${h - 16}" x2="${pad + 58}" y2="${h - 16}" stroke="#dcd7c8" stroke-width="1.2"/>
</g>`
}

function board(view: View) {
  const { config, comments } = view
  const cards: string[] = []
  const colY = [140, 168]

  comments.forEach((c, i) => {
    const rand = jitter(c.login)
    const col = i % 2
    const y = colY[col]!
    const h = 74 + wrapText(c.text, perLine, maxLines).length * lineH
    cards.push(card(c, colX[col]! + (rand() - 0.5) * 14, y, i, rand, view.now))
    colY[col] = y + h + 24
  })

  if (!comments.length) {
    cards.push(
      `<text x="${colX[0]}" y="200" class="hand" fill="#8b9bb0">nothing here yet \u2014 be the first.</text>`,
    )
    colY[0] = 260
  }

  const height = Math.round(Math.max(...colY) + 24)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${xml(config.title)}">
<defs>
<filter id="soft" x="-20%" y="-20%" width="150%" height="150%"><feGaussianBlur stdDeviation="4"/></filter>
<style>
@font-face { font-family: 'GCHand'; src: url(data:font/woff2;base64,${caveat}) format('woff2'); }
.hand { font-family: 'GCHand', cursive; font-size: 19px; fill: #93a4b8; }
.title { font-family: 'GCHand', cursive; font-size: 38px; fill: #e8eef6; }
.who { font-family: ${sans}; font-size: 12px; font-weight: 600; fill: #2b3440; }
.ago { font-family: ${sans}; font-size: 10.5px; fill: #9aa3ad; }
.msg { font-family: ${sans}; font-size: 12.5px; fill: #333c47; }
</style>
</defs>
<rect width="${width}" height="${height}" fill="#0d1117"/>
<text x="110" y="82" class="title">${xml(config.title)}</text>
<line x1="110" y1="94" x2="${110 + config.title.length * 13}" y2="94" stroke="#f2d98a" stroke-width="2.5" stroke-linecap="round"/>
${cards.join('\n')}
<text x="540" y="78" class="hand">${xml(config.subtitle)}</text>
<g fill="none" stroke="#7e8ea3" stroke-width="1.6" stroke-linecap="round">
<path d="M624 92 q16 14 4 30"/><path d="M616 116 l12 8 -11 5"/>
<path d="M70 348 q14 14 30 6"/><path d="M92 344 l10 10 -12 4"/>
</g>
<text x="14" y="300" class="hand">cool</text><text x="14" y="322" class="hand">people</text><text x="14" y="344" class="hand">here</text>
<path d="M404 210 l4 9 10 1 -7 7 2 10 -9 -5 -9 5 2 -10 -7 -7 10 -1z" fill="none" stroke="#f2d98a" stroke-width="1.5"/>
<path d="M790 250 q8 -10 16 0 q8 -10 16 0 q0 12 -16 22 q-16 -10 -16 -22z" fill="none" stroke="#7e8ea3" stroke-width="1.5"/>
</svg>`
}
