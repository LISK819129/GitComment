import { avatar, body, heading, leave, name, older, when, type Rendered, type View, plain } from './shared.js'

export function cozy(view: View): Rendered {
  const { config, comments, now } = view
  const { title, subtitle } = heading(config)
  const span = config.showAvatar ? 2 : 1

  const rows = comments.map(c => {
    const meta = [name(c), config.showDate ? `<sub>${when(c, now)}</sub>` : '']
      .filter(Boolean)
      .join(' \u00b7 ')
    const cell = `<td valign="top">${meta}<br>${body(c)}</td>`
    if (!config.showAvatar) return `<tr>${cell}</tr>`
    return `<tr><td width="60" align="center" valign="top">${avatar(c, 40)}</td>${cell}</tr>`
  })

  if (!rows.length) {
    rows.push(`<tr><td colspan="${span}"><sub>nothing here yet \u2014 be the first.</sub></td></tr>`)
  }

  const footer = [leave(view, 'leave a message'), older(view)].filter(Boolean).join(' \u00b7 ')

  return plain([
    '<table>',
    `<tr><td colspan="${span}"><b>${title}</b><br><sub>${subtitle}</sub></td></tr>`,
    ...rows,
    `<tr><td colspan="${span}" align="center"><sub>${footer}</sub></td></tr>`,
    '</table>',
  ])
}
