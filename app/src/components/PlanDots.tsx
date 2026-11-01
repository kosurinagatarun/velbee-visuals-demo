import type { Stop } from '../data/types'

type Props = {
  stops: Stop[]
  activeId?: string
  onSelect: (id: string) => void
  hideActiveNumber?: boolean
}

export function PlanDots({ stops, activeId, onSelect, hideActiveNumber }: Props) {
  return (
    <g>
      {stops.map((stop) => {
        const active = stop.id === activeId
        if (hideActiveNumber && active) return null
        const n = String(Number.parseInt(stop.id, 10))
        return (
          <g key={stop.id} onClick={() => onSelect(stop.id)} style={{ cursor: 'pointer' }}>
            <circle className={active ? 'dot-hit active' : 'dot-hit'} cx={stop.plan.x} cy={stop.plan.y} r={0.028} />
            <circle className={active ? 'dot active' : 'dot'} cx={stop.plan.x} cy={stop.plan.y} r={0.016} />
            <text
              className="dot-num"
              x={stop.plan.x}
              y={stop.plan.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={0.02}
            >
              {n}
            </text>
          </g>
        )
      })}
    </g>
  )
}
