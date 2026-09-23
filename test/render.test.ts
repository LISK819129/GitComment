import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalize } from '../src/comments.js'
import { loadConfig, type Theme } from '../src/config.js'
import { render } from '../src/render.js'
import { comments } from './fixtures.js'

const url = 'https://github.com/octo/octo/discussions/1'
const html: Theme[] = ['cozy', 'steam', 'minimal']
const art: Theme[] = ['notes', 'drawn', 'dev', 'pink', 'comic', 'win95', 'retro']
const all = [...html, ...art]

function out(overrides = {}) {
  const config = loadConfig(null, { blockedUsers: ['spamaccount'], ...overrides })
  const picked = normalize(comments, config, 'octo').map(c => ({ ...c, avatarData: 'data:image/png;base64,AAA' }))
  return render(config, picked, url, comments.length)
}

const block = (o = {}) => out(o).markdown

for (const theme of all) {
  test(`${theme} shows the comments and links back to the discussion`, () => {
    const r = out({ theme })
    const everything = r.markdown + r.assets.map(a => a.content).join('')
    assert.match(everything, /rohan/)
    assert.equal(r.markdown.includes(url), true)
  })

  test(`${theme} never emits comment markup or comment HTML`, () => {
    const r = out({ theme, maxComments: 25 })
    const all = r.markdown + r.assets.map(a => a.content).join('')
    assert.equal(all.includes('<!--'), false)
    assert.equal(all.includes('<script'), false)
    assert.doesNotMatch(all, /<[a-z]+[^>]*\son[a-z]+\s*=/i)
  })

  test(`${theme} renders an empty board without falling over`, () => {
    const config = loadConfig(null, { theme })
    const r = render(config, [], url, 0)
    assert.equal(r.markdown.includes(url), true)
    assert.equal(r.markdown.trim().length > 0, true)
  })
}

for (const theme of html) {
  test(`${theme} writes no files`, () => {
    assert.deepEqual(out({ theme }).assets, [])
  })

  test(`${theme} links every username`, () => {
    const md = block({ theme })
    assert.match(md, /avatars.githubusercontent.com/)
  })
}

for (const theme of art) {
  test(`${theme} produces one svg asset referenced with a content hash`, () => {
    const r = out({ theme })
    assert.equal(r.assets.length, 1)
    const asset = r.assets[0]!
    assert.match(asset.path, /\.svg$/)
    assert.match(asset.content, /^<svg xmlns=/)
    assert.equal(r.markdown.includes(asset.path + '?v='), true)
    assert.match(r.markdown, /\?v=[0-9a-f]{10}/)
  })

  test(`${theme} keeps the hash stable for the same input`, () => {
    assert.equal(out({ theme }).markdown, out({ theme }).markdown)
  })

  test(`${theme} changes the hash when the comments change`, () => {
    assert.notEqual(out({ theme }).markdown, out({ theme, maxComments: 4 }).markdown)
  })

  test(`${theme} escapes hostile text inside the svg`, () => {
    const svg = out({ theme, maxComments: 25 }).assets[0]!.content
    assert.doesNotMatch(svg, /<img|<script|]]>/)
    assert.equal(svg.includes('<!--'), false)
  })

}

test('notes embeds avatars as data uris and never fetches externally', () => {
  const svg = out({ theme: 'notes' }).assets[0]!.content
  assert.match(svg, /href="data:image\/png;base64,/)
  assert.doesNotMatch(svg, /href="https?:\/\//)
})

test('notes survives a comment whose avatar could not be fetched', () => {
  const config = loadConfig(null, { theme: 'notes' })
  const picked = normalize(comments, config, 'octo')
  const svg = render(config, picked, url, 12).assets[0]!.content
  assert.doesNotMatch(svg, /undefined/)
})

test('drawn header depends only on the title, not the comments', () => {
  const a = out({ theme: 'drawn' }).assets[0]!.content
  const b = out({ theme: 'drawn', maxComments: 2 }).assets[0]!.content
  assert.equal(a, b)
})

test('links to the discussion for the comments it did not show', () => {
  assert.match(block({ theme: 'cozy', maxComments: 3 }), /older messages \(\d+\)/)
})

test('show_avatar and show_date turn things off', () => {
  const bare = block({ theme: 'cozy', showAvatar: false, showDate: false })
  assert.doesNotMatch(bare, /avatars.githubusercontent.com/)
  assert.doesNotMatch(bare, /<span title=/)
})

test('truncated comments link back to the original', () => {
  const md = block({ theme: 'cozy', maxComments: 25 })
  assert.match(md, /read the rest/)
  assert.match(md, /discussioncomment-\d+/)
})

test('avatar urls are escaped so the attribute cannot be broken out of', () => {
  assert.match(block({ theme: 'cozy' }), /\?s=80&amp;v=4/)
})

const svgThemes: Theme[] = ['notes', 'dev', 'pink', 'comic', 'win95', 'retro']

for (const theme of svgThemes) {
  test(`${theme} draws a different picture for dark and light`, () => {
    const dark = out({ theme, variant: 'dark' }).assets[0]!.content
    const light = out({ theme, variant: 'light' }).assets[0]!.content
    assert.notEqual(dark, light)
  })

  test(`${theme} transparent ships two files behind a picture element`, () => {
    const r = out({ theme, variant: 'transparent' })
    assert.equal(r.assets.length, 2)
    assert.match(r.markdown, /<picture>/)
    assert.match(r.markdown, /prefers-color-scheme: dark/)
    for (const asset of r.assets) {
      assert.doesNotMatch(asset.content, /<rect width="880" height="\d+" (rx="\d+" )?fill="#/)
    }
  })

  test(`${theme} keeps the markdown to the discussion link alone`, () => {
    const md = out({ theme }).markdown
    assert.doesNotMatch(md, /github\.com\/rohan/)
    assert.match(md, /leave a message/)
    assert.equal(md.includes(url), true)
  })

  test(`${theme} never leaks NaN or undefined into the artwork`, () => {
    const svg = out({ theme, maxComments: 25 }).assets[0]!.content
    assert.doesNotMatch(svg, /NaN|undefined/)
  })

  test(`${theme} embeds avatars rather than linking them`, () => {
    const svg = out({ theme }).assets[0]!.content
    assert.doesNotMatch(svg, /<image[^>]*href="https?:\/\//)
  })
}

test('drawn keeps every username clickable, since its comments are real html', () => {
  const md = out({ theme: 'drawn' }).markdown
  assert.match(md, /<a href="https:\/\/github\.com\/rohan">/)
})
