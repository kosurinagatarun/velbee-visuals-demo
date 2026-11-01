import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Frame } from '../components/Frame'
import { OrbitStill } from '../components/OrbitStill'
import { useContent } from '../data/ContentContext'
import { compassDeg } from '../data/labels'
import { isBuildingOnlyMode, showcaseTitle, VISUALS_BRAND } from '../config/visuals'

const SNAP_MS = 220
const PX_PER_FRAME_DESKTOP = 3
const PX_PER_FRAME_MOBILE = 2
const PX_PER_PITCH_DESKTOP = 48
const PX_PER_PITCH_MOBILE = 36
const ORBIT_ZOOM_MIN = 0.92
const ORBIT_ZOOM_MAX = 2.5

function pxPerFrame() {
  if (typeof window === 'undefined') return PX_PER_FRAME_DESKTOP
  return window.matchMedia('(max-width: 860px)').matches ? PX_PER_FRAME_MOBILE : PX_PER_FRAME_DESKTOP
}

function pxPerPitch() {
  if (typeof window === 'undefined') return PX_PER_PITCH_DESKTOP
  return window.matchMedia('(max-width: 860px)').matches ? PX_PER_PITCH_MOBILE : PX_PER_PITCH_DESKTOP
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function pinchDistance(points: Map<number, { x: number; y: number }>) {
  const pts = [...points.values()]
  if (pts.length < 2) return 0
  return Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y)
}

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
  const orbitZoomRef = useRef(1)
  orbitZoomRef.current = orbitZoom

  const count = pack.angles.length
  const pitchRings = pack.pitchRings
  const pitchMax = Math.max(0, pitchRings.length - 1)
  const canPitch = pitchRings.length > 1

  const angleId = params.get('angle') ?? pack.angles[0]?.id ?? '001'
  const pitchParam = params.get('pitch')
  const initialPitch = pitchParam
    ? Math.max(0, pitchRings.findIndex((r) => r.id === pitchParam))
    : 0

  const urlIndex = Math.max(
    0,
    pack.angles.findIndex((item) => item.id === angleId),
  )

  const orbitRef = useRef(urlIndex)
  const pitchRef = useRef(initialPitch >= 0 ? initialPitch : 0)
  const [nearest, setNearest] = useState(urlIndex)
  const [nearestPitch, setNearestPitch] = useState(initialPitch >= 0 ? initialPitch : 0)
  const dragRef = useRef<{
    x: number
    y: number
    start: number
    startPitch: number
    moved: boolean
  } | null>(null)
  const animRef = useRef<number | null>(null)
  const viewRef = useRef<HTMLElement>(null)
  const animateToRef = useRef<(target: number) => void>(() => {})
  const writeOrbitRef = useRef<(value: number) => void>(() => {})
  const writePitchRef = useRef<(value: number) => void>(() => {})

  useEffect(() => {
    if (buildingOnly) {
      document.documentElement.classList.add('is-building-showcase')
      return () => document.documentElement.classList.remove('is-building-showcase')
    }
    return undefined
  }, [buildingOnly])

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

  function writePitch(value: number) {
    const next = clamp(value, 0, pitchMax)
    pitchRef.current = next
    const snap = clamp(Math.round(next), 0, pitchMax)
    setNearestPitch((current) => (current === snap ? current : snap))
  }

  const angle = pack.angles[nearest] ?? pack.angles[0]
  const pitchRing = pitchRings[nearestPitch] ?? pitchRings[0]

  function patchAngle(id: string) {
    const merged = new URLSearchParams(params)
    merged.set('angle', id)
    merged.set('light', 'day')
    if (pitchRing?.id) merged.set('pitch', pitchRing.id)
    setParams(merged, { replace: true })
  }

  function commitAngle(index: number) {
    const item = pack.angles[wrap(index, count)]
    if (item) patchAngle(item.id)
  }

  function commitPitch(index: number) {
    const ring = pitchRings[clamp(index, 0, pitchMax)]
    if (!ring) return
    const merged = new URLSearchParams(params)
    merged.set('pitch', ring.id)
    setParams(merged, { replace: true })
  }

  function animatePitchTo(target: number) {
    if (!canPitch) return
    const start = pitchRef.current
    const end = clamp(target, 0, pitchMax)
    const t0 = performance.now()

    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / SNAP_MS)
      const eased = 1 - (1 - u) ** 3
      writePitch(start + (end - start) * eased)
      if (u < 1) requestAnimationFrame(tick)
      else {
        writePitch(end)
        commitPitch(end)
      }
    }
    requestAnimationFrame(tick)
  }

  function nudgePitch(step: number) {
    animatePitchTo(Math.round(pitchRef.current) + step)
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
  writePitchRef.current = writePitch

  useEffect(() => {
    const el = viewRef.current
    if (!el) return

    const pointers = new Map<number, { x: number; y: number }>()
    const pinch = { dist: 0, zoom: 1 }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      setOrbitZoom((z) => {
        const next = z + (event.deltaY > 0 ? -0.08 : 0.08)
        return Math.max(ORBIT_ZOOM_MIN, Math.min(ORBIT_ZOOM_MAX, next))
      })
    }

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      const target = event.target as HTMLElement
      if (target.closest('button')) return

      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

      if (pointers.size >= 2) {
        dragRef.current = null
        setDragging(false)
        pinch.dist = pinchDistance(pointers)
        pinch.zoom = orbitZoomRef.current
        return
      }

      if (animRef.current) cancelAnimationFrame(animRef.current)
      dragRef.current = {
        x: event.clientX,
        y: event.clientY,
        start: orbitRef.current,
        startPitch: pitchRef.current,
        moved: false,
      }
      setDragging(true)
      try {
        el.setPointerCapture(event.pointerId)
      } catch {
        /* ignore */
      }
    }

    const onMove = (event: PointerEvent) => {
      if (pointers.has(event.pointerId)) {
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      }

      if (pointers.size >= 2 && pinch.dist > 10) {
        event.preventDefault()
        const dist = pinchDistance(pointers)
        if (dist > 0) {
          const ratio = dist / pinch.dist
          const next = pinch.zoom * ratio
          setOrbitZoom(Math.max(ORBIT_ZOOM_MIN, Math.min(ORBIT_ZOOM_MAX, next)))
        }
        return
      }

      const drag = dragRef.current
      if (!drag) return
      event.preventDefault()
      const dx = event.clientX - drag.x
      const dy = event.clientY - drag.y
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) drag.moved = true
      writeOrbitRef.current(drag.start - dx / pxPerFrame())
      if (canPitch) {
        writePitchRef.current(drag.startPitch - dy / pxPerPitch())
      }
    }

    const endPointer = (event: PointerEvent) => {
      pointers.delete(event.pointerId)
      try {
        if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId)
      } catch {
        /* ignore */
      }

      if (pointers.size >= 2) {
        pinch.dist = pinchDistance(pointers)
        setOrbitZoom((z) => {
          pinch.zoom = z
          return z
        })
        return
      }

      const drag = dragRef.current
      if (!drag) return
      dragRef.current = null
      setDragging(false)
      animateToRef.current(Math.round(orbitRef.current))
      if (canPitch) animatePitchTo(Math.round(pitchRef.current))
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', endPointer)
    el.addEventListener('pointercancel', endPointer)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', endPointer)
      el.removeEventListener('pointercancel', endPointer)
    }
  }, [count, canPitch, pitchMax])

  const stageClass = buildingOnly ? 'stage stage-building-only' : 'stage'
  const hintDesktop = canPitch
    ? 'Drag sideways · up/down for view · scroll or −/+ to zoom'
    : 'Drag to rotate · Scroll or −/+ to zoom'
  const hintTouch = canPitch
    ? 'Swipe sideways · up/down for view · pinch or −/+ to zoom'
    : 'Swipe to rotate · Pinch or −/+ to zoom'

  return (
    <div className={stageClass}>
      <header className="topbar topbar-building">
        <span className="crumb">
          {buildingOnly ? showcaseTitle() : VISUALS_BRAND.product}
        </span>
        <div className="modes modes-building">
          <button type="button" className="orbit-nav-btn" onClick={() => rotate(-1)} aria-label="Rotate left">
            <span className="orbit-nav-icon" aria-hidden>
              ←
            </span>
            <span className="orbit-nav-label">Left</span>
          </button>
          <button type="button" className="orbit-nav-btn" onClick={() => rotate(1)} aria-label="Rotate right">
            <span className="orbit-nav-icon" aria-hidden>
              →
            </span>
            <span className="orbit-nav-label">Right</span>
          </button>
        </div>
        <div className="compass" aria-label={`Facing ${angle.face}${canPitch ? ` · ${pitchRing?.label ?? ''}` : ''}`}>
          <span style={{ transform: `rotate(${compassDeg(angle.face)}deg)` }}>N</span>
        </div>
        {canPitch ? (
          <div className="orbit-pitch-nav" aria-label="View angle">
            <button type="button" className="orbit-nav-btn" onClick={() => nudgePitch(-1)} aria-label="Lower view">
              ↓
            </button>
            <span className="orbit-pitch-label">{pitchRing?.label}</span>
            <button type="button" className="orbit-nav-btn" onClick={() => nudgePitch(1)} aria-label="Raise view">
              ↑
            </button>
          </div>
        ) : null}
      </header>

      <div className="stage-body">
        <section
          ref={viewRef}
          aria-label="Building view"
          className={dragging ? 'viewport is-orbit is-drag' : 'viewport is-orbit'}
        >
          <Frame>
            <div className="orbit-zoom-wrap" style={{ transform: `scale(${orbitZoom})` }}>
              <OrbitStill
                angles={pack.angles}
                pitchRings={pitchRings}
                orbitRef={orbitRef}
                pitchRef={pitchRef}
              />
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
            <p className="building-hint">
              <span className="building-hint-desktop">{hintDesktop}</span>
              <span className="building-hint-touch">{hintTouch}</span>
            </p>
          ) : null}
          {canPitch ? (
            <div className="orbit-pitch-rail" aria-hidden>
              {pitchRings.map((ring, i) => (
                <span
                  key={ring.id}
                  className={i === nearestPitch ? 'orbit-pitch-dot is-on' : 'orbit-pitch-dot'}
                />
              ))}
            </div>
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
        </footer>
      ) : null}
    </div>
  )
}
