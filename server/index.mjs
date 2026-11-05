import 'dotenv/config'
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import api from './api.mjs'

const production = process.env.NODE_ENV === 'production'
const vite = production
  ? null
  : await (
      await import('vite')
    ).createServer({ server: { middlewareMode: true }, appType: 'spa' })
const root = resolve('dist')
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
}
const server = http.createServer(async (req, res) => {
  if (req.url?.startsWith('/api/')) return api(req, res)
  if (vite) return vite.middlewares(req, res)
  try {
    const path = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname,
    )
    if (path.split('/').some((segment) => segment.startsWith('.'))) {
      res.writeHead(404)
      res.end('Not found')
      return
    }
    const file = resolve(root, `.${path}`)
    if (!file.startsWith(`${root}/`) && file !== root) {
      res.writeHead(403)
      res.end()
      return
    }
    let data,
      extension = extname(file)
    try {
      data = await readFile(file)
    } catch {
      if (extension) {
        res.writeHead(404)
        res.end('Not found')
        return
      }
      data = await readFile(resolve(root, 'index.html'))
      extension = '.html'
    }
    res.setHeader(
      'Content-Type',
      types[extension] || 'application/octet-stream',
    )
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.end(data)
  } catch {
    res.writeHead(400)
    res.end('Bad request')
  }
})
server.listen(
  Number(process.env.PORT) || 5173,
  process.env.HOST || '127.0.0.1',
  () =>
    console.log(
      `SE Store running at http://${process.env.HOST || 'localhost'}:${Number(process.env.PORT) || 5173}`,
    ),
)
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    server.close()
    vite?.close()
    process.exit(0)
  })
