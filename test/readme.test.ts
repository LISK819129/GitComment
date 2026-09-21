import { test } from 'node:test'
import assert from 'node:assert/strict'
import { END, MarkerError, START, replaceRegion } from '../src/readme.js'

const readme = `# hi\n\nsome stuff\n\n${START}\nold\n${END}\n\nfooter\n`

test('replaces only the region between the markers', () => {
  const out = replaceRegion(readme, 'new block')
  assert.match(out, /# hi/)
  assert.match(out, /footer/)
  assert.doesNotMatch(out, /old/)
  assert.match(out, /new block/)
})

test('keeps the markers themselves', () => {
  const out = replaceRegion(readme, 'new')
  assert.equal(out.includes(START), true)
  assert.equal(out.includes(END), true)
})

test('is idempotent', () => {
  const once = replaceRegion(readme, 'new')
  assert.equal(replaceRegion(once, 'new'), once)
})

test('survives an empty region', () => {
  const out = replaceRegion(`a\n${START}${END}\nb`, 'x')
  assert.match(out, /x/)
  assert.match(out, /^a/)
})

test('complains when a marker is missing', () => {
  assert.throws(() => replaceRegion('# hi\n', 'x'), MarkerError)
  assert.throws(() => replaceRegion(`${START}\n`, 'x'), MarkerError)
})

test('complains when the markers are the wrong way round', () => {
  assert.throws(() => replaceRegion(`${END}\n${START}`, 'x'), MarkerError)
})

test('complains about a duplicated start marker', () => {
  assert.throws(() => replaceRegion(`${START}\n${START}\n${END}`, 'x'), MarkerError)
})
