import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const appDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(appDir, '..')
const repo = path.resolve(root, '..')
const buildingDir = path.join(repo, 'content', 'building')
const FRAME_COUNT = 200
const ARCHIVE_LEGACY = process.env.ORBIT_ARCHIVE_LEGACY === '1'

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
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
      const rel = urlPath === '/' ? '/scripts/orbit-rig.html' : urlPath
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

function archiveOldEight() {
  const stocksDir = path.join(repo, 'stocks', 'orbit-8')
  fs.mkdirSync(stocksDir, { recursive: true })
  for (let i = 1; i <= 8; i += 1) {
    const id = String(i).padStart(3, '0')
    const from = path.join(buildingDir, id)
    if (!fs.existsSync(from)) continue
    const to = path.join(stocksDir, id)
    fs.cpSync(from, to, { recursive: true })
  }
}

function writeJpeg(id, dataUrl) {
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

async function main() {
  if (process.env.ORBIT_PROCEDURAL_JPG !== '1') {
    console.error('Procedural orbit JPG capture is retired (use collage-reference photoreal).')
    console.error('  python ../content/scripts/extract_collage_panels.py')
    console.error('  python ../content/scripts/generate_orbit_photoreal.py')
    console.error('  npm run render:orbit-bands')
    process.exit(1)
  }

  if (ARCHIVE_LEGACY) archiveOldEight()

  const started = new Date().toISOString()
  console.log(`Orbit render start ${started}`)
  console.log(`Frames: ${FRAME_COUNT} → ${buildingDir}`)

  const { server, port } = await startServer()
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.goto(`http://127.0.0.1:${port}/scripts/orbit-rig.html`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => Boolean(window.orbitRig))

  const rigCount = await page.evaluate(() => window.orbitRig.FRAME_COUNT)
  if (rigCount !== FRAME_COUNT) {
    throw new Error(`orbit-rig FRAME_COUNT=${rigCount}, expected ${FRAME_COUNT}`)
  }

  const angles = ['angle,face']
  const bands = {}

  for (let i = 0; i < FRAME_COUNT; i += 1) {
    const meta = await page.evaluate((index) => {
      const info = window.orbitRig.setFrame(index)
      return { ...info, jpeg: window.orbitRig.captureJpeg() }
    }, i)
    writeJpeg(meta.id, meta.jpeg)
    angles.push(`${meta.id},${meta.face}`)
    bands[meta.id] = meta.bands
    if ((i + 1) % 20 === 0) console.log(`rendered ${i + 1}/${FRAME_COUNT}`)
  }

  fs.writeFileSync(path.join(buildingDir, 'angles.csv'), `${angles.join('\n')}\n`)
  fs.writeFileSync(path.join(buildingDir, 'bands.json'), `${JSON.stringify(bands, null, 2)}\n`)

  await browser.close()
  server.close()

  console.log(`Done: ${FRAME_COUNT} day stills at ${buildingDir}`)
  console.log(`Finished ${new Date().toISOString()}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
