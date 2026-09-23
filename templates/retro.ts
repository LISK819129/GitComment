import type { Comment } from '../src/comments.js'
import { formatDate } from '../src/time.js'
import { artwork, boardWidth, type Draw, type Mode } from './artwork.js'
import type { Rendered, View } from './shared.js'
import { wrapText, xml } from './svg.js'

const ui = "Verdana, Geneva, 'DejaVu Sans', sans-serif"
const mono = "'Courier New', Courier, monospace"

const skins = {
  dark: {
    page: '#c8d8ea', edge: '#1d3452', bar1: '#8fb2d8', bar2: '#4d7cb0',
    barText: '#08172b', panel: '#e4edf8', row: '#f8fbff', alt: '#eaf1fa',
    text: '#0e1d31', link: '#123d84', dim: '#4d6a8c', rule: '#9fb8d0',
    counter: '#0a0a0a', counterText: '#7dff7d', accent: '#c25a12',
  },
  light: {
    page: '#dfe8f5', edge: '#5b7ca8', bar1: '#b9d0ea', bar2: '#7ea6d4',
    barText: '#10233c', panel: '#eef4fb', row: '#ffffff', alt: '#f2f6fc',
    text: '#12243c', link: '#1a4fa0', dim: '#5d7a9c', rule: '#b8ccdf',
    counter: '#101010', counterText: '#f5f5f5', accent: '#d86a1c',
  },
}

const pad = 10
const barH = 34
const sideW = 168
const rowPad = 10
const lineH = 15
const perLine = 62
const maxLines = 3
const footerH = 26

const nav = ['Home', 'Guestbook', 'Projects', 'About Me', 'Links']

export function retro(view: View): Rendered {
  return artwork(view, 'comments-retro', build(view))
}

