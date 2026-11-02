# Lumion 120-frame orbit drop folder

Put your **120** exterior stills here, then ingest from repo root:

```bash
python content/scripts/ingest_lumion_orbit.py
python content/scripts/validate_building_orbit.py
```

## File naming (preferred)

`001.jpg` … `120.jpg` (PNG/WebP also OK)

- **001** = first view (0° bearing — your **front** / main facade)
- **002** = next step **clockwise** around the building (3° per frame for a full 360°)
- **120** = last step before looping back to 001

## Export rules (Lumion / Enscape / V-Ray)

- One **fixed** orbit: same height, distance, FOV, exposure for all 120
- **120** cameras evenly spaced on a circle (3° steps)
- **1920×1080** or larger 16:9 (ingest center-crops to 1920×1080)
- Day / `day.jpg` light only for now

## Order check

If filenames are wrong, rotation in the app will feel “scrambled”. Rename so frame 001 is front and order follows the camera path clockwise.

After ingest, bump cache in `app/src/data/loadContent.ts` and `npm run build` in `app/`.
