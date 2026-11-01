import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ShowcaseBoot } from '../components/ShowcaseBoot'
import { isBuildingOnlyMode } from '../config/visuals'
import { loadContent, preloadBuildingOrbit } from './loadContent'
import type { ContentPack } from './types'

type State =
  | { status: 'loading'; phase: 'metadata' }
  | { status: 'loading'; phase: 'assets'; loaded: number; total: number }
  | { status: 'ready'; pack: ContentPack }
  | { status: 'error'; message: string }

const Ctx = createContext<ContentPack | null>(null)

export function ContentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading', phase: 'metadata' })

  useEffect(() => {
    let cancelled = false

    loadContent()
      .then(async (pack) => {
        if (cancelled) return
        const preloadOrbit = isBuildingOnlyMode() || pack.angles.length > 0
        if (!preloadOrbit) {
          setState({ status: 'ready', pack })
          return
        }

        const total =
          pack.pitchRings.reduce(
            (sum, ring) => sum + (ring.shared ? 1 : pack.angles.length),
            0,
          ) || pack.angles.length
        setState({ status: 'loading', phase: 'assets', loaded: 0, total })

        await preloadBuildingOrbit(pack.angles, pack.pitchRings, (loaded, t) => {
          if (!cancelled) setState({ status: 'loading', phase: 'assets', loaded, total: t })
        })

        if (!cancelled) setState({ status: 'ready', pack })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : String(err),
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return state.phase === 'metadata' ? (
      <ShowcaseBoot phase="metadata" />
    ) : (
      <ShowcaseBoot phase="assets" loaded={state.loaded} total={state.total} />
    )
  }

  if (state.status === 'error') {
    return (
      <div className="boot">
        <p>Content failed to load</p>
        <pre>{state.message}</pre>
      </div>
    )
  }

  return <Ctx.Provider value={state.pack}>{children}</Ctx.Provider>
}

export function useContent(): ContentPack {
  const pack = useContext(Ctx)
  if (!pack) throw new Error('useContent must be used inside ContentProvider')
  return pack
}
