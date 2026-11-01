import { useLayoutEffect, useRef, useState } from 'react'
import { projectHotspot } from '../lib/projectHotspot'
import type { Arrow } from '../data/types'

type Props = {
  arrows: Arrow[]
  yawDeg: number
  pitchDeg: number
  fovDeg?: number
  onGo: (to: string) => void
}

type Placed = Arrow & { x: number; y: number; visible: boolean; key: string; spinDeg: number }

export function TourArrows({ arrows, yawDeg, pitchDeg, fovDeg, onGo }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [placed, setPlaced] = useState<Placed[]>([])

  useLayoutEffect(() => {
    const el = wrapRef.current?.parentElement
    if (!el || !arrows.length) {
      setPlaced([])
      return
    }

    function place() {
      if (!el) return
      const w = el.clientWidth
      const h = el.clientHeight
      const next: Placed[] = arrows.map((arrow) => {
        const spot = projectHotspot(arrow.yaw, arrow.pitch, yawDeg, pitchDeg, w, h, fovDeg)
        let spin = arrow.yaw - yawDeg
        while (spin > 180) spin -= 360
        while (spin < -180) spin += 360
        return {
          ...arrow,
          ...spot,
          spinDeg: spin,
          key: `${arrow.to}-${arrow.yaw}-${arrow.pitch}`,
        }
      })
      setPlaced(next)
    }

    place()
    const observer = new ResizeObserver(place)
    observer.observe(el)
    return () => observer.disconnect()
  }, [arrows, fovDeg, pitchDeg, yawDeg])

  return (
    <div ref={wrapRef} className="tour-arrow-slot">
      {placed.map((arrow) =>
        arrow.visible ? (
          <button
            key={arrow.key}
            type="button"
            className="door-chevron"
            style={{
              left: arrow.x,
              top: arrow.y,
              transform: `rotate(${arrow.spinDeg}deg)`,
            }}
            aria-label={arrow.label ? `Enter ${arrow.label}` : `Go to stop ${arrow.to}`}
            onClick={() => onGo(arrow.to)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" />
            </svg>
            {arrow.label ? <span className="door-chevron-label">{arrow.label}</span> : null}
          </button>
        ) : null,
      )}
    </div>
  )
}
