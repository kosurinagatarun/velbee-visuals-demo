import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

export let FRAME_COUNT = 60
export const WIDTH = 1920
export const HEIGHT = 1080

const BUILD = { w: 22, d: 12, ground: 4.2, typical: 0 }
BUILD.total = BUILD.ground
const FLOORS = [{ level: 'ground', y0: 0, y1: BUILD.ground }]

let orbitRadius = 40
let orbitCamY = 5.8
let orbitLookY = 3.0
let orbitFov = 30
let jpegQuality = 0.94

const canvas = document.getElementById('view')
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
})
renderer.setSize(WIDTH, HEIGHT, false)
renderer.setPixelRatio(1)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.92
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0xc8d8e8, 0.0065)

const camera = new THREE.PerspectiveCamera(orbitFov, WIDTH / HEIGHT, 0.15, 250)
camera.position.set(0, orbitCamY, orbitRadius)
camera.lookAt(0, orbitLookY, 0)

function makeTex(w, h, paint) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  paint(c.getContext('2d'), w, h)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

const stoneTex = makeTex(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#ddd2c4'
  ctx.fillRect(0, 0, w, h)
  for (let y = 0; y < h; y += 6) {
    for (let x = 0; x < w; x += 18) {
      const tone = ((x / 18 + y / 6) % 2) + Math.random() * 0.15
      ctx.fillStyle = tone > 1.1 ? '#c9bfb0' : '#e8e0d4'
      ctx.fillRect(x, y, 18, 6)
    }
  }
})
stoneTex.repeat.set(3, 2)

const grassTex = makeTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#5a7a48'
  ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 1200; i += 1) {
    ctx.strokeStyle = `rgba(${40 + Math.random() * 40},${90 + Math.random() * 50},40,0.25)`
    ctx.beginPath()
    ctx.moveTo(Math.random() * w, Math.random() * h)
    ctx.lineTo(Math.random() * w, Math.random() * h)
    ctx.stroke()
  }
})
grassTex.repeat.set(12, 12)

const paveTex = makeTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#a8abb0'
  ctx.fillRect(0, 0, w, h)
  for (let y = 0; y < h; y += 32) {
    for (let x = 0; x < w; x += 32) {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.strokeRect(x + 1, y + 1, 30, 30)
    }
  }
})
paveTex.repeat.set(10, 6)

const mats = {
  stone: new THREE.MeshPhysicalMaterial({
    map: stoneTex,
    color: 0xffffff,
    roughness: 0.62,
    metalness: 0.02,
    clearcoat: 0.15,
    clearcoatRoughness: 0.4,
  }),
  stoneDark: new THREE.MeshPhysicalMaterial({
    map: stoneTex,
    color: 0x9a9088,
    roughness: 0.72,
    metalness: 0.04,
  }),
  base: new THREE.MeshPhysicalMaterial({ color: 0x7a7068, roughness: 0.85, metalness: 0.05 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xddeeff,
    roughness: 0.04,
    metalness: 0,
    transmission: 0.88,
    thickness: 0.45,
    ior: 1.52,
    transparent: true,
  }),
  mullion: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35, metalness: 0.55 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x8b6844, roughness: 0.42, metalness: 0.05 }),
  woodSlat: new THREE.MeshStandardMaterial({ color: 0x6d5034, roughness: 0.38, metalness: 0.04 }),
  canopy: new THREE.MeshStandardMaterial({ color: 0xf0ebe3, roughness: 0.48, metalness: 0.02 }),
  grass: new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.95, metalness: 0 }),
  pavement: new THREE.MeshStandardMaterial({ map: paveTex, roughness: 0.88, metalness: 0.03 }),
  asphalt: new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.92, metalness: 0.05 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x555a60, roughness: 0.25, metalness: 0.85 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x3f6a3a, roughness: 0.82, metalness: 0 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x4a3528, roughness: 0.9, metalness: 0 }),
  carPaint: (hex) =>
    new THREE.MeshPhysicalMaterial({
      color: hex,
      roughness: 0.18,
      metalness: 0.65,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    }),
}

function mesh(geo, material, x, y, z, shadow = true) {
  const m = new THREE.Mesh(geo, material)
  m.position.set(x, y, z)
  m.castShadow = shadow
  m.receiveShadow = true
  scene.add(m)
  return m
}

function box(w, h, d, material, x, y, z, shadow = true) {
  return mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z, shadow)
}

