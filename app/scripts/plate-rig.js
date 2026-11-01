import * as THREE from 'three'
import {
  CubeCamera,
  WebGLCubeRenderTarget,
  WebGLRenderer,
  Scene,
  Group,
  Mesh,
  MeshStandardMaterial,
  BoxGeometry,
  PlaneGeometry,
  CylinderGeometry,
  Color,
  AmbientLight,
  HemisphereLight,
  DirectionalLight,
  DoubleSide,
  SRGBColorSpace,
  ACESFilmicToneMapping,
} from 'three'

const canvas = document.getElementById('view')
const renderer = new WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true,
  alpha: false,
})
renderer.outputColorSpace = SRGBColorSpace
renderer.toneMapping = ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05

const scene = new Scene()
scene.background = new Color(0xb8d4f0)

const plateRoot = new Group()
scene.add(plateRoot)

const furnitureRoot = new Group()
plateRoot.add(furnitureRoot)

const W = 22
const D = 14.5
const H = 3.05
const T = 0.12

const mat = {
  floor: new MeshStandardMaterial({ color: 0xc9b896, roughness: 0.55, metalness: 0.02 }),
  ceiling: new MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.9, metalness: 0 }),
  wall: new MeshStandardMaterial({ color: 0xf0ece4, roughness: 0.82, metalness: 0 }),
  core: new MeshStandardMaterial({ color: 0xe2ddd4, roughness: 0.75, metalness: 0.05 }),
  glass: new MeshStandardMaterial({
    color: 0xa8cce8,
    roughness: 0.08,
    metalness: 0.1,
    transparent: true,
    opacity: 0.45,
  }),
  desk: new MeshStandardMaterial({ color: 0x8b7355, roughness: 0.45, metalness: 0.08 }),
  plant: new MeshStandardMaterial({ color: 0x3d7a45, roughness: 0.7, metalness: 0 }),
  accent: new MeshStandardMaterial({ color: 0x2f3f52, roughness: 0.4, metalness: 0.15 }),
  outdoor: new MeshStandardMaterial({ color: 0x7eb8e8, roughness: 1, metalness: 0, side: DoubleSide }),
}

function box(x, z, w, d, h, y0, material, root = plateRoot) {
  const mesh = new Mesh(new BoxGeometry(w, h, d), material)
  mesh.position.set(x + w / 2, y0 + h / 2, z + d / 2)
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
  box(0, 0, W, D, T, 0, mat.floor)
  box(0, 0, W, D, T, H - T, mat.ceiling)

  wallZ(0, 0, W, H)
  wallZ(0, D, W, H)
  wallX(0, 0, D, H)
  wallX(W, 0, D, H)

  box(8.5, 0, 5, T * 0.6, 2.45, 0.2, mat.glass)
  box(7.2, 9.8, 7.6, 4.5, H - 0.2, T, mat.core)
  wallX(6.5, 2.8, 9.2, H)
  wallX(15.3, 2.8, 9.2, H)
  wallZ(0.4, 9.5, 6.1, H)
  wallZ(15.5, 9.5, 6.1, H)

  for (let i = 0; i < 8; i += 1) {
    box(20.4 + i * 0.22, 5.2, 0.08, 0.08, 1.05, 0, mat.accent)
  }
  wallX(21.55, 4.8, 3.8, 0.85, 0, mat.accent)

  const sky = new Mesh(new PlaneGeometry(40, 20), mat.outdoor)
  sky.position.set(W + 8, H * 0.55, D * 0.45)
  sky.rotation.y = -Math.PI / 2
  plateRoot.add(sky)
  const ground = new Mesh(
    new PlaneGeometry(40, 30),
    new MeshStandardMaterial({ color: 0x6a8f6a, roughness: 1 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.set(W + 8, 0.01, D * 0.45)
  plateRoot.add(ground)
}

function buildFurniture() {
  box(9.2, 2.2, 3.6, 1.2, 0.95, T, mat.desk, furnitureRoot)
  box(10.8, 2.35, 0.55, 0.55, 0.75, T, mat.accent, furnitureRoot)
  box(8.5, 4.8, 2.2, 0.9, 0.42, T, mat.accent, furnitureRoot)
  box(12.3, 4.8, 2.2, 0.9, 0.42, T, mat.accent, furnitureRoot)

  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      box(1.2 + col * 2.4, 3.6 + row * 2.5, 1.6, 0.8, 0.74, T, mat.desk, furnitureRoot)
      box(16.4 + col * 2.4, 3.6 + row * 2.5, 1.6, 0.8, 0.74, T, mat.desk, furnitureRoot)
    }
  }
  box(2.2, 10.2, 3.2, 1.4, 0.76, T, mat.desk, furnitureRoot)
  box(16.6, 10.2, 3.2, 1.4, 0.76, T, mat.desk, furnitureRoot)

  const plantGeo = new CylinderGeometry(0.22, 0.28, 0.55, 10)
  for (const [x, z] of [
    [10.5, 1.4],
    [5.5, 5.5],
    [18.5, 5.5],
    [20.2, 6.2],
  ]) {
    const p = new Mesh(plantGeo, mat.plant)
    p.position.set(x, T + 0.35, z)
    furnitureRoot.add(p)
  }
}

buildShell()
buildFurniture()

scene.add(new AmbientLight(0xffffff, 0.35))
scene.add(new HemisphereLight(0xe8f2ff, 0xc9b896, 0.55))
const sun = new DirectionalLight(0xfff5e8, 1.15)
sun.position.set(6, 14, -4)
scene.add(sun)

const cubeRt = new WebGLCubeRenderTarget(1536, { generateMipmaps: false })
const cubeCam = new CubeCamera(0.08, 120, cubeRt)

const equirectScene = new Scene()
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
equirectScene.add(new Mesh(new PlaneGeometry(2, 2), equirectMat))

/**
 * @param {{ location: number[], rotationYDeg: number, fitout: 'furnished'|'empty', width?: number, height?: number }} opts
 */
function renderStop(opts) {
  const [x, y, z] = opts.location
  const width = opts.width ?? 6000
  const height = opts.height ?? 3000
  furnitureRoot.visible = opts.fitout !== 'empty'

  cubeCam.position.set(x, y, z)
  cubeCam.update(renderer, scene)

  equirectMat.uniforms.heading.value = THREE.MathUtils.degToRad(opts.rotationYDeg ?? 0)

  canvas.width = width
  canvas.height = height
  renderer.setSize(width, height, false)
  renderer.render(equirectScene, equirectCam)

  return canvas.toDataURL('image/jpeg', 0.92)
}

window.plateRig = { renderStop }
