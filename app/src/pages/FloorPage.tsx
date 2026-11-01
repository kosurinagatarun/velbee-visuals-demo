import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
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
import { floorLabel } from '../data/labels'
import type { Fitout, FloorLevel, FloorMode } from '../data/types'

function isLevel(value: string | undefined): value is FloorLevel {
  return value === 'ground' || value === '1' || value === '2'
}

function isMode(value: string | null): value is FloorMode {
  return value === 'plan' || value === 'isometric' || value === 'tour'
}

function isFitout(value: string | null): value is Fitout {
  return value === 'furnished' || value === 'empty'
}

export function FloorPage() {
  const { level } = useParams()
  const [params, setParams] = useSearchParams()
  const pack = useContent()
  const [inspector, setInspector] = useState(false)
  const stageRef = useRef<HTMLElement>(null)

  const floor = pack.floors.find((row) => row.level === level)
  const plate = floor ? pack.plates[floor.plateCode] : undefined
  const modeParam = params.get('mode')
  const mode: FloorMode = isMode(modeParam) ? modeParam : 'tour'
  const fitoutParam = params.get('fitout')
  const fitout: Fitout = isFitout(fitoutParam) ? fitoutParam : 'furnished'
  const stopId = params.get('stop') ?? plate?.stops[0]?.id ?? '01'
  const stop = plate?.stops.find((s) => s.id === stopId) ?? plate?.stops[0]
  const angle = params.get('angle') ?? pack.angles[0]?.id ?? '001'
  const light = params.get('light') === 'night' ? 'night' : 'day'

  const tourKey = `${stopId}-${fitout}`
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
  } = usePanoTour(tourKey)

  const equirectTour = plate?.equirectTour === true

  const stillSrc = useMemo(() => {
    if (!plate || !stop) return ''
    if (mode === 'plan') return plate.planUrl(fitout)
    if (mode === 'isometric') return plate.isoUrl(fitout)
    return plate.tourUrl(fitout, stop.file)
  }, [fitout, mode, plate, stop])

  const panoSrc = useMemo(() => {
    if (!plate || !stop) return ''
    return plate.panoUrl(fitout, stop.id)
  }, [fitout, plate, stop])

  useEffect(() => {
    if (!plate || !stop) return
    const neighborIds = new Set([stop.id, ...stop.arrows.map((arrow) => arrow.to)])
    const urls = [plate.planUrl(fitout), plate.isoUrl(fitout)]
    if (equirectTour) {
      urls.push(panoSrc)
      for (const item of plate.stops) {
        if (!neighborIds.has(item.id)) continue
        urls.push(plate.panoUrl(fitout, item.id))
      }
    }
    for (const url of urls) {
      const img = new Image()
      img.src = url
    }
  }, [equirectTour, fitout, panoSrc, plate, stop])

  function patch(next: { mode?: FloorMode; stop?: string; fitout?: Fitout }) {
    const nextParams = new URLSearchParams(params)
    if (next.mode) nextParams.set('mode', next.mode)
    if (next.stop) nextParams.set('stop', next.stop)
    if (next.fitout) nextParams.set('fitout', next.fitout)
    setParams(nextParams, { replace: true })
  }

  function goStop(id: string) {
    patch({ mode: 'tour', stop: id })
  }

  const { guidedActive, setGuidedActive, guidedNext } = useGuidedWalk(plate?.stops ?? [], stopId, goStop)

  useEffect(() => {
    document.documentElement.classList.add('velbee-tour-active')
    return () => document.documentElement.classList.remove('velbee-tour-active')
  }, [])

  if (!isLevel(level) || !floor || !plate || !stop) {
    return <Navigate to="/" replace />
  }

  const backTo = `/?angle=${angle}&light=${light}`
  const showInspector = mode === 'tour' && inspector
  const planSrc = plate.planUrl(fitout)
  const lookDeg = stop.heading + yawDeg

  return (
    <div
      className={
        showInspector
          ? 'unit is-inspect'
          : equirectTour && panoReady
            ? 'unit is-pano-ready'
            : equirectTour
              ? 'unit'
              : 'unit unit-tour-stills'
      }
    >
      <section ref={stageRef} className="unit-stage unit-stage-stop-flash" data-stop={stopId} aria-label={stop.name}>
        {mode === 'tour' ? (
          <>
            {!equirectTour || !panoReady ? (
              <Still key={`hold-${fitout}-${stop.id}`} src={stillSrc} alt={stop.name} />
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
          <Still key={`${mode}-${fitout}`} src={stillSrc} alt={stop.name} />
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

        {mode === 'tour' ? (
          <button
            type="button"
            className="unit-fold"
            aria-label={showInspector ? 'Close inspector panel' : 'Open inspector panel'}
            onClick={() => setInspector((value) => !value)}
          >
            {showInspector ? '‹' : '›'}
          </button>
        ) : null}

        <div className="unit-hud">
          <Link className="unit-back" to={backTo} aria-label="Go back">
            ←
          </Link>
          <span className="unit-name">{floorLabel(floor.level)}</span>
          <span className="unit-sep" />
          <button type="button" className={mode === 'plan' ? 'on' : ''} onClick={() => patch({ mode: 'plan' })}>
            Floor Plan
          </button>
          <button type="button" className={mode === 'isometric' ? 'on' : ''} onClick={() => patch({ mode: 'isometric' })}>
            Isometric
          </button>
          <button type="button" className={mode === 'tour' ? 'on' : ''} onClick={() => patch({ mode: 'tour' })}>
            Tour
          </button>
          <span className="unit-sep" />
          <button type="button" className={fitout === 'furnished' ? 'on' : ''} onClick={() => patch({ fitout: 'furnished' })}>
            Furnished
          </button>
          <button type="button" className={fitout === 'empty' ? 'on' : ''} onClick={() => patch({ fitout: 'empty' })}>
            Empty
          </button>
        </div>

        {mode === 'tour' && !showInspector ? (
          <TourMinimap
            planSrc={planSrc}
            stops={plate.stops}
            activeId={stop.id}
            lookDeg={lookDeg}
            onSelect={goStop}
          />
        ) : null}
      </section>

      {showInspector ? (
        <aside className="unit-inspect">
          <h1>{floorLabel(floor.level)}</h1>
          <dl className="inspect-facts">
            <div>
              <dt>Level</dt>
              <dd>{floorLabel(floor.level)}</dd>
            </div>
            <div>
              <dt>Facing</dt>
              <dd>{floor.facing}</dd>
            </div>
            <div>
              <dt>Plate</dt>
              <dd>{plate.code}</dd>
            </div>
            <div>
              <dt>Stop</dt>
              <dd>{stop.name}</dd>
            </div>
          </dl>
        </aside>
      ) : null}
    </div>
  )
}
