import { load } from 'js-yaml'

export type Theme = 'cozy' | 'steam' | 'minimal' | 'notes' | 'drawn'
export type Moderation = 'automatic' | 'approved'

export type Config = {
  title: string
  subtitle: string
  theme: Theme
  maxComments: number
  showAvatar: boolean
  showDate: boolean
  messageMaxLength: number
  moderation: Moderation
  approvalReaction: string
  blockedUsers: string[]
}

const defaults: Config = {
  title: 'Comments',
  subtitle: 'little messages from people passing by.',
  theme: 'cozy',
  maxComments: 5,
  showAvatar: true,
  showDate: true,
  messageMaxLength: 240,
  moderation: 'automatic',
  approvalReaction: '+1',
  blockedUsers: [],
}

const themes: Theme[] = ['cozy', 'steam', 'minimal', 'notes', 'drawn']
const moderations: Moderation[] = ['automatic', 'approved']

const reactions = [
  '+1', '-1', 'laugh', 'hooray', 'confused', 'heart', 'rocket', 'eyes',
]

export class ConfigError extends Error {}

export function loadConfig(yaml: string | null, overrides: Partial<Config>): Config {
  const file = yaml ? parseYaml(yaml) : {}
  const merged = { ...defaults, ...fromYaml(file) }
  for (const [k, v] of Object.entries(overrides)) {
    if (v !== undefined) (merged as Record<string, unknown>)[k] = v
  }
  return validate(merged)
}

function parseYaml(raw: string): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = load(raw)
  } catch (err) {
    throw new ConfigError(`could not parse the config file: ${(err as Error).message}`)
  }
  if (parsed == null) return {}
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ConfigError('the config file should be a mapping of settings')
  }
  return parsed as Record<string, unknown>
}

function fromYaml(file: Record<string, unknown>): Partial<Config> {
  const out: Partial<Config> = {}
  const map: Record<string, keyof Config> = {
    title: 'title',
    subtitle: 'subtitle',
    theme: 'theme',
    max_comments: 'maxComments',
    show_avatar: 'showAvatar',
    show_date: 'showDate',
    message_max_length: 'messageMaxLength',
    moderation: 'moderation',
    approval_reaction: 'approvalReaction',
    blocked_users: 'blockedUsers',
  }
  for (const [key, value] of Object.entries(file)) {
    const field = map[key]
    if (!field) throw new ConfigError(`unknown config option: ${key}`)
    ;(out as Record<string, unknown>)[field] = value
  }
  return out
}

function validate(c: Config): Config {
  if (typeof c.title !== 'string' || typeof c.subtitle !== 'string') {
    throw new ConfigError('title and subtitle must be strings')
  }
  if (!themes.includes(c.theme)) {
    throw new ConfigError(`theme must be one of ${themes.join(', ')}`)
  }
  if (!moderations.includes(c.moderation)) {
    throw new ConfigError(`moderation must be one of ${moderations.join(', ')}`)
  }
  if (!reactions.includes(c.approvalReaction)) {
    throw new ConfigError(`approval_reaction must be one of ${reactions.join(', ')}`)
  }
  if (!Number.isInteger(c.maxComments) || c.maxComments < 1 || c.maxComments > 25) {
    throw new ConfigError('max_comments must be a whole number between 1 and 25')
  }
  if (!Number.isInteger(c.messageMaxLength) || c.messageMaxLength < 40 || c.messageMaxLength > 1000) {
    throw new ConfigError('message_max_length must be a whole number between 40 and 1000')
  }
  if (typeof c.showAvatar !== 'boolean' || typeof c.showDate !== 'boolean') {
    throw new ConfigError('show_avatar and show_date must be true or false')
  }
  if (!Array.isArray(c.blockedUsers) || c.blockedUsers.some(u => typeof u !== 'string')) {
    throw new ConfigError('blocked_users must be a list of usernames')
  }
  return { ...c, blockedUsers: c.blockedUsers.map(u => u.toLowerCase().replace(/^@/, '')) }
}

export { defaults }
