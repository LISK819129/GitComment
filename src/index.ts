import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { ConfigError, type Config, type Theme, type Variant } from './config.js'
import { GitHubError } from './github.js'
import { MarkerError } from './readme.js'
import { update } from './update.js'

async function run() {
  const octokit = getOctokit(core.getInput('token', { required: true }))

  const [owner, repo] = (core.getInput('repository') || `${context.repo.owner}/${context.repo.repo}`).split('/')
  if (!owner || !repo) throw new ConfigError('repository must look like owner/name')

  const number = Number(core.getInput('discussion-number', { required: true }))
  if (!Number.isInteger(number) || number < 1) {
    throw new ConfigError('discussion-number must be a whole number')
  }

  const result = await update(octokit, {
    owner,
    repo,
    number,
    readmePath: core.getInput('readme-path') || 'README.md',
    configPath: core.getInput('config') || '.github/gitcomment.yml',
    branch: core.getInput('branch') || undefined,
    overrides: overrides(),
    log: core.info,
  })

  core.setOutput('comments', result.count)
  core.setOutput('markdown', result.markdown)
  core.setOutput('changed', result.changed)
  core.info(result.changed ? `rendered ${result.count} message(s)` : 'README already up to date')
}

function overrides(): Partial<Config> {
  const out: Partial<Config> = {}
  const theme = core.getInput('theme')
  const variant = core.getInput('variant')
  const max = core.getInput('max-comments')
  if (theme) out.theme = theme as Theme
  if (variant) out.variant = variant as Variant
  if (max) {
    const n = Number(max)
    if (!Number.isInteger(n)) throw new ConfigError('max-comments must be a whole number')
    out.maxComments = n
  }
  return out
}

run().catch(err => {
  if (err instanceof ConfigError || err instanceof MarkerError || err instanceof GitHubError) {
    core.setFailed(err.message)
  } else {
    core.setFailed(`gitcomment failed: ${(err as Error).message ?? err}`)
  }
})
