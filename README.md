# World Cup 2026 Tracker

A fast, offline-friendly web app to follow the **FIFA World Cup 2026**. Type match
scores and watch group standings, third-place qualification and the full knockout
bracket update live.

**Live site:** https://arazmj.github.io/world-cup-2026-tracker/

## Features

- Real 2026 draw — all 48 teams across 12 groups, with country flags.
- Group standings with the **full FIFA tiebreakers**: points → goal difference →
  goals for → head-to-head (points/GD/GF among level teams) → fair play → drawing of lots.
- Ranks the 12 third-placed teams and qualifies the best eight.
- Knockout bracket (Round of 32 → Final) with the official **Annex C** third-place
  slotting, automatic advancement and penalty-shootout winners for drawn matches.
- Autosaves in your browser; **Export / Import** a JSON file and **share a link**
  that encodes the whole tournament.
- Light / dark theme, responsive, keyboard accessible.

## Develop

```bash
npm install
npm run dev       # start the dev server
npm test          # run the logic + render tests (Vitest)
npm run build     # type-check + production build
npm run preview   # preview the production build
```

## Deploy

Pushing to `main` builds the app and publishes it to GitHub Pages via
`.github/workflows/deploy.yml`. The Vite `base` is set to `/world-cup-2026-tracker/`
to match the repository name.

## Data

`src/data/*.json` (teams, schedule, knockout tree and the 495-row Annex C table) are
generated from the validated source data by `scripts/gen-data.py`. The tiebreaker and
bracket logic in `src/lib/` is covered by unit tests in `src/test/`.

## License

MIT
