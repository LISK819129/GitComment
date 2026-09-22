import { blossom, blossomTree, catsleep } from '../src/art.js'
import type { Comment } from '../src/comments.js'
import { caveat } from '../src/font.js'
import { formatDate } from '../src/time.js'
import { artwork, boardWidth, type Draw, type Mode } from './artwork.js'
import type { Rendered, View } from './shared.js'
import { jitter, sans, wrapText, xml } from './svg.js'

const skins = {
  dark: { bg: '#1d1418', card: '#fdf7f5', edge: '#e8d3d6', text: '#3b2f33', dim: '#a08f94', ink: '#e8b8c4', title: '#f3d3dc', tape: '#e8a9bb' },
  light: { bg: '#fdf4f6', card: '#fffdfc', edge: '#f0dade', text: '#4a3b40', dim: '#a89298', ink: '#8c6470', title: '#7a4f5c', tape: '#f4b8c8' },
}

const cardW = 330
const colX = [66, 434]
const pad = 18
const lineH = 17
const perLine = 40
const maxLines = 4

export function pink(view: View): Rendered {
  return artwork(view, 'comments-pink', build(view))
}

function build(view: View): Draw {
  return (mode: Mode, background: boolean) => {
    const skin = skins[mode]
    const cards: string[] = []
    const colY = [156, 184]

    view.comments.forEach((c, i) => {
      const rand = jitter(c.login)
      const col = i % 2
      const y = colY[col]!
      cards.push(card(c, colX[col]! + (rand() - 0.5) * 12, y, i, rand, skin))
      colY[col] = y + cardHeight(c) + 26
    })

    if (!view.comments.length) {
      cards.push(`<text x="${colX[0]}" y="216" class="hand" fill="${skin.dim}">nothing here yet — be the first.</text>`)
      colY[0] = 268
    }

    const height = Math.round(Math.max(...colY) + 30)

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${boardWidth}" height="${height}" viewBox="0 0 ${boardWidth} ${height}" role="img" aria-label="${xml(view.config.title)}">
<defs>
<filter id="pshadow" x="-20%" y="-20%" width="150%" height="150%"><feGaussianBlur stdDeviation="3.5"/></filter>
<style>
@font-face { font-family: 'GCHand'; src: url(data:font/woff2;base64,${caveat}) format('woff2'); }
.title { font-family: 'GCHand', cursive; font-size: 40px; fill: ${skin.title}; }
.hand { font-family: 'GCHand', cursive; font-size: 20px; fill: ${skin.ink}; }
.who { font-family: ${sans}; font-size: 12px; font-weight: 600; fill: ${skin.text}; }
.date { font-family: ${sans}; font-size: 10.5px; fill: ${skin.dim}; }
.msg { font-family: ${sans}; font-size: 12.5px; fill: ${skin.text}; }
</style>
</defs>
${background ? `<rect width="${boardWidth}" height="${height}" rx="8" fill="${skin.bg}"/>` : ''}
<image href="${blossomTree}" x="-24" y="-16" width="420" height="196" opacity="0.95"/>
<image href="${blossom}" x="${boardWidth - 250}" y="${height - 150}" width="150" height="119" opacity="0.5"/>
<image href="${catsleep}" x="${boardWidth - 214}" y="24" width="200" height="114"/>
<text x="44" y="82" class="title">${xml(view.config.title)}</text>
<path d="M44 96 q52 -10 104 0" stroke="${skin.tape}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<path d="M196 62 q7 -9 14 0 q7 -9 14 0 q0 11 -14 20 q-14 -9 -14 -20z" fill="none" stroke="${skin.tape}" stroke-width="1.8"/>
<text x="452" y="118" class="hand">${xml(view.config.subtitle)}</text>
<path d="M470 132 q7 -9 14 0 q7 -9 14 0 q0 11 -14 20 q-14 -9 -14 -20z" fill="none" stroke="${skin.tape}" stroke-width="1.8"/>
${cards.join('\n')}
</svg>`
  }
}

function cardHeight(c: Comment) {
  return 62 + wrapText(c.text, perLine, maxLines).length * lineH
}

function card(c: Comment, x: number, y: number, i: number, rand: () => number, skin: (typeof skins)['dark']) {
  const lines = wrapText(c.text, perLine, maxLines)
  const h = cardHeight(c)
  const tilt = (rand() - 0.5) * 4.5
  const cx = x + cardW / 2
  const cy = y + h / 2

  const avatar = c.avatarData
    ? `<clipPath id="p${i}"><circle cx="${pad + 12}" cy="${pad + 12}" r="12"/></clipPath><image href="${xml(c.avatarData)}" x="${pad}" y="${pad}" width="24" height="24" clip-path="url(#p${i})" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="${pad + 12}" cy="${pad + 12}" r="12" fill="${skin.edge}"/>`

  return `<g transform="rotate(${tilt.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)}) translate(${x.toFixed(1)} ${y})">
<rect x="2" y="3" width="${cardW}" height="${h}" rx="2" fill="#000" opacity="0.18" filter="url(#pshadow)"/>
<rect width="${cardW}" height="${h}" rx="2" fill="${skin.card}"/>
<rect x="${cardW / 2 - 30}" y="-8" width="60" height="17" fill="${skin.tape}" opacity="0.55" transform="rotate(${tilt > 0 ? -5 : 6} ${cardW / 2} 0)"/>
${avatar}
<text x="${pad + 32}" y="${pad + 16}" class="who">${xml(c.login)}</text>
<text x="${cardW - pad}" y="${pad + 15}" class="date" text-anchor="end">${xml(formatDate(c.createdAt))}</text>
${lines.map((l, n) => `<text x="${pad}" y="${pad + 42 + n * lineH}" class="msg">${xml(l)}</text>`).join('\n')}
<line x1="${pad}" y1="${h - 14}" x2="${pad + 54}" y2="${h - 14}" stroke="${skin.tape}" stroke-width="1.6" opacity="0.7"/>
</g>`
}
