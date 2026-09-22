import { cozy } from '../templates/cozy.js'
import { drawn } from '../templates/drawn.js'
import { minimal } from '../templates/minimal.js'
import { notes } from '../templates/notes.js'
import { steam } from '../templates/steam.js'
import type { Rendered, View } from '../templates/shared.js'
import type { Comment } from './comments.js'
import type { Config } from './config.js'

const themes = { cozy, steam, minimal, notes, drawn }

export const needsAvatarData: Record<string, boolean> = {
  cozy: false,
  steam: false,
  minimal: false,
  notes: true,
  drawn: false,
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
