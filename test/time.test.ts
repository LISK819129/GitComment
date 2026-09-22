import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatDate, fullDate } from '../src/time.js'

test('formats a date the way a guestbook reads', () => {
  assert.equal(formatDate(new Date('2026-09-22T03:09:00Z')), '22 Sep, 2026')
  assert.equal(formatDate(new Date('2026-01-05T10:00:00Z')), '5 Jan, 2026')
  assert.equal(formatDate(new Date('2025-12-31T23:30:00Z')), '31 Dec, 2025')
})

test('uses UTC so the same comment reads the same everywhere', () => {
  assert.equal(formatDate(new Date('2026-03-01T00:30:00Z')), '1 Mar, 2026')
  assert.equal(formatDate(new Date('2026-02-28T23:30:00Z')), '28 Feb, 2026')
})

test('the hover text carries the time as well', () => {
  assert.equal(fullDate(new Date('2026-09-22T03:09:00Z')), '2026-09-22 03:09 UTC')
})
