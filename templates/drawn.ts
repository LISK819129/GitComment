import { caveat } from '../src/font.js'
import { escape } from '../src/comments.js'
import { hash, sans, xml } from './svg.js'
import { avatar, body, leave, name, older, when, type Rendered, type View } from './shared.js'

const width = 880

export function drawn(view: View): Rendered {
  const { config, comments } = view
  const svg = header(config.title, config.subtitle)
  const path = '.github/gitcomment/header.svg'

  const rows = comments.map(c => {
    const meta = [name(c), config.showDate ? `<sub>${when(c)}</sub>` : '']
      .filter(Boolean)
      .join(' \u00b7 ')
    const cell = `<td valign="top">${meta}<br>${body(c)}</td>`
    if (!config.showAvatar) return `<tr>${cell}</tr>`
    return `<tr><td width="58" align="center" valign="top">${avatar(c, 38)}</td>${cell}</tr>`
  })

  const span = config.showAvatar ? 2 : 1
  if (!rows.length) {
    rows.push(`<tr><td colspan="${span}"><sub>nothing here yet \u2014 be the first.</sub></td></tr>`)
  }

  const footer = [leave(view, 'leave a message'), older(view)].filter(Boolean).join(' \u00b7 ')

  const markdown = [
    `<a href="${escape(view.discussionUrl)}"><img src="${escape(`${path}?v=${hash(svg)}`)}" alt="${escape(config.title)}" width="${width}"></a>`,
    '',
    '<table>',
    ...rows,
    `<tr><td colspan="${span}" align="center"><sub>${footer}</sub></td></tr>`,
    '</table>',
  ].join('\n')

  return { markdown, assets: [{ path, content: svg }] }
}

function header(title: string, subtitle: string) {
  const height = 118
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${xml(title)}">
<defs>
<style>
@font-face { font-family: 'GCHand'; src: url(data:font/woff2;base64,${caveat}) format('woff2'); }
.title { font-family: 'GCHand', cursive; font-size: 40px; fill: #6e7b8c; }
.hand { font-family: 'GCHand', cursive; font-size: 19px; fill: #8c98a8; }
.foot { font-family: ${sans}; font-size: 11px; fill: #98a2ae; }
</style>
</defs>
<text x="8" y="58" class="title">${xml(title)}</text>
<line x1="8" y1="72" x2="${8 + title.length * 14}" y2="72" stroke="#e3b341" stroke-width="2.5" stroke-linecap="round"/>
<text x="430" y="52" class="hand">${xml(subtitle)}</text>
<g fill="none" stroke="#8c98a8" stroke-width="1.6" stroke-linecap="round">
<path d="M512 66 q16 14 4 30"/><path d="M504 90 l12 8 -11 5"/>
</g>
<path d="M370 40 l4 9 10 1 -7 7 2 10 -9 -5 -9 5 2 -10 -7 -7 10 -1z" fill="none" stroke="#e3b341" stroke-width="1.5"/>
<path d="M812 34 q8 -10 16 0 q8 -10 16 0 q0 12 -16 22 q-16 -10 -16 -22z" fill="none" stroke="#8c98a8" stroke-width="1.5"/>
</svg>`
}
