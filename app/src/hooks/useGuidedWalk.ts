import { useEffect, useRef, useState } from 'react'
import type { Stop } from '../data/types'

export function useGuidedWalk(stops: Stop[], activeId: string, goStop: (id: string) => void) {
  const [active, setActive] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    indexRef.current = Math.max(0, stops.findIndex((s) => s.id === activeId))
  }, [activeId, stops])

  useEffect(() => {
    if (!active || stops.length < 2) return
    const timer = window.setInterval(() => {
      indexRef.current = (indexRef.current + 1) % stops.length
      goStop(stops[indexRef.current].id)
    }, 8000)
    return () => window.clearInterval(timer)
  }, [active, goStop, stops])

  function next() {
    indexRef.current = (indexRef.current + 1) % stops.length
    goStop(stops[indexRef.current].id)
  }

  return { guidedActive: active, setGuidedActive: setActive, guidedNext: next }
}
