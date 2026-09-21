import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'

const types: Record<string, string> = {
  png: 'image/png',
  svg: 'image/svg+xml',
  html: 'text/html; charset=utf-8',
}

createServer((req, res) => {
  const path = (req.url ?? '/').split('?')[0]!
  const file = path === '/' ? 'tmp/preview.html' : decodeURIComponent(path.slice(1))
  let body: Buffer
  try {
    body = readFileSync(file)
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('not found')
    return
  }
  res.writeHead(200, { 'content-type': types[file.split('.').pop()!] ?? 'text/plain' })
  res.end(body)
}).listen(4173, () => console.log('preview on http://localhost:4173'))
