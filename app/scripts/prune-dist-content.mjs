import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const contentDir = path.join(scriptDir, '..', 'dist', 'content')

function rmrf(target) {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true })
}

if (!fs.existsSync(contentDir)) {
  console.error('Missing dist/content — run vite build first')
  process.exit(1)
}

for (const dir of ['plates', 'incoming', 'scripts', 'stocks']) {
  rmrf(path.join(contentDir, dir))
}
const orbitProgress = path.join(contentDir, 'building', '.orbit-gen-progress.json')
if (fs.existsSync(orbitProgress)) fs.unlinkSync(orbitProgress)
fs.writeFileSync(path.join(contentDir, 'floors.csv'), 'level,facing,plate_code\n', 'utf8')

console.log('Pruned dist/content for building-only deploy')
