import * as THREE from 'three'

/** Default perspective FOV for walk tours (vertical). */
export const DEFAULT_PANO_FOV = 75
export const MIN_PANO_FOV = 42
export const MAX_PANO_FOV = 95

/** @deprecated use DEFAULT_PANO_FOV */
export const PANO_FOV_Y_DEG = DEFAULT_PANO_FOV

export function clampPanoFov(value: number): number {
  return Math.max(MIN_PANO_FOV, Math.min(MAX_PANO_FOV, value))
}

const forward = new THREE.Vector3(0, 0, -1)
const dir = new THREE.Vector3()
const euler = new THREE.Euler(0, 0, 0, 'YXZ')
const quat = new THREE.Quaternion()
const invCam = new THREE.Quaternion()

function wrapPi(value: number) {
  let a = value
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

/**
 * World-locked hotspot on the pano sphere (Panom-style): moves on screen as you look,
 * stays on the same door/walk direction in the scene — chevron icon does not spin.
 */
export function projectHotspot(
  yawDeg: number,
  pitchDeg: number,
  camYawDeg: number,
  camPitchDeg: number,
  width: number,
  height: number,
  fovYDeg: number = DEFAULT_PANO_FOV,
) {
  const yaw = (yawDeg * Math.PI) / 180
  const pitch = (pitchDeg * Math.PI) / 180
  euler.set(pitch, yaw, 0)
  dir.copy(forward).applyEuler(euler)

  const camYaw = (camYawDeg * Math.PI) / 180
  const camPitch = (camPitchDeg * Math.PI) / 180
  euler.set(camPitch, camYaw, 0)
  quat.setFromEuler(euler)
  invCam.copy(quat).invert()
  dir.applyQuaternion(invCam)

  const fovY = (fovYDeg * Math.PI) / 180
  const aspect = width / Math.max(1, height)
  const fovX = 2 * Math.atan(Math.tan(fovY / 2) * aspect)
  const tanY = Math.tan(fovY / 2)
  const tanX = Math.tan(fovX / 2)

  const depth = -dir.z
  const behind = depth < 0.08
  const nx = dir.x / (depth * tanX)
  const ny = dir.y / (depth * tanY)

  return {
    x: (nx * 0.5 + 0.5) * width,
    y: (-ny * 0.5 + 0.5) * height,
    visible: !behind && Math.abs(nx) < 1.35 && Math.abs(ny) < 1.35,
  }
}

export { wrapPi }
