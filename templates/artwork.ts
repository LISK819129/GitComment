import { escape } from '../src/comments.js'
import { hash } from './svg.js'
import type { Asset, Rendered, View } from './shared.js'

export type Mode = 'dark' | 'light'

export type Draw = (mode: Mode, background: boolean) => string

const width = 880

export function artwork(view: View, name: string, draw: Draw): Rendered {
  const { variant } = view.config
  const assets: Asset[] = []
  const alt = escape(view.config.title)

  const add = (suffix: string, svg: string) => {
    const path = `.github/gitcomment/${name}${suffix}.svg`
    assets.push({ path, content: svg })
    return `${path}?v=${hash(svg)}`
  }

  let picture: string
  if (variant === 'transparent') {
    const dark = add('-dark', draw('dark', false))
    const light = add('-light', draw('light', false))
    picture = [
      '<picture>',
      `<source media="(prefers-color-scheme: dark)" srcset="${escape(dark)}">`,
      `<img src="${escape(light)}" alt="${alt}" width="${width}">`,
      '</picture>',
    ].join('')
  } else {
    const src = add('', draw(variant, true))
    picture = `<img src="${escape(src)}" alt="${alt}" width="${width}">`
  }

  const hidden = view.totalCount - view.comments.length
  const footer = [
    `<a href="${escape(view.discussionUrl)}">leave a message</a>`,
    hidden > 0 ? `<a href="${escape(view.discussionUrl)}">older messages (${hidden})</a>` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  const markdown = [
    `<a href="${escape(view.discussionUrl)}">${picture}</a>`,
    '',
    `<sub>${footer}</sub>`,
  ].join('\n')

  return { markdown, assets }
}

export { width as boardWidth }
