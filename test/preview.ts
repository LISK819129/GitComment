import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { loadConfig, type Theme } from '../src/config.js'
import { normalize, type Comment } from '../src/comments.js'
import { render } from '../src/render.js'
import { comments } from './fixtures.js'

const discussionUrl = 'https://github.com/octo/octo/discussions/1'
const themes: Theme[] = ['notes', 'drawn', 'cozy', 'steam', 'minimal']

mkdirSync('tmp/out', { recursive: true })

function fakeAvatar(c: Comment, i: number) {
  try {
    return { ...c, avatarData: `data:image/png;base64,${readFileSync(`tmp/proto/av/${i % 8}.png`).toString('base64')}` }
  } catch {
    return c
  }
}

const only = process.argv[2]
const sections: string[] = []

for (const theme of themes) {
  if (only && theme !== only) continue
  const config = loadConfig(null, { theme, blockedUsers: ['spamaccount'] })
  const picked = normalize(comments, config, 'octo').map(fakeAvatar)
  const { markdown, assets } = render(config, picked, discussionUrl, comments.length)

  let md = markdown
  for (const asset of assets) {
    const name = `tmp/out/${theme}-${asset.path.split('/').pop()}`
    writeFileSync(name, asset.content)
    md = md.split(asset.path).join(`/${name}`)
  }
  sections.push(`## ${theme}${assets.length ? ` — ${(assets[0]!.content.length / 1024).toFixed(0)} KB svg` : ''}\n\n${md}`)
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
<style>body{margin:0;background:#0d1117}.markdown-body{box-sizing:border-box;max-width:900px;margin:0 auto;padding:28px}</style>
<article class="markdown-body" data-theme="dark">${await res.text()}</article>`,
)
console.log('wrote tmp/preview.html')
