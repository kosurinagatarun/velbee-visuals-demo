import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const appDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(appDir, '..')
const repo = path.resolve(root, '..')
const contentPlate = path.join(repo, 'content', 'plates', 'typical')
const briefPath = path.join(contentPlate, 'cameras.blend.json')

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
}

function sendFile(file, res) {
  const type = mime[path.extname(file).toLowerCase()] ?? 'application/octet-stream'
  res.setHeader('Content-Type', type)
  fs.createReadStream(file).pipe(res)
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/')
      const rel = urlPath === '/' ? '/scripts/plate-rig.html' : urlPath
      const file = path.normalize(path.join(root, rel.replace(/^\//, '')))
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
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

function writeJpeg(outPath, dataUrl) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64')
  fs.writeFileSync(outPath, buf)
}

async function main() {
  const brief = JSON.parse(fs.readFileSync(briefPath, 'utf8'))
  const { width, height } = brief.render
  const { server, port } = await startServer()
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto(`http://127.0.0.1:${port}/scripts/plate-rig.html`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => Boolean(window.plateRig))

  let count = 0
  for (const stop of brief.stops) {
    for (const fitout of ['furnished', 'empty']) {
      const rel = stop.outputs[fitout]
      const outPath = path.join(contentPlate, rel)
      const dataUrl = await page.evaluate(
        ({ location, rotationYDeg, fitout: f, width: w, height: h }) =>
          window.plateRig.renderStop({
            location,
            rotationYDeg,
            fitout: f,
            width: w,
            height: h,
          }),
        {
          location: stop.location_m,
          rotationYDeg: stop.rotation_deg[1],
          fitout,
          width,
          height,
        },
      )
      writeJpeg(outPath, dataUrl)
      count += 1
      console.log(`wrote ${rel} (${count}/${brief.stops.length * 2})`)
    }
  }

  await browser.close()
  server.close()
  console.log(`Done: ${count} equirects at ${width}x${height}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
