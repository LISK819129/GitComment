import { blackCat, comicCity } from '../src/art.js'
import type { Comment } from '../src/comments.js'
import { formatDate } from '../src/time.js'
import { artwork, boardWidth, type Draw, type Mode } from './artwork.js'
import type { Rendered, View } from './shared.js'
import { jitter, sans, wrapText, xml } from './svg.js'

const skins = {
  dark: { bg: '#161512', card: '#f7f3e8', ink: '#12100c', text: '#1b1813', dim: '#6d6455', speech: '#f7f3e8', burst: '#f2b705', city: 0.5, halftone: '#ffffff', halftoneOpacity: 0.05 },
  light: { bg: '#f2ece0', card: '#fffdf6', ink: '#12100c', text: '#1b1813', dim: '#7a7162', speech: '#fffdf6', burst: '#f2b705', city: 0.85, halftone: '#12100c', halftoneOpacity: 0.05 },
}

const cardW = 372
const colX = [46, 452]
const pad = 20
const lineH = 18
const perLine = 42
const maxLines = 4

export function comic(view: View): Rendered {
  return artwork(view, 'comments-comic', build(view))
}

function build(view: View): Draw {
  return (mode: Mode, background: boolean) => {
    const skin = skins[mode]
    const cards: string[] = []
    const colY = [148, 176]

    view.comments.forEach((c, i) => {
      const rand = jitter(c.login)
      const col = i % 2
      const y = colY[col]!
      cards.push(card(c, colX[col]! + (rand() - 0.5) * 10, y, i, rand, skin))
      colY[col] = y + cardHeight(c) + 26
    })

    if (!view.comments.length) {
      cards.push(`<text x="${colX[0]}" y="210" class="bold" fill="${skin.dim}">NOTHING HERE YET — BE THE FIRST.</text>`)
      colY[0] = 262
    }

    const height = Math.round(Math.max(...colY) + 96)

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${boardWidth}" height="${height}" viewBox="0 0 ${boardWidth} ${height}" role="img" aria-label="${xml(view.config.title)}">
<defs>
<pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.1" fill="${skin.halftone}" opacity="${skin.halftoneOpacity}"/></pattern>
<style>
.title { font-family: ${sans}; font-size: 34px; font-weight: 800; letter-spacing: 1px; fill: ${skin.card}; }
.bold { font-family: ${sans}; font-size: 14px; font-weight: 800; letter-spacing: 0.6px; fill: ${skin.text}; }
.who { font-family: ${sans}; font-size: 12.5px; font-weight: 800; fill: ${skin.text}; }
.date { font-family: ${sans}; font-size: 10.5px; font-weight: 600; fill: ${skin.dim}; }
.msg { font-family: ${sans}; font-size: 13px; fill: ${skin.text}; }
</style>
</defs>
${background ? `<rect width="${boardWidth}" height="${height}" fill="${skin.bg}"/>` : ''}
<rect width="${boardWidth}" height="${height}" fill="url(#dots)"/>
<image href="${comicCity}" x="0" y="${height - 80}" width="${boardWidth}" height="80" opacity="${skin.city}"/>
<g transform="translate(40 34)">
<rect x="-10" y="-26" width="${20 + view.config.title.length * 21}" height="46" fill="${skin.ink}" transform="rotate(-1.2)"/>
<text x="4" y="8" class="title" transform="rotate(-1.2)">${xml(view.config.title.toUpperCase())}</text>
</g>
<g transform="translate(470 40)">
<path d="M0 0 h340 v56 h-286 l-22 20 v-20 H0 z" fill="${skin.speech}" stroke="${skin.ink}" stroke-width="2.5" stroke-linejoin="round"/>
<text x="18" y="24" class="bold">${xml(view.config.subtitle.toUpperCase().slice(0, 34))}</text>
<text x="18" y="44" class="bold">${xml(view.config.subtitle.toUpperCase().slice(34, 68))}</text>
</g>
<image href="${blackCat}" x="${boardWidth - 190}" y="${height - 152}" width="170" height="114"/>
<g transform="translate(${boardWidth - 300} ${height - 150})">
<path d="M0 0 h104 v34 h-78 l-16 14 v-14 H0 z" fill="${skin.speech}" stroke="${skin.ink}" stroke-width="2.2" stroke-linejoin="round"/>
<text x="14" y="22" class="bold" font-size="12">KEEP BUILDING!</text>
</g>
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
  const tilt = (rand() - 0.5) * 3.5
  const cx = x + cardW / 2
  const cy = y + h / 2

  const avatar = c.avatarData
    ? `<clipPath id="c${i}"><circle cx="${pad + 12}" cy="${pad + 12}" r="12"/></clipPath><image href="${xml(c.avatarData)}" x="${pad}" y="${pad}" width="24" height="24" clip-path="url(#c${i})" preserveAspectRatio="xMidYMid slice"/><circle cx="${pad + 12}" cy="${pad + 12}" r="12" fill="none" stroke="${skin.ink}" stroke-width="1.8"/>`
    : `<circle cx="${pad + 12}" cy="${pad + 12}" r="12" fill="none" stroke="${skin.ink}" stroke-width="1.8"/>`

  const burst = rand() > 0.5
    ? `<g transform="translate(${cardW - 6} 12)"><path d="M0 0 l14 -6 -5 11 13 2 -12 7 8 9 -14 -4 -2 13 -7 -12 -10 7 4 -13 -12 -3 12 -6z" fill="${skin.burst}" stroke="${skin.ink}" stroke-width="1.6" stroke-linejoin="round"/></g>`
    : ''

  return `<g transform="rotate(${tilt.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)}) translate(${x.toFixed(1)} ${y})">
<rect x="4" y="5" width="${cardW}" height="${h}" fill="${skin.ink}" opacity="0.85"/>
<rect width="${cardW}" height="${h}" fill="${skin.card}" stroke="${skin.ink}" stroke-width="2.5"/>
${avatar}
<text x="${pad + 32}" y="${pad + 16}" class="who">${xml(c.login)}</text>
<text x="${cardW - pad}" y="${pad + 15}" class="date" text-anchor="end">${xml(formatDate(c.createdAt))}</text>
${lines.map((l, n) => `<text x="${pad}" y="${pad + 44 + n * lineH}" class="msg">${xml(l)}</text>`).join('\n')}
${burst}
</g>`
}
