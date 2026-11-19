# Cover Bay

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Moustakimm/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Moustakimm/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Cover Bay turns one of your own photos into a multi-panel cover in
the style of a GTA poster. It was built for make.fun's
"Make GTA 6 Cover Art" bounty, worth $250 in USDC.

## What it does

Cover Bay is a fully offline static web app — no account, no upload,
no network needed once it is open. Choose one of 4 layouts (Poster,
Trio, Duo, Single), drop in up to 3 photos, and shape each panel:
zoom in, pan around, flip it. Add your own caption in one of 3
lettering styles, then finish it with one of 4 colour grades
(Sunset, Neon, Midnight, Palm). The title block, sun and palms are
drawn by hand in code, and every letter and font is original — no
Rockstar logo, artwork or font anywhere.

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
