# The Needle & The Wave

A single-file browser game that teaches the Kakeya conjecture, its connection
to harmonic analysis, and what that connection does (and honestly doesn't) mean
for everyday technology. Aimed at a curious high-school student; ~20 minutes.

**Play it:** [quantisan.github.io/kakeya-game](https://quantisan.github.io/kakeya-game/),
or `npm install && npm run build` and open `dist/kakeya-game.html`. Everything —
code, fonts, libraries — is inlined; it works offline. Progress saves locally.

## The arc (one level per historical beat)

1. **1917 — Spin the needle.** Kakeya's question; sweep a needle, read the
   painted area, bet on convexity (and lose, like Kakeya did).
2. **1919 — The Besicovitch squeeze.** Slide triangle slivers together:
   translation is free, area collapses, every direction survives. Rotating
   instead goes nowhere — the level lets you try.
3. **1971 — Box-count it.** Davies' reformulation: the squeezed set has almost
   no area but box-counting slope climbing toward 2. Needle (1) and a
   Sierpinski fractal (~1.58) for contrast.
4. **1971 — Waves are needles.** The hinge: drag a wedge in frequency space,
   watch the wave packet concentrate on a tube. Match the target tube.
   Pays off the header oscilloscope.
5. **1971 — Break the cutoff.** Fefferman's proof as a game: pack near-parallel
   tubes under your own Level-2 par, apply the sharp cutoff, read the computed
   blowup ratio.
6. **1990s→2025 — The tower.** Kakeya → restriction → Bochner–Riesz → local
   smoothing. Predict-then-reveal: failure propagates up; a proven foundation
   proves nothing above it.
7. **Today — What's really running.** Sort MRI / WiFi / song recognition /
   JPEG / MP3 into honest buckets. The "waits on the conjectures" bucket is
   correctly empty.
8. **2008 — Bonus: finite directions.** Dvir's finite-field Kakeya as a 5×5
   mod-5 puzzle; par computed by the game's own greedy search.

Every number on screen is computed, not scripted: areas are counted pixels,
the dimension slope is a least-squares fit of real box counts, the tube shape
comes from second moments of the wave field, and the blowup ratio is a
pixel-count quotient.

## Development

```bash
npm install
npm test        # pure-math core tests (Perron areas, box counting, wave moments, finite-field solver)
npm run build   # bundles TypeScript + libraries + fonts into dist/kakeya-game.html
npm run dev     # watch mode
node scripts/drive.mjs  # headless-Chrome playthrough of all levels (needs Chrome)
```

Architecture: pure math core in `src/core/` (no DOM), canvas/DOM shells per
level in `src/levels/`, one shared pixel-counting instrument in `src/paint.ts`.
`scripts/tune-*.ts` are the numeric experiments that fixed the construction
parameters and win thresholds.
