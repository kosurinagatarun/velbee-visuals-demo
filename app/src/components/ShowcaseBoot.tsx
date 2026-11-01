import { showcaseTitle, VISUALS_BRAND, isBuildingOnlyMode } from '../config/visuals'

type Props =
  | { phase: 'metadata' }
  | { phase: 'assets'; loaded: number; total: number }

export function ShowcaseBoot(props: Props) {
  const buildingOnly = isBuildingOnlyMode()
  const title = buildingOnly ? showcaseTitle() : VISUALS_BRAND.product

  const total = props.phase === 'assets' ? props.total : 0
  const loaded = props.phase === 'assets' ? props.loaded : 0
  const pct =
    props.phase === 'metadata' ? 0 : total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 100

  const status = props.phase === 'metadata' ? 'Preparing showcase…' : 'Loading showcase…'

  return (
    <div className="boot boot-preloader" role="status" aria-live="polite" aria-busy="true">
      <div className="boot-inner">
        <p className="boot-brand">{VISUALS_BRAND.product}</p>
        <h1 className="boot-title">{title}</h1>
        <div className="boot-progress" aria-hidden="true">
          <div className="boot-progress-track">
            <div className="boot-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <p className="boot-status">{status}</p>
        {props.phase === 'assets' && total > 0 ? (
          <p className="boot-pct">{pct}%</p>
        ) : null}
      </div>
    </div>
  )
}
