/**
 * Capture orbit stills: one building mesh, fixed camera (see building-spec.json),
 * full 360° at step_deg per frame. Also writes angles.csv + bands.json.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { readOrbitSpec } from './read-orbit-spec.mjs'
import { startOrbitRenderServer, writeOrbitJpeg } from './orbit-render-server.mjs'

const appDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(appDir, '..')
const repo = path.resolve(root, '..')
const buildingDir = path.join(repo, 'content', 'building')

async function main() {
  const { spec, frameCount: FRAME_COUNT } = readOrbitSpec(repo)
  const step = spec.orbit.step_deg ?? 360 / FRAME_COUNT
  console.log('Orbit 360 capture: one scene, fixed camera height/distance/FOV')
  console.log(`  frames=${FRAME_COUNT} step=${step}° → ${buildingDir}`)

  const { server, port } = await startOrbitRenderServer(root, repo)
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.goto(`http://127.0.0.1:${port}/scripts/orbit-rig.html`, { waitUntil: 'networkidle' })
  await page.evaluate(() => window.orbitRig.ready)

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
    writeOrbitJpeg(buildingDir, meta.id, meta.jpeg)
    angles.push(`${meta.id},${meta.face}`)
    bands[meta.id] = meta.bands
    if ((i + 1) % 15 === 0 || i + 1 === FRAME_COUNT) console.log(`  captured ${i + 1}/${FRAME_COUNT}`)
  }

  fs.writeFileSync(path.join(buildingDir, 'angles.csv'), `${angles.join('\n')}\n`)
  fs.writeFileSync(path.join(buildingDir, 'bands.json'), `${JSON.stringify(bands, null, 2)}\n`)
  fs.writeFileSync(
    path.join(buildingDir, '.orbit-gen-progress.json'),
    `${JSON.stringify(
      {
        done: Array.from({ length: FRAME_COUNT }, (_, i) => String(i + 1).padStart(3, '0')),
        provider: 'photoreal-hdri-60',
      },
      null,
      2,
    )}\n`,
  )

  await browser.close()
  server.close()
  console.log(`Done: ${FRAME_COUNT} day stills + bands at ${buildingDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
