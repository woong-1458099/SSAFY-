from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from export_walking_sprites import parse_ase_layers, render_layer_frames, write_png


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Export a single-frame Aseprite file to PNG layers.")
    parser.add_argument("source", type=Path, help="Path to .ase or .aseprite file")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Directory for exported PNG files. Defaults to the source file directory.",
    )
    parser.add_argument(
        "--prefix",
        default=None,
        help="Filename prefix for exported files. Defaults to the source stem.",
    )
    return parser


def has_visible_pixels(rgba: bytes) -> bool:
    return any(rgba[offset + 3] > 0 for offset in range(0, len(rgba), 4))


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    source = args.source
    if not source.exists():
        raise FileNotFoundError(f"Source file not found: {source}")

    output_dir = args.output_dir or source.parent
    output_dir.mkdir(parents=True, exist_ok=True)
    prefix = args.prefix or source.stem

    frame_width, frame_height, layer_names, frames = parse_ase_layers(source)
    if len(frames) != 1:
        raise ValueError(f"{source} has {len(frames)} frames. This exporter currently supports single-frame files only.")

    exported_layers: list[dict[str, object]] = []
    composite = bytearray(frame_width * frame_height * 4)

    for layer_index, layer_name in enumerate(layer_names):
        rendered_frames = render_layer_frames(frame_width, frame_height, frames, layer_index)
        if not rendered_frames:
            continue
        rgba = rendered_frames[0]
        if not has_visible_pixels(rgba):
            continue

        file_name = f"{prefix}_layer_{layer_index + 1:02d}.png"
        target = output_dir / file_name
        write_png(target, frame_width, frame_height, rgba)

        for offset in range(0, len(rgba), 4):
            if rgba[offset + 3] == 0:
                continue
            composite[offset : offset + 4] = rgba[offset : offset + 4]

        exported_layers.append(
            {
                "layer_index": layer_index,
                "layer_name": layer_name,
                "file_name": file_name,
            }
        )

    composite_name = f"{prefix}_full.png"
    write_png(output_dir / composite_name, frame_width, frame_height, bytes(composite))

    manifest = {
        "source": str(source).replace("\\", "/"),
        "size": {"width": frame_width, "height": frame_height},
        "composite_file": composite_name,
        "layers": exported_layers,
    }
    (output_dir / f"{prefix}_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