function build(view: View): Draw {
  return (mode: Mode) => {
    const skin = skins[mode]
    const rows: string[] = []
    let y = pad + barH + 8

    view.comments.forEach((c, i) => {
      rows.push(row(c, pad + sideW + 6, y, boardWidth - sideW - pad * 2 - 6, i, skin))
      y += rowHeight(c) + 6
    })

    if (!view.comments.length) {
      rows.push(
        `<text x="${pad + sideW + 20}" y="${y + 24}" class="dim">No entries yet. Be the first to sign!</text>`,
      )
      y += 60
    }

    const height = Math.round(Math.max(y, pad + barH + 214) + footerH + pad + 4)
    const innerW = boardWidth - pad * 2

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${boardWidth}" height="${height}" viewBox="0 0 ${boardWidth} ${height}" role="img" aria-label="${xml(view.config.title)}">
<defs>
<linearGradient id="rbar" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${skin.bar1}"/><stop offset="1" stop-color="${skin.bar2}"/>
</linearGradient>
<style>
.h { font-family: ${ui}; font-size: 17px; font-weight: 700; fill: ${skin.barText}; }
.sub { font-family: ${ui}; font-size: 11px; fill: ${skin.barText}; }
.nav { font-family: ${ui}; font-size: 11.5px; fill: ${skin.link}; }
.navh { font-family: ${ui}; font-size: 11.5px; font-weight: 700; fill: ${skin.text}; }
.who { font-family: ${ui}; font-size: 11.5px; font-weight: 700; fill: ${skin.link}; }
.date { font-family: ${ui}; font-size: 10px; fill: ${skin.dim}; }
.msg { font-family: ${ui}; font-size: 11.5px; fill: ${skin.text}; }
.dim { font-family: ${ui}; font-size: 11.5px; fill: ${skin.dim}; }
.tick { font-family: ${mono}; font-size: 14px; font-weight: 700; fill: ${skin.counterText}; letter-spacing: 2px; }
.foot { font-family: ${mono}; font-size: 11px; fill: ${skin.text}; }
.small { font-family: ${ui}; font-size: 9.5px; fill: ${skin.dim}; }
</style>
</defs>
<rect x="${pad}" y="${pad}" width="${innerW}" height="${height - pad * 2}" fill="${skin.page}" stroke="${skin.edge}" stroke-width="2"/>
<rect x="${pad + 2}" y="${pad + 2}" width="${innerW - 4}" height="${barH}" fill="url(#rbar)"/>
<rect x="${pad + 10}" y="${pad + 9}" width="16" height="19" fill="${skin.row}" stroke="${skin.edge}"/>
<path d="M${pad + 13} ${pad + 14} h10 M${pad + 13} ${pad + 18} h10 M${pad + 13} ${pad + 22} h6" stroke="${skin.link}" stroke-width="1.6"/>
<text x="${pad + 34}" y="${pad + 24}" class="h">${xml(view.config.title)}</text>
<text x="${boardWidth / 2}" y="${pad + 23}" class="sub" text-anchor="middle">~ ✦ ${xml(view.config.subtitle)} ✦ ~</text>
${counter(boardWidth - pad - 190, pad + 8, view.totalCount, skin)}
${sidebar(pad + 2, pad + barH + 8, height - pad * 2 - barH - footerH - 14, skin)}
${rows.join('\n')}
<rect x="${pad + 2}" y="${height - pad - footerH - 2}" width="${innerW - 4}" height="${footerH}" fill="${skin.panel}" stroke="${skin.rule}"/>
<text x="${boardWidth / 2}" y="${height - pad - 9}" class="foot" text-anchor="middle">&gt;&gt;&gt; Developers from around the world leave their mark here! &lt;&lt;&lt;</text>
<text x="${boardWidth - pad - 12}" y="${pad + barH + 20}" class="small" text-anchor="end">Best viewed at 1024x768</text>
</svg>`
  }
}

function counter(x: number, y: number, total: number, skin: (typeof skins)['dark']) {
  const digits = String(Math.min(total, 999999)).padStart(6, '0')
  return `<g transform="translate(${x} ${y})">
<rect width="96" height="20" fill="${skin.counter}" stroke="${skin.edge}"/>
<text x="48" y="15" class="tick" text-anchor="middle">${digits}</text>
<text x="104" y="15" class="small">visitors</text>
</g>`
}

function sidebar(x: number, y: number, h: number, skin: (typeof skins)['dark']) {
  const items = nav
    .map((label, i) => `<text x="${x + 24}" y="${y + 52 + i * 21}" class="nav">${xml(label)}</text>
<rect x="${x + 11}" y="${y + 43 + i * 21}" width="8" height="8" fill="${skin.accent}" opacity="0.7"/>`)
    .join('\n')

  return `<rect x="${x}" y="${y}" width="${sideW}" height="${h}" fill="${skin.panel}" stroke="${skin.rule}"/>
<text x="${x + 11}" y="${y + 22}" class="navh">Sign my guestbook!</text>
<line x1="${x + 10}" y1="${y + 30}" x2="${x + sideW - 10}" y2="${y + 30}" stroke="${skin.rule}"/>
${items}`
}

function rowHeight(c: Comment) {
  return Math.max(46, 22 + wrapText(c.text, perLine, maxLines).length * lineH)
}

function row(c: Comment, x: number, y: number, w: number, i: number, skin: (typeof skins)['dark']) {
  const lines = wrapText(c.text, perLine, maxLines)
  const h = rowHeight(c)

  const avatar = c.avatarData
    ? `<image href="${xml(c.avatarData)}" x="${x + rowPad}" y="${y + 8}" width="30" height="30" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="${x + rowPad}" y="${y + 8}" width="30" height="30" fill="${skin.rule}"/>`

  return `<g>
<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${i % 2 ? skin.alt : skin.row}" stroke="${skin.rule}"/>
${avatar}
<rect x="${x + rowPad}" y="${y + 8}" width="30" height="30" fill="none" stroke="${skin.edge}"/>
<text x="${x + rowPad + 40}" y="${y + 20}" class="who">${xml(shortLogin(c.login))}</text>
<line x1="${x + rowPad + 40}" y1="${y + 22}" x2="${x + rowPad + 40 + c.login.length * 6.4}" y2="${y + 22}" stroke="${skin.link}" stroke-width="0.8"/>
<text x="${x + w - rowPad}" y="${y + 20}" class="date" text-anchor="end">${xml(formatDate(c.createdAt))}</text>
${lines.map((l, n) => `<text x="${x + rowPad + 40}" y="${y + 37 + n * lineH}" class="msg">${xml(l)}</text>`).join('\n')}
</g>`
}

const maxLogin = 24

function shortLogin(login: string) {
  return login.length > maxLogin ? `${login.slice(0, maxLogin - 1)}…` : login
}
