import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Frame } from '../components/Frame'
import { OrbitStill } from '../components/OrbitStill'
import { useContent } from '../data/ContentContext'
import { compassDeg } from '../data/labels'
import { isBuildingOnlyMode, showcaseTitle, VISUALS_BRAND } from '../config/visuals'

const SNAP_MS = 220
const PX_PER_FRAME = 3
const ORBIT_ZOOM_MIN = 1
const ORBIT_ZOOM_MAX = 2.5

function wrap(value: number, count: number): number {
  return ((value % count) + count) % count
}

function shortestDelta(from: number, to: number, count: number): number {
  let delta = to - from
  if (delta > count / 2) delta -= count
  if (delta < -count / 2) delta += count
  return delta
}

export function BuildingPage() {
  const pack = useContent()
  const buildingOnly = isBuildingOnlyMode()
  const [params, setParams] = useSearchParams()
  const [dragging, setDragging] = useState(false)
  const [orbitZoom, setOrbitZoom] = useState(1)

  const count = pack.angles.length
  const angleId = params.get('angle') ?? pack.angles[0]?.id ?? '001'

  const urlIndex = Math.max(
    0,
    pack.angles.findIndex((item) => item.id === angleId),
  )

  const orbitRef = useRef(urlIndex)
  const [nearest, setNearest] = useState(urlIndex)
  const dragRef = useRef<{ x: number; start: number; moved: boolean } | null>(null)
  const animRef = useRef<number | null>(null)
  const viewRef = useRef<HTMLElement>(null)
  const animateToRef = useRef<(target: number) => void>(() => {})
  const writeOrbitRef = useRef<(value: number) => void>(() => {})

  useEffect(() => {
    document.title = buildingOnly
      ? `${showcaseTitle()} · ${VISUALS_BRAND.product}`
      : `${VISUALS_BRAND.product} — Showcase`
  }, [buildingOnly])

  function writeOrbit(value: number) {
    const next = wrap(value, count)
    orbitRef.current = next
    const snap = wrap(Math.round(next), count)
    setNearest((current) => (current === snap ? current : snap))
  }

  const angle = pack.angles[nearest] ?? pack.angles[0]

  function patchAngle(id: string) {
    const merged = new URLSearchParams(params)
    merged.set('angle', id)
    merged.set('light', 'day')
    setParams(merged, { replace: true })
  }

  function commitAngle(index: number) {
    const item = pack.angles[wrap(index, count)]
    if (item) patchAngle(item.id)
  }

  function animateTo(target: number) {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const start = orbitRef.current
    const end = wrap(target, count)
    const delta = shortestDelta(start, end, count)
    const t0 = performance.now()

    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / SNAP_MS)
      const eased = 1 - (1 - u) ** 3
      writeOrbit(start + delta * eased)
      if (u < 1) {
        animRef.current = requestAnimationFrame(tick)
        return
      }
      writeOrbit(end)
      commitAngle(end)
    }

    animRef.current = requestAnimationFrame(tick)
  }

  function rotate(step: number) {
    animateTo(Math.round(orbitRef.current) + step)
  }

  animateToRef.current = animateTo
  writeOrbitRef.current = writeOrbit

  useEffect(() => {
    const el = viewRef.current
    if (!el) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      setOrbitZoom((z) => {
        const next = z + (event.deltaY > 0 ? -0.08 : 0.08)
        return Math.max(ORBIT_ZOOM_MIN, Math.min(ORBIT_ZOOM_MAX, next))
      })
    }

    const onDown = (event: PointerEvent | MouseEvent) => {
      if ('button' in event && event.button !== 0) return
      const target = event.target as HTMLElement
      if (target.closest('button')) return
      if (animRef.current) cancelAnimationFrame(animRef.current)
      dragRef.current = { x: event.clientX, start: orbitRef.current, moved: false }
      setDragging(true)
    }

    const onMove = (event: PointerEvent | MouseEvent) => {
      const drag = dragRef.current
      if (!drag) return
      event.preventDefault()
      const dx = event.clientX - drag.x
      if (Math.abs(dx) > 6) drag.moved = true
      writeOrbitRef.current(drag.start - dx / PX_PER_FRAME)
    }

    const onUp = () => {
      const drag = dragRef.current
      if (!drag) return
      dragRef.current = null
      setDragging(false)
      animateToRef.current(Math.round(orbitRef.current))
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('mouseup', onUp)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('mouseup', onUp)
    }
  }, [count])

  const stageClass = buildingOnly ? 'stage stage-building-only' : 'stage'

  return (
    <div className={stageClass}>
      <header className="topbar">
        <span className="crumb">
          {buildingOnly ? showcaseTitle() : VISUALS_BRAND.product}
        </span>
        <div className="modes">
          <button type="button" onClick={() => rotate(-1)} aria-label="Rotate left">
            Rotate left
          </button>
          <button type="button" onClick={() => rotate(1)} aria-label="Rotate right">
            Rotate right
          </button>
        </div>
        <div className="compass" aria-label={`Facing ${angle.face}`}>
          <span style={{ transform: `rotate(${compassDeg(angle.face)}deg)` }}>N</span>
        </div>
      </header>

      <div className="stage-body">
        <section
          ref={viewRef}
          aria-label="Building view"
          className={dragging ? 'viewport is-orbit is-drag' : 'viewport is-orbit'}
        >
          <Frame>
            <div className="orbit-zoom-wrap" style={{ transform: `scale(${orbitZoom})` }}>
              <OrbitStill angles={pack.angles} orbitRef={orbitRef} />
            </div>
          </Frame>
          <div className="orbit-zoom-ui" aria-label="Building zoom">
            <button type="button" onClick={() => setOrbitZoom((z) => Math.max(ORBIT_ZOOM_MIN, z - 0.15))}>
              −
            </button>
            <span>{Math.round(orbitZoom * 100)}%</span>
            <button type="button" onClick={() => setOrbitZoom((z) => Math.min(ORBIT_ZOOM_MAX, z + 0.15))}>
              +
            </button>
            <button type="button" onClick={() => setOrbitZoom(1)}>
              ⟲
            </button>
          </div>
          {buildingOnly ? (
            <p className="building-hint">Drag to rotate · Scroll or use −/+ to zoom</p>
          ) : null}
        </section>

        {buildingOnly ? null : (
          <aside className="rail">
            <p className="hint">Enable full showcase: npm run dev (without client mode).</p>
          </aside>
        )}
      </div>

      {buildingOnly ? (
        <footer className="building-footer">
          <span>{VISUALS_BRAND.product}</span>
          <span className="building-footer-sep">·</span>
          <span>{count} views · 360° orbit</span>
        </footer>
      ) : null}
    </div>
  )
}
