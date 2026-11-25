# Pocket World

Six little worlds on one cube, seen three ways. Every shape, texture, light and sound is made by code: no image files, no models, no audio files.

Run it with `npm run dev` (a tiny Python server that never caches, so edits always show), then open http://localhost:8765.

## The four views

| View | File | What it is |
|---|---|---|
| Low poly | `lowpoly.html` | The main world. Procedural from a seed, with season, sides, light and time of day. |
| Paper | `transform.html?mode=paper` | The same idea cut from paper. Folds flat into its net and back. (`paper.html` redirects here.) |
| Paper → Real | `transform.html` | One world built twice. A scan line turns the paper into a polished 3D render. |
| Film | `blender/paper-cube-trim.mp4` | Rendered in Blender: one printed sheet folds itself into the cube. |

`index.html` is the hub that frames them, with the toolbar, the fly-through button and the sound.

## Controls

- **1–4** switch views · **T** fly through · **C** customize · **N** day / night · **M** sound
- `?w=` in the address holds a shared world (only the values that differ from the defaults). **Copy link** in the Customize panel writes it.
- `?skip` skips the welcome card, `?record` hides all interface for screen recording.

## How it is put together

- `shared/knobs.js`: the parameter schema and the Customize panel generated from it (the same approach and look as Builderland).
- `shared/sound.js`: all sound, synthesised with Web Audio (wind, water, waves, birds, crickets, a music box, paper folds, pops).
- `shared/tour.js`: the camera flight, defined in the cube's own coordinates.
- `shared/daylight.js`: time of day for the paper engine (sun, moon, stars, sky colour).
- `shared/hero.js`: the big title drawn behind the cube, like a website hero.
- `shared/bridge.js`: messages between a world and the hub (what the camera faces, sound cues, toolbar commands).

## Blender film

`blender/paper-cube.blend` is the scene. The fold animation is baked to a point cache, `blender/fold.pc2`, which is not in the repository (about 70 MB), so the finished film ships as `blender/paper-cube-trim.mp4`. The printed art is painted by `blender/paint-net.html` into `blender/net-art.png`.

Render: `/Applications/Blender.app/Contents/MacOS/Blender -b blender/paper-cube.blend -a`, then `ffmpeg -framerate 24 -i blender/frames/f_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 17 out.mp4`.
