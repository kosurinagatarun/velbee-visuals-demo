import { joinContentPath, isBuildingOnlyMode } from '../config/visuals'
import type { Angle, Band, ContentPack, Fitout, FloorLevel, FloorRow, Plate, Stop } from './types'

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  const header = lines[0]?.split(',').map((h) => h.trim())
  if (!header) return []
  return lines.slice(1).filter((line) => line.trim()).map((line) => {
    const cells = line.split(',').map((c) => c.trim())
    const row: Record<string, string> = {}
    header.forEach((key, i) => {
      row[key] = cells[i] ?? ''
    })
    return row
  })
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Missing ${url} (${res.status})`)
  return res.text()
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Missing ${url} (${res.status})`)
  return res.json() as Promise<T>
}

function isLevel(value: string): value is FloorLevel {
  return value === 'ground' || value === '1' || value === '2'
}

const BUILDING_CACHE = 'orbit-301-v1'

export function buildingStillUrl(angleId: string, light: 'day' | 'night'): string {
  return `${joinContentPath('building', angleId, `${light}.jpg`)}?v=${BUILDING_CACHE}`
}

export function plateAssetUrl(plateCode: string, file: string): string {
  return joinContentPath('plates', plateCode, file)
}

async function loadPlate(code: string, errors: string[]): Promise<Plate | null> {
  let match: { plate: string; stops: Stop[] }
  try {
    match = await fetchJson<{ plate: string; stops: Stop[] }>(
      joinContentPath('plates', code, 'match.json'),
    )
  } catch {
    errors.push(`Missing match.json for plate "${code}"`)
    return null
  }
  if (match.plate !== code) errors.push(`match.json plate "${match.plate}" != folder "${code}"`)
  const stops = match.stops
  if (!stops.length) errors.push(`Plate "${code}" has no tour stops`)

  let equirectTour = false
  try {
    const delivery = await fetchJson<{ equirectTour?: boolean }>(
      plateAssetUrl(code, 'pano/delivery.json'),
    )
    equirectTour = delivery.equirectTour === true
  } catch {
    /* still-only tour until delivery.json marks panos verified */
  }

  const stopIds = new Set(stops.map((s) => s.id))
  for (const stop of stops) {
    for (const arrow of stop.arrows) {
      if (!stopIds.has(arrow.to)) errors.push(`Arrow on ${stop.id} points at missing stop ${arrow.to}`)
    }
  }

  const planCache =
    code === 'exterior' ? 'panom-ref40' : code === 'unit-4bhk' ? 'panom-unit18' : 'pr3'
  const panoCache =
    code === 'exterior' ? 'panom-ref40' : code === 'unit-4bhk' ? 'panom-unit18' : 'pr4'

  return {
    code,
    equirectTour,
    planUrl: (fitout: Fitout) => {
      if (code === 'exterior') {
        return `${plateAssetUrl(code, 'site-plan.jpg')}?v=${planCache}`
      }
      return `${plateAssetUrl(code, fitout === 'empty' ? 'floor-plan-empty.jpg' : 'floor-plan.jpg')}?v=${planCache}`
    },
    isoUrl: (fitout: Fitout) =>
      `${plateAssetUrl(code, fitout === 'empty' ? 'isometric-empty.jpg' : 'isometric.jpg')}?v=${planCache}`,
    tourUrl: (fitout: Fitout, file: string) =>
      `${plateAssetUrl(code, `tour/${fitout}/${file}`)}?v=${planCache}`,
    panoUrl: (fitout: Fitout, stopId: string) =>
      `${plateAssetUrl(code, `pano/${fitout}/${stopId}.jpg`)}?v=${panoCache}`,
    stops,
  }
}

export async function loadContent(): Promise<ContentPack> {
  const errors: string[] = []
  const buildingOnly = isBuildingOnlyMode()

  const [anglesCsv, bands] = await Promise.all([
    fetchText(joinContentPath('building', 'angles.csv')),
    fetchJson<Record<string, Band[]>>(joinContentPath('building', 'bands.json')),
  ])

  let floors: FloorRow[] = []
  if (!buildingOnly) {
    const floorsCsv = await fetchText(joinContentPath('floors.csv'))
    floors = parseCsv(floorsCsv).map((row) => {
      if (!isLevel(row.level)) errors.push(`Unknown floor level "${row.level}"`)
      return {
        level: row.level as FloorLevel,
        facing: row.facing,
        plateCode: row.plate_code,
      }
    })
  }

  const angles: Angle[] = parseCsv(anglesCsv).map((row) => ({
    id: row.angle,
    face: row.face,
  }))

  const plates: Record<string, Plate> = {}
  if (!buildingOnly) {
    const plateCodes = [...new Set(floors.map((f) => f.plateCode))]
    for (const code of plateCodes) {
      const plate = await loadPlate(code, errors)
      if (plate) plates[code] = plate
    }
  }

  let exterior: Plate | undefined
  let unitTour: Plate | undefined
  if (!buildingOnly) {
    exterior = (await loadPlate('exterior', errors)) ?? undefined
    unitTour = (await loadPlate('unit-4bhk', errors)) ?? undefined
    for (const angle of angles) {
      if (!bands[angle.id]?.length) errors.push(`No floor bands for angle ${angle.id}`)
    }
    if (floors.length < 1) errors.push(`Expected at least one floor, got ${floors.length}`)
  }

  if (angles.length < 2) errors.push(`Expected an orbit of stills, got ${angles.length}`)
  if (errors.length) throw new Error(errors.join('\n'))

  return {
    floors,
    angles,
    bands: buildingOnly ? {} : bands,
    plates,
    exterior,
    unitTour,
  }
}
