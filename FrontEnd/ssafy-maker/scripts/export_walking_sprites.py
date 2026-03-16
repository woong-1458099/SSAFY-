import struct
import zlib
from pathlib import Path


FILE_HEADER_SIZE = 128
FRAME_HEADER_SIZE = 16
CHUNK_LAYER = 0x2004
CHUNK_CEL = 0x2005
FRAME_WIDTH = 16
FRAME_HEIGHT = 32
WALK_CLOTHES_LAYER_INDEX = 2


def png_chunk(chunk_type: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + chunk_type
        + data
        + struct.pack(">I", zlib.crc32(chunk_type + data) & 0xFFFFFFFF)
    )


def write_png(path: Path, width: int, height: int, rgba: bytes) -> None:
    scanlines = bytearray()
    stride = width * 4
    for row in range(height):
        scanlines.append(0)
        start = row * stride
        scanlines.extend(rgba[start : start + stride])

    png = bytearray(b"\x89PNG\r\n\x1a\n")
    png.extend(png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)))
    png.extend(png_chunk(b"IDAT", zlib.compress(bytes(scanlines), level=9)))
    png.extend(png_chunk(b"IEND", b""))
    path.write_bytes(png)


def read_png_rgba(path: Path) -> tuple[int, int, bytes]:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"{path} is not a PNG file")

    pos = 8
    width = height = None
    bit_depth = color_type = None
    idat = bytearray()

    while pos < len(data):
        length = int.from_bytes(data[pos : pos + 4], "big")
        pos += 4
        chunk_type = data[pos : pos + 4]
        pos += 4
        chunk = data[pos : pos + length]
        pos += length
        pos += 4

        if chunk_type == b"IHDR":
            width = int.from_bytes(chunk[0:4], "big")
            height = int.from_bytes(chunk[4:8], "big")
            bit_depth = chunk[8]
            color_type = chunk[9]
        elif chunk_type == b"IDAT":
            idat.extend(chunk)
        elif chunk_type == b"IEND":
            break

    if bit_depth != 8 or color_type != 6:
        raise ValueError(f"Unsupported PNG format in {path}")

    raw = zlib.decompress(bytes(idat))
    stride = width * 4
    rgba = bytearray(width * height * 4)
    prev = bytearray(stride)
    src = dst = 0

    def paeth(a: int, b: int, c: int) -> int:
        p = a + b - c
        pa = abs(p - a)
        pb = abs(p - b)
        pc = abs(p - c)
        if pa <= pb and pa <= pc:
            return a
        if pb <= pc:
            return b
        return c

    for _ in range(height):
        filter_type = raw[src]
        src += 1
        row = bytearray(raw[src : src + stride])
        src += stride

        if filter_type == 1:
            for index in range(4, stride):
                row[index] = (row[index] + row[index - 4]) & 0xFF
        elif filter_type == 2:
            for index in range(stride):
                row[index] = (row[index] + prev[index]) & 0xFF
        elif filter_type == 3:
            for index in range(stride):
                left = row[index - 4] if index >= 4 else 0
                row[index] = (row[index] + ((left + prev[index]) // 2)) & 0xFF
        elif filter_type == 4:
            for index in range(stride):
                left = row[index - 4] if index >= 4 else 0
                up = prev[index]
                up_left = prev[index - 4] if index >= 4 else 0
                row[index] = (row[index] + paeth(left, up, up_left)) & 0xFF
        elif filter_type != 0:
            raise ValueError(f"Unsupported PNG filter {filter_type} in {path}")

        rgba[dst : dst + stride] = row
        prev = row
        dst += stride

    return width, height, bytes(rgba)


def split_sheet_frames(rgba: bytes, width: int, height: int, frame_width: int, frame_height: int) -> list[bytes]:
    frame_count = width // frame_width
    frames = []
    for frame_index in range(frame_count):
        frame = bytearray(frame_width * frame_height * 4)
        for row in range(frame_height):
            src_start = (row * width + frame_index * frame_width) * 4
            dst_start = row * frame_width * 4
            frame[dst_start : dst_start + frame_width * 4] = rgba[src_start : src_start + frame_width * 4]
        frames.append(bytes(frame))
    return frames


def combine_frames_into_sheet(frames: list[bytes], frame_width: int, frame_height: int) -> bytes:
    sheet = bytearray(frame_width * frame_height * len(frames) * 4)
    for frame_index, frame in enumerate(frames):
        for row in range(frame_height):
            src_start = row * frame_width * 4
            dst_start = (row * frame_width * len(frames) + frame_index * frame_width) * 4
            sheet[dst_start : dst_start + frame_width * 4] = frame[src_start : src_start + frame_width * 4]
    return bytes(sheet)


def parse_ase_layers(path: Path) -> tuple[int, int, list[str], list[list[dict[str, object]]]]:
    data = path.read_bytes()
    frame_count = struct.unpack_from("<H", data, 6)[0]
    width, height = struct.unpack_from("<HH", data, 8)
    layer_names: list[str] = []
    frames: list[list[dict[str, object]]] = []
    offset = FILE_HEADER_SIZE

    for _ in range(frame_count):
        frame_bytes, _, old_chunk_count, _ = struct.unpack_from("<IHHH", data, offset)
        new_chunk_count = struct.unpack_from("<I", data, offset + 12)[0]
        chunk_count = new_chunk_count if new_chunk_count else old_chunk_count
        chunk_offset = offset + FRAME_HEADER_SIZE
        cels = []

        for _ in range(chunk_count):
            chunk_size, chunk_type = struct.unpack_from("<IH", data, chunk_offset)

            if chunk_type == CHUNK_LAYER:
                name_len = struct.unpack_from("<H", data, chunk_offset + 22)[0]
                name = data[chunk_offset + 24 : chunk_offset + 24 + name_len].decode("utf-8", errors="replace")
                layer_names.append(name)
            elif chunk_type == CHUNK_CEL:
                layer_index, x, y, opacity, cel_type = struct.unpack_from("<HhhBH", data, chunk_offset + 6)
                if cel_type != 2:
                    raise ValueError(f"Unsupported cel type {cel_type} in {path}")

                cel_width, cel_height = struct.unpack_from("<HH", data, chunk_offset + 22)
                pixels = zlib.decompress(data[chunk_offset + 26 : chunk_offset + chunk_size])
                cels.append(
                    {
                        "layer_index": layer_index,
                        "x": x,
                        "y": y,
                        "opacity": opacity,
                        "width": cel_width,
                        "height": cel_height,
                        "pixels": pixels,
                    }
                )

            chunk_offset += chunk_size

        frames.append(cels)
        offset += frame_bytes

    return width, height, layer_names, frames


def blend_pixel(dst: bytearray, offset: int, src_rgba: bytes, opacity: int) -> None:
    src_r, src_g, src_b, src_a = src_rgba
    src_a = (src_a * opacity) // 255
    if src_a <= 0:
        return

    dst_r, dst_g, dst_b, dst_a = dst[offset : offset + 4]
    inv_src_a = 255 - src_a
    out_a = src_a + (dst_a * inv_src_a + 127) // 255
    if out_a <= 0:
        dst[offset : offset + 4] = b"\x00\x00\x00\x00"
        return

    src_r_p = src_r * src_a
    src_g_p = src_g * src_a
    src_b_p = src_b * src_a
    dst_r_p = dst_r * dst_a
    dst_g_p = dst_g * dst_a
    dst_b_p = dst_b * dst_a

    out_r_p = src_r_p + (dst_r_p * inv_src_a + 127) // 255
    out_g_p = src_g_p + (dst_g_p * inv_src_a + 127) // 255
    out_b_p = src_b_p + (dst_b_p * inv_src_a + 127) // 255

    dst[offset + 0] = min(255, (out_r_p + out_a // 2) // out_a)
    dst[offset + 1] = min(255, (out_g_p + out_a // 2) // out_a)
    dst[offset + 2] = min(255, (out_b_p + out_a // 2) // out_a)
    dst[offset + 3] = min(255, out_a)


def render_layer_frames(frame_width: int, frame_height: int, frames: list[list[dict[str, object]]], layer_index: int) -> list[bytes]:
    rendered = []
    for frame in frames:
        canvas = bytearray(frame_width * frame_height * 4)
        for cel in frame:
            if cel["layer_index"] != layer_index:
                continue

            pixels = cel["pixels"]
            cel_width = cel["width"]
            cel_height = cel["height"]
            start_x = cel["x"]
            start_y = cel["y"]
            opacity = cel["opacity"]

            for py in range(cel_height):
                dst_y = start_y + py
                if dst_y < 0 or dst_y >= frame_height:
                    continue
                for px in range(cel_width):
                    dst_x = start_x + px
                    if dst_x < 0 or dst_x >= frame_width:
                        continue

                    src_offset = (py * cel_width + px) * 4
                    dst_offset = (dst_y * frame_width + dst_x) * 4
                    blend_pixel(canvas, dst_offset, pixels[src_offset : src_offset + 4], opacity)
        rendered.append(bytes(canvas))
    return rendered


def average_rgb(frame: bytes) -> tuple[float, float, float]:
    sum_r = sum_g = sum_b = total_alpha = 0
    for offset in range(0, len(frame), 4):
        alpha = frame[offset + 3]
        if alpha == 0:
            continue
        sum_r += frame[offset] * alpha
        sum_g += frame[offset + 1] * alpha
        sum_b += frame[offset + 2] * alpha
        total_alpha += alpha
    if total_alpha == 0:
        return (1.0, 1.0, 1.0)
    return (sum_r / total_alpha, sum_g / total_alpha, sum_b / total_alpha)


def tint_frame(frame: bytes, source_rgb: tuple[float, float, float], target_rgb: tuple[float, float, float]) -> bytes:
    tinted = bytearray(len(frame))
    source_r, source_g, source_b = source_rgb
    target_r, target_g, target_b = target_rgb
    for offset in range(0, len(frame), 4):
        alpha = frame[offset + 3]
        if alpha == 0:
            continue
        tinted[offset + 0] = min(255, round(frame[offset] * target_r / max(source_r, 1.0)))
        tinted[offset + 1] = min(255, round(frame[offset + 1] * target_g / max(source_g, 1.0)))
        tinted[offset + 2] = min(255, round(frame[offset + 2] * target_b / max(source_b, 1.0)))
        tinted[offset + 3] = alpha
    return bytes(tinted)


def alpha_bbox(frame: bytes, frame_width: int, frame_height: int) -> tuple[int, int, int, int]:
    min_x = frame_width
    min_y = frame_height
    max_x = -1
    max_y = -1
    for y in range(frame_height):
        for x in range(frame_width):
            if frame[(y * frame_width + x) * 4 + 3] == 0:
                continue
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)
    if max_x < 0:
        return (0, 0, 0, 0)
    return (min_x, min_y, max_x, max_y)


def translate_frame(frame: bytes, frame_width: int, frame_height: int, dx: int, dy: int) -> bytes:
    translated = bytearray(frame_width * frame_height * 4)
    for y in range(frame_height):
        for x in range(frame_width):
            src_x = x - dx
            src_y = y - dy
            if src_x < 0 or src_x >= frame_width or src_y < 0 or src_y >= frame_height:
                continue
            src_offset = (src_y * frame_width + src_x) * 4
            dst_offset = (y * frame_width + x) * 4
            translated[dst_offset : dst_offset + 4] = frame[src_offset : src_offset + 4]
    return bytes(translated)


def write_sheet(paths: list[Path], frames: list[bytes], frame_width: int, frame_height: int) -> None:
    sheet_rgba = combine_frames_into_sheet(frames, frame_width, frame_height)
    for path in paths:
        path.parent.mkdir(parents=True, exist_ok=True)
        write_png(path, frame_width * len(frames), frame_height, sheet_rgba)


def generate_walk_base_assets() -> list[bytes]:
    source = Path("assets/raw/characters/walking.ase")
    frame_width, frame_height, _, frames = parse_ase_layers(source)
    male_frames = render_layer_frames(frame_width, frame_height, frames, 1)
    female_frames = render_layer_frames(frame_width, frame_height, frames, 0)

    write_sheet(
        [Path("assets/game/character/base_male_walk.png"), Path("public/assets/game/character/base_male_walk.png")],
        male_frames,
        frame_width,
        frame_height,
    )
    write_sheet(
        [Path("assets/game/character/base_female_walk.png"), Path("public/assets/game/character/base_female_walk.png")],
        female_frames,
        frame_width,
        frame_height,
    )
    return male_frames


def generate_walk_clothes_assets(template_frames: list[bytes]) -> None:
    template_rgb = average_rgb(template_frames[3])
    for gender in ("male", "female"):
        for index in range(1, 4):
            source_path = Path(f"assets/game/character/{gender}_clothes_{index}.png")
            source_width, source_height, source_rgba = read_png_rgba(source_path)
            source_frames = split_sheet_frames(source_rgba, source_width, source_height, FRAME_WIDTH, FRAME_HEIGHT)
            target_rgb = average_rgb(source_frames[0])
            tinted_frames = [tint_frame(frame, template_rgb, target_rgb) for frame in template_frames]
            write_sheet(
                [
                    Path(f"assets/game/character/{gender}_clothes_{index}_walk.png"),
                    Path(f"public/assets/game/character/{gender}_clothes_{index}_walk.png"),
                ],
                tinted_frames,
                FRAME_WIDTH,
                FRAME_HEIGHT,
            )


def generate_walk_hair_assets(walk_base_frames: list[bytes]) -> None:
    base_walk_boxes = [alpha_bbox(frame, FRAME_WIDTH, FRAME_HEIGHT) for frame in walk_base_frames]
    for gender in ("male", "female"):
        idle_base_path = Path(f"assets/game/character/base_{gender}.png")
        idle_width, idle_height, idle_rgba = read_png_rgba(idle_base_path)
        idle_base_frames = split_sheet_frames(idle_rgba, idle_width, idle_height, FRAME_WIDTH, FRAME_HEIGHT)
        idle_box = alpha_bbox(idle_base_frames[0], FRAME_WIDTH, FRAME_HEIGHT)

        offsets = [(walk_box[0] - idle_box[0], walk_box[1] - idle_box[1]) for walk_box in base_walk_boxes]
        for index in range(1, 4):
            source_path = Path(f"assets/game/character/{gender}_hair_{index}.png")
            source_width, source_height, source_rgba = read_png_rgba(source_path)
            source_frames = split_sheet_frames(source_rgba, source_width, source_height, FRAME_WIDTH, FRAME_HEIGHT)
            source_frame = source_frames[0]
            shifted_frames = [translate_frame(source_frame, FRAME_WIDTH, FRAME_HEIGHT, dx, dy) for dx, dy in offsets]
            write_sheet(
                [
                    Path(f"assets/game/character/{gender}_hair_{index}_walk.png"),
                    Path(f"public/assets/game/character/{gender}_hair_{index}_walk.png"),
                ],
                shifted_frames,
                FRAME_WIDTH,
                FRAME_HEIGHT,
            )


if __name__ == "__main__":
    walk_base_frames = generate_walk_base_assets()
    source = Path("assets/raw/characters/walking.ase")
    frame_width, frame_height, _, parsed_frames = parse_ase_layers(source)
    clothes_template_frames = render_layer_frames(frame_width, frame_height, parsed_frames, WALK_CLOTHES_LAYER_INDEX)
    generate_walk_clothes_assets(clothes_template_frames)
    generate_walk_hair_assets(walk_base_frames)
