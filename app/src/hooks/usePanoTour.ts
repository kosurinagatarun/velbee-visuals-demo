import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_PANO_FOV, clampPanoFov } from '../lib/projectHotspot'

export function usePanoTour(stopKey: string) {
  const [yawDeg, setYawDeg] = useState(0)
  const [pitchDeg, setPitchDeg] = useState(0)
  const [fovDeg, setFovDeg] = useState(DEFAULT_PANO_FOV)
  const [panoReady, setPanoReady] = useState(false)

  useEffect(() => {
    setYawDeg(0)
    setPitchDeg(0)
    setFovDeg(DEFAULT_PANO_FOV)
    setPanoReady(false)
  }, [stopKey])

  const resetLook = useCallback(() => {
    setYawDeg(0)
    setPitchDeg(0)
    setFovDeg(DEFAULT_PANO_FOV)
  }, [])

  const zoomIn = useCallback(() => setFovDeg((f) => clampPanoFov(f - 8)), [])
  const zoomOut = useCallback(() => setFovDeg((f) => clampPanoFov(f + 8)), [])
  const resetZoom = useCallback(() => setFovDeg(DEFAULT_PANO_FOV), [])

  return {
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
  }
}
