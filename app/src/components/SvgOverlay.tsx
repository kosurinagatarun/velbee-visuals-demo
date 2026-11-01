import type { ReactNode } from 'react'

export function SvgOverlay({ children }: { children: ReactNode }) {
  return (
    <svg className="overlay" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden={false}>
      {children}
    </svg>
  )
}
