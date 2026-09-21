import { mkdirSync, writeFileSync } from 'node:fs'
import { getOctokit } from '@actions/github'
import { update } from '../src/update.js'
import type { Theme } from '../src/config.js'

const token = process.env.GITHUB_TOKEN
const [target, number, theme] = process.argv.slice(2)

if (!token || !target || !number) {
  console.error(`
  GITHUB_TOKEN=<your token> npm run try -- <owner>/<repo> <discussion-number> [theme]

  Reads a real Discussion and renders it, without writing anything to GitHub.
  Output lands in tmp/local/.
`)
  process.exit(1)
}

const [owner, repo] = target.split('/')
if (!owner || !repo) {
  console.error('first argument should look like owner/repo')
  process.exit(1)
}

const result = await update(getOctokit(token), {
  owner,
  repo,
  number: Number(number),
  readmePath: 'README.md',
  configPath: '.github/gitcomment.yml',
  overrides: theme ? { theme: theme as Theme } : {},
  dryRun: true,
  log: console.log,
})

mkdirSync('tmp/local', { recursive: true })
writeFileSync('tmp/local/block.md', result.markdown)

let page = result.markdown
for (const asset of result.assets) {
  const name = asset.path.split('/').pop()!
  writeFileSync(`tmp/local/${name}`, asset.content)
  page = page.split(asset.path).join(`/tmp/local/${name}`)
}

const res = await fetch('https://api.github.com/markdown', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ text: page, mode: 'gfm' }),
})

writeFileSync(
  'tmp/preview.html',
  `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.8.1/github-markdown.min.css">
<style>body{margin:0;background:#0d1117}.markdown-body{box-sizing:border-box;max-width:900px;margin:0 auto;padding:28px}</style>
<article class="markdown-body">${res.ok ? await res.text() : '<pre>could not reach the markdown api</pre>'}</article>`,
)

console.log(`
  ${result.count} comment(s) rendered, nothing written to GitHub.
  tmp/local/block.md    the markup that would go in your README
  ${result.assets.map(a => `tmp/local/${a.path.split('/').pop()}`).join('\n  ')}

  npm run serve   then open http://127.0.0.1:4173
`)
