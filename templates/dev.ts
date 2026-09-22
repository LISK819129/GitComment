import type { Comment } from '../src/comments.js'
import { formatDate } from '../src/time.js'
import { artwork, boardWidth, type Draw, type Mode } from './artwork.js'
import type { Rendered, View } from './shared.js'
import { wrapText, xml } from './svg.js'

const mono = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"

const skins = {
  dark: { bg: '#0d1117', edge: '#2b3138', user: '#3fb950', text: '#d5dbe2', dim: '#6e7781', note: '#4b5563', art: '#2ea043' },
  light: { bg: '#f6f8fa', edge: '#d0d7de', user: '#1a7f37', text: '#1f2328', dim: '#8b949e', note: '#9aa4b0', art: '#1a7f37' },
}

const pad = 26
const lineH = 19
const perLine = 52
const maxLines = 4

const cat = ['/\\__/\\', '( •_• )', '  \\|', '   |', '  |_|_,']

export function dev(view: View): Rendered {
  return artwork(view, 'comments-dev', build(view))
}

function build(view: View): Draw {
  return (mode: Mode, background: boolean) => {
    const skin = skins[mode]
    const entries: string[] = []
    let y = 92

    for (const c of view.comments) {
      entries.push(entry(c, y, skin))
      y += 30 + wrapText(c.text, perLine, maxLines).length * lineH + 14
    }

    if (!view.comments.length) {
      entries.push(`<text x="${pad + 34}" y="${y + 6}" class="dim">// nothing here yet — be the first.</text>`)
      y += 40
    }

    const height = Math.round(y + 34)
    const frame = background
      ? `<rect x="1" y="1" width="${boardWidth - 2}" height="${height - 2}" rx="10" fill="${skin.bg}" stroke="${skin.edge}"/>`
      : `<rect x="1" y="1" width="${boardWidth - 2}" height="${height - 2}" rx="10" fill="none" stroke="${skin.edge}"/>`

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${boardWidth}" height="${height}" viewBox="0 0 ${boardWidth} ${height}" role="img" aria-label="${xml(view.config.title)}">
<style>
.t { font-family: ${mono}; font-size: 15px; fill: ${skin.user}; }
.u { font-family: ${mono}; font-size: 13.5px; font-weight: 600; fill: ${skin.user}; }
.m { font-family: ${mono}; font-size: 13px; fill: ${skin.text}; }
.d { font-family: ${mono}; font-size: 11.5px; fill: ${skin.dim}; }
.dim { font-family: ${mono}; font-size: 12.5px; fill: ${skin.note}; }
.art { font-family: ${mono}; font-size: 12px; fill: ${skin.art}; opacity: 0.85; }
</style>
${frame}
<circle cx="${pad}" cy="30" r="5.5" fill="#ff5f57"/>
<circle cx="${pad + 18}" cy="30" r="5.5" fill="#febc2e"/>
<circle cx="${pad + 36}" cy="30" r="5.5" fill="#28c840"/>
<text x="${pad + 56}" y="35" class="t">${xml(view.config.title)}</text>
${entries.join('\n')}
<text x="${pad + 34}" y="${height - 18}" class="u">_<tspan fill="${skin.user}">█</tspan></text>
${noteLines(view.config.subtitle).map((l, i) => `<text x="596" y="${48 + i * 18}" class="dim">// ${xml(l)}</text>`).join(String.fromCharCode(10))}
<text x="596" y="${48 + noteLines(view.config.subtitle).length * 18}" class="dim">// keep building.</text>
${cat.map((l, i) => `<text x="806" y="${42 + i * 14}" class="art" xml:space="preserve">${xml(l)}</text>`).join(String.fromCharCode(10))}
</svg>`
  }
}

const maxLogin = 26

function shortLogin(login: string) {
  return login.length > maxLogin ? `${login.slice(0, maxLogin - 1)}…` : login
}

function noteLines(text: string) {
  return wrapText(text, 24, 3)
}

function entry(c: Comment, y: number, skin: (typeof skins)['dark']) {
  const lines = wrapText(c.text, perLine, maxLines)
  const avatar = c.avatarData
    ? `<clipPath id="d${c.id}"><circle cx="${pad + 52}" cy="${y - 5}" r="11"/></clipPath><image href="${xml(c.avatarData)}" x="${pad + 41}" y="${y - 16}" width="22" height="22" clip-path="url(#d${c.id})" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="${pad + 52}" cy="${y - 5}" r="11" fill="${skin.edge}"/>`

  return `<g>
<text x="${pad + 8}" y="${y}" class="u">|</text>
<text x="${pad + 24}" y="${y}" class="u">&gt;</text>
${avatar}
<text x="${pad + 72}" y="${y}" class="u">${xml(shortLogin(c.login))}</text>
<text x="${pad + 300}" y="${y}" class="d">${xml(formatDate(c.createdAt))}</text>
${lines.map((l, i) => `<text x="${pad + 72}" y="${y + 24 + i * lineH}" class="m">${xml(l)}</text>`).join('\n')}
<path d="M${pad + 34} ${y + 6} L${pad + 34} ${y + 24 + lines.length * lineH - 14}" stroke="${skin.edge}" stroke-width="1.5" fill="none"/>
</g>`
}
