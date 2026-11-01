import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const appDir = path.resolve(scriptDir, '..')
const repo = path.resolve(appDir, '..')
const dist = path.join(appDir, 'dist')
const releaseDir = path.join(repo, 'release', 'client-building-orbit')

function rmrf(target) {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true })
}

function copyRecursive(src, dest) {
  fs.cpSync(src, dest, { recursive: true })
}

if (!fs.existsSync(dist)) {
  console.error('Run npm run build:client first (missing app/dist)')
  process.exit(1)
}

rmrf(releaseDir)
fs.mkdirSync(releaseDir, { recursive: true })
copyRecursive(dist, releaseDir)

const content = path.join(releaseDir, 'content')
for (const dir of ['plates', 'incoming', 'scripts', 'stocks']) {
  rmrf(path.join(content, dir))
}
const orbitProgress = path.join(content, 'building', '.orbit-gen-progress.json')
if (fs.existsSync(orbitProgress)) fs.unlinkSync(orbitProgress)
const floorsPath = path.join(content, 'floors.csv')
fs.writeFileSync(floorsPath, 'level,facing,plate_code\n', 'utf8')

const readme = `# Client deliverable — building orbit only

## What is included

- **Single page:** interactive **360° building spin** (drag to rotate).
- **${fs.existsSync(path.join(content, 'building', '001', 'day.jpg')) ? '301' : '?'}** orbit stills at \`content/building/001/day.jpg\` … \`301/day.jpg\` (1920×1080).
- **Zoom:** scroll wheel or −/+ controls (building only, not the whole browser page).
- **Rotate left / right** buttons and compass.
- **No** floor picker, interior tours, exterior walk, or extra routes.

Powered by **VelBEE Visuals**.

## Host on your server

1. Upload **everything in this folder** to the web root (or a subfolder).
2. Configure **SPA fallback** so unknown paths serve \`index.html\`.
3. Serve over **HTTPS**.

### nginx example

\`\`\`nginx
root /var/www/client-building-orbit;
index index.html;
location / {
  try_files $uri $uri/ /index.html;
}
location /content/ {
  expires 30d;
  add_header Cache-Control "public, immutable";
}
\`\`\`

### Local preview

\`\`\`bash
cd client-building-orbit
npx --yes serve -s .
\`\`\`

Open the URL shown (usually http://localhost:3000).

## Size

Orbit JPEGs are ~150 MB total. Use a CDN or gzip-disabled static host for best performance.

## Customize title

Rebuild from source with \`VITE_PROJECT_TITLE=Your Project Name\` in \`app/.env.client\`.
`

fs.writeFileSync(path.join(releaseDir, 'README-CLIENT.txt'), readme, 'utf8')

console.log(`Client package ready: ${releaseDir}`)
console.log('Zip this folder and send to your client.')
