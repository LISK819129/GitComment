import type { RawComment } from '../src/github.js'

export const now = new Date('2026-09-21T12:00:00Z')

function ago(minutes: number) {
  return new Date(now.getTime() - minutes * 60_000).toISOString()
}

let n = 0

function comment(login: string | null, body: string, createdAt: string, extra: Partial<RawComment> = {}): RawComment {
  n += 1
  return {
    id: `DC_${n}`,
    url: `https://github.com/octo/octo/discussions/1#discussioncomment-${n}`,
    body,
    createdAt,
    isMinimized: false,
    author: login
      ? {
          login,
          url: `https://github.com/${login}`,
          avatarUrl: `https://avatars.githubusercontent.com/u/${1000 + n}?s=80&v=4`,
        }
      : null,
    ...extra,
  }
}

export const comments: RawComment[] = [
  comment('rohan', '+rep, this guy makes weird games', ago(95)),
  comment('maya', 'found OpenNPC today. cool stuff :)', ago(60 * 26)),
  comment('alex', 'how did I end up here', ago(60 * 24 * 4)),
  comment('octocat', 'hello from the other side 🐙', ago(60 * 24 * 40)),
  comment(
    'a-very-long-github-username-here',
    'stopped by from the ScrapBounds repo.\nthe movement feels great — how are you doing the camera?\n\nanyway, keep going 👍',
    ago(8),
  ),
  comment(
    'verbose',
    'I have a lot of thoughts about this project and I intend to share every single one of them right here in your guestbook because I could not find a better place to put them, starting with the fact that the README is very nice, and continuing at length about the commit history, the choice of language, the folder layout, and several other things nobody asked about.',
    ago(200),
  ),
  comment('linker', 'saw this on https://news.ycombinator.com/item?id=12345678 — also check [my thing](https://example.com/thing)', ago(400)),
  comment('sneaky', '<img src=x onerror=alert(1)><script>alert(2)</script>**still bold?**', ago(500)),
  comment('breaker', '<!-- GITCOMMENT:END --> nice profile <!-- GITCOMMENT:START -->', ago(505)),
  comment('stretch', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', ago(510)),
  comment('shouty', '# BIG TEXT\n> quoted\n---\n`code` and ~~strike~~ and *slanted*', ago(520)),
  comment('rtl', 'مرحبا \u202egnihtemos ydeek\u202c ok', ago(530)),
  comment('imagebomb', '![big](https://example.com/huge.png)', ago(540)),
  comment('empty', '   \n\n  ', ago(550)),
  comment(null, 'this account is gone', ago(560)),
  comment('spamaccount', 'BUY FOLLOWERS CHEAP', ago(3)),
  comment('hidden', 'this one was minimized by the owner', ago(4), { isMinimized: true }),
]

export const approved = comments.map(c => ({
  ...c,
  reactions: { nodes: ['rohan', 'maya', 'alex'].includes(c.author?.login ?? '') ? [{ user: { login: 'octo' } }] : [] },
}))
