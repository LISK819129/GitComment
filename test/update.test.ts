import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Octokit } from '../src/github.js'
import { START, END } from '../src/readme.js'
import { update } from '../src/update.js'
import { comments } from './fixtures.js'

const readme = `# octo\n\nhello\n\n${START}\n${END}\n\nbye\n`

type Stub = {
  files: Record<string, string>
  discussion?: unknown
  writes: { path: string; text: string; sha: string; message: string }[]
  failNext?: number
}

function client(stub: Stub) {
  const shas: Record<string, number> = {}
  const sha = (path: string) => `sha-${path}-${shas[path] ?? 0}`

  return {
    graphql: async () => ({
      repository: {
        discussion: 'discussion' in stub ? stub.discussion : {
          url: 'https://github.com/octo/octo/discussions/1',
          title: 'Comments',
          comments: { totalCount: comments.length, nodes: comments },
        },
      },
    }),
    rest: {
      repos: {
        getContent: async ({ path }: { path: string }) => {
          const text = stub.files[path]
          if (text === undefined) throw Object.assign(new Error('Not Found'), { status: 404 })
          return { data: { type: 'file', sha: sha(path), content: Buffer.from(text).toString('base64') } }
        },
        createOrUpdateFileContents: async (args: any) => {
          if (stub.failNext && stub.failNext > 0) {
            stub.failNext -= 1
            shas[args.path] = (shas[args.path] ?? 0) + 1
            throw Object.assign(new Error('conflict'), { status: 409 })
          }
          assert.equal(args.sha, sha(args.path))
          const text = Buffer.from(args.content, 'base64').toString('utf8')
          stub.files[args.path] = text
          stub.writes.push({ path: args.path, text, sha: args.sha, message: args.message })
          return {}
        },
      },
    },
  } as unknown as Octokit
}

const options = {
  owner: 'octo',
  repo: 'octo',
  number: 1,
  readmePath: 'README.md',
  configPath: '.github/gitcomment.yml',
  overrides: {},
}

test('fills the marker region and leaves the rest of the README alone', async () => {
  const stub: Stub = { files: { 'README.md': readme }, writes: [] }
  const result = await update(client(stub), options)

  assert.equal(result.changed, true)
  assert.equal(result.count, 5)

  const out = stub.writes[0]!.text
  assert.match(out, /^# octo\n\nhello\n/)
  assert.match(out, /bye\n$/)
  assert.match(out, /<table>/)
  assert.match(out, /rohan/)
  assert.equal(out.includes(START), true)
  assert.equal(out.includes(END), true)
  assert.equal(stub.writes[0]!.message, 'comments: 5 messages')
})

test('does not commit when nothing changed', async () => {
  const stub: Stub = { files: { 'README.md': readme }, writes: [] }
  await update(client(stub), options)
  const again = await update(client({ ...stub, writes: [] }), options)
  assert.equal(again.changed, false)
})

test('reads config from the repository and applies it', async () => {
  const stub: Stub = {
    files: { 'README.md': readme, '.github/gitcomment.yml': 'theme: minimal\nmax_comments: 2\n' },
    writes: [],
  }
  const result = await update(client(stub), options)
  assert.equal(result.count, 2)
  assert.doesNotMatch(result.markdown, /<table>/)
})

test('action inputs beat the committed config', async () => {
  const stub: Stub = {
    files: { 'README.md': readme, '.github/gitcomment.yml': 'max_comments: 2\n' },
    writes: [],
  }
  const result = await update(client(stub), { ...options, overrides: { maxComments: 4 } })
  assert.equal(result.count, 4)
})

test('retries when someone else commits first', async () => {
  const stub: Stub = { files: { 'README.md': readme }, writes: [], failNext: 2 }
  const result = await update(client(stub), options)
  assert.equal(result.changed, true)
  assert.equal(stub.writes.length, 1)
})

test('gives up after too many conflicts', async () => {
  const stub: Stub = { files: { 'README.md': readme }, writes: [], failNext: 9 }
  await assert.rejects(update(client(stub), options), /conflict/)
})

test('explains a missing discussion', async () => {
  const stub: Stub = { files: { 'README.md': readme }, writes: [], discussion: null }
  await assert.rejects(update(client(stub), options), /discussion #1 not found/)
})

test('explains a missing README', async () => {
  const stub: Stub = { files: {}, writes: [] }
  await assert.rejects(update(client(stub), options), /README.md not found/)
})

test('explains missing markers', async () => {
  const stub: Stub = { files: { 'README.md': '# octo\n' }, writes: [] }
  await assert.rejects(update(client(stub), options), /missing the GitComment markers/)
})

test('dry run writes nothing but still returns the artwork', async () => {
  const stub: Stub = { files: { 'README.md': readme }, writes: [] }
  const result = await update(client(stub), { ...options, overrides: { theme: 'notes' }, dryRun: true })

  assert.equal(stub.writes.length, 0)
  assert.equal(stub.files['README.md'], readme)
  assert.equal(result.changed, false)
  assert.equal(result.assets.length, 1)
  assert.match(result.assets[0]!.content, /^<svg/)
})
