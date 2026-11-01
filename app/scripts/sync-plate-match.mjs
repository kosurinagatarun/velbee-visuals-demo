/**
 * Regenerate match.json arrow yaw/pitch from plate-spec cameras + door (Panom-style).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { startOrbitRenderServer } from './orbit-render-server.mjs'

const DOOR = [5.05, 1.15, 3.55]

const appDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(appDir, '..')
const repo = path.resolve(root, '..')
const plateDir = path.join(repo, 'content', 'plates', 'simple')
const spec = JSON.parse(fs.readFileSync(path.join(plateDir, 'plate-spec.json'), 'utf8'))
const matchPath = path.join(plateDir, 'match.json')

const { server, port } = await startOrbitRenderServer(root, repo)
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${port}/scripts/simple-plate-rig.html`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => Boolean(window.simplePlateRig?.computeHotspot))
await page.evaluate(() => window.simplePlateRig.ready)

const stops = []
for (const stop of spec.stops) {
  const heading = stop.rotation_deg[1]
  const toOther = spec.stops.find((s) => s.id !== stop.id)
  const hotspot = await page.evaluate(
    ({ location, headingDeg, door }) => window.simplePlateRig.computeHotspot(location, headingDeg, door),
    { location: stop.location_m, headingDeg: heading, door: DOOR },
  )
  const [pnx, pny] = stop.plan_norm ?? (stop.id === '01' ? [0.378, 0.475] : [0.7, 0.475])
  stops.push({
    id: stop.id,
    file: `${stop.id}.jpg`,
    name: stop.name,
    plan: { x: pnx, y: pny },
    facing: 'south',
    heading,
    arrows: [
      {
        yaw: hotspot.yaw,
        pitch: hotspot.pitch - 2,
        to: toOther.id,
        label: toOther.name,
      },
    ],
  })
}

fs.writeFileSync(
  matchPath,
  `${JSON.stringify(
    {
      plate: 'simple',
      notes: 'True equirect panos from simple-plate-rig; arrows calibrated to interior door (Panom-style).',
      stops,
    },
    null,
    2,
  )}\n`,
)

console.log('Updated', matchPath)
for (const s of stops) {
  const a = s.arrows[0]
  console.log(`  ${s.id} ${s.name} → ${a.label} yaw=${a.yaw} pitch=${a.pitch}`)
}

await browser.close()
server.close()
