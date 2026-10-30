# ConceptKnot — Dot Landing v47 (Owl & Cubs fidelity upgrade)

## Scope

- Replace the low-detail patterned bird with a **cute pointillist baby owl** from the approved visual reference; preserve perch and gentle fruit-peck motion.
- Replace crude on-the-fly grayscale/circle conversion of **both lion cubs** with precomposed high-density black-and-white halftone artwork, preserving the expressive eyes, fur, paws, pencil, box and black/white composition.
- Keep the **single organically lobed large cumulonimbus** cut out from the approved pointillist scene (no extra small clouds), with only a small cloud-dot group moving.
- Render six orbiting apples using **red, lime green and yellow dots** (two of each), with black contours, using the existing motion path.
- Keep exactly **three flowers**, line-based grass, background hillside, original scroll button and navigation.
- Keep independent eye blinking/glints (cubs and owl); do not animate every image dot. Only animate the owl rig, apple nodes, a small cloud dot group, lion eyelids and glints at capped 24 FPS.

## Architecture

- `assets/ck-dot-landing-v47.js`: scene, compositing, shared 24 fps clock, lifecycle and navigation.
- `assets/ck-dot-landing-v47.css`: isolated black/white artwork and responsive layout.
- `assets/ck-dot-lion-front-v47.webp` and `assets/ck-dot-lion-sleep-v47.webp`: alpha-masked grayscale dot art (no background rectangles).
- `assets/ck-dot-owl-v47.webp`: cropped, alpha-masked detail-preserving owl.
- `assets/ck-dot-cumulus-v47.webp`: single irregular scalloped stipple cumulonimbus, alpha mask without photographic sky.
- `assets/ck-garden-25d-v36.js`: loads v47 renderer and falls back to legacy artwork if import fails.
- `sw.js`: new cache scope; assets included, no Actions or installation artifacts.

## Verification

- JS syntax and static asset/lifecycle integration assertions run locally.
- Artwork cutouts inspected on transparent checkerboard before commit.
- Chromium executable in this container did not complete screenshot in time; actual browser/Android visual and performance checks remain unverified.

## Release policy

- One grouped GitHub commit `[skip ci]` (no Actions or install artifacts).
- Vercel Git auto deployment remains disabled; production deployment only when explicitly requested.
