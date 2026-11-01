import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

const canvas = document.getElementById('view')
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  alpha: false,
})
renderer.setPixelRatio(1)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.9
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xb8d4f0)
scene.fog = new THREE.Fog(0xd4e8f8, 28, 70)

const plateRoot = new THREE.Group()
scene.add(plateRoot)
const furnitureRoot = new THREE.Group()
plateRoot.add(furnitureRoot)

/** @type {THREE.Mesh | null} */
let ceilingMesh = null
/** @type {THREE.Object3D | null} */
let skyMesh = null
/** @type {THREE.Object3D | null} */
let outdoorGroundMesh = null

const W = 12
const D = 8
const H = 3.15
const T = 0.14
const SPLIT = 5.1

function makeTex(w, h, paint) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  paint(ctx, w, h)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

const oakTex = makeTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#c4a574'
  ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 40; i += 1) {
    ctx.strokeStyle = `rgba(90,60,35,${0.08 + Math.random() * 0.12})`
    ctx.lineWidth = 1 + Math.random() * 2
    ctx.beginPath()
    ctx.moveTo(0, Math.random() * h)
    ctx.bezierCurveTo(w * 0.3, Math.random() * h, w * 0.7, Math.random() * h, w, Math.random() * h)
    ctx.stroke()
  }
})
oakTex.repeat.set(4, 3)

const carpetTex = makeTex(128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#5a6572'
  ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 800; i += 1) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
  }
})
carpetTex.repeat.set(6, 4)

const plasterTex = makeTex(128, 128, (ctx, w, h) => {
  ctx.fillStyle = '#f2eee6'
  ctx.fillRect(0, 0, w, h)
  for (let i = 0; i < 600; i += 1) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
  }
})
plasterTex.repeat.set(3, 2)

const mat = {
  floorEntry: new THREE.MeshStandardMaterial({ map: oakTex, roughness: 0.42, metalness: 0.04 }),
  floorOffice: new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.88, metalness: 0 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0xf6f4f0, roughness: 0.92, metalness: 0 }),
  wall: new THREE.MeshStandardMaterial({ map: plasterTex, roughness: 0.82, metalness: 0 }),
  core: new THREE.MeshStandardMaterial({ color: 0xe0dbd2, roughness: 0.7, metalness: 0.05 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.04,
    metalness: 0,
    transmission: 0.82,
    thickness: 0.35,
    ior: 1.52,
    transparent: true,
  }),
  mullion: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.35, metalness: 0.55 }),
  sofa: new THREE.MeshStandardMaterial({ color: 0x3d4f5c, roughness: 0.72, metalness: 0.02 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.48, metalness: 0.06 }),
  accent: new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.35, metalness: 0.45 }),
  plant: new THREE.MeshStandardMaterial({ color: 0x3a7040, roughness: 0.82, metalness: 0 }),
  outdoor: new THREE.MeshStandardMaterial({ color: 0x87bce8, roughness: 1, side: THREE.DoubleSide }),
  screen: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.35, metalness: 0.2, emissive: 0x224466, emissiveIntensity: 0.15 }),
  chair: new THREE.MeshStandardMaterial({ color: 0x3d4550, roughness: 0.55, metalness: 0.12 }),
  table: new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.38, metalness: 0.08 }),
}

function box(x, z, w, d, h, y0, material, root = plateRoot, shadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
  mesh.position.set(x + w / 2, y0 + h / 2, z + d / 2)
  mesh.castShadow = shadow
  mesh.receiveShadow = true
  root.add(mesh)
  return mesh
}

function wallX(x, z, d, h, y0 = T) {
  box(x - T / 2, z, T, d, h, y0, mat.wall)
}

function wallZ(x, z, w, h, y0 = T) {
  box(x, z - T / 2, w, T, h, y0, mat.wall)
}

