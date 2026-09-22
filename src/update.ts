import { embedAvatars } from './avatars.js'
import { normalize } from './comments.js'
import { loadConfig, type Config } from './config.js'
import { GitHubError, fetchDiscussion, readFile, writeFile, type Octokit } from './github.js'
import { replaceRegion } from './readme.js'
import { needsAvatarData, render } from './render.js'
import type { Asset } from '../templates/shared.js'

export type Options = {
  owner: string
  repo: string
  number: number
  readmePath: string
  configPath: string
  branch?: string
  overrides: Partial<Config>
  log?: (message: string) => void
  dryRun?: boolean
}

const attempts = 3

export async function update(octokit: Octokit, options: Options) {
  const { owner, repo, number, readmePath, configPath, branch } = options
  const log = options.log ?? (() => {})

  const config = loadConfig(await readConfig(octokit, owner, repo, configPath, branch), options.overrides)
  const discussion = await fetchDiscussion(
    octokit, owner, repo, number,
    config.moderation === 'approved' ? config.approvalReaction : undefined,
  )

  let comments = normalize(discussion.comments, config, owner)
  if (needsAvatarData(config.theme)) comments = await embedAvatars(comments)

  const { markdown, assets } = render(config, comments, discussion.url, discussion.totalCount)

  if (options.dryRun) {
    return { count: comments.length, changed: false, markdown, assets }
  }

  for (const asset of assets) {
    if (await writeAsset(octokit, owner, repo, asset, branch, log)) {
      log(`wrote ${asset.path}`)
    }
  }

  for (let attempt = 1; ; attempt += 1) {
    const current = await readFile(octokit, owner, repo, readmePath, branch)
    const next = replaceRegion(current.text, markdown)
    if (next === current.text) return { count: comments.length, changed: false, markdown, assets }

    try {
      await writeFile(
        octokit, owner, repo, readmePath, next, current.sha,
        `comments: ${comments.length} message${comments.length === 1 ? '' : 's'}`,
        branch,
      )
      return { count: comments.length, changed: true, markdown, assets }
    } catch (err) {
      const status = (err as { status?: number }).status
      if ((status !== 409 && status !== 422) || attempt === attempts) throw err
      log(`README moved underneath us, retrying (${attempt}/${attempts})`)
    }
  }
}

async function writeAsset(
  octokit: Octokit,
  owner: string,
  repo: string,
  asset: Asset,
  branch: string | undefined,
  log: (m: string) => void,
) {
  const existing = await readOptional(octokit, owner, repo, asset.path, branch)
  if (existing?.text === asset.content) return false

  try {
    await writeFile(
      octokit, owner, repo, asset.path, asset.content, existing?.sha ?? '',
      'comments: artwork', branch,
    )
    return true
  } catch (err) {
    const status = (err as { status?: number }).status
    if (status === 409 || status === 422) {
      log(`${asset.path} changed underneath us, leaving it alone`)
      return false
    }
    throw err
  }
}

async function readOptional(octokit: Octokit, owner: string, repo: string, path: string, branch?: string) {
  try {
    return await readFile(octokit, owner, repo, path, branch)
  } catch (err) {
    if (err instanceof GitHubError && err.message.includes('not found')) return undefined
    throw err
  }
}

async function readConfig(octokit: Octokit, owner: string, repo: string, path: string, branch?: string) {
  const file = await readOptional(octokit, owner, repo, path, branch)
  return file?.text ?? null
}
