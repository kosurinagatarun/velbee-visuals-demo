/**
 * Photoreal plate pack for content/plates/simple: panos, tour stills, plan, isometric.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { startOrbitRenderServer } from './orbit-render-server.mjs'

const appDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(appDir, '..')
const repo = path.resolve(root, '..')
const plateDir = path.join(repo, 'content', 'plates', 'simple')
const specPath = path.join(plateDir, 'plate-spec.json')

function writeJpeg(outPath, dataUrl) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, Buffer.from(dataUrl.split(',')[1], 'base64'))
}

async function main() {
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'))
  const { pano, still, plan, iso } = spec.render
  const { server, port } = await startOrbitRenderServer(root, repo)
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  page.setDefaultTimeout(120_000)
  await page.goto(`http://127.0.0.1:${port}/scripts/simple-plate-rig.html`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => Boolean(window.simplePlateRig))
  await page.evaluate(() => window.simplePlateRig.ready)

  for (const stop of spec.stops) {
    for (const fitout of ['furnished', 'empty']) {
      const panoRel = fitout === 'furnished' ? stop.outputs.furnished_pano : stop.outputs.empty_pano
      const tourRel = fitout === 'furnished' ? stop.outputs.furnished_tour : stop.outputs.empty_tour
      const quality = still.jpeg_quality ?? 0.92

      const panoUrl = await page.evaluate(
        ({ location, rotationYDeg, fitout: f, width, height }) =>
          window.simplePlateRig.renderEquirect({
            location,
            rotationYDeg: rotationYDeg[1],
            fitout: f,
            width,
            height,
          }),
        {
          location: stop.location_m,
          rotationYDeg: stop.rotation_deg,
          fitout,
          width: pano.width,
          height: pano.height,
        },
      )
      writeJpeg(path.join(plateDir, panoRel), panoUrl)
      console.log(`  pano ${panoRel}`)

      const tourUrl = await page.evaluate(
        ({ location, lookAt, fitout: f, width, height, quality: q }) =>
          window.simplePlateRig.renderPerspective({
            location,
            lookAt,
            fitout: f,
            width,
            height,
            quality: q,
          }),
        {
          location: stop.location_m,
          lookAt: stop.tour_look_at_m,
          fitout,
          width: still.width,
          height: still.height,
          quality,
        },
      )
      writeJpeg(path.join(plateDir, tourRel), tourUrl)
      console.log(`  tour ${tourRel}`)
    }
  }

  for (const fitout of ['furnished', 'empty']) {
    const planRel = fitout === 'furnished' ? spec.outputs.floor_plan_furnished : spec.outputs.floor_plan_empty
    const isoRel = fitout === 'furnished' ? spec.outputs.iso_furnished : spec.outputs.iso_empty
    const planUrl = await page.evaluate(
      ({ fitout: f, width, height, quality }) =>
        window.simplePlateRig.renderPlan({ fitout: f, width, height, quality }),
      {
        fitout,
        width: plan.width,
        height: plan.height,
        quality: plan.jpeg_quality ?? 0.92,
      },
    )
    writeJpeg(path.join(plateDir, planRel), planUrl)
    console.log(`  plan ${planRel}`)

    const isoUrl = await page.evaluate(
      ({ fitout: f, width, height, quality }) =>
        window.simplePlateRig.renderIso({ fitout: f, width, height, quality }),
      {
        fitout,
        width: iso.width,
        height: iso.height,
        quality: iso.jpeg_quality ?? 0.92,
      },
    )
    writeJpeg(path.join(plateDir, isoRel), isoUrl)
    console.log(`  iso ${isoRel}`)
  }

  const deliveryPath = path.join(plateDir, 'pano', 'delivery.json')
  fs.mkdirSync(path.dirname(deliveryPath), { recursive: true })
  fs.writeFileSync(
    deliveryPath,
    `${JSON.stringify(
      {
        equirectTour: true,
        width: pano.width,
        height: pano.height,
        note: 'Photoreal equirects from simple-plate-rig (WebGL archviz).',
      },
      null,
      2,
    )}\n`,
  )

  await browser.close()
  server.close()
  console.log(`Done: plate simple at ${plateDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
