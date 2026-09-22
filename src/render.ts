import { comic } from '../templates/comic.js'
import { cozy } from '../templates/cozy.js'
import { dev } from '../templates/dev.js'
import { drawn } from '../templates/drawn.js'
import { minimal } from '../templates/minimal.js'
import { notes } from '../templates/notes.js'
import { pink } from '../templates/pink.js'
import { steam } from '../templates/steam.js'
import { win95 } from '../templates/win95.js'
import type { Rendered, View } from '../templates/shared.js'
import type { Comment } from './comments.js'
import type { Config, Theme } from './config.js'

const themes = { cozy, steam, minimal, notes, drawn, dev, pink, comic, win95 }

const withAvatars: Theme[] = ['notes', 'dev', 'pink', 'comic', 'win95']

export function needsAvatarData(theme: Theme) {
  return withAvatars.includes(theme)
}

export function render(
  config: Config,
  comments: Comment[],
  discussionUrl: string,
  totalCount: number,
): Rendered {
  const view: View = { config, comments, discussionUrl, totalCount }
  return themes[config.theme](view)
}
