# ConceptKnot — Dot Landing v49: Eyes, Contours, Visible Notes & RGB Cloud Rhythm

Date: 2026-10-30

## Scope and fixes

- **Front lion's real eye registration:** Replaces the previous misaligned white SVG ellipse eyelids with a **352 × 342** lossless WebP closed-eyes frame derived from the EXACT approved open-eyed lion illustration. Both images use the same intrinsic geometry and CSS width. The blink switches the whole registered frame for a short double-blink; there are no giant oval masks or off-center ghost pupils. Only the eye regions were redrawn; lion, pencil, pose, ears and background transparency remain identical.
- **Tighter owl cut-out:** Replaces the v47 owl with a cleaner 149 × 173 lossless WebP image. Edge alpha is restricted around the actual dark stipple silhouette; the opaque white halo outside the owl is removed. The owl's face and high-quality detail remain intact, with the original headbutt loop and perch position.
- **ALL visible meadow curves are dots:** Replaces the 22 continuous hill contour paths and the top meadow curve with round-capped short-dash dot paths; also changes the fruit rail and the little owl perch to dotted curves. The field remains minimally drawn and all three flowers are retained.
- **TWO visible notes, one on each side:** The previous three lawn notes were often obscured by the cub artwork. They are now two independently positioned decorations (left of the awake cub, right of sleeping cub), placed at z-index 7 above the mascot images and anchored to the viewport edges to remain visible on narrow/mobile screens. Only 20% of each note's top dots move.
- **RGB music effect with drifting cloud contact:** Both small stipple clouds continue left-to-right infinitely beneath one main cumulus. As they pass, only 22 of the 66 reactive lower-rim dots momentarily pulse **red (#ef4348), green (#42bf67), or blue (#4384ee)** and shift upward. They return to black as the cloud passes. All original raster cumulus dots remain static; no full image warp, filter or WebGL.
- **SCROLL DOWN** maintains the gentle 4px float animation inherited from v48, and it stops outside the landing view.

## Performance and accessibility

- Animation updates remain on the existing single 24fps RAF, exclusively on the landing page while visible/focused and only when reduced-motion is not set.
- This release adds exactly one source-registered static closed-eye image and one alpha-trimmed owl. It does not launch any Actions job, create installation artifacts, or enable automatic deployment.
- `prefers-reduced-motion` and `.ck-dot-paused` also stop blinking, moving notes/clouds and button float.

## Changed files

- `assets/ck-dot-landing-v49.js`
- `assets/ck-dot-landing-v49.css`
- `assets/ck-dot-lion-closed-v49.webp`
- `assets/ck-dot-owl-tight-v49.webp`
- `tests/dot-landing-v49.test.cjs`
- `assets/ck-garden-25d-v36.js` (bootstrap only)
- `sw.js` (cache v49 and added assets)
- `docs/design/CONCEPTKNOT_DOT_LANDING_V49.md`

## Verification and deployment

- `node --check assets/ck-dot-landing-v49.js`
- `node tests/dot-landing-v49.test.cjs`
- RGB rim subset, sprite geometry and alpha trim validated locally.
- Chromium screenshot automation is blocked by the container network/browser policy; the user should examine the actual Vercel production page on desktop/mobile after deployment.