function addLights() {
  const hemi = new THREE.HemisphereLight(0xe8f2ff, 0x6a5848, 0.35)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xfff2dc, 1.85)
  sun.position.set(-28, 38, 18)
  sun.castShadow = true
  sun.shadow.mapSize.set(4096, 4096)
  sun.shadow.bias = -0.00015
  sun.shadow.normalBias = 0.02
  sun.shadow.camera.left = -45
  sun.shadow.camera.right = 45
  sun.shadow.camera.top = 35
  sun.shadow.camera.bottom = -28
  sun.shadow.camera.near = 8
  sun.shadow.camera.far = 100
  scene.add(sun)
  scene.add(new THREE.DirectionalLight(0xb8d4f0, 0.45).translateX(22).translateY(12).translateZ(-14))
}

function addSite() {
  const ground = mesh(new THREE.CircleGeometry(85, 80), mats.grass, 0, 0, 0, false)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true

  const court = mesh(new THREE.PlaneGeometry(58, 38), mats.pavement, 0, 0.015, 0, false)
  court.rotation.x = -Math.PI / 2

  const road = mesh(new THREE.PlaneGeometry(90, 14), mats.asphalt, 0, 0.02, 26, false)
  road.rotation.x = -Math.PI / 2

  for (const [x, z, rot] of [
    [-14, 8, 0],
    [14, 8, 0],
    [-20, -6, 0.2],
    [20, -5, -0.15],
  ]) {
    const car = new THREE.Group()
    box(4.2, 0.9, 1.85, mats.carPaint(0x2a3140), 0, 0.45, 0, true)
    box(2.4, 0.55, 1.7, mats.carPaint(0x2a3140), -0.3, 1.05, 0, true)
    car.position.set(x, 0, z)
    car.rotation.y = rot
    scene.add(car)
  }

  for (const [x, z] of [
    [-18, 14],
    [18, 14],
    [-24, 0],
    [24, 1],
  ]) {
    box(0.18, 3.2, 0.18, mats.metal, x, 1.6, z, false)
    mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshStandardMaterial({ emissive: 0xfff0d0, emissiveIntensity: 0.8, color: 0xffffee }), x, 3.35, z, false)
  }
}

function addGlassFacade(z, count, x0, step, pw, ph, yc) {
  for (let i = 0; i < count; i += 1) {
    const x = x0 + i * step
    box(pw, ph, 0.08, mats.glass, x, yc, z, false)
    box(pw + 0.12, ph + 0.14, 0.04, mats.mullion, x, yc, z + Math.sign(z) * 0.04, false)
  }
}

function addTree(x, z, scale = 1) {
  box(0.45 * scale, 2.2 * scale, 0.45 * scale, mats.trunk, x, 1.1 * scale, z, false)
  mesh(new THREE.SphereGeometry(2.1 * scale, 16, 14), mats.leaf, x, 3.2 * scale, z)
  mesh(new THREE.SphereGeometry(1.5 * scale, 14, 12), mats.leaf, x + 0.4, 2.8 * scale, z + 0.3)
}

function addBuilding() {
  const { w, d, total: gh } = BUILD
  const hw = w / 2
  const hd = d / 2

  box(w + 0.5, 0.6, d + 0.5, mats.base, 0, 0.3, 0, false)
  box(w, gh, d, mats.stone, 0, gh / 2 + 0.25, 0)
  box(w + 0.4, 0.22, d + 0.4, mats.stoneDark, 0, gh + 0.08, 0, false)

  const yGlass = gh * 0.52
  addGlassFacade(hd + 0.12, 9, -8.6, 2.28, 1.7, 2.4, yGlass)
  addGlassFacade(-hd - 0.12, 7, -7.2, 2.28, 1.65, 2.2, yGlass)

  for (const x of [-hw - 0.12, hw + 0.12]) {
    for (let i = 0; i < 4; i += 1) {
      box(0.08, 2.2, 1.6, mats.glass, x, yGlass, -3.4 + i * 2.35, false)
    }
    for (let i = 0; i < 11; i += 1) {
      const z = -hd + 0.7 + i * 0.92
      box(0.12, 2.15, 0.2, mats.woodSlat, x, yGlass, z, false)
    }
  }

  for (let i = 0; i < 14; i += 1) {
    box(0.14, gh - 0.4, 0.12, mats.wood, -3.8 + i * 0.55, (gh - 0.4) / 2 + 0.28, hd + 0.14, false)
  }
  box(5.5, 0.28, 2.6, mats.canopy, 0, 2.95, hd + 1.15, false)
  box(3.8, 2.55, 0.12, mats.glass, 0, 1.5, hd + 0.22, false)
  box(4.6, 0.08, 0.08, mats.mullion, 0, 2.75, hd + 1.28, false)
}

