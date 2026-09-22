import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { loadConfig, type Theme, type Variant } from '../src/config.js'
import { normalize, type Comment } from '../src/comments.js'
import { render } from '../src/render.js'
import { comments } from './fixtures.js'

const discussionUrl = 'https://github.com/octo/octo/discussions/1'
const art: Theme[] = ['notes', 'dev', 'pink', 'comic', 'win95']
const plain: Theme[] = ['drawn', 'cozy', 'steam', 'minimal']

mkdirSync('tmp/out', { recursive: true })

function fakeAvatar(c: Comment, i: number) {
  try {
    return { ...c, avatarData: `data:image/png;base64,${readFileSync(`tmp/proto/av/${i % 8}.png`).toString('base64')}` }
  } catch {
    return c
  }
}

const onlyTheme = process.argv[2]
const onlyVariant = (process.argv[3] as Variant) ?? undefined
const sections: string[] = []

function one(theme: Theme, variant: Variant) {
  const config = loadConfig(null, { theme, variant, blockedUsers: ['spamaccount'], maxComments: 4 })
  const picked = normalize(comments, config, 'octo').map(fakeAvatar)
  const { markdown, assets } = render(config, picked, discussionUrl, comments.length)

  let md = markdown
  let kb = 0
  for (const asset of assets) {
    const name = `tmp/out/${theme}-${variant}-${asset.path.split('/').pop()}`
    writeFileSync(name, asset.content)
    md = md.split(asset.path).join(`/${name}`)
    kb += asset.content.length / 1024
  }
  sections.push(`## ${theme} \u2014 ${variant}${kb ? ` \u2014 ${kb.toFixed(0)} KB` : ''}\n\n${md}`)
}

for (const theme of art) {
  if (onlyTheme && theme !== onlyTheme) continue
  for (const variant of (onlyVariant ? [onlyVariant] : ['dark', 'light', 'transparent']) as Variant[]) {
    one(theme, variant)
  }
}
for (const theme of plain) {
  if (onlyTheme && theme !== onlyTheme) continue
  if (onlyVariant && onlyVariant !== 'dark') continue
  one(theme, 'dark')
}

const source = sections.join('\n\n<hr>\n\n')
writeFileSync('tmp/preview.md', source)

const res = await fetch('https://api.github.com/markdown', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ text: source, mode: 'gfm' }),
})
if (!res.ok) {
  console.error(`github markdown api: ${res.status} ${await res.text()}`)
  process.exit(1)
}

writeFileSync(
  'tmp/preview.html',
  `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.8.1/github-markdown.min.css">
<style>body{margin:0;background:#0d1117}.markdown-body{box-sizing:border-box;max-width:940px;margin:0 auto;padding:28px}</style>
<article class="markdown-body">${await res.text()}</article>`,
)
console.log('wrote tmp/preview.html')
