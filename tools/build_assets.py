"""Turn the raw files in Images/ into game-ready sprite sheets in assets/.

Browsers can't play GIF frames inside a game canvas, so the animated GIFs are
flattened into horizontal sprite sheets, and the packed sheets (submarine, orca)
are cropped into individual pieces.

Run from the repo root:  python tools/build_assets.py   (needs Pillow)
"""
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Images"
OUT = ROOT / "assets"
CRAFTPIX = SRC / "craftpix-net-800891-octopus-jellyfish-shark-and-turtle-free-sprite-pixel-art"

# craftpix folder number -> species key used by the game
CREATURES = {1: "jelly", 2: "turtle", 3: "swordfish", 4: "angler", 5: "eel", 6: "octopus"}


def gif_to_sheet(src, dst, crop=None):
    im = Image.open(src)
    frames = []
    for i in range(im.n_frames):
        im.seek(i)
        frame = im.convert("RGBA")
        frames.append(frame.crop(crop) if crop else frame)
    w, h = frames[0].size
    sheet = Image.new("RGBA", (w * len(frames), h))
    for i, frame in enumerate(frames):
        sheet.paste(frame, (i * w, 0))
    sheet.save(dst)
    print(f"{dst.name}: {len(frames)} frames of {w}x{h}")


def pack_cells(src, boxes, cell, dst):
    """Crop boxes out of a sheet and centre each one in an equal-size cell."""
    im = Image.open(src).convert("RGBA")
    cw, ch = cell
    sheet = Image.new("RGBA", (cw * len(boxes), ch))
    for i, box in enumerate(boxes):
        piece = im.crop(box)
        x = i * cw + (cw - piece.width) // 2
        y = (ch - piece.height) // 2
        sheet.paste(piece, (x, y))
    sheet.save(dst)
    print(f"{dst.name}: {len(boxes)} frames of {cw}x{ch}")


def main():
    (OUT / "creatures").mkdir(parents=True, exist_ok=True)

    gif_to_sheet(SRC / "sprite diver swim forward.gif", OUT / "diver_swim.png")
    gif_to_sheet(SRC / "sprite diver tread.gif", OUT / "diver_tread.png")
    gif_to_sheet(SRC / "whalesharkcute.gif", OUT / "whaleshark.png", crop=(20, 15, 310, 240))

    sub = Image.open(SRC / "submarine.png").convert("RGBA")
    sub.crop((34, 10, 154, 84)).save(OUT / "sub.png")
    sub.crop((216, 10, 336, 84)).save(OUT / "sub_alt.png")
    print("sub.png, sub_alt.png")

    # Left column of whale.png is the orca swim cycle; the right column has spouts.
    orca_boxes = [(11, 30, 110, 58), (10, 68, 105, 99), (9, 110, 104, 141), (9, 156, 108, 184),
                  (9, 196, 109, 226), (8, 249, 108, 280), (11, 298, 111, 328)]
    pack_cells(SRC / "whale.png", orca_boxes, (104, 34), OUT / "orca.png")
    spout_boxes = [(335, 221, 349, 239), (326, 88, 356, 112), (329, 150, 358, 179)]
    pack_cells(SRC / "whale.png", spout_boxes, (32, 32), OUT / "spout.png")

    # Angie's portrait is 10x-scaled pixel art: shrink to its native 60x60 grid
    # and cut it into a circle so it can be used as an avatar.
    face = Image.open(SRC / "angie profile.png").convert("RGBA").resize((60, 60), Image.NEAREST)
    px = face.load()
    for y in range(60):
        for x in range(60):
            if (x + 0.5 - 30) ** 2 + (y + 0.5 - 30) ** 2 > 29.5 ** 2:
                px[x, y] = (0, 0, 0, 0)
    face.save(OUT / "angie.png")
    print("angie.png")

    for name in ["blue-whale.png", "blue-whale-smile.png", "krill-2.png", "krill-3.png"]:
        shutil.copy(SRC / name, OUT / name)

    for folder, key in CREATURES.items():
        for anim in ["Idle", "Walk", "Hurt"]:
            shutil.copy(CRAFTPIX / str(folder) / f"{anim}.png", OUT / "creatures" / f"{key}_{anim.lower()}.png")
    print("creatures/ copied")


if __name__ == "__main__":
    main()
