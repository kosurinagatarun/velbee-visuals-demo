import { useEffect, useRef } from 'react'
import { buildingStillUrl } from '../data/loadContent'
import type { Angle, OrbitPitchRing } from '../data/types'

type Props = {
  angles: Angle[]
  pitchRings: OrbitPitchRing[]
  orbitRef: { current: number }
  pitchRef: { current: number }
}

function wrap(value: number, count: number): number {
  return ((value % count) + count) % count
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

const WINDOW = 10

export function OrbitStill({ angles, pitchRings, orbitRef, pitchRef }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const count = angles.length
  const ringCount = Math.max(1, pitchRings.length)
  const pitchMax = Math.max(0, ringCount - 1)
  const sideRing = pitchRings[0]!
  const orbitIndex = wrap(Math.round(orbitRef.current), count)
  const sizer = angles[orbitIndex] ?? angles[0]
  const stepDeg = count > 0 ? 360 / count : 0
  const sizerUrl = sizer && sideRing ? buildingStillUrl(sizer.id, sideRing, 'day') : ''

  useEffect(() => {
    const root = rootRef.current
    if (!root || count < 1) return
    const layerA = root.querySelector<HTMLImageElement>('[data-orbit-a]')
    const layerB = root.querySelector<HTMLImageElement>('[data-orbit-b]')
    if (!layerA || !layerB) return

    const cache = new Map<string, HTMLImageElement>()

    function urlFor(index: number, pitchIdx: number) {
      const item = angles[wrap(index, count)]
      const r = pitchRings[clamp(pitchIdx, 0, ringCount - 1)] ?? pitchRings[0]
      if (!item || !r) return ''
      return buildingStillUrl(item.id, r, 'day')
    }

    function touch(url: string) {
      if (!url || cache.has(url)) return
      const img = new Image()
      img.src = url
      cache.set(url, img)
    }

    function preload(index: number, low: number, high: number) {
      for (let d = -WINDOW; d <= WINDOW; d += 1) {
        touch(urlFor(index + d, low))
        if (high !== low) touch(urlFor(index + d, high))
      }
      if (pitchMax > 0) {
        for (let p = 0; p <= pitchMax; p += 1) {
          for (let d = -WINDOW; d <= WINDOW; d += 1) {
            touch(urlFor(index + d, p))
          }
        }
      }
    }

    function applySrc(el: HTMLImageElement, url: string) {
      if (!url) return
      const current = el.getAttribute('src') ?? ''
      const path = url.split('?')[0]!
      if (current === url || el.src.endsWith(path)) {
        if (el.hasAttribute('data-orbit-show')) el.setAttribute('data-orbit-show', url)
        return
      }
      const img = cache.get(url)
      if (img?.complete && img.naturalWidth > 0) {
        el.src = url
        if (el.hasAttribute('data-orbit-show')) el.setAttribute('data-orbit-show', url)
        return
      }
      touch(url)
      el.src = url
      if (el.hasAttribute('data-orbit-show')) el.setAttribute('data-orbit-show', url)
    }

    function spinStyle(ring: OrbitPitchRing | undefined) {
      if (ring?.shared) {
        return {
          transform: `rotate(${orbitRef.current * stepDeg}deg)`,
          transformOrigin: 'center center',
        } as const
      }
      return { transform: '', transformOrigin: 'center center' } as const
    }

    let key = ''
    let frame = 0

    const paint = () => {
      const orbitF = orbitRef.current
      const index = wrap(Math.floor(orbitF + 1e-6), count)
      const pitch = clamp(pitchRef.current, 0, pitchMax)
      const low = Math.floor(pitch)
      const high = Math.min(low + 1, pitchMax)
      const frac = pitch - low

      const ringLow = pitchRings[low]!
      const ringHigh = pitchRings[high]!

      if (pitchMax === 0) {
        layerA.style.opacity = '1'
        layerB.style.opacity = '0'
        const url = urlFor(index, 0)
        const k = `0:${index}`
        if (k !== key) {
          applySrc(layerA, url)
          key = k
          preload(index, 0, 0)
        }
        Object.assign(layerA.style, spinStyle(ringLow))
        layerB.style.transform = ''
      } else {
        const urlA = urlFor(index, low)
        const urlB = urlFor(index, high)
        const k = `${low}:${high}:${index}`
        if (k !== key) {
          applySrc(layerA, urlA)
          applySrc(layerB, urlB)
          preload(index, low, high)
          key = k
        }
        layerA.style.opacity = String(1 - frac)
        layerB.style.opacity = String(frac)
        Object.assign(layerA.style, spinStyle(ringLow))
        Object.assign(layerB.style, spinStyle(ringHigh))
      }

      frame = requestAnimationFrame(paint)
    }

    frame = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(frame)
  }, [angles, count, orbitRef, pitchRef, pitchRings, ringCount, pitchMax, stepDeg])

  const urlA0 = sizer && sideRing ? buildingStillUrl(sizer.id, sideRing, 'day') : ''
  const urlB0 =
    pitchMax >= 1 && pitchRings[1]
      ? buildingStillUrl(sizer?.id ?? '001', pitchRings[1]!, 'day')
      : urlA0

  return (
    <div className="orbit" ref={rootRef} role="img" aria-label="Building. Drag sideways and vertically.">
      {sizer ? <img className="orbit-sizer" src={sizerUrl} alt="" draggable={false} /> : null}
      <div className="orbit-layer is-on" data-orbit-layer="">
        <img data-orbit-a="" data-orbit-show="" src={urlA0} alt="" draggable={false} />
        <img data-orbit-b="" className="orbit-plan-spin" src={urlB0} alt="" draggable={false} style={{ opacity: 0 }} />
      </div>
    </div>
  )
}
