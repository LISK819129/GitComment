import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalize } from '../src/comments.js'
import { loadConfig } from '../src/config.js'
import { buildFilter } from '../src/profanity.js'
import type { RawComment } from '../src/github.js'

function comment(login: string, body: string, createdAt: string, reacted = false): RawComment {
  return {
    id: `c-${login}`,
    url: 'https://github.com/o/o/discussions/1#c',
    body,
    createdAt,
    isMinimized: false,
    author: { login, url: `https://github.com/${login}`, avatarUrl: 'https://a/x?s=80' },
    reactions: { nodes: reacted ? [{ user: { login: 'owner' } }] : [] },
  }
}

const older = comment('early', 'I was here before moderation', '2026-09-01T00:00:00Z')
const newer = comment('late', 'I arrived after moderation', '2026-09-20T00:00:00Z')
const approved = comment('blessed', 'I got a thumbs up', '2026-09-21T00:00:00Z', true)

test('approved mode with no cutoff still hides everything unreacted', () => {
  const config = loadConfig('moderation: approved\n', {})
  const out = normalize([older, newer, approved], config, 'owner')
  assert.deepEqual(out.map(c => c.login), ['blessed'])
})

test('approved_since keeps comments made before it', () => {
  const config = loadConfig('moderation: approved\napproved_since: 2026-09-15\n', {})
  const out = normalize([older, newer, approved], config, 'owner')
  assert.deepEqual(out.map(c => c.login).sort(), ['blessed', 'early'])
})

test('approved_since does not let new comments through', () => {
  const config = loadConfig('moderation: approved\napproved_since: 2026-09-15\n', {})
  const out = normalize([newer], config, 'owner')
  assert.deepEqual(out, [])
})

test('approved_since is ignored when moderation is automatic', () => {
  const config = loadConfig('approved_since: 2026-09-15\n', {})
  const out = normalize([older, newer], config, 'owner')
  assert.equal(out.length, 2)
})

test('a bad date is rejected rather than silently ignored', () => {
  assert.throws(() => loadConfig('approved_since: someday\n', {}), /approved_since must be a date/)
})

test('blocked_words drops a comment', () => {
  const config = loadConfig('blocked_words:\n  - crypto\n', {})
  const out = normalize([comment('spam', 'buy my CRYPTO now', '2026-09-20T00:00:00Z')], config, 'owner')
  assert.deepEqual(out, [])
})

test('blocked_words leaves innocent comments alone', () => {
  const config = loadConfig('blocked_words:\n  - crypto\n', {})
  const out = normalize([comment('ok', 'nice project', '2026-09-20T00:00:00Z')], config, 'owner')
  assert.equal(out.length, 1)
})

test('the profanity filter is off unless asked for', () => {
  const off = buildFilter([], false)
  assert.equal(off('this is shit'), false)
})

test('the profanity filter catches the obvious cases', () => {
  const on = buildFilter([], true)
  assert.equal(on('this is shit'), true)
  assert.equal(on('SHIT'), true)
  assert.equal(on('what the fuuuuck'), true)
  assert.equal(on('sh1t'), true)
  assert.equal(on('a$$hole'), true)
})

test('the profanity filter does not fire on innocent words', () => {
  const on = buildFilter([], true)
  for (const clean of [
    'I live in Scunthorpe',
    'the classic analysis of assets passed assessment',
    'Essex, Sussex and Middlesex are counties',
    'the cocktail app is neat',
    'nice titlebar animation',
    'shiitake mushrooms in your recipe repo',
    'password manager looks solid',
    'grape juice > orange',
    'this scattered layout is lovely',
    'found you through OpenNPC. really cool project',
    'Desktop Drifter is sick :)',
  ]) {
    assert.equal(on(clean), false, `false positive on: ${clean}`)
  }
})

test('custom words combine with the built-in list', () => {
  const both = buildFilter(['sponsorship'], true)
  assert.equal(both('want a sponsorship?'), true)
  assert.equal(both('this is shit'), true)
})
