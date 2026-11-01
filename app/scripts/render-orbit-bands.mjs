import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { readOrbitSpec } from './read-orbit-spec.mjs'
import { startOrbitRenderServer } from './orbit-render-server.mjs'

const appDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(appDir, '..')
const repo = path.resolve(root, '..')
const buildingDir = path.join(repo, 'content', 'building')

async function main() {
  const { frameCount: FRAME_COUNT } = readOrbitSpec(repo)
  console.log(`Orbit bands-only: ${FRAME_COUNT} angles → ${buildingDir}`)
  console.log('Does not overwrite day.jpg (use npm run render:orbit for 360 JPG capture).')

  const { server, port } = await startOrbitRenderServer(root, repo)
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.goto(`http://127.0.0.1:${port}/scripts/orbit-rig.html`, { waitUntil: 'networkidle' })
  await page.evaluate(() => window.orbitRig.ready)

  const angles = ['angle,face']
  const bands = {}

  for (let i = 0; i < FRAME_COUNT; i += 1) {
    const meta = await page.evaluate((index) => window.orbitRig.setFrame(index), i)
    angles.push(`${meta.id},${meta.face}`)
    bands[meta.id] = meta.bands
    if ((i + 1) % 20 === 0) console.log(`bands ${i + 1}/${FRAME_COUNT}`)
  }

  fs.writeFileSync(path.join(buildingDir, 'angles.csv'), `${angles.join('\n')}\n`)
  fs.writeFileSync(path.join(buildingDir, 'bands.json'), `${JSON.stringify(bands, null, 2)}\n`)

  await browser.close()
  server.close()
  console.log('Wrote angles.csv and bands.json')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
