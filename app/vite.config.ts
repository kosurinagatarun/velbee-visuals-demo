import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type PreviewServer, type ViteDevServer } from 'vite'

const appDir = path.dirname(fileURLToPath(import.meta.url))
const contentRoot = path.resolve(appDir, '../content')

const mime: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.json': 'application/json',
  '.csv': 'text/csv; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
}

function contentRelPath(urlPath: string): string | null {
  const pathOnly = decodeURIComponent(urlPath.split('?')[0] ?? '')
  const marker = '/content/'
  const idx = pathOnly.indexOf(marker)
  if (idx === -1) return null
  return pathOnly.slice(idx + marker.length)
}

function sendContent(urlPath: string, method: string | undefined, res: http.ServerResponse) {
  const rel = contentRelPath(urlPath)
  if (rel === null) {
    res.statusCode = 404
    res.end()
    return
  }
  const file = path.normalize(path.join(contentRoot, rel))
  if (!file.startsWith(contentRoot) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.statusCode = 404
    res.end()
    return
  }
  res.setHeader('Content-Type', mime[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
  res.setHeader('Cache-Control', 'no-cache')
  if (method === 'HEAD') {
    res.end()
    return
  }
  fs.createReadStream(file).pipe(res)
}

function contentMiddleware(server: ViteDevServer | PreviewServer) {
  server.middlewares.use((req, res, next) => {
    if (!req.url || contentRelPath(req.url) === null) {
      next()
      return
    }
    sendContent(req.url, req.method, res)
  })
}

const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: 'content-static',
      configureServer: contentMiddleware,
      configurePreviewServer: contentMiddleware,
      closeBundle() {
        fs.cpSync(contentRoot, path.resolve(appDir, 'dist/content'), { recursive: true })
      },
    },
  ],
  server: {
    fs: { allow: [path.resolve(appDir, '..')] },
  },
})
