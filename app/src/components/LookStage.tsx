import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  lookKey: string
  panX: number
  panY: number
  onPan: (x: number, y: number) => void
  children: ReactNode
}

const SCALE = 1.28
const LIMIT_X = 140
const LIMIT_Y = 80

export function LookStage({ lookKey, panX, panY, onPan, children }: Props) {
  const onPanRef = useRef(onPan)
  onPanRef.current = onPan
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null)
  const panRef = useRef({ x: panX, y: panY })
  panRef.current = { x: panX, y: panY }

  useEffect(() => {
    onPanRef.current(0, 0)
  }, [lookKey])

  function onDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true
    if (!drag.moved) return
    onPanRef.current(
      Math.max(-LIMIT_X, Math.min(LIMIT_X, drag.panX + dx)),
      Math.max(-LIMIT_Y, Math.min(LIMIT_Y, drag.panY + dy)),
    )
  }

  function onUp(event: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div
      className="look-stage"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div
        className="look-layer"
        style={{ transform: `translate(${panX}px, ${panY}px) scale(${SCALE})` }}
      >
        {children}
      </div>
    </div>
  )
}