function buildShell() {
  box(0, 0, SPLIT, D, T, 0, mat.floorEntry)
  box(SPLIT, 0, W - SPLIT, D, T, 0, mat.floorOffice)
  ceilingMesh = box(0, 0, W, D, T, H - T, mat.ceiling)

  wallZ(0, 0, W, H)
  wallZ(0, D, W, H)
  wallX(0, 0, D, H)
  wallX(W, 0, D, H)

  wallX(SPLIT, 0, D, H)
  box(SPLIT - 0.55, 3.2, 1.1, 1.8, 2.35, T, mat.core)
  box(SPLIT - 0.05, 3.15, 0.12, 1.9, 2.28, T, mat.wood)

  const doorW = 1.05
  const doorZ = 3.35
  box(1.8, D - T * 0.4, doorW, T * 0.35, 2.35, T, mat.glass)
  box(1.8 - 0.08, D - T * 0.5, 0.08, T * 0.5, 2.35, T, mat.mullion)
  box(1.8 + doorW, D - T * 0.5, 0.08, T * 0.5, 2.35, T, mat.mullion)

  for (let i = 0; i < 4; i += 1) {
    const zx = 0.9 + i * 1.35
    box(zx, D - T * 0.35, 1.05, T * 0.3, 1.85, T + 0.35, mat.glass)
  }
  for (let i = 0; i < 3; i += 1) {
    const zx = 6.2 + i * 1.55
    box(zx, D - T * 0.35, 1.25, T * 0.3, 1.65, T + 0.45, mat.glass)
  }

  box(-0.5, 2.5, 0.35, 3.5, H - 0.3, T, mat.stone)
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(24, 14), mat.outdoor)
  sky.position.set(W / 2, H * 0.55, D + 6)
  plateRoot.add(sky)
  skyMesh = sky
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 20),
    new THREE.MeshStandardMaterial({ color: 0x6a8a62, roughness: 0.95 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.set(W / 2, 0.01, D + 5)
  ground.receiveShadow = true
  plateRoot.add(ground)
  outdoorGroundMesh = ground
}

const DOOR_TARGET = [5.05, 1.15, 3.55]

function buildFurniture() {
  box(0.6, 1.0, 2.2, 0.9, 0.9, T, mat.wood, furnitureRoot)
  box(0.55, 0.95, 2.3, 0.65, 0.05, T + 0.9, mat.stone, furnitureRoot)
  box(3.0, 5.5, 0.9, 0.45, 0.85, T, mat.wood, furnitureRoot)
  box(1.2, 6.5, 0.55, 0.55, 0.65, T, mat.wood, furnitureRoot)

  const tableX = 6.2
  const tableZ = 3.6
  box(tableX, tableZ, 4.4, 1.35, 0.1, T, mat.table, furnitureRoot)
  for (const [ox, oz] of [
    [-1.6, -0.55],
    [-0.55, -0.55],
    [0.55, -0.55],
    [1.6, -0.55],
    [-1.6, 0.55],
    [-0.55, 0.55],
    [0.55, 0.55],
    [1.6, 0.55],
  ]) {
    box(tableX + ox, tableZ + oz, 0.52, 0.52, 0.85, T, mat.chair, furnitureRoot)
  }
  box(6.0, 0.32, 3.8, 0.12, 1.05, T + 0.08, mat.screen, furnitureRoot)
  box(6.0, 0.28, 3.6, 0.06, 0.08, T + 1.1, mat.mullion, furnitureRoot)
  box(10.8, 6.2, 0.55, 0.55, 0.62, T, mat.wood, furnitureRoot)
  box(11.2, 1.2, 0.45, 0.45, 0.9, T, mat.plant, furnitureRoot)

  const plantGeo = new THREE.CylinderGeometry(0.26, 0.32, 0.5, 12)
  for (const [x, z] of [
    [0.55, 6.2],
    [4.2, 1.0],
  ]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.38, 12), mat.wood)
    pot.position.set(x, T + 0.19, z)
    pot.castShadow = true
    furnitureRoot.add(pot)
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), mat.plant)
    leaf.position.set(x, T + 0.75, z)
    leaf.castShadow = true
    furnitureRoot.add(leaf)
  }

  const lightStrip = new THREE.Mesh(
    new THREE.BoxGeometry(W - 1, 0.06, 0.35),
    new THREE.MeshStandardMaterial({ color: 0xfff8ee, emissive: 0xfff0d0, emissiveIntensity: 0.35 }),
  )
  lightStrip.position.set(W / 2, H - 0.22, D / 2)
  furnitureRoot.add(lightStrip)
}

buildShell()
buildFurniture()

function addLights() {
  scene.add(new THREE.HemisphereLight(0xe8f2ff, 0xc9b896, 0.28))
  scene.add(new THREE.AmbientLight(0xffffff, 0.12))
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.05)
  sun.position.set(4, 12, 10)
  sun.castShadow = true
  sun.shadow.mapSize.set(4096, 4096)
  sun.shadow.camera.left = -14
  sun.shadow.camera.right = 14
  sun.shadow.camera.top = 10
  sun.shadow.camera.bottom = -10
  scene.add(sun)
  scene.add(new THREE.DirectionalLight(0xc8dff5, 0.35).translateX(-8).translateY(6).translateZ(-4))
}

addLights()

const cubeRt = new THREE.WebGLCubeRenderTarget(3072, { generateMipmaps: false })
const cubeCam = new THREE.CubeCamera(0.08, 120, cubeRt)

const equirectScene = new THREE.Scene()
const equirectCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
const equirectMat = new THREE.ShaderMaterial({
  uniforms: {
    envMap: { value: cubeRt.texture },
    heading: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform samplerCube envMap;
    uniform float heading;
    const float PI = 3.141592653589793;
    void main() {
      float lon = (vUv.x - 0.5) * 2.0 * PI - heading;
      float lat = (0.5 - vUv.y) * PI;
      float cosLat = cos(lat);
      vec3 dir;
      dir.x = cosLat * sin(lon);
      dir.y = sin(lat);
      dir.z = -cosLat * cos(lon);
      vec3 col = textureCube(envMap, vec3(-dir.x, dir.y, dir.z)).rgb;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
})
equirectScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), equirectMat))

function setFitout(fitout) {
  furnitureRoot.visible = fitout !== 'empty'
}

