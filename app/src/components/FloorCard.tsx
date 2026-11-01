import { floorLabel } from '../data/labels'
import type { FloorRow } from '../data/types'

type Props = {
  floor: FloorRow
  stopName?: string
}

export function FloorCard({ floor, stopName }: Props) {
  return (
    <aside className="card">
      <h1>{floorLabel(floor.level)}</h1>
      <dl>
        <div>
          <dt>Level</dt>
          <dd>{floorLabel(floor.level)}</dd>
        </div>
        <div>
          <dt>Facing</dt>
          <dd>{floor.facing}</dd>
        </div>
        <div>
          <dt>Plate</dt>
          <dd>{floor.plateCode}</dd>
        </div>
        {stopName ? (
          <div>
            <dt>Stop</dt>
            <dd>{stopName}</dd>
          </div>
        ) : null}
      </dl>
    </aside>
  )
}
