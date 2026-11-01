import { useEffect, useRef } from 'react'
import { buildingStillUrl } from '../data/loadContent'
import type { Angle } from '../data/types'

type Props = {
  angles: Angle[]
  orbitRef: { current: number }
}

function wrap(value: number, count: number): number {
  return ((value % count) + count) % count
}

const WINDOW = 12

export function OrbitStill({ angles, orbitRef }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const count = angles.length
  const sizer = angles[wrap(Math.round(orbitRef.current), count)] ?? angles[0]

  useEffect(() => {
    const root = rootRef.current
    if (!root || count < 1) return
    const show = root.querySelector<HTMLImageElement>('[data-orbit-show]')
    if (!show) return

    const cache = new Map<string, HTMLImageElement>()

    function urlFor(index: number) {
      const item = angles[wrap(index, count)]
      return item ? buildingStillUrl(item.id, 'day') : ''
    }

    function preload(index: number) {
      for (let d = -WINDOW; d <= WINDOW; d += 1) {
        const url = urlFor(index + d)
        if (!url || cache.has(url)) continue
        const img = new Image()
        img.src = url
        cache.set(url, img)
      }
    }

    let shown = -1
    let frame = 0

    const paint = () => {
      const index = wrap(Math.round(orbitRef.current), count)
      if (index !== shown) {
        const url = urlFor(index)
        const cached = cache.get(url)
        if (!cached) {
          preload(index)
        }
        const ready = cache.get(url)
        if (ready?.complete && ready.naturalWidth > 0) {
          if (show.src !== ready.src) show.src = url
          shown = index
        } else if (show.getAttribute('src') !== url) {
          show.src = url
          shown = index
        }
        preload(index)
      }
      frame = requestAnimationFrame(paint)
    }

    preload(wrap(Math.round(orbitRef.current), count))
    frame = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(frame)
  }, [angles, count, orbitRef])

  return (
    <div className="orbit" ref={rootRef} role="img" aria-label="Building. Drag to rotate.">
      {sizer ? <img className="orbit-sizer" src={buildingStillUrl(sizer.id, 'day')} alt="" draggable={false} /> : null}
      <div className="orbit-layer is-on" data-orbit-layer="">
        <img data-orbit-show="" src={sizer ? buildingStillUrl(sizer.id, 'day') : ''} alt="" draggable={false} />
      </div>
    </div>
  )
}
