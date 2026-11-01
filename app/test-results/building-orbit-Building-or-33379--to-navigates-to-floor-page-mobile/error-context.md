# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: building-orbit.spec.ts >> Building orbit (Panom-style) >> go to navigates to floor page
- Location: tests\building-orbit.spec.ts:92:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Go to' })
    - locator resolved to <button type="button">Go to</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
      - waiting 100ms
    110 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <div class="orbit-zoom-ui" aria-label="Building zoom">…</div> intercepts pointer events
      - retrying click action
        - waiting 500ms
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]: VelBEE Visuals
    - generic [ref=e6]:
      - button "Exterior VT" [ref=e7] [cursor=pointer]
      - button "Unit tour (4BHK)" [ref=e8] [cursor=pointer]
      - button "Rotate left" [ref=e9] [cursor=pointer]
      - button "Rotate right" [ref=e10] [cursor=pointer]
      - button "Select floor" [ref=e11] [cursor=pointer]
    - generic "Facing north" [ref=e12]: "N"
  - generic [ref=e14]:
    - region "Building view" [ref=e15]:
      - generic [ref=e16]:
        - img "Building. Drag to rotate." [ref=e18]
        - img:
          - generic [ref=e19] [cursor=pointer]
      - generic [ref=e20]:
        - strong [ref=e21]: Ground
        - paragraph [ref=e22]: Facing north
        - button "Go to" [ref=e23] [cursor=pointer]
      - generic "Building zoom" [ref=e24]:
        - button "−" [ref=e25] [cursor=pointer]
        - generic [ref=e26]: 100%
        - button "+" [ref=e27] [cursor=pointer]
        - button "⟲" [ref=e28] [cursor=pointer]
    - complementary [ref=e29]:
      - heading "Floor" [level=1] [ref=e30]
      - paragraph [ref=e31]: Drag to rotate · Scroll to zoom the building (not the page).
      - list [ref=e32]:
        - listitem [ref=e33]:
          - button "Ground" [active] [ref=e34] [cursor=pointer]
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | 
  3  | async function waitForBuilding(page: import('@playwright/test').Page) {
  4  |   await page.goto('/')
  5  |   await expect(page.getByRole('img', { name: /Building\. Drag to rotate\./i })).toBeVisible({
  6  |     timeout: 30_000,
  7  |   })
  8  | }
  9  | 
  10 | function angleFromSrc(src: string | null): string | null {
  11 |   if (!src) return null
  12 |   const m = src.match(/\/building\/(\d{3})\/day\.jpg/)
  13 |   return m?.[1] ?? null
  14 | }
  15 | 
  16 | async function visibleAngle(page: import('@playwright/test').Page): Promise<string | null> {
  17 |   return page.locator('[data-orbit-show]').getAttribute('src').then(angleFromSrc)
  18 | }
  19 | 
  20 | test.describe('Building orbit (Panom-style)', () => {
  21 |   test('loads homepage without content error', async ({ page }) => {
  22 |     await waitForBuilding(page)
  23 |     await expect(page.getByText('Content failed to load')).toHaveCount(0)
  24 |     await expect(page.getByRole('region', { name: 'Building view' })).toBeVisible()
  25 |   })
  26 | 
  27 |   test('content angle count matches building-spec', async ({ page }) => {
  28 |     const specRes = await page.request.get('/content/building/building-spec.json')
  29 |     expect(specRes.ok()).toBeTruthy()
  30 |     const spec = (await specRes.json()) as { orbit: { frame_count: number } }
  31 |     const frameCount = spec.orbit.frame_count
  32 | 
  33 |     const res = await page.request.get('/content/building/angles.csv')
  34 |     expect(res.ok()).toBeTruthy()
  35 |     const text = await res.text()
  36 |     const lines = text.trim().split(/\r?\n/)
  37 |     expect(lines.length).toBe(frameCount + 1)
  38 |   })
  39 | 
  40 |   for (let run = 1; run <= 3; run += 1) {
  41 |     test(`drag orbit changes visible angle (pass ${run}/3)`, async ({ page }) => {
  42 |       await waitForBuilding(page)
  43 |       const viewport = page.getByRole('region', { name: 'Building view' })
  44 |       const box = await viewport.boundingBox()
  45 |       expect(box).toBeTruthy()
  46 |       const start = await visibleAngle(page)
  47 |       expect(start).toBeTruthy()
  48 | 
  49 |       const seen = new Set<string>([start!])
  50 |       const cx = box!.x + box!.width / 2
  51 |       const cy = box!.y + box!.height / 2
  52 |       await page.mouse.move(cx, cy)
  53 |       await page.mouse.down()
  54 |       await page.mouse.move(cx - 420, cy, { steps: 12 })
  55 |       await page.mouse.move(cx - 820, cy, { steps: 12 })
  56 |       await page.mouse.up()
  57 | 
  58 |       await page.waitForTimeout(400)
  59 |       const end = await visibleAngle(page)
  60 |       expect(end).toBeTruthy()
  61 |       seen.add(end!)
  62 |       expect(seen.size).toBeGreaterThanOrEqual(2)
  63 |     })
  64 |   }
  65 | 
  66 |   test('orbit angle stabilizes after drag release', async ({ page }) => {
  67 |     await waitForBuilding(page)
  68 |     const viewport = page.getByRole('region', { name: 'Building view' })
  69 |     const box = await viewport.boundingBox()
  70 |     expect(box).toBeTruthy()
  71 |     const cx = box!.x + box!.width / 2
  72 |     const cy = box!.y + box!.height / 2
  73 |     await page.mouse.move(cx, cy)
  74 |     await page.mouse.down()
  75 |     await page.mouse.move(cx - 500, cy, { steps: 8 })
  76 |     await page.mouse.up()
  77 |     await page.waitForTimeout(350)
  78 |     const a = await visibleAngle(page)
  79 |     await page.waitForTimeout(350)
  80 |     const b = await visibleAngle(page)
  81 |     expect(a).toBe(b)
  82 |   })
  83 | 
  84 |   test('floor band opens selection', async ({ page }) => {
  85 |     await waitForBuilding(page)
  86 |     const band = page.locator('polygon.band').first()
  87 |     await expect(band).toBeAttached()
  88 |     await band.click({ force: true })
  89 |     await expect(page.getByRole('button', { name: 'Go to' })).toBeVisible()
  90 |   })
  91 | 
  92 |   test('go to navigates to floor page', async ({ page }) => {
  93 |     await waitForBuilding(page)
  94 |     await page.getByRole('button', { name: 'Ground' }).click()
> 95 |     await page.getByRole('button', { name: 'Go to' }).click()
     |                                                       ^ Error: locator.click: Test timeout of 60000ms exceeded.
  96 |     await expect(page).toHaveURL(/\/floors\/ground/)
  97 |   })
  98 | })
  99 | 
```