function renderEquirect(opts) {
  const [x, y, z] = opts.location
  const width = opts.width ?? 6000
  const height = opts.height ?? 3000
  setFitout(opts.fitout)
  cubeCam.position.set(x, y, z)
  cubeCam.update(renderer, scene)
  equirectMat.uniforms.heading.value = THREE.MathUtils.degToRad(opts.rotationYDeg ?? 0)
  canvas.width = width
  canvas.height = height
  renderer.setSize(width, height, false)
  renderer.render(equirectScene, equirectCam)
  return canvas.toDataURL('image/jpeg', opts.quality ?? 0.96)
}

function renderPerspective(opts) {
  const [x, y, z] = opts.location
  const [tx, ty, tz] = opts.lookAt
  const width = opts.width ?? 1920
  const height = opts.height ?? 1080
  const fov = opts.fov ?? 52
  setFitout(opts.fitout)
  const cam = new THREE.PerspectiveCamera(fov, width / height, 0.08, 80)
  cam.position.set(x, y, z)
  cam.lookAt(tx, ty, tz)
  canvas.width = width
  canvas.height = height
  renderer.setSize(width, height, false)
  renderer.render(scene, cam)
  return canvas.toDataURL('image/jpeg', opts.quality ?? 0.92)
}

function renderPlan(opts) {
  const width = opts.width ?? 1800
  const height = opts.height ?? 1400
  setFitout(opts.fitout)

  const prevBg = scene.background
  const prevFog = scene.fog
  scene.background = new THREE.Color(0xf3efe6)
  scene.fog = null
  if (ceilingMesh) ceilingMesh.visible = false
  if (skyMesh) skyMesh.visible = false
  if (outdoorGroundMesh) outdoorGroundMesh.visible = false

  const pad = 1.22
  const imgAspect = width / height
  const plateAspect = W / D
  let halfX = (W * pad) / 2
  let halfZ = (D * pad) / 2
  if (imgAspect > plateAspect) {
    halfX = halfZ * imgAspect
  } else {
    halfZ = halfX / imgAspect
  }

  const cam = new THREE.OrthographicCamera(-halfX, halfX, halfZ, -halfZ, 0.1, 80)
  cam.position.set(W / 2, 40, D / 2)
  cam.up.set(0, 0, -1)
  cam.lookAt(W / 2, 0, D / 2)

  canvas.width = width
  canvas.height = height
  renderer.setSize(width, height, false)
  renderer.render(scene, cam)
  if (ceilingMesh) ceilingMesh.visible = true
  if (skyMesh) skyMesh.visible = true
  if (outdoorGroundMesh) outdoorGroundMesh.visible = true
  scene.background = prevBg
  scene.fog = prevFog
  return canvas.toDataURL('image/jpeg', opts.quality ?? 0.94)
}

function renderIso(opts) {
  const width = opts.width ?? 1920
  const height = opts.height ?? 1080
  setFitout(opts.fitout)
  const cam = new THREE.PerspectiveCamera(38, width / height, 0.1, 80)
  cam.position.set(-6, 11, 14)
  cam.lookAt(W / 2, 1.2, D / 2)
  canvas.width = width
  canvas.height = height
  renderer.setSize(width, height, false)
  renderer.render(scene, cam)
  return canvas.toDataURL('image/jpeg', opts.quality ?? 0.92)
}

function computeHotspot(camPos, headingDeg, targetPos) {
  const [cx, cy, cz] = camPos
  const [tx, ty, tz] = targetPos
  let dx = tx - cx
  let dy = ty - cy
  let dz = tz - cz
  const len = Math.hypot(dx, dy, dz) || 1
  dx /= len
  dy /= len
  dz /= len
  const h = THREE.MathUtils.degToRad(headingDeg)
  const fx = Math.sin(h)
  const fz = -Math.cos(h)
  const rx = Math.cos(h)
  const rz = Math.sin(h)
  const dotF = dx * fx + dz * fz
  const dotR = dx * rx + dz * rz
  const yaw = (Math.atan2(dotR, dotF) * 180) / Math.PI
  const pitch = (Math.asin(Math.max(-1, Math.min(1, dy))) * 180) / Math.PI
  return { yaw: Number(yaw.toFixed(1)), pitch: Number(pitch.toFixed(1)) }
}

function loadHdri() {
  return new Promise((resolve, reject) => {
    new RGBELoader().load(
      '/content/stocks/hdri/studio_small_08_2k.hdr',
      (hdr) => {
        hdr.mapping = THREE.EquirectangularReflectionMapping
        scene.environment = hdr
        scene.background = hdr
        scene.backgroundIntensity = 0.55
        scene.environmentIntensity = 1.15
        resolve()
      },
      undefined,
      reject,
    )
  })
}

const ready = loadHdri().catch((err) => {
  console.warn('HDRI fallback', err)
})

window.simplePlateRig = {
  ready,
  DOOR_TARGET,
  computeHotspot,
  renderEquirect,
  renderPerspective,
  renderPlan,
  renderIso,
}
