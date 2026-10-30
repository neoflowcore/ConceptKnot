# ConceptKnot — monochrome dot spatial drawing (v46)

## Confirmed visual contract

- [x] The original landing composition remains recognizable (two lions, bird, orchard orbit, notebook and pencil).
- [x] Entire landing is converted to black/white pointillism, with sparse fine lines in the lawn.
- [x] Exactly **three** flowers are intentionally drawn in the new foreground; the photographic lower meadow is masked.
- [x] One **large cumulus cloud**, not multiple small ones, is drawn with static stippling and a small independent moving dot cluster.
- [x] The cub's **eyes only** blink and subtly track; the cub's body is stationary except when explicitly clicked to replay the pencil tap.
- [x] The bird's **head** nods/pecks towards an orbiting apple, while the perch stays fixed.
- [x] Six black-and-white stippled apples move on a shared closed orbit; the orbit itself stays still.
- [x] The cloud drifts gently; no full background image bobbing.
- [x] Artwork conversion uses canvas **only once per source image** to produce a static dot image. Continuous canvas redraw is forbidden.
- [x] The runtime uses one shared 24fps-capped requestAnimationFrame loop and zero WebGL render loops.
- [x] Leaving the landing tab, losing focus, hiding the document, or enabling reduced motion stops all motion.
- [x] Existing UI (PDF, chalk board, color picker, typing controls) is not changed.

## Engineering integration

- [x] New assets: `assets/ck-dot-landing-v1.js`, `assets/ck-dot-landing-v1.css`.
- [x] Landing bootstrap calls the new dot renderer and offers legacy fallback only on failed dynamic import.
- [x] New assets added to the service-worker cache; cache key rotated.
- [x] One focused Node regression test for the dot landing contract.
- [x] GitHub commit with `[skip ci]`; no Actions, installer, ZIP or automatic Vercel production deployment.

## Real-device verification (pending)

- [ ] Chrome/Brave desktop: verify responsive crop, three flowers and one cloud.
- [ ] Android: verify cub eyes and bird position after responsive scaling.
- [ ] Confirm GPU idle on study tabs with `CK3DPerformance.getState()` and `CK21Garden.getState()`.
- [ ] Inspect long-session memory and graphics performance on actual hardware.

## Design notes

The landing retains the existing source artwork through a deterministic black-dot rasterizer. New vector elements use the same monochrome visual language, keeping moving objects independent rather than animating a giant image. Every full-screen colored background and unnecessary duplicate foreground are excluded from the new renderer. The old implementation stays available only if the new module cannot load.