# Lumion 300-frame orbit drop folder

Put **300** exterior **perspective** stills here, then ingest from repo root:

```bash
python content/scripts/sync_orbit_metadata.py
python content/scripts/ingest_lumion_orbit.py --source-dir content/building/incoming/lumion-300
python content/scripts/validate_building_orbit.py
```

## Naming

Use either:

- `1.jpg` … `300.jpg` (or `.png` / `.webp`), **or**
- `001.jpg` … `300.jpg`

**300** = last step before looping back to **001** (full 360°).

## Export settings (for your arch friend)

| Setting | Value |
| --- | --- |
| Mode | **Photo / perspective** — **not** 360° pano |
| Size | **1920×1080** (16:9) or higher (ingest crops to 1920×1080) |
| Step | **1.2°** → **300** frames per revolution |
| Camera | Same height, distance, FOV, exposure on **every** frame |
| **001 / 1** | Marketing front (main facade) |

## Spec reference

[`building-spec.json`](../building-spec.json) → `frame_count: 300`, `step_deg: 1.2`.

After ingest, bump browser cache if needed: orbit query `?v=orbit-300` in the app.
