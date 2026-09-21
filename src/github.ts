import { getOctokit } from '@actions/github'

export type Octokit = ReturnType<typeof getOctokit>

export type RawComment = {
  id: string
  url: string
  body: string
  createdAt: string
  isMinimized: boolean
  author: { login: string; url: string; avatarUrl: string } | null
  reactions?: { nodes: ({ user: { login: string } | null } | null)[] }
}

export type Discussion = {
  url: string
  title: string
  totalCount: number
  comments: RawComment[]
}

export class GitHubError extends Error {}

const reactionEnum: Record<string, string> = {
  '+1': 'THUMBS_UP',
  '-1': 'THUMBS_DOWN',
  laugh: 'LAUGH',
  hooray: 'HOORAY',
  confused: 'CONFUSED',
  heart: 'HEART',
  rocket: 'ROCKET',
  eyes: 'EYES',
}

function query(withReactions: boolean) {
  const reactions = withReactions
    ? 'reactions(content: $reaction, first: 20) { nodes { user { login } } }'
    : ''
  const args = withReactions
    ? '$owner: String!, $repo: String!, $number: Int!, $reaction: ReactionContent!'
    : '$owner: String!, $repo: String!, $number: Int!'
  return `
    query(${args}) {
      repository(owner: $owner, name: $repo) {
        discussion(number: $number) {
          url
          title
          comments(last: 100) {
            totalCount
            nodes {
              id
              url
              body
              createdAt
              isMinimized
              author { login url avatarUrl(size: 80) }
              ${reactions}
            }
          }
        }
      }
    }
  `
}

export async function fetchDiscussion(
  octokit: Octokit,
  owner: string,
  repo: string,
  number: number,
  approvalReaction?: string,
): Promise<Discussion> {
  const variables: Record<string, unknown> = { owner, repo, number }
  if (approvalReaction) variables.reaction = reactionEnum[approvalReaction]

  let data: any
  try {
    data = await octokit.graphql(query(Boolean(approvalReaction)), variables)
  } catch (err) {
    throw new GitHubError(`could not read discussions: ${describe(err)}`)
  }

  const repository = data?.repository
  if (!repository) throw new GitHubError(`repository ${owner}/${repo} not found`)

  const discussion = repository.discussion
  if (!discussion) {
    throw new GitHubError(
      `discussion #${number} not found in ${owner}/${repo} — check discussion-number, and that Discussions is enabled`,
    )
  }

  return {
    url: discussion.url,
    title: discussion.title,
    totalCount: discussion.comments.totalCount,
    comments: (discussion.comments.nodes ?? []).filter(Boolean),
  }
}

export async function readFile(octokit: Octokit, owner: string, repo: string, path: string, branch?: string) {
  try {
    const res = await octokit.rest.repos.getContent({
      owner, repo, path, ...(branch ? { ref: branch } : {}),
    })
    const file = res.data
    if (Array.isArray(file) || file.type !== 'file' || !('content' in file)) {
      throw new GitHubError(`${path} is not a file`)
    }
    return { text: Buffer.from(file.content, 'base64').toString('utf8'), sha: file.sha }
  } catch (err) {
    if (err instanceof GitHubError) throw err
    if ((err as { status?: number }).status === 404) {
      throw new GitHubError(`${path} not found in ${owner}/${repo}`)
    }
    throw new GitHubError(`could not read ${path}: ${describe(err)}`)
  }
}

export async function writeFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  text: string,
  sha: string,
  message: string,
  branch?: string,
) {
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    ...(sha ? { sha } : {}),
    content: Buffer.from(text, 'utf8').toString('base64'),
    ...(branch ? { branch } : {}),
  })
}

function describe(err: unknown) {
  const e = err as { status?: number; message?: string }
  if (e.status === 403) return `${e.message} (does the workflow grant the right permissions?)`
  return e.message ?? String(err)
}
