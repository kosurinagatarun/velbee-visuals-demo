import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PanoViewer } from '../components/PanoViewer'

const SCENES = {
  street: {
    label: 'Street',
    src: '/content/plates/typical/pano/street.jpg',
  },
  lobby: {
    label: 'Lobby',
    src: '/content/plates/typical/pano/lobby.jpg',
  },
} as const

type SceneId = keyof typeof SCENES

function isScene(value: string | null): value is SceneId {
  return value === 'street' || value === 'lobby'
}

export function PanoPage() {
  const [params, setParams] = useSearchParams()
  const sceneParam = params.get('scene')
  const scene: SceneId = isScene(sceneParam) ? sceneParam : 'street'

  useEffect(() => {
    for (const item of Object.values(SCENES)) {
      const img = new Image()
      img.src = item.src
    }
  }, [])

  return (
    <div className="stage">
      <header className="topbar">
        <Link className="ghost" to="/">
          Back
        </Link>
        <span className="crumb">Look around test</span>
        <nav className="modes" aria-label="Scene">
          {(Object.keys(SCENES) as SceneId[]).map((id) => (
            <button
              key={id}
              type="button"
              className={scene === id ? 'on' : ''}
              onClick={() => {
                const next = new URLSearchParams(params)
                next.set('scene', id)
                setParams(next, { replace: true })
              }}
            >
              {SCENES[id].label}
            </button>
          ))}
        </nav>
      </header>
      <div className="stage-body pano-stage">
        <section className="viewport is-orbit pano-view">
          <PanoViewer equirectUrl={SCENES[scene].src} />
          <p className="pano-hint">Drag to look. Look up for the sky, down for the ground.</p>
        </section>
      </div>
    </div>
  )
}
