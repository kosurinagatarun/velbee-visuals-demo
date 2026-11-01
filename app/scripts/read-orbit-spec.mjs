import fs from 'node:fs'
import path from 'node:path'

/** @param {string} repoRoot */
export function readOrbitSpec(repoRoot) {
  const specPath = path.join(repoRoot, 'content', 'building', 'building-spec.json')
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'))
  const frameCount = spec.orbit.frame_count
  return { spec, frameCount }
}
