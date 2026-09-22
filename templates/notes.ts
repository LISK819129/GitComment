import type { Comment } from '../src/comments.js'
import { caveat } from '../src/font.js'
import { formatDate } from '../src/time.js'
import { artwork, boardWidth, type Draw, type Mode } from './artwork.js'
import type { Rendered, View } from './shared.js'
import { jitter, sans, wrapText, xml } from './svg.js'

const skins = {
  dark: { bg: '#0d1117', card: '#fbfaf5', text: '#2b3440', msg: '#333c47', dim: '#9aa3ad', edge: '#ddd8c9', title: '#e8eef6', hand: '#93a4b8', accent: '#f2d98a', rule: '#dcd7c8', shadow: 0.32 },
  light: { bg: '#f6f8fa', card: '#fffef9', text: '#2b3440', msg: '#333c47', dim: '#9aa3ad', edge: '#e4dfd0', title: '#3d4753', hand: '#7d8b9c', accent: '#d9a441', rule: '#dcd7c8', shadow: 0.16 },
}

const cardW = 300
const colX = [110, 456]
const pad = 18
const lineH = 18
const perLine = 38
const maxLines = 5

export function notes(view: View): Rendered {
  return artwork(view, 'comments', build(view))
}

function build(view: View): Draw {
  return (mode: Mode, background: boolean) => {
    const skin = skins[mode]
    const cards: string[] = []
    const colY = [140, 170]

    view.comments.forEach((c, i) => {
      const rand = jitter(c.login)
      const col = i % 2
      const y = colY[col]!
      cards.push(card(c, colX[col]! + (rand() - 0.5) * 14, y, i, rand, skin))
      colY[col] = y + cardHeight(c) + 24
    })

    if (!view.comments.length) {
      cards.push(`<text x="${colX[0]}" y="200" class="hand">nothing here yet — be the first.</text>`)
      colY[0] = 258
    }

    const height = Math.round(Math.max(...colY) + 24)

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${boardWidth}" height="${height}" viewBox="0 0 ${boardWidth} ${height}" role="img" aria-label="${xml(view.config.title)}">
<defs>
<filter id="soft" x="-20%" y="-20%" width="150%" height="150%"><feGaussianBlur stdDeviation="4"/></filter>
<style>
@font-face { font-family: 'GCHand'; src: url(data:font/woff2;base64,${caveat}) format('woff2'); }
.hand { font-family: 'GCHand', cursive; font-size: 19px; fill: ${skin.hand}; }
.title { font-family: 'GCHand', cursive; font-size: 38px; fill: ${skin.title}; }
.who { font-family: ${sans}; font-size: 12px; font-weight: 600; fill: ${skin.text}; }
.date { font-family: ${sans}; font-size: 10.5px; fill: ${skin.dim}; }
.msg { font-family: ${sans}; font-size: 12.5px; fill: ${skin.msg}; }
</style>
</defs>
${background ? `<rect width="${boardWidth}" height="${height}" fill="${skin.bg}"/>` : ''}
<text x="110" y="82" class="title">${xml(view.config.title)}</text>
<line x1="110" y1="94" x2="${110 + view.config.title.length * 13}" y2="94" stroke="${skin.accent}" stroke-width="2.5" stroke-linecap="round"/>
${cards.join('\n')}
<text x="858" y="76" text-anchor="end" class="hand">${xml(view.config.subtitle)}</text>
<g fill="none" stroke="${skin.hand}" stroke-width="1.6" stroke-linecap="round">
<path d="M712 92 q-10 28 -48 38"/>
<path d="M664 130 l13 3"/>
<path d="M664 130 l9 -9"/>
<path d="M70 348 q14 14 30 6"/>
<path d="M100 354 l-13 -1"/>
<path d="M100 354 l-7 11"/>
</g>
<text x="14" y="300" class="hand">cool</text><text x="14" y="322" class="hand">people</text><text x="14" y="344" class="hand">here</text>
<path d="M404 210 l4 9 10 1 -7 7 2 10 -9 -5 -9 5 2 -10 -7 -7 10 -1z" fill="none" stroke="${skin.accent}" stroke-width="1.5"/>
<path d="M790 250 q8 -10 16 0 q8 -10 16 0 q0 12 -16 22 q-16 -10 -16 -22z" fill="none" stroke="${skin.hand}" stroke-width="1.5"/>
</svg>`
  }
}

function cardHeight(c: Comment) {
  return 74 + wrapText(c.text, perLine, maxLines).length * lineH
}

function card(c: Comment, x: number, y: number, i: number, rand: () => number, skin: (typeof skins)['dark']) {
  const lines = wrapText(c.text, perLine, maxLines)
  const h = cardHeight(c)
  const tilt = (rand() - 0.5) * 6.5
  const cx = x + cardW / 2
  const cy = y + h / 2
  const tape = rand() > 0.45

  const avatar = c.avatarData
    ? `<clipPath id="av${i}"><circle cx="${pad + 13}" cy="${pad + 13}" r="13"/></clipPath><image href="${xml(c.avatarData)}" x="${pad}" y="${pad}" width="26" height="26" clip-path="url(#av${i})" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="${pad + 13}" cy="${pad + 13}" r="13" fill="${skin.edge}"/>`

  return `<g transform="rotate(${tilt.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)}) translate(${x.toFixed(1)} ${y})">
<rect x="2" y="3" width="${cardW}" height="${h}" rx="3" fill="#000" opacity="${skin.shadow}" filter="url(#soft)"/>
<rect width="${cardW}" height="${h}" rx="3" fill="${skin.card}"/>
${tape ? `<rect x="${cardW / 2 - 28}" y="-9" width="56" height="18" rx="1" fill="${skin.accent}" opacity="0.7" transform="rotate(${tilt > 0 ? -6 : 7} ${cardW / 2} 0)"/>` : ''}
${avatar}
<circle cx="${pad + 13}" cy="${pad + 13}" r="13" fill="none" stroke="${skin.edge}"/>
<text x="${pad + 36}" y="${pad + 17}" class="who">${xml(shortLogin(c.login))}</text>
<text x="${cardW - pad}" y="${pad + 16}" class="date" text-anchor="end">${xml(formatDate(c.createdAt))}</text>
${lines.map((l, n) => `<text x="${pad}" y="${pad + 46 + n * lineH}" class="msg">${xml(l)}</text>`).join('\n')}
<line x1="${pad}" y1="${h - 16}" x2="${pad + 58}" y2="${h - 16}" stroke="${skin.rule}" stroke-width="1.2"/>
</g>`
}

const maxLogin = 21

function shortLogin(login: string) {
  return login.length > maxLogin ? `${login.slice(0, maxLogin - 1)}…` : login
}
