/**
 * Placeholder day-high.jpg for every orbit angle (until Lumion delivers real high orbit).
 * Blends each side still with the bird's-eye plate so horizontal spin still changes at "High".
 *
 * Usage: node content/scripts/bake-day-high-placeholders.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const appDir = path.join(repo, 'app')
const require = createRequire(path.join(appDir, 'package.json'))
const building = path.join(repo, 'content', 'building')
const topPath = path.join(building, 'plan', 'top.jpg')
const refHigh = path.join(building, 'reference', 'day-high-REF-001.jpg')

async function main() {
  let sharp
  try {
    sharp = require('sharp')
  } catch {
    console.error('Run: cd app && npm install sharp --save-dev')
    process.exit(1)
  }

  if (!fs.existsSync(topPath)) {
    console.error('Missing plan/top.jpg')
    process.exit(1)
  }

  const topBuf = await sharp(topPath).resize(1920, 1080, { fit: 'cover' }).toBuffer()
  const dirs = fs
    .readdirSync(building, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{3}$/.test(d.name))
    .map((d) => d.name)
    .sort()

  let n = 0
  for (const id of dirs) {
    const dayPath = path.join(building, id, 'day.jpg')
    if (!fs.existsSync(dayPath)) continue
    const out = path.join(building, id, 'day-high.jpg')
    await sharp(dayPath)
      .composite([{ input: topBuf, blend: 'over', opacity: 0.22 }])
      .jpeg({ quality: 92 })
      .toFile(out)
    n += 1
  }

  if (n === 0 && fs.existsSync(refHigh)) {
    console.warn('No day.jpg folders; copying reference high to 001/day-high.jpg only')
    fs.copyFileSync(refHigh, path.join(building, '001', 'day-high.jpg'))
    n = 1
  }

  console.log(`Wrote ${n} day-high.jpg placeholders (replace with Lumion high orbit).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
