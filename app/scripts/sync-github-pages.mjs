import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.resolve(scriptDir, '..')
const repo = path.resolve(appDir, '..')
const dist = path.join(appDir, 'dist')
const docs = path.join(repo, 'docs')

function rmrf(target) {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true })
}

if (!fs.existsSync(dist)) {
  console.error('Missing app/dist — run vite build first')
  process.exit(1)
}

rmrf(docs)
fs.cpSync(dist, docs, { recursive: true })

const content = path.join(docs, 'content')
for (const dir of ['plates', 'incoming', 'scripts', 'stocks']) {
  rmrf(path.join(content, dir))
}
const orbitProgress = path.join(content, 'building', '.orbit-gen-progress.json')
if (fs.existsSync(orbitProgress)) fs.unlinkSync(orbitProgress)
fs.writeFileSync(path.join(content, 'floors.csv'), 'level,facing,plate_code\n', 'utf8')

const index = path.join(docs, 'index.html')
if (fs.existsSync(index)) {
  fs.copyFileSync(index, path.join(docs, '404.html'))
}
fs.writeFileSync(path.join(docs, '.nojekyll'), '', 'utf8')

console.log(`GitHub Pages site: ${docs}`)
console.log('Enable Pages: repo Settings → Pages → Branch main → /docs')
