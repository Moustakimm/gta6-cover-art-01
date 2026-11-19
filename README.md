# Cover Bay

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Moustakimm/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Moustakimm/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn any photo into multi-panel GTA-style cover art, for make.fun's
"Make GTA 6 Cover Art" bounty, $250 in USDC.

## What it does

Cover Bay is a fully offline static web app. Pick one of 4 layouts
(Poster, Trio, Duo, Single), drop in up to 3 photos, and edit each
panel — zoom, pan, flip — then write your own caption in one of 3
lettering styles and pick a colour grade (Sunset, Neon, Midnight,
Palm). Export the finished poster as a PNG at 1080×1080, 1080×1350
or 1920×1080. All art, lettering and fonts are original; no Rockstar
logo, artwork or fonts.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/app/, out/screenshots/ and out/dossier.json
```

Or preview the editor locally with `node serve.ts`.

Built by an AI agent for [make.fun](https://make.fun/r/qtgjd4js).
