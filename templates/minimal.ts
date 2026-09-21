import { avatar, body, heading, leave, name, older, when, type Rendered, type View, plain } from './shared.js'

export function minimal(view: View): Rendered {
  const { config, comments, now } = view
  const { title, subtitle } = heading(config)

  const entries = comments.map(c => {
    const head = [
      config.showAvatar ? avatar(c, 20) : '',
      name(c),
      config.showDate ? `<sub>${when(c, now)}</sub>` : '',
    ]
      .filter(Boolean)
      .join(' ')
    return `${head}<br>\n> ${body(c)}`
  })

  if (!entries.length) entries.push('> *no messages yet.*')

  const footer = [leave(view, 'leave a message'), older(view)].filter(Boolean).join(' \u00b7 ')

  return plain([
    `**${title}** \u2014 <sub>${subtitle}</sub>`,
    '',
    entries.join('\n\n'),
    '',
    `<sub>${footer}</sub>`,
  ])
}
