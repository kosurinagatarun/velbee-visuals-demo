import type { FloorLevel } from './types'

export function floorLabel(level: FloorLevel): string {
  if (level === 'ground') return 'Ground'
  return `Floor ${level}`
}

export function compassDeg(face: string): number {
  const map: Record<string, number> = {
    north: 0,
    'north-east': 45,
    east: 90,
    'south-east': 135,
    south: 180,
    'south-west': 225,
    west: 270,
    'north-west': 315,
  }
  return map[face] ?? 0
}
