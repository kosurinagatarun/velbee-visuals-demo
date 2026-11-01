export type FloorLevel = 'ground' | '1' | '2'
export type Light = 'day' | 'night'
export type FloorMode = 'plan' | 'isometric' | 'tour'
export type Fitout = 'furnished' | 'empty'

export type Point = {
  x: number
  y: number
}

export type FloorRow = {
  level: FloorLevel
  facing: string
  plateCode: string
}

export type Angle = {
  id: string
  face: string
}

export type Arrow = {
  yaw: number
  pitch: number
  to: string
  /** Destination room name (UI). */
  label?: string
}

export type Stop = {
  id: string
  file: string
  name: string
  plan: Point
  facing: string
  heading: number
  arrows: Arrow[]
}

export type Plate = {
  code: string
  /** WebGL equirect look-around; false until real 6000×3000 panos pass validation. */
  equirectTour: boolean
  planUrl: (fitout: Fitout) => string
  isoUrl: (fitout: Fitout) => string
  tourUrl: (fitout: Fitout, file: string) => string
  panoUrl: (fitout: Fitout, stopId: string) => string
  stops: Stop[]
}

export type Band = {
  level: FloorLevel
  points: Point[]
}

export type ContentPack = {
  floors: FloorRow[]
  angles: Angle[]
  bands: Record<string, Band[]>
  plates: Record<string, Plate>
  /** Site exterior walkthrough (Panom-style equirect graph). */
  exterior?: Plate
  /** Interior unit tour reference (4BHK). */
  unitTour?: Plate
}
