import { pixelCat } from '../src/art.js'
import type { Comment } from '../src/comments.js'
import { formatDate } from '../src/time.js'
import { artwork, boardWidth, type Draw, type Mode } from './artwork.js'
import type { Rendered, View } from './shared.js'
import { jitter, wrapText, xml } from './svg.js'

const ui = "Tahoma, Verdana, 'DejaVu Sans', Geneva, sans-serif"
const mono = "ui-monospace, Consolas, 'Courier New', monospace"

const skins = {
  dark: { face: '#c0c0c0', light: '#ffffff', shade: '#808080', dark: '#000000', bar: '#000080', barText: '#ffffff', text: '#000000', dim: '#4d4d4d', page: '#ffffff', title: '#e6edf3', note: '#9aa7b4' },
  light: { face: '#c0c0c0', light: '#ffffff', shade: '#808080', dark: '#000000', bar: '#000080', barText: '#ffffff', text: '#000000', dim: '#4d4d4d', page: '#ffffff', title: '#1f2328', note: '#57606a' },
}

const boxW = 380
const colX = [22, 452]
const lineH = 17
const perLine = 44
const maxLines = 4

const barH = 20
const insetY = 66
const catH = 150

export function win95(view: View): Rendered {
  return artwork(view, 'comments-win95', build(view))
}

function build(view: View): Draw {
  return (mode: Mode) => {
    const skin = skins[mode]
    const boxes: string[] = []
    const colY = [118, 158]

    view.comments.forEach((c, i) => {
      const rand = jitter(c.login)
      const col = i % 2
      const y = colY[col]!
      boxes.push(dialog(c, colX[col]! + (rand() - 0.5) * 12, y, skin))
      colY[col] = y + boxHeight(c) + 26
    })

    if (!view.comments.length) {
      boxes.push(`<text x="${colX[0]}" y="186" class="sub">No messages yet — be the first.</text>`)
      colY[0] = 240
    }

    const height = Math.round(Math.max(...colY) + catH)

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${boardWidth}" height="${height}" viewBox="0 0 ${boardWidth} ${height}" role="img" aria-label="${xml(view.config.title)}">
<style>
.title { font-family: ${ui}; font-size: 34px; font-weight: 700; letter-spacing: -0.5px; fill: ${skin.title}; }
.sub { font-family: ${mono}; font-size: 13px; fill: ${skin.note}; }
.bar { font-family: ${ui}; font-size: 11.5px; font-weight: 700; fill: ${skin.barText}; }
.ui { font-family: ${ui}; font-size: 11.5px; fill: ${skin.text}; }
.who { font-family: ${ui}; font-size: 12.5px; font-weight: 700; fill: ${skin.text}; }
.date { font-family: ${ui}; font-size: 10.5px; fill: ${skin.dim}; }
.msg { font-family: ${mono}; font-size: 12px; fill: ${skin.text}; }
</style>
<text x="24" y="54" class="title">${xml(view.config.title)}</text>
<text x="26" y="80" class="sub">// ${xml(view.config.subtitle)}</text>
${boxes.join('\n')}
<image href="${pixelCat}" x="${boardWidth - 250}" y="${height - catH + 14}" width="230" height="152"/>
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

function dialog(c: Comment, x: number, y: number, skin: (typeof skins)['dark']) {
  const lines = wrapText(c.text, perLine, maxLines)
  const h = boxHeight(c)
  const insetH = lines.length * lineH + 16

  const avatar = c.avatarData
    ? `<image href="${xml(c.avatarData)}" x="12" y="32" width="26" height="26" preserveAspectRatio="xMidYMid slice"/><rect x="12" y="32" width="26" height="26" fill="none" stroke="${skin.shade}"/>`
    : `<rect x="12" y="32" width="26" height="26" fill="${skin.shade}"/>`

  const controls = ['minimise', '□', '✕']
    .map((g, n) => {
      const bx = boxW - 58 + n * 17
      const glyph =
        g === 'minimise'
          ? `<rect x="${bx + 4}" y="14" width="7" height="2" fill="${skin.text}"/>`
          : `<text x="${bx + 7.5}" y="17" class="ui" text-anchor="middle" font-size="9">${xml(g)}</text>`
      return `${bevel(bx, 6, 15, 14, skin)}${glyph}`
    })
    .join(String.fromCharCode(10))

  return `<g transform="translate(${x.toFixed(1)} ${y})">
<rect x="4" y="5" width="${boxW}" height="${h}" fill="#000" opacity="0.28"/>
${bevel(0, 0, boxW, h, skin)}
<rect x="4" y="4" width="${boxW - 8}" height="${barH}" fill="${skin.bar}"/>
<circle cx="15" cy="14" r="5.5" fill="${skin.barText}"/>
<text x="27" y="18" class="bar">GitComment — Message</text>
${controls}
${avatar}
<text x="48" y="49" class="who">${xml(shortLogin(c.login))}</text>
<text x="${boxW - 14}" y="49" class="date" text-anchor="end">${xml(formatDate(c.createdAt))}</text>
${bevel(12, insetY, boxW - 24, insetH, skin, true)}
${lines.map((l, n) => `<text x="20" y="${insetY + 20 + n * lineH}" class="msg">${xml(l)}</text>`).join('\n')}
</g>`
}

const maxLogin = 26

function shortLogin(login: string) {
  return login.length > maxLogin ? `${login.slice(0, maxLogin - 1)}…` : login
}
