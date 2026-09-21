import { createHash } from 'node:crypto'

export const sans =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export function xml(text: string) {
  return text.replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[ch]!,
  )
}

export function hash(text: string) {
  return createHash('sha256').update(text).digest('hex').slice(0, 10)
}

// Deterministic per author, so a note keeps the same tilt every time the board is redrawn.
export function jitter(key: string) {
  let h = 2166136261
  for (const ch of key) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return ((h >>> 0) % 1000) / 1000
  }
}

export function wrapText(text: string, perLine: number, maxLines: number) {
  const out: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (line && `${line} ${word}`.length > perLine) {
        out.push(line)
        line = word
      } else {
        line = line ? `${line} ${word}` : word
      }
    }
    if (line) out.push(line)
    if (out.length > maxLines) break
  }
  if (out.length > maxLines) {
    const kept = out.slice(0, maxLines)
    kept[maxLines - 1] = `${kept[maxLines - 1]!.slice(0, perLine - 2)}\u2026`
    return kept
  }
  return out
}
