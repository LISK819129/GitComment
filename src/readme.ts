export const START = '<!-- GITCOMMENT:START -->'
export const END = '<!-- GITCOMMENT:END -->'

export class MarkerError extends Error {}

export function replaceRegion(readme: string, block: string) {
  const start = readme.indexOf(START)
  const end = readme.indexOf(END)

  if (start === -1 || end === -1) {
    throw new MarkerError(
      `README is missing the GitComment markers. Add these two lines where you want the comments:\n${START}\n${END}`,
    )
  }
  if (end < start) throw new MarkerError(`${END} appears before ${START} in the README`)
  if (readme.indexOf(START, start + START.length) !== -1) {
    throw new MarkerError(`README contains more than one ${START}`)
  }

  const before = readme.slice(0, start + START.length)
  const after = readme.slice(end)
  return `${before}\n\n${block.trim()}\n\n${after}`
}
