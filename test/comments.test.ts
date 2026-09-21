import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalize, sanitize } from '../src/comments.js'
import { loadConfig } from '../src/config.js'
import { approved, comments, now } from './fixtures.js'
import { START, END } from '../src/readme.js'

const config = (overrides = {}) => loadConfig(null, overrides)

function pick(overrides = {}) {
  const c = config(overrides)
  return normalize(comments, c, 'octo')
}

test('newest comment comes first', () => {
  const logins = pick({ maxComments: 25, blockedUsers: ['spamaccount'] }).map(c => c.login)
  assert.equal(logins[0], 'a-very-long-github-username-here')
  assert.equal(logins[1], 'rohan')
})

test('honours max_comments', () => {
  assert.equal(pick({ maxComments: 3 }).length, 3)
  assert.equal(pick({ maxComments: 1 }).length, 1)
})

test('drops blocked users, case insensitively and with a stray @', () => {
  const logins = pick({ maxComments: 25, blockedUsers: ['@SpamAccount'] }).map(c => c.login)
  assert.equal(logins.includes('spamaccount'), false)
})

test('drops comments the owner minimized on GitHub', () => {
  assert.equal(pick({ maxComments: 25 }).some(c => c.login === 'hidden'), false)
})

test('drops comments from deleted accounts and empty comments', () => {
  const logins = pick({ maxComments: 25 }).map(c => c.login)
  assert.equal(logins.includes('empty'), false)
  assert.equal(logins.length, comments.length - 3)
})

test('approved moderation keeps only comments the owner reacted to', () => {
  const picked = normalize(approved, config({ moderation: 'approved', maxComments: 25 }), 'octo')
  assert.deepEqual(picked.map(c => c.login).sort(), ['alex', 'maya', 'rohan'])
})

test('escapes HTML instead of rendering it', () => {
  const { html } = sanitize('<img src=x onerror=alert(1)><script>alert(2)</script>', 240)
  assert.doesNotMatch(html, /<img/)
  assert.doesNotMatch(html, /<script/)
  assert.match(html, /&lt;img/)
})

test('a commenter cannot forge the markers', () => {
  const { html } = sanitize(`${END} hello ${START}`, 240)
  assert.equal(html.includes(START), false)
  assert.equal(html.includes(END), false)
  assert.equal(html.includes('<!--'), false)
  assert.match(html, /hello/)
})

test('strips bidi overrides and zero-width padding', () => {
  const { html } = sanitize('ok \u202egnihtemos\u202c \u200b\u200b end', 240)
  assert.doesNotMatch(html, /[\u202a-\u202e\u200b]/)
})

test('keeps emoji and zero-width joiners intact', () => {
  const { html } = sanitize('nice \u{1F419} \u{1F468}\u200D\u{1F469}\u200D\u{1F467}', 240)
  assert.match(html, /\u{1F419}/u)
  assert.match(html, /\u{1F468}\u200D\u{1F469}\u200D\u{1F467}/u)
})

test('turns newlines into line breaks', () => {
  const { html } = sanitize('one\ntwo', 240)
  assert.equal(html, 'one<br>two')
})

test('keeps a small amount of markdown', () => {
  assert.equal(sanitize('**b** *i* ~~s~~ `c`', 240).html, '<b>b</b> <i>i</i> <s>s</s> <code>c</code>')
})

test('drops images entirely but keeps their alt text', () => {
  const { html } = sanitize('![huge](https://example.com/x.png)', 240)
  assert.equal(html, 'huge')
})

test('links http and https only', () => {
  assert.match(sanitize('https://example.com/a', 240).html, /<a href="https:\/\/example.com\/a">/)
  assert.doesNotMatch(sanitize('javascript:alert(1)', 240).html, /<a /)
  assert.doesNotMatch(sanitize('[x](javascript:alert(1))', 240).html, /<a /)
})

test('escapes ampersands inside link targets', () => {
  const { html } = sanitize('https://example.com/?a=1&b=2', 240)
  assert.match(html, /href="https:\/\/example\.com\/\?a=1&amp;b=2"/)
})

test('truncates long comments at a word boundary', () => {
  const { html, truncated } = sanitize('word '.repeat(200), 60)
  assert.equal(truncated, true)
  assert.equal(html.length < 100, true)
  assert.doesNotMatch(html, /wor$/)
})

test('truncates comments with too many lines', () => {
  assert.equal(sanitize('a\n'.repeat(40), 1000).truncated, true)
})

test('breaks up unbroken strings that would stretch the table', () => {
  assert.match(sanitize('a'.repeat(120), 240).html, /<wbr>/)
})

test('treats a comment that is only whitespace or markup as empty', () => {
  assert.equal(sanitize('   \n\n ', 240).html, '')
  assert.equal(sanitize('<!-- nothing -->', 240).html, '')
})
