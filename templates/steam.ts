import { avatar, body, heading, leave, name, older, when, type Rendered, type View, plain } from './shared.js'

export function steam(view: View): Rendered {
  const { config, comments } = view
  const { title, subtitle } = heading(config)

  const rows = comments.map(c => {
    const stacked = [
      name(c),
      config.showDate ? `<br><sub>${when(c)}</sub>` : '',
      '<br><br>',
      body(c),
    ].join('')
    if (!config.showAvatar) return `<tr><td>${stacked}</td></tr>`
    return `<tr><td width="60" valign="top">${avatar(c, 44)}</td><td valign="top">${stacked}</td></tr>`
  })

  if (!rows.length) {
    rows.push(`<tr><td colspan="${config.showAvatar ? 2 : 1}"><sub>no comments yet.</sub></td></tr>`)
  }

  const rest = older(view)

  return plain([
    `<b>${title}</b> &nbsp; <sub>${subtitle}</sub>`,
    '',
    '<table>',
    ...rows,
    '</table>',
    '',
    `${leave(view, '<kbd> leave a comment </kbd>')}${rest ? ` &nbsp; <sub>${rest}</sub>` : ''}`,
  ])
}
