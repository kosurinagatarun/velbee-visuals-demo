import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { clampPanoFov, DEFAULT_PANO_FOV } from '../lib/projectHotspot'

type Props = {
  equirectUrl: string
  fovDeg?: number
  onFovChange?: (fov: number) => void
  onLook?: (yawDeg: number, pitchDeg: number) => void
  onReady?: () => void
}

type Engine = {
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  scene: THREE.Scene
}

export function PanoViewer({ equirectUrl, fovDeg = DEFAULT_PANO_FOV, onFovChange, onLook, onReady }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const onLookRef = useRef(onLook)
  const onReadyRef = useRef(onReady)
  const onFovChangeRef = useRef(onFovChange)
  const fovRef = useRef(fovDeg)
  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  onLookRef.current = onLook
  onReadyRef.current = onReady
  onFovChangeRef.current = onFovChange
  fovRef.current = fovDeg

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const container = el

    let raf = 0
    let dragging = false
    let lastX = 0
    let lastY = 0
    const activePointers = new Map<number, { x: number; y: number }>()
    const pinchRef = { dist: 0, fov: DEFAULT_PANO_FOV }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x111111)
    const camera = new THREE.PerspectiveCamera(fovRef.current, 1, 0.1, 400)
    camera.rotation.order = 'YXZ'

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    renderer.setClearColor(0x111111)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    el.appendChild(renderer.domElement)
    engineRef.current = { renderer, camera, scene }

    function emitLook() {
      onLookRef.current?.((yawRef.current * 180) / Math.PI, (pitchRef.current * 180) / Math.PI)
    }

    function setFov(next: number) {
      const clamped = clampPanoFov(next)
      fovRef.current = clamped
      camera.fov = clamped
      camera.updateProjectionMatrix()
      onFovChangeRef.current?.(clamped)
    }

    function resize() {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w < 2 || h < 2) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }

    function loop() {
      camera.fov = fovRef.current
      camera.updateProjectionMatrix()
      camera.rotation.x = pitchRef.current
      camera.rotation.y = yawRef.current
      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }

    function pinchDistance() {
      const pts = [...activePointers.values()]
      if (pts.length < 2) return 0
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
    }

    function onDown(event: PointerEvent) {
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (activePointers.size >= 2) {
        pinchRef.dist = pinchDistance()
        pinchRef.fov = fovRef.current
        dragging = false
        return
      }
      dragging = true
      lastX = event.clientX
      lastY = event.clientY
      container.classList.add('is-drag')
      try {
        container.setPointerCapture(event.pointerId)
      } catch {
        /* ignore */
      }
    }

    function onMove(event: PointerEvent) {
      if (activePointers.has(event.pointerId)) {
        activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      }
      if (activePointers.size >= 2 && pinchRef.dist > 8) {
        const dist = pinchDistance()
        if (dist > 8) {
          setFov(pinchRef.fov * (pinchRef.dist / dist))
        }
        return
      }
      if (!dragging) return
      yawRef.current -= (event.clientX - lastX) * 0.0045
      pitchRef.current -= (event.clientY - lastY) * 0.0045
      lastX = event.clientX
      lastY = event.clientY
      const limit = Math.PI / 2 - 0.12
      pitchRef.current = Math.max(-limit, Math.min(limit, pitchRef.current))
      emitLook()
    }

    function onUp(event: PointerEvent) {
      activePointers.delete(event.pointerId)
      if (activePointers.size < 2) pinchRef.dist = 0
      if (activePointers.size === 0) {
        dragging = false
        container.classList.remove('is-drag')
      }
      if (container.hasPointerCapture(event.pointerId)) {
        container.releasePointerCapture(event.pointerId)
      }
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault()
      event.stopPropagation()
      setFov(fovRef.current + (event.deltaY > 0 ? 4 : -4))
    }

    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        setFov(fovRef.current - 6)
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault()
        setFov(fovRef.current + 6)
      } else if (event.key === '0') {
        event.preventDefault()
        setFov(DEFAULT_PANO_FOV)
      }
    }

    resize()
    setFov(fovRef.current)
    emitLook()
    raf = requestAnimationFrame(loop)
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    container.addEventListener('pointerdown', onDown)
    container.addEventListener('pointermove', onMove)
    container.addEventListener('pointerup', onUp)
    container.addEventListener('pointercancel', onUp)
    container.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)

    return () => {
      engineRef.current = null
      cancelAnimationFrame(raf)
      observer.disconnect()
      container.removeEventListener('pointerdown', onDown)
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerup', onUp)
      container.removeEventListener('pointercancel', onUp)
      container.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      const bg = scene.background
      if (bg instanceof THREE.Texture) bg.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    engine.camera.fov = clampPanoFov(fovDeg)
    engine.camera.updateProjectionMatrix()
  }, [fovDeg])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine || !equirectUrl) return
    let cancelled = false
    const loader = new THREE.TextureLoader()

    loader.load(
      equirectUrl,
      (texture: THREE.Texture) => {
        if (cancelled || engineRef.current !== engine) {
          texture.dispose()
          return
        }
        texture.mapping = THREE.EquirectangularReflectionMapping
        texture.colorSpace = THREE.SRGBColorSpace
        const previous = engine.scene.background
        engine.scene.background = texture
        if (previous instanceof THREE.Texture) previous.dispose()
        onReadyRef.current?.()
      },
      undefined,
      () => {
        /* keep tour still visible until equirect loads */
      },
    )

    return () => {
      cancelled = true
    }
  }, [equirectUrl])

  return (
    <div
      ref={wrapRef}
      className="pano unit-pano"
      aria-label="360 look around. Drag to look. Pinch or scroll to zoom."
    />
  )
}
