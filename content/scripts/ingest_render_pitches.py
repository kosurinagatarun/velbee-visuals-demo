"""Ingest D:\\knt\\visuals\\renders pitch folders into content/building."""

from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[2]
BUILDING = REPO / "content" / "building"
RENDERS = REPO / "renders"
SPEC = BUILDING / "building-spec.json"
OUT_W, OUT_H = 1920, 1080
JPEG_Q = 80

PREFIX_SEQ_RE = re.compile(r"^.+_(\d+)\.(jpe?g|png|webp)$", re.I)


def load_frame_count() -> int:
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    return int(spec["orbit"]["frame_count"])


def cover(img: Image.Image, w: int, h: int) -> Image.Image:
    sw, sh = img.size
    scale = max(w / sw, h / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    out = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - w) // 2
    top = (nh - h) // 2
    return out.crop((left, top, left + w, top + h))


def collect_prefixed(source_dir: Path) -> dict[int, Path]:
    mapped: dict[int, Path] = {}
    for path in source_dir.iterdir():
        if not path.is_file():
            continue
        m = PREFIX_SEQ_RE.match(path.name)
        if not m:
            continue
        seq = int(m.group(1))
        mapped[seq + 1] = path
    return mapped


def fill_to_count(mapped: dict[int, Path], frame_count: int, source_dir: Path) -> dict[int, Path]:
    if not mapped:
        raise SystemExit(f"No prefixed frames in {source_dir}")
    out = dict(mapped)
    max_have = max(out)
    if max_have >= frame_count:
        return {n: out[n] for n in range(1, frame_count + 1)}
    # 300-frame export: duplicate last frame for 301
    for n in range(max_have + 1, frame_count + 1):
        out[n] = out[max_have]
    return {n: out[n] for n in range(1, frame_count + 1)}


def ingest_band(source_dir: Path, out_name: str, frame_count: int) -> int:
    if not source_dir.is_dir():
        raise SystemExit(f"Missing {source_dir}")
    pair_map = fill_to_count(collect_prefixed(source_dir), frame_count, source_dir)
    n_done = 0
    for n in range(1, frame_count + 1):
        src = pair_map[n]
        fid = f"{n:03d}"
        out_dir = BUILDING / fid
        out_dir.mkdir(parents=True, exist_ok=True)
        img = cover(Image.open(src).convert("RGB"), OUT_W, OUT_H)
        img.save(out_dir / out_name, quality=JPEG_Q, optimize=True)
        n_done += 1
    return n_done


def main() -> None:
    frame_count = load_frame_count()
    bands = [
        (RENDERS / "REG", "day.jpg", "Regular (REG → day.jpg)"),
        (RENDERS / "BT", "day-high.jpg", "High (BT → day-high.jpg)"),
        (RENDERS / "BIRD EYE", "day-top.jpg", "Bird's eye (BIRD EYE → day-top.jpg)"),
    ]
    # Legacy Lumion folder names
    legacy = [
        (RENDERS / "BOTTOM", "day.jpg"),
        (RENDERS / "TOP - MID", "day-high.jpg"),
        (RENDERS / "TOP", "day-top.jpg"),
    ]
    for i, (src_dir, out_name, label) in enumerate(bands):
        if not src_dir.is_dir() and legacy[i][0].is_dir():
            src_dir = legacy[i][0]
            label = f"{label} [legacy {src_dir.name}]"
        count = ingest_band(src_dir, out_name, frame_count)
        print(f"{label}: {count} frames → building/NNN/{out_name}")

    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    spec["reference"] = "renders/ REG + BT + BIRD EYE → day / day-high / day-top"
    spec["pitch_rings"] = [
        {"id": "mid", "label": "Mid", "file": "day.jpg"},
        {"id": "high", "label": "High", "file": "day-high.jpg"},
        {"id": "top", "label": "Bird's eye", "file": "day-top.jpg"},
    ]
    SPEC.write_text(json.dumps(spec, indent=2) + "\n", encoding="utf-8")
    print("Updated building-spec.json pitch_rings (mid / high / top).")


if __name__ == "__main__":
    main()
