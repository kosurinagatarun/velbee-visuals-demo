import { useEffect, useMemo, useRef } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { PlanDots } from '../components/PlanDots'
import { PanoViewer } from '../components/PanoViewer'
import { Still } from '../components/Still'
import { SvgOverlay } from '../components/SvgOverlay'
import { TourArrows } from '../components/TourArrows'
import { TourControls } from '../components/TourControls'
import { TourMinimap } from '../components/TourMinimap'
import { useContent } from '../data/ContentContext'
import { useGuidedWalk } from '../hooks/useGuidedWalk'
import { usePanoTour } from '../hooks/usePanoTour'

type TourMode = 'tour' | 'plan'

function isMode(value: string | null): value is TourMode {
  return value === 'plan' || value === 'tour'
}

export function UnitTourPage() {
  const pack = useContent()
  const plate = pack.unitTour
  const [params, setParams] = useSearchParams()
  const stageRef = useRef<HTMLElement>(null)

  const modeParam = params.get('mode')
  const mode: TourMode = isMode(modeParam) ? modeParam : 'tour'
  const stopId = params.get('stop') ?? plate?.stops[0]?.id ?? '01'
  const stop = plate?.stops.find((s) => s.id === stopId) ?? plate?.stops[0]
  const angle = params.get('angle') ?? pack.angles[0]?.id ?? '001'

  const {
    yawDeg,
    pitchDeg,
    fovDeg,
    panoReady,
    setYawDeg,
    setPitchDeg,
    setFovDeg,
    setPanoReady,
    resetLook,
    zoomIn,
    zoomOut,
    resetZoom,
  } = usePanoTour(stopId)

  const fitout = 'furnished' as const
  const equirectTour = plate?.equirectTour === true

  const stillSrc = useMemo(() => {
    if (!plate || !stop) return ''
    if (mode === 'plan') return plate.planUrl(fitout)
    return plate.tourUrl(fitout, stop.file)
  }, [mode, plate, stop])

  const panoSrc = useMemo(() => {
    if (!plate || !stop) return ''
    return plate.panoUrl(fitout, stop.id)
  }, [plate, stop])

  function patch(next: { mode?: TourMode; stop?: string }) {
    const nextParams = new URLSearchParams(params)
    if (next.mode) nextParams.set('mode', next.mode)
    if (next.stop) nextParams.set('stop', next.stop)
    setParams(nextParams, { replace: true })
  }

  function goStop(id: string) {
    patch({ mode: 'tour', stop: id })
  }

  const { guidedActive, setGuidedActive, guidedNext } = useGuidedWalk(plate?.stops ?? [], stopId, goStop)

  useEffect(() => {
    if (!plate || !stop) return
    const neighborIds = new Set([stop.id, ...stop.arrows.map((a) => a.to)])
    const urls = [plate.planUrl(fitout)]
    if (equirectTour) {
      urls.push(panoSrc)
      for (const item of plate.stops) {
        if (neighborIds.has(item.id)) urls.push(plate.panoUrl(fitout, item.id))
      }
    }
    for (const url of urls) {
      const img = new Image()
      img.src = url
    }
  }, [equirectTour, panoSrc, plate, stop])

  useEffect(() => {
    document.documentElement.classList.add('velbee-tour-active')
    return () => document.documentElement.classList.remove('velbee-tour-active')
  }, [])

  if (!plate || !stop) return <Navigate to="/" replace />

  const backTo = `/?angle=${angle}&light=day`
  const lookDeg = stop.heading + yawDeg

  return (
    <div className={equirectTour && panoReady ? 'unit is-pano-ready' : equirectTour ? 'unit' : 'unit unit-tour-stills'}>
      <section ref={stageRef} className="unit-stage unit-stage-stop-flash" data-stop={stopId} aria-label={stop.name}>
        {mode === 'tour' ? (
          <>
            {!equirectTour || !panoReady ? (
              <Still key={`hold-${stop.id}`} src={stillSrc} alt={stop.name} />
            ) : null}
            {equirectTour ? (
              <PanoViewer
                equirectUrl={panoSrc}
                fovDeg={fovDeg}
                onFovChange={setFovDeg}
                onLook={(yaw, pitch) => {
                  setYawDeg(yaw)
                  setPitchDeg(pitch)
                }}
                onReady={() => setPanoReady(true)}
              />
            ) : null}
          </>
        ) : (
          <Still key="plan" src={stillSrc} alt="Floor plan" />
        )}

        {mode === 'plan' ? (
          <SvgOverlay>
            <PlanDots stops={plate.stops} activeId={stop.id} onSelect={goStop} />
          </SvgOverlay>
        ) : null}

        {mode === 'tour' ? (
          <TourArrows arrows={stop.arrows} yawDeg={yawDeg} pitchDeg={pitchDeg} fovDeg={fovDeg} onGo={goStop} />
        ) : null}

        {mode === 'tour' ? (
          <div className="unit-compass" aria-label="North">
            <span style={{ transform: `rotate(${-lookDeg}deg)` }}>N</span>
          </div>
        ) : null}

        {mode === 'tour' ? (
          <TourControls
            stageRef={stageRef}
            fovDeg={fovDeg}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetZoom={resetZoom}
            onResetLook={resetLook}
            showGuided
            guidedActive={guidedActive}
            onToggleGuided={() => setGuidedActive((v) => !v)}
            onGuidedNext={guidedNext}
          />
        ) : null}

        <div className="unit-hud">
          <Link className="unit-back" to={backTo} aria-label="Go back">
            ←
          </Link>
          <span className="unit-name">4BHK East · {stop.name}</span>
          <span className="unit-sep" />
          <button type="button" className={mode === 'plan' ? 'on' : ''} onClick={() => patch({ mode: 'plan' })}>
            Floor plan
          </button>
          <button type="button" className={mode === 'tour' ? 'on' : ''} onClick={() => patch({ mode: 'tour' })}>
            Tour
          </button>
        </div>

        {mode === 'tour' ? (
          <p className="pano-hint pano-hint-tour">Drag to look · Pinch or scroll to zoom</p>
        ) : null}

        {mode === 'tour' ? (
          <TourMinimap
            planSrc={plate.planUrl(fitout)}
            stops={plate.stops}
            activeId={stop.id}
            lookDeg={lookDeg}
            onSelect={goStop}
          />
        ) : null}
      </section>
    </div>
  )
}