function addLandscape() {
  const spots = [
    [-21, -12, 1.1],
    [21, -11, 1],
    [-23, 5, 0.95],
    [23, 6, 1.05],
    [-16, 17, 0.9],
    [16, 18, 1],
    [-28, 2, 0.85],
    [28, 3, 0.9],
    [-8, -16, 0.8],
    [9, -15, 0.85],
  ]
  for (const [x, z, s] of spots) addTree(x, z, s)
}

function convexHull(points) {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  if (pts.length <= 2) return pts
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lower = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper = []
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    const p = pts[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

function projectBox(min, max) {
  camera.updateMatrixWorld()
  camera.updateProjectionMatrix()
  const pts = []
  for (const x of [min.x, max.x]) {
    for (const y of [min.y, max.y]) {
      for (const z of [min.z, max.z]) {
        const v = new THREE.Vector3(x, y, z).project(camera)
        if (v.z < -1 || v.z > 1) continue
        pts.push({
          x: Number(((v.x + 1) / 2).toFixed(4)),
          y: Number(((1 - v.y) / 2).toFixed(4)),
        })
      }
    }
  }
  return convexHull(pts)
}

function faceName(index) {
  const names = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']
  return names[Math.round(((index * 360) / FRAME_COUNT) / 45) % 8]
}

function setFrame(index) {
  const i = ((index % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT
  const yaw = (i * 2 * Math.PI) / FRAME_COUNT
  camera.fov = orbitFov
  camera.updateProjectionMatrix()
  camera.position.set(Math.sin(yaw) * orbitRadius, orbitCamY, Math.cos(yaw) * orbitRadius)
  camera.lookAt(0, orbitLookY, 0)
  renderer.render(scene, camera)
  const pad = 0.05
  const bands = FLOORS.map((floor) => ({
    level: floor.level,
    points: projectBox(
      { x: -BUILD.w / 2 - pad, y: floor.y0, z: -BUILD.d / 2 - pad },
      { x: BUILD.w / 2 + pad, y: floor.y1, z: BUILD.d / 2 + pad },
    ),
  }))
  return {
    index: i,
    id: String(i + 1).padStart(3, '0'),
    bearing_deg: Number(((i * 360) / FRAME_COUNT).toFixed(1)),
    face: faceName(i),
    bands,
  }
}

function captureJpeg() {
  return canvas.toDataURL('image/jpeg', jpegQuality)
}

function buildSceneContent() {
  addLights()
  addSite()
  addBuilding()
  addLandscape()
}

function loadHdriEnvironment() {
  return new Promise((resolve, reject) => {
    new RGBELoader().load(
      '/content/stocks/hdri/quarry_04_2k.hdr',
      (hdr) => {
        hdr.mapping = THREE.EquirectangularReflectionMapping
        scene.background = hdr
        scene.environment = hdr
        scene.backgroundIntensity = 0.85
        scene.environmentIntensity = 1.05
        resolve()
      },
      undefined,
      reject,
    )
  })
}

function applySpec(spec) {
  FRAME_COUNT = spec.orbit.frame_count
  orbitRadius = spec.orbit.radius_m ?? orbitRadius
  orbitCamY = spec.orbit.camera_y_m ?? orbitCamY
  orbitLookY = spec.orbit.look_y_m ?? orbitLookY
  orbitFov = spec.orbit.fov_deg ?? orbitFov
  jpegQuality = spec.output?.jpeg_quality ?? jpegQuality
  camera.fov = orbitFov
  camera.updateProjectionMatrix()
}

function publishRig(readyPromise) {
  window.orbitRig = {
    get FRAME_COUNT() {
      return FRAME_COUNT
    },
    ready: readyPromise,
    setFrame,
    captureJpeg,
    orbit: {
      radius_m: orbitRadius,
      camera_y_m: orbitCamY,
      look_y_m: orbitLookY,
      fov_deg: orbitFov,
      step_deg: 360 / FRAME_COUNT,
    },
  }
}

const ready = fetch('/content/building/building-spec.json')
  .then((res) => {
    if (!res.ok) throw new Error(`building-spec ${res.status}`)
    return res.json()
  })
  .then((spec) => {
    applySpec(spec)
    return loadHdriEnvironment().then(() => {
      buildSceneContent()
      setFrame(0)
    })
  })

publishRig(ready)

ready.catch((err) => {
  console.error(err)
  buildSceneContent()
  setFrame(0)
})
