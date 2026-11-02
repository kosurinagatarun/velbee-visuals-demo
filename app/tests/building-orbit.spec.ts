import { expect, test } from '@playwright/test'

async function waitForBuilding(page: import('@playwright/test').Page) {
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Building view' })).toBeVisible({
    timeout: 120_000,
  })
  await expect(page.getByText('Content failed to load')).toHaveCount(0)
}

function angleFromSrc(src: string | null): string | null {
  if (!src) return null
  const m = src.match(/\/building\/(\d{3})\/day(?:-high|-top)?\.jpg/)
  return m?.[1] ?? null
}

async function visibleAngle(page: import('@playwright/test').Page): Promise<string | null> {
  return page.locator('[data-orbit-show]').getAttribute('src').then(angleFromSrc)
}

test.describe('Building orbit (Panom-style)', () => {
  test('loads homepage without content error', async ({ page }) => {
    await waitForBuilding(page)
    await expect(page.getByText('Content failed to load')).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Building view' })).toBeVisible()
  })

  test('content angle count matches building-spec', async ({ page }) => {
    const specRes = await page.request.get('/content/building/building-spec.json')
    expect(specRes.ok()).toBeTruthy()
    const spec = (await specRes.json()) as { orbit: { frame_count: number } }
    const frameCount = spec.orbit.frame_count

    const res = await page.request.get('/content/building/angles.csv')
    expect(res.ok()).toBeTruthy()
    const text = await res.text()
    const lines = text.trim().split(/\r?\n/)
    expect(lines.length).toBe(frameCount + 1)
  })

  for (let run = 1; run <= 3; run += 1) {
    test(`drag orbit changes visible angle (pass ${run}/3)`, async ({ page }) => {
      await waitForBuilding(page)
      const viewport = page.getByRole('region', { name: 'Building view' })
      const box = await viewport.boundingBox()
      expect(box).toBeTruthy()
      const start = await visibleAngle(page)
      expect(start).toBeTruthy()

      const seen = new Set<string>([start!])
      const cx = box!.x + box!.width / 2
      const cy = box!.y + box!.height / 2
      await page.mouse.move(cx, cy)
      await page.mouse.down()
      await page.mouse.move(cx - 420, cy, { steps: 12 })
      await page.mouse.move(cx - 820, cy, { steps: 12 })
      await page.mouse.up()

      await page.waitForTimeout(400)
      const end = await visibleAngle(page)
      expect(end).toBeTruthy()
      seen.add(end!)
      expect(seen.size).toBeGreaterThanOrEqual(2)
    })
  }

  test('orbit angle stabilizes after drag release', async ({ page }) => {
    await waitForBuilding(page)
    const viewport = page.getByRole('region', { name: 'Building view' })
    const box = await viewport.boundingBox()
    expect(box).toBeTruthy()
    const cx = box!.x + box!.width / 2
    const cy = box!.y + box!.height / 2
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx - 500, cy, { steps: 8 })
    await page.mouse.up()
    await page.waitForTimeout(350)
    const a = await visibleAngle(page)
    await page.waitForTimeout(350)
    const b = await visibleAngle(page)
    expect(a).toBe(b)
  })

  test('High view mode loads high orbit stills', async ({ page }) => {
    await waitForBuilding(page)
    await page.getByRole('tab', { name: 'High' }).click()
    await page.waitForTimeout(300)
    const src = await page.locator('[data-orbit-show]').getAttribute('src')
    expect(src).toMatch(/day-high\.jpg/)
  })

  test('Bird\'s eye view mode loads top orbit stills', async ({ page }) => {
    await waitForBuilding(page)
    await page.getByRole('tab', { name: "Bird's eye" }).click()
    await page.waitForTimeout(300)
    const src = await page.locator('[data-orbit-show]').getAttribute('src')
    expect(src).toMatch(/day-top\.jpg/)
  })

  test('floor band opens selection', async ({ page }) => {
    await waitForBuilding(page)
    const band = page.locator('polygon.band').first()
    await expect(band).toBeAttached()
    await band.click({ force: true })
    await expect(page.getByRole('button', { name: 'Go to' })).toBeVisible()
  })

  test('go to navigates to floor page', async ({ page }) => {
    await waitForBuilding(page)
    await page.getByRole('button', { name: 'Ground' }).click()
    await page.getByRole('button', { name: 'Go to' }).click()
    await expect(page).toHaveURL(/\/floors\/ground/)
  })
})
