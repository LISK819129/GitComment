import { pixelCat } from '../src/art.js'
import type { Comment } from '../src/comments.js'
import { formatDate } from '../src/time.js'
import { artwork, boardWidth, type Draw, type Mode } from './artwork.js'
import type { Rendered, View } from './shared.js'
import { jitter, wrapText, xml } from './svg.js'

const ui = "Tahoma, Verdana, 'DejaVu Sans', Geneva, sans-serif"
const mono = "ui-monospace, Consolas, 'Courier New', monospace"

const skins = {
  dark: { bg: '#3a6ea5', face: '#c0c0c0', light: '#ffffff', shade: '#808080', dark: '#000000', bar: '#000080', barText: '#ffffff', text: '#000000', dim: '#4d4d4d', page: '#ffffff', title: '#ffffff', note: '#c9d8e8' },
  light: { bg: '#d4e4f4', face: '#c0c0c0', light: '#ffffff', shade: '#808080', dark: '#000000', bar: '#000080', barText: '#ffffff', text: '#000000', dim: '#4d4d4d', page: '#ffffff', title: '#123a63', note: '#3c5a77' },
}

const boxW = 372
const colX = [34, 440]
const lineH = 17
const perLine = 44
const maxLines = 3

export function win95(view: View): Rendered {
  return artwork(view, 'comments-win95', build(view))
}

function build(view: View): Draw {
  return (mode: Mode, background: boolean) => {
    const skin = skins[mode]
    const boxes: string[] = []
    const colY = [126, 168]

    view.comments.forEach((c, i) => {
      const rand = jitter(c.login)
      const col = i % 2
      const y = colY[col]!
      boxes.push(dialog(c, colX[col]! + (rand() - 0.5) * 16, y, i, skin))
      colY[col] = y + boxHeight(c) + 24
    })

    if (!view.comments.length) {
      boxes.push(`<text x="${colX[0]}" y="190" class="ui" fill="${skin.note}">No messages yet — be the first.</text>`)
      colY[0] = 250
    }

    const height = Math.round(Math.max(...colY) + 20)

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${boardWidth}" height="${height}" viewBox="0 0 ${boardWidth} ${height}" role="img" aria-label="${xml(view.config.title)}">
<style>
.title { font-family: ${ui}; font-size: 34px; font-weight: 700; letter-spacing: -0.5px; fill: ${skin.title}; }
.sub { font-family: ${mono}; font-size: 13px; fill: ${skin.note}; }
.bar { font-family: ${ui}; font-size: 11.5px; font-weight: 700; fill: ${skin.barText}; }
.ui { font-family: ${ui}; font-size: 11.5px; fill: ${skin.text}; }
.who { font-family: ${ui}; font-size: 12px; font-weight: 700; fill: ${skin.text}; }
.date { font-family: ${ui}; font-size: 10.5px; fill: ${skin.dim}; }
.msg { font-family: ${mono}; font-size: 12px; fill: ${skin.text}; }
</style>
${background ? `<rect width="${boardWidth}" height="${height}" fill="${skin.bg}"/>` : ''}
<text x="34" y="58" class="title">${xml(view.config.title)}</text>
<text x="36" y="84" class="sub">// ${xml(view.config.subtitle)}</text>
<image href="${pixelCat}" x="${boardWidth - 172}" y="${height - 116}" width="150" height="99"/>
${boxes.join('\n')}
<path d="M${boardWidth - 232} ${height - 132} l0 18 4 -4 3 7 3 -1 -3 -7 5 0z" fill="${skin.light}" stroke="${skin.dark}" stroke-width="1.2" stroke-linejoin="round"/>
</svg>`
  }
}

function boxHeight(c: Comment) {
  return 92 + wrapText(c.text, perLine, maxLines).length * lineH
}

function bevel(x: number, y: number, w: number, h: number, s: (typeof skins)['dark'], inset = false) {
  const tl = inset ? s.shade : s.light
  const br = inset ? s.light : s.dark
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${inset ? s.page : s.face}"/>
<path d="M${x} ${y + h} L${x} ${y} L${x + w} ${y}" stroke="${tl}" stroke-width="2" fill="none"/>
<path d="M${x} ${y + h} L${x + w} ${y + h} L${x + w} ${y}" stroke="${br}" stroke-width="2" fill="none"/>`
}

function button(x: number, y: number, w: number, label: string, s: (typeof skins)['dark']) {
  return `${bevel(x, y, w, 21, s)}<text x="${x + w / 2}" y="${y + 14}" class="ui" text-anchor="middle">${xml(label)}</text>`
}

function dialog(c: Comment, x: number, y: number, i: number, skin: (typeof skins)['dark']) {
  const lines = wrapText(c.text, perLine, maxLines)
  const h = boxHeight(c)
  const bodyH = 26 + lines.length * lineH

  const avatar = c.avatarData
    ? `<image href="${xml(c.avatarData)}" x="12" y="34" width="28" height="28" preserveAspectRatio="xMidYMid slice"/><rect x="12" y="34" width="28" height="28" fill="none" stroke="${skin.shade}"/>`
    : `<rect x="12" y="34" width="28" height="28" fill="${skin.shade}"/>`

  const controls = ['_', '□', '✕']
    .map((g, n) => `${bevel(boxW - 56 + n * 17, 5, 15, 14, skin)}<text x="${boxW - 56 + n * 17 + 7.5}" y="${16}" class="ui" text-anchor="middle" font-size="9">${xml(g)}</text>`)
    .join('\n')

  return `<g transform="translate(${x.toFixed(1)} ${y})">
<rect x="3" y="4" width="${boxW}" height="${h}" fill="#000" opacity="0.25"/>
${bevel(0, 0, boxW, h, skin)}
<rect x="4" y="4" width="${boxW - 8}" height="20" fill="${skin.bar}"/>
<circle cx="14" cy="14" r="6" fill="${skin.barText}"/>
<text x="26" y="18" class="bar">GitComment — Message</text>
${controls}
${avatar}
<text x="50" y="46" class="who">${xml(c.login)}</text>
<text x="${boxW - 14}" y="46" class="date" text-anchor="end">${xml(formatDate(c.createdAt))}</text>
${bevel(12, 68, boxW - 24, bodyH, skin, true)}
${lines.map((l, n) => `<text x="20" y="${88 + n * lineH}" class="msg">${xml(l)}</text>`).join('\n')}
${button(12, h - 30, 74, '☆ Star', skin)}
${button(94, h - 30, 74, 'Reply', skin)}
<text x="${boxW - 14}" y="${h - 15}" class="date" text-anchor="end">Keep Building!</text>
</g>`
}
