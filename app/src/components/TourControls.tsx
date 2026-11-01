import type { RefObject } from 'react'
import { useCallback, useState } from 'react'

type Props = {
  stageRef: RefObject<HTMLElement | null>
  fovDeg: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onResetLook?: () => void
  /** Guided walk: advance to next stop id */
  onGuidedNext?: () => void
  guidedActive?: boolean
  onToggleGuided?: () => void
  showGuided?: boolean
}

export function TourControls({
  stageRef,
  fovDeg,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onResetLook,
  onGuidedNext,
  guidedActive,
  onToggleGuided,
  showGuided,
}: Props) {
  const [copied, setCopied] = useState(false)

  const toggleFullscreen = useCallback(async () => {
    const el = stageRef.current
    if (!el) return
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    await el.requestFullscreen()
  }, [stageRef])

  const shareLink = useCallback(async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: 'VelBEE Visuals', url })
        return
      }
    } catch {
      /* cancelled */
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }, [])

  return (
    <div className="tour-controls" role="toolbar" aria-label="Tour controls">
      <button type="button" className="tour-ctrl" onClick={onZoomOut} aria-label="Zoom out">
        −
      </button>
      <span className="tour-ctrl-label" aria-live="polite">
        {Math.round(fovDeg)}°
      </span>
      <button type="button" className="tour-ctrl" onClick={onZoomIn} aria-label="Zoom in">
        +
      </button>
      <button type="button" className="tour-ctrl" onClick={onResetZoom} aria-label="Reset zoom">
        ⟲
      </button>
      {onResetLook ? (
        <button type="button" className="tour-ctrl" onClick={onResetLook} aria-label="Reset view">
          ⊙
        </button>
      ) : null}
      <button type="button" className="tour-ctrl" onClick={toggleFullscreen} aria-label="Fullscreen">
        ⛶
      </button>
      <button type="button" className="tour-ctrl" onClick={shareLink} aria-label="Share link">
        {copied ? '✓' : '⎘'}
      </button>
      {showGuided && onToggleGuided ? (
        <button
          type="button"
          className={guidedActive ? 'tour-ctrl on' : 'tour-ctrl'}
          onClick={onToggleGuided}
          aria-label={guidedActive ? 'Stop guided walk' : 'Start guided walk'}
        >
          {guidedActive ? '■' : '▶'}
        </button>
      ) : null}
      {guidedActive && onGuidedNext ? (
        <button type="button" className="tour-ctrl" onClick={onGuidedNext} aria-label="Next stop">
          ›
        </button>
      ) : null}
    </div>
  )
}
