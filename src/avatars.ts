import type { Comment } from './comments.js'

const timeout = 8000
const maxBytes = 24 * 1024

export async function embedAvatars(comments: Comment[]): Promise<Comment[]> {
  return Promise.all(
    comments.map(async comment => ({ ...comment, avatarData: await fetchOne(comment.avatarUrl) })),
  )
}

async function fetchOne(url: string): Promise<string | undefined> {
  const sized = url.replace(/([?&])s=\d+/, '$1s=64')
  try {
    const res = await fetch(sized, { signal: AbortSignal.timeout(timeout) })
    if (!res.ok) return undefined

    const type = res.headers.get('content-type') ?? ''
    if (!/^image\/(png|jpeg|gif|webp)$/.test(type)) return undefined

    const bytes = new Uint8Array(await res.arrayBuffer())
    if (bytes.byteLength > maxBytes) return undefined

    return `data:${type};base64,${Buffer.from(bytes).toString('base64')}`
  } catch {
    return undefined
  }
}
