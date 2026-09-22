import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ConfigError, defaults, loadConfig } from '../src/config.js'

test('an absent config file gives the defaults', () => {
  assert.deepEqual(loadConfig(null, {}), defaults)
})

test('reads the documented options', () => {
  const config = loadConfig(
    `title: "notes"\nsubtitle: "hi"\nmax_comments: 8\nshow_date: false\nmoderation: approved\nblocked_users:\n  - "@Spam"\n`,
    {},
  )
  assert.equal(config.title, 'notes')
  assert.equal(config.maxComments, 8)
  assert.equal(config.showDate, false)
  assert.equal(config.moderation, 'approved')
  assert.deepEqual(config.blockedUsers, ['spam'])
})

test('action inputs win over the config file', () => {
  const config = loadConfig('theme: steam\nmax_comments: 8\n', { theme: 'minimal', maxComments: 3 })
  assert.equal(config.theme, 'minimal')
  assert.equal(config.maxComments, 3)
})

test('rejects typos rather than ignoring them', () => {
  assert.throws(() => loadConfig('max_coments: 5\n', {}), ConfigError)
})

test('rejects nonsense values', () => {
  assert.throws(() => loadConfig('theme: neon\n', {}), ConfigError)
  assert.throws(() => loadConfig('max_comments: 0\n', {}), ConfigError)
  assert.throws(() => loadConfig('max_comments: 500\n', {}), ConfigError)
  assert.throws(() => loadConfig('message_max_length: 5\n', {}), ConfigError)
  assert.throws(() => loadConfig('moderation: sometimes\n', {}), ConfigError)
  assert.throws(() => loadConfig('blocked_users: nope\n', {}), ConfigError)
})

test('rejects a config file that is not a mapping', () => {
  assert.throws(() => loadConfig('- a\n- b\n', {}), ConfigError)
  assert.throws(() => loadConfig('title: "unclosed\n', {}), ConfigError)
})

test('an empty config file is fine', () => {
  assert.deepEqual(loadConfig('# nothing here\n', {}), defaults)
})

test('the default theme is the one the README advertises', () => {
  assert.equal(loadConfig(null, {}).theme, 'notes')
  assert.equal(loadConfig(null, {}).variant, 'dark')
})
