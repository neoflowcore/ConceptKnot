# ConceptKnot v8 · Central kinetic garden — release notes (2026-10-28)

## From the two screenshot references
- Existing scene has too much clear sky/grass in the center: previous objects were scattered to side coordinates and two balls oscillated independently.
- New centered original geometric contraption uses a closed blue track, grassy ring with recessed hole, funnel, hinged textbook, rotating-pencil, notebook and ascending chart. Six desktop balls and four mobile balls run continuously, each 1/n lap apart, with a repeatable 17-second motion clock. Book, pencil and bar chart animate from the same lap phase.
- Central blue bird now perches around x=-3.4,z=-16.7 instead of the old far-left x=-20.5, with bounded bob and mouse tracking.
- Trees are 14 conical faceted evergreens with a yellow hexagonal pencil trunk, copper ferrule and pointed graphite base. They frame the sides.
- Increase paint-like contrast via tiered tree light/shade vertex colors, deeper green field variation, a warm directional sun and less flat ambient lighting.
- Low-memory/no-WebGL fallback contains a different original SVG with a center blue continuous track and a CSS looping ball, reduced-motion safe.
- No third-party Clay images/models/code. Reference is only stylistic: toy-like educational motion, color and composition.

## Constraints and verification
- Changes touch only the scenery modules, fallback assets, service worker, test and this documentation. Learning answers, notes, S Pen and UI interactions are unchanged.
- No GitHub Actions, EXE/APK/ZIP builds or third-party runtime dependencies.
- JavaScript source parses and the new 3D module was manually exercised with a fake Three.js scene: the six balls move at t=8.5 seconds and return to the same positions at t=17 seconds; four balls are used for mobile.
- Physical GPU browser checks remain necessary for shadows, responsive framing and battery usage.
