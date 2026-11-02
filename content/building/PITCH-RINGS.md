# Building orbit — mid, high, bird's eye

Ingest from `D:\knt\visuals\renders\`:

| Renders folder | Pitch | Output |
|----------------|--------|--------|
| `BOTTOM/` | **Mid** | `building/NNN/day.jpg` |
| `TOP - MID/` | **High** | `building/NNN/day-high.jpg` |
| `TOP/` | **Bird's eye** | `building/NNN/day-top.jpg` |

Re-ingest after new exports:

```bash
python content/scripts/ingest_render_pitches.py
```

`BOTTOM` = mid (eye-level orbit), not a “lower” angle. No band below mid.

App: drag sideways at any height; drag **up** mid → high → bird's-eye.
