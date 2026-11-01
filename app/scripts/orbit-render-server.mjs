import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
}

export function sendFile(file, res) {
  const type = mime[path.extname(file).toLowerCase()] ?? 'application/octet-stream'
  res.setHeader('Content-Type', type)
  fs.createReadStream(file).pipe(res)
}

/** Serve app/, repo content at /content/, optional old/stocks at /stocks/ */
export function startOrbitRenderServer(appRoot, repoRoot) {
  const contentRoot = path.join(repoRoot, 'content')
  const stocksRoot = path.join(repoRoot, 'old', 'stocks')
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/')
      if (urlPath.startsWith('/content/')) {
        const rel = urlPath.slice('/content/'.length)
        const file = path.normalize(path.join(contentRoot, rel))
        if (!file.startsWith(contentRoot) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
          res.statusCode = 404
          res.end('not found')
          return
        }
        sendFile(file, res)
        return
      }
      if (urlPath.startsWith('/stocks/')) {
        const rel = urlPath.slice('/stocks/'.length)
        const file = path.normalize(path.join(stocksRoot, rel))
        if (!file.startsWith(stocksRoot) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
          res.statusCode = 404
          res.end('not found')
          return
        }
        sendFile(file, res)
        return
      }
      const rel = urlPath === '/' ? '/scripts/orbit-rig.html' : urlPath
      const file = path.normalize(path.join(appRoot, rel.replace(/^\//, '')))
      if (!file.startsWith(appRoot) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.statusCode = 404
        res.end('not found')
        return
      }
      sendFile(file, res)
    })
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({ server, port })
    })
  })
}

export function writeOrbitJpeg(buildingDir, id, dataUrl) {
  if (!dataUrl?.includes(',')) {
    throw new Error(`Frame ${id}: empty capture`)
  }
  const dir = path.join(buildingDir, id)
  fs.mkdirSync(dir, { recursive: true })
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64')
  fs.writeFileSync(path.join(dir, 'day.jpg'), buf)
  const night = path.join(dir, 'night.jpg')
  if (fs.existsSync(night)) fs.unlinkSync(night)
}
