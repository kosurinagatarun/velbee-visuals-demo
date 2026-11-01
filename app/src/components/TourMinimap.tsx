import { useState } from 'react'
import { PlanDots } from './PlanDots'
import { SvgOverlay } from './SvgOverlay'
import type { Stop } from '../data/types'

type Props = {
  planSrc: string
  stops: Stop[]
  activeId: string
  lookDeg: number
  onSelect: (id: string) => void
}

export function TourMinimap({ planSrc, stops, activeId, lookDeg, onSelect }: Props) {
  const [large, setLarge] = useState(false)
  const active = stops.find((stop) => stop.id === activeId)

  return (
    <div className={large ? 'tour-minimap is-large' : 'tour-minimap'}>
      <button
        type="button"
        className="minimap-size"
        aria-label={large ? 'Shrink minimap' : 'Enlarge minimap'}
        onClick={() => setLarge((value) => !value)}
      >
        {large ? '↙' : '↗'}
      </button>
      <div className="minimap-plan">
        <img src={planSrc} alt="" />
        <SvgOverlay>
          <PlanDots stops={stops} activeId={activeId} onSelect={onSelect} hideActiveNumber />
          {active ? (
            <g
              className="cam-mark"
              transform={`translate(${active.plan.x} ${active.plan.y}) rotate(${lookDeg})`}
            >
              <path className="cam-cone" d="M 0 0 L -0.028 -0.072 L 0.028 -0.072 Z" />
              <circle className="cam-disc" r={0.016} />
            </g>
          ) : null}
        </SvgOverlay>
      </div>
    </div>
  )
}
