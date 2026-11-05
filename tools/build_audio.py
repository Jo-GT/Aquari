"""Compress the raw files in Sound/ into web-friendly copies in assets/audio/.

The originals are large (some are 6-20 MB), which is slow to download on a
phone. Music is re-encoded at 128 kbps, ambience at 80 kbps mono, and the
10-minute whale recording is trimmed to a loopable 90 seconds.

Run from the repo root:  python tools/build_audio.py   (needs: pip install imageio-ffmpeg)
"""
import subprocess
from pathlib import Path

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent.parent
MUSIC = ROOT / "Sound" / "Background Music"
NOISE = ROOT / "Sound" / "Underwater noises"
OUT = ROOT / "assets" / "audio"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

# output name -> (source file, extra ffmpeg args)
MUSIC_ARGS = ["-b:a", "128k"]
AMBIENCE_ARGS = ["-ac", "1", "-b:a", "80k"]
SFX_ARGS = ["-ac", "1", "-b:a", "128k"]

FILES = {
    "music_menu": (MUSIC / "main menu theme.mp3", MUSIC_ARGS),
    "music_sunlit": (MUSIC / "Purrple Cat - Sunlit Shore.mp3", MUSIC_ARGS),
    "music_blue": (MUSIC / "Purrple Cat - Out of the Blue.mp3", MUSIC_ARGS),
    "music_dreamscape": (MUSIC / "alex-morgan-underwater-dreamscape-537486.mp3", MUSIC_ARGS),
    "music_deep": (MUSIC / "leberch-underwater-590441.mp3", MUSIC_ARGS),
    "music_whales": (MUSIC / "Purrple Cat - Swimming With Whales.mp3", MUSIC_ARGS),
    "music_siren": (MUSIC / "Purrple Cat - Siren's Song.mp3", MUSIC_ARGS),
    "music_end": (MUSIC / "Under the Sea - END scene music.mp3", MUSIC_ARGS),

    "amb_waves": (NOISE / "waves water main background ambiance sound.mp3", AMBIENCE_ARGS),
    "amb_bubbles": (NOISE / "bubbles underwater noise.mp3", ["-t", "90"] + AMBIENCE_ARGS),
    "amb_deep": (NOISE / "deep sea background ambiance.mp3", AMBIENCE_ARGS),
    "amb_whales": (NOISE / "whale and diver sound.mp3",
                   ["-t", "90", "-af", "afade=t=in:d=2,afade=t=out:st=88:d=2"] + AMBIENCE_ARGS),
    "amb_move": (NOISE / "underwater movement noises.mp3", AMBIENCE_ARGS),

    "sfx_ping": (NOISE / "release cheerful ping noise.mp3", SFX_ARGS),
    "sfx_release": (NOISE / "release noise.mp3", SFX_ARGS),
    "sfx_whale": (NOISE / "whale call.mp3", SFX_ARGS),
    "sfx_whale_deep": (NOISE / "deep whale sound.mp3", SFX_ARGS),
    "sfx_orca": (NOISE / "orca screech.mp3", SFX_ARGS),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for name, (src, args) in FILES.items():
        dst = OUT / f"{name}.mp3"
        subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", str(src), "-vn", "-map_metadata", "-1", *args, str(dst)],
                       check=True)
        size = dst.stat().st_size
        total += size
        print(f"{name:18} {size / 1e6:5.2f} MB")
    print(f"{'total':18} {total / 1e6:5.2f} MB")


if __name__ == "__main__":
    main()
