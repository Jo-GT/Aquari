# Aquari

A cosy ocean-rescue game made for Angie. 🐋

- **Rescue Dives**: four levels (Sunny Shallows → Kelp Forest → The Twilight Deep → The Open Ocean). Swim as a diver (or a submarine in the deep), free animals tangled in litter, clean up trash, collect krill, and find the hidden message in a bottle. The last dive has a very special whale shark to save.
- **Sanctuary**: rescued animals recover here. Feed them krill and give them cuddles, then release them home to unlock a real conservation fact.
- **Ocean Journal**: every species met, plus every bottle message found.

## Personalising

Edit [src/config.js](src/config.js): hero name, your name, the whale shark's name, the four bottle messages and the ending message.

## Playing locally

Browsers block game images opened straight from disk, so serve the folder:

```sh
python -m http.server 8000
```

then open <http://localhost:8000>.

## Sharing it

Push to GitHub and turn on **Settings → Pages → Deploy from branch (main, / root)**. The game will be live at <https://outj1nx3d.github.io/Aquari/> and works on phones too (hold the screen to swim).

## Assets

`assets/` is generated from the raw files in `Images/` (GIFs become sprite sheets, packed sheets get cropped):

```sh
pip install pillow
python tools/build_assets.py
```

Angie's portrait is pixel art by @viiolaceus.

Sounds in `assets/audio/` are compressed copies of the originals in `Sound/` (about 64 MB down to 23 MB):

```sh
pip install imageio-ffmpeg
python tools/build_audio.py
```

Music: "Out of the Blue", "Sunlit Shore", "Swimming With Whales" and "Siren's Song" by Purrple Cat; "Underwater Dreamscape" by Alex Morgan; "Underwater" by leberch.
