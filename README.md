# Gobble Run — The Great Thanksgiving Escape

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/Rieee-delrey/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/Rieee-delrey/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

You are the turkey. Thanksgiving is coming, the farmer is behind you with
a pitchfork, and the kitchen — with its oven and its carving knives — is
between you and the forest gate. Run the farmyard, slip through the barn,
dodge the oven jets, and get out alive.

The farmer is no metronome: he winds up with his arm raised before every
knife throw (watch for it — a raised knife means duck), he stops and
searches the hay when you vanish into it, and when he is nearly on you he
lunges. Chain corn without a hit to build a combo; every fifth cob in a
chain pays a bonus.

## Play

Open `game/index.html` in a desktop browser (or `node serve.ts` and visit
http://localhost:8080). No network, no build step, no assets to download:
every sound is synthesised with WebAudio, including a quiet plucked tune
while you run.

- **Space / W / ↑ / click** — jump
- **S / ↓** — duck under the farmer's thrown knives
- **Shift / X** — dash (buys breathing room from the farmer)
- **H** — hide in a haystack when one is close (the farmer runs past, then searches)
- **P / Esc** — pause
- **M** — mute

Jump the fences and pumpkins, duck the carving knives, grab corn (+10) and
golden feathers (+50). Mud slows you down. The farmer gains on you every
second — corn, feathers, dashes and hiding buy distance back. Lose all 3
lives, or let him catch you, and it is dinner time. Reach the forest gate
at the end of the kitchen and you are free.

## Layout

- `game/src/config.js` — every tuning number and colour
- `game/src/random.js` — the seeded generator behind the farm
- `game/src/input.js` — keyboard and pointer input
- `game/src/audio.js` — synthesised gobbles, thuds, jingles and the tune
- `game/src/stages.js` — farmyard, barn and kitchen: spawn tables and pace
- `game/src/farmer.js` — the farmer's mind: chase, wind up, search, lunge
- `game/src/particles.js` — leaves, feathers, stars, confetti, dust
- `game/src/world.js` — the run itself: turkey, farmer, hazards, combos, score
- `game/src/render.js` — the autumn farm, the turkey, the farmer, the HUD
- `game/src/shots.js` — the staged scenes and the autopilot behind them
- `game/src/main.js` — boot, the loop and the five screens

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` into `/output` and writes `dossier.json` with the vendored
make.fun library. The screenshots are real renders of the game's own code,
staged by `?shot=start|play|kitchen|end` with seed 7.

An entry for the [turkey escape game bounty](https://make.fun/bounty/turkey-run-game-01) on make.fun.
