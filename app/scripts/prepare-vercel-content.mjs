import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(appDir, '..')
const contentDest = path.join(repoRoot, 'content')
const docsContent = path.join(repoRoot, 'docs', 'content')
const probe = path.join(contentDest, 'building', '001', 'day.jpg')

if (fs.existsSync(probe)) {
  console.log('content/building already present — skip prepare')
  process.exit(0)
}

const docsProbe = path.join(docsContent, 'building', '001', 'day.jpg')
if (!fs.existsSync(docsProbe)) {
  console.error(
    'Missing orbit frames. Need content/building/ or docs/content/building/ (GitHub Pages export).',
  )
  process.exit(1)
}

fs.mkdirSync(contentDest, { recursive: true })
fs.cpSync(docsContent, contentDest, { recursive: true })
console.log('Prepared content/ from docs/content/ for Vercel build')
