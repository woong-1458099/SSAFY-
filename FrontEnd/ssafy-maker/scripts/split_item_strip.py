from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from export_walking_sprites import read_png_rgba, write_png


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Split a transparent PNG strip into separate item PNGs.")
    parser.add_argument("source", type=Path, help="Path to the source PNG strip")
    parser.add_argument("--output-dir", type=Path, default=None, help="Directory for output PNGs")
    parser.add_argument("--prefix", default=None, help="Filename prefix for output files")
    return parser


def column_has_pixel(rgba: bytes, width: int, height: int, x: int) -> bool:
    for y in range(height):
        if rgba[(y * width + x) * 4 + 3] > 0:
            return True
    return False


def find_segments(rgba: bytes, width: int, height: int) -> list[tuple[int, int]]:
    segments: list[tuple[int, int]] = []
    start: int | None = None
    for x in range(width):
        filled = column_has_pixel(rgba, width, height, x)
        if filled and start is None:
            start = x
        elif not filled and start is not None:
            segments.append((start, x - 1))
            start = None
    if start is not None:
        segments.append((start, width - 1))
    return segments


def crop_rgba(rgba: bytes, width: int, height: int, left: int, right: int) -> tuple[int, int, bytes]:
    min_y = height
    max_y = -1
    for x in range(left, right + 1):
        for y in range(height):
            if rgba[(y * width + x) * 4 + 3] > 0:
                min_y = min(min_y, y)
                max_y = max(max_y, y)

    if max_y < 0:
        return 0, 0, b""

    cropped_width = right - left + 1
    cropped_height = max_y - min_y + 1
    cropped = bytearray(cropped_width * cropped_height * 4)
    for y in range(cropped_height):
        src_y = min_y + y
        src_start = (src_y * width + left) * 4
        dst_start = y * cropped_width * 4
        cropped[dst_start : dst_start + cropped_width * 4] = rgba[src_start : src_start + cropped_width * 4]
    return cropped_width, cropped_height, bytes(cropped)


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    source = args.source
    if not source.exists():
        raise FileNotFoundError(f"Source file not found: {source}")

    output_dir = args.output_dir or (source.parent / source.stem)
    output_dir.mkdir(parents=True, exist_ok=True)
    prefix = args.prefix or source.stem.rstrip("s") or source.stem

    width, height, rgba = read_png_rgba(source)
    segments = find_segments(rgba, width, height)

    manifest_items: list[dict[str, object]] = []
    for index, (left, right) in enumerate(segments, start=1):
        item_width, item_height, item_rgba = crop_rgba(rgba, width, height, left, right)
        file_name = f"{prefix}_{index:02d}.png"
        write_png(output_dir / file_name, item_width, item_height, item_rgba)
        manifest_items.append(
            {
                "index": index,
                "file_name": file_name,
                "source_bounds": {
                    "left": left,
                    "right": right,
                },
                "size": {
                    "width": item_width,
                    "height": item_height,
                },
            }
        )

    manifest = {
        "source": str(source).replace("\\", "/"),
        "source_size": {"width": width, "height": height},
        "item_count": len(manifest_items),
        "items": manifest_items,
    }
    (output_dir / f"{source.stem}_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
