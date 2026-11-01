/** Photoreal top-down plan from plate rig (not SVG). */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { startOrbitRenderServer } from './orbit-render-server.mjs'

const appDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(appDir, '..')
const repo = path.resolve(root, '..')
const plateDir = path.join(repo, 'content', 'plates', 'simple')
const spec = JSON.parse(fs.readFileSync(path.join(plateDir, 'plate-spec.json'), 'utf8'))
const { plan } = spec.render

const { server, port } = await startOrbitRenderServer(root, repo)
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${port}/scripts/simple-plate-rig.html`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => Boolean(window.simplePlateRig?.renderPlan))
await page.evaluate(() => window.simplePlateRig.ready)

function writeJpeg(outPath, dataUrl) {
  fs.writeFileSync(outPath, Buffer.from(dataUrl.split(',')[1], 'base64'))
}

for (const fitout of ['furnished', 'empty']) {
  const rel = fitout === 'furnished' ? spec.outputs.floor_plan_furnished : spec.outputs.floor_plan_empty
  const dataUrl = await page.evaluate(
    ({ fitout: f, width, height, quality }) =>
      window.simplePlateRig.renderPlan({ fitout: f, width, height, quality }),
    { fitout, width: plan.width, height: plan.height, quality: plan.jpeg_quality ?? 0.94 },
  )
  writeJpeg(path.join(plateDir, rel), dataUrl)
  console.log(`wrote ${rel} (photoreal top-down)`)
}

await browser.close()
server.close()
