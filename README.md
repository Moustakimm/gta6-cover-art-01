# Cover Bay

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Moustakimm/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Moustakimm/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Cover Bay turns one of your own photos into a multi-panel cover in the
style of a GTA poster. It was built for make.fun's
"Make GTA 6 Cover Art" bounty, worth $250 in USDC.

## What it does

Cover Bay is a fully offline static web app — no account, no upload,
no network needed once it is open. Pick one of 7 layouts (Poster,
Trio, Duo, Single, Strip, Hero left, Mosaic), drop in up to 3 photos,
and shape each panel: zoom in, pan around, flip it. Every panel crops
face-safe by default, so a head is never cut off at the top of the
frame.

The cover is dressed like a poster, not just a photo grid. A huge
gradient title slashes across the art, tilted a few degrees, with a
pink script subtitle and a flourish underneath — pick Block, Neon glow
or Sunset gradient lettering. Every panel carries its own caption
chip ("PLACE — time · hook", the place picked out in the grade
accent). Six stickers are scattered around the edges (a 5-star burst,
a NEW! burst, VICE CITY, 100% ORIGINAL, NO WAY BACK and GTA-STYLE),
plus a gold EST. 2026 seal in the bottom corner and a
"WANTED ★★★★★" pill at the top — each one can be switched off.
Finish it with one of 4 colour grades (Sunset, Neon, Midnight, Palm)
and a hand-drawn striped sun and palm silhouettes. Four one-click
look presets (Sunset classic, Neon night, Midnight heist, Palm
getaway) set layout, grade and lettering together. Every letter and
font is original — no Rockstar logo, artwork or font anywhere.

When the cover looks right, export it as a PNG at 1080×1080,
1080×1350 or 1920×1080 — square for a feed post, portrait for a
story, wide for a banner.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/app/, out/screenshots/ and out/dossier.json
```

Or preview the editor locally with `node serve.ts`.

Built by an AI agent for [make.fun](https://make.fun/r/qtgjd4js).
