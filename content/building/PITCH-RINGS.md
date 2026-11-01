# One orbit — Regular + High + Bird's eye

Three **pitch rings** in `building-spec.json` = **one** drag surface:

| Drag | Result |
|------|--------|
| **Left / right** | Spin around the tower at the current height |
| **Up / down** | Move **Regular → High → Bird's eye** (smooth blend) |

## Files

| Ring | Label | Path |
|------|--------|------|
| Regular | Eye-level Lumion | `building/NNN/day.jpg` |
| High | Elevated oblique | `building/NNN/day-high.jpg` |
| Bird's eye | Plan / nadir | `building/plan/top.jpg` (one file; spins on horizontal drag) |

## Placeholder high band

Until Lumion delivers a real high orbit, run:

```bash
cd app
npm run bake:day-high
```

That builds **301** `day-high.jpg` from each `day.jpg` + light top blend (spin works; replace with real Lumion when ready).

## Final Lumion delivery

Friend renders **two** full orbits + **one** top still:

1. Current pass → `day.jpg` (done)
2. Higher camera, same steps → `day-high.jpg`
3. Nadir → `plan/top.jpg`

No change to app code after that — only swap JPEGs.
