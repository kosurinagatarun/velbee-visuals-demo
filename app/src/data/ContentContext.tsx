import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadContent } from './loadContent'
import type { ContentPack } from './types'

type State =
  | { status: 'loading' }
  | { status: 'ready'; pack: ContentPack }
  | { status: 'error'; message: string }

const Ctx = createContext<ContentPack | null>(null)

export function ContentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    loadContent()
      .then((pack) => setState({ status: 'ready', pack }))
      .catch((err: unknown) =>
        setState({ status: 'error', message: err instanceof Error ? err.message : String(err) }),
      )
  }, [])

  if (state.status === 'loading') {
    return (
      <div className="boot">
        <p>Loading showcase…</p>
      </div>
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
