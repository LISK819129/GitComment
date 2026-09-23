import { mkdirSync, writeFileSync } from 'node:fs'
import { getOctokit } from '@actions/github'
import { embedAvatars } from '../src/avatars.js'
import { normalize } from '../src/comments.js'
import { loadConfig, type Theme, type Variant } from '../src/config.js'
import { fetchDiscussion } from '../src/github.js'
import { render } from '../src/render.js'

const token = process.env.GITHUB_TOKEN
const [target, number, only] = process.argv.slice(2)

if (!token || !target || !number) {
  console.error(`
  GITHUB_TOKEN=<token> npm run try -- <owner>/<repo> <discussion-number> [theme]

  Renders a real Discussion without writing anything to GitHub.
  Leave the theme off to render every theme and variant.
`)
  process.exit(1)
}

const [owner, repo] = target.split('/')
if (!owner || !repo) {
  console.error('first argument should look like owner/repo')
  process.exit(1)
}

const octokit = getOctokit(token)
const discussion = await fetchDiscussion(octokit, owner, repo, Number(number))
console.log(`${discussion.totalCount} comment(s) in "${discussion.title}"`)

const themes: Theme[] = ['notes', 'dev', 'pink', 'comic', 'win95', 'retro', 'drawn', 'cozy', 'steam', 'minimal']
const variants: Variant[] = ['dark', 'light', 'transparent']
const chosen = only ? themes.filter(t => t === only) : themes

if (only && !chosen.length) {
  console.error(`unknown theme: ${only}`)
  process.exit(1)
}

mkdirSync('tmp/local', { recursive: true })

const base = loadConfig(null, {})
const comments = await embedAvatars(normalize(discussion.comments, base, owner))
const panels: string[] = []

for (const theme of chosen) {
  const svgTheme = ['notes', 'dev', 'pink', 'comic', 'win95', 'retro'].includes(theme)
  for (const variant of svgTheme ? variants : (['dark'] as Variant[])) {
    const config = loadConfig(null, { theme, variant })
    const { markdown, assets } = render(config, comments, discussion.url, discussion.totalCount)

    if (!assets.length) {
      panels.push(`<section><h2>${theme}</h2><div class="md">${markdown}</div></section>`)
      continue
    }
    for (const asset of assets) {
      const shade = asset.path.endsWith('-light.svg') ? 'light' : 'dark'
      const file = `tmp/local/${theme}-${variant}-${asset.path.split('/').pop()}`
      writeFileSync(file, asset.content)
      const bg = variant === 'transparent' ? (shade === 'light' ? '#ffffff' : '#0d1117') : 'transparent'
      const kb = (asset.content.length / 1024).toFixed(0)
      const label = variant === 'transparent' ? `${theme} — transparent (on ${shade} GitHub)` : `${theme} — ${variant}`
      panels.push(
        `<section><h2>${label} <small>${kb} KB</small></h2><div class="frame" style="background:${bg}"><img src="/${file}"></div></section>`,
      )
    }
  }
}

writeFileSync(
  'tmp/preview.html',
  `<!doctype html><meta charset="utf-8"><title>GitComment themes</title>
<style>
body{margin:0;background:#161b22;color:#c9d1d9;font:14px/1.5 system-ui,sans-serif;padding:26px}
section{max-width:920px;margin:0 auto 30px}
h2{font-size:14px;font-weight:600;margin:0 0 8px;color:#e6edf3}
small{font-weight:400;color:#8b949e}
.frame{border:1px solid #30363d;border-radius:8px;overflow:hidden}
.md{border:1px solid #30363d;border-radius:8px;padding:16px;background:#0d1117}
img{display:block;width:100%}
</style>
${panels.join('\n')}`,
)

console.log(`
  ${comments.length} comment(s) rendered across ${panels.length} panels.
  Nothing was written to GitHub.

  npm run serve     then open http://127.0.0.1:4173
`)
