/**
 * Rasterize architect SVG sheets to floor-plan.jpg (not WebGL).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const appDir = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(appDir, '..', '..')
const plateDir = path.join(repo, 'content', 'plates', 'simple')
const sourceDir = path.join(plateDir, 'source')

const pairs = [
  { svg: 'floor-plan-furnished.svg', jpg: 'floor-plan.jpg' },
  { svg: 'floor-plan-empty.svg', jpg: 'floor-plan-empty.jpg' },
]

const browser = await chromium.launch({ headless: true })

for (const { svg, jpg } of pairs) {
  const svgPath = path.join(sourceDir, svg)
  const svgText = fs.readFileSync(svgPath, 'utf8')
  const page = await browser.newPage({ viewport: { width: 1800, height: 1400 } })
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:#fafaf8">${svgText}</body></html>`,
    { waitUntil: 'networkidle' },
  )
  const outPath = path.join(plateDir, jpg)
  await page.screenshot({ path: outPath, type: 'jpeg', quality: 92, fullPage: false })
  await page.close()
  console.log(`wrote content/plates/simple/${jpg} ← source/${svg}`)
}

await browser.close()
