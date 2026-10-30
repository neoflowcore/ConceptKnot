# ConceptKnot Dot Landing v50 — seamless cloud wrap + soft ground dot transition

## Baseline and rollback snapshot

- Pre-change GitHub main: `1091387b6721134921c5d4d37204f589edacfd7f` (v49).
- Backup branch created **before editing**: `backup/dot-v49-before-cloud-loop-20261030`.
- Last verified pre-change Vercel production deployment: `dpl_81qMrb9RjVXdDQ7Djit73TP6u7mn` (`conceptknot-k3fwbggir-neoflowcores-projects.vercel.app`).
- Rollback option: redeploy the backup branch SHA to production, or restore that saved Vercel production deployment. No force-push is needed.

## Changes

### Two small stippled clouds (same shapes and speeds)
- Measure the visible landing viewport in the main cloud's 1244-unit SVG coordinate system via `getBoundingClientRect()` on layout/resizes, not every animation frame.
- Travel to beyond the screen's right edge (plus a safety margin) before recycling to entirely beyond the left edge.
- Introduce a smooth opacity ramp in/out as a cloud's dots enter and leave the viewport, avoiding the former on-screen jump.
- Retain the fixed large cumulus and the v49 local reactive dots / RGB effect unchanged.

### Stipple-to-lawn transition
- In the one-time `garden-clean-v37.webp` raster-to-dot pass, preserve full-size dots above 52% image height.
- Between 52% and 76%, smoothly shrink dot radius from 100% to 1% of its normal size; reduce opacity over the same interval.
- Transition only the static background; do not alter the lion cubs, owl, apples, music notes, rails, or green/yellow/red fruits.

## Performance / lifecycle
- No WebGL or added animation loops; remains at max 24 FPS on landing only.
- Two group transforms and two opacity writes per frame for the drifting small clouds.
- In study views or when hidden/unfocused/reduced-motion: stop the scene clock as before.
- Service worker cache version incremented to avoid stale JS/CSS.

## Verification
- `node --check assets/ck-dot-landing-v50.js`.
- `node tests/dot-landing-v50.test.cjs` — includes 4 viewport widths, two cloud velocities, a full 250-second scene simulation and seamless wrap asserts.
- Legacy `dot-landing-v49` contract can still be run from its independent original file.
- Browser screenshot validation is not available in this environment: Chromium blocks even local page navigation.

## Release policy
- Group all work into one main commit with `[skip ci]` and deploy that exact SHA once to Vercel production.
- GitHub Actions and installation/ZIP artifacts are NOT run.
