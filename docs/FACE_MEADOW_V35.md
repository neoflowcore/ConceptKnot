# Face registration and meadow shading v35 — 2026-10-30

Scope: cub facial expression registration; harmonious grass/tree shading. Existing scene composition and responsive foreground anchors retained.

Face:
- Replace individually protruding eye/iris/muzzle/nose/mouth meshes with one authored 1024px SVG landmark atlas projected on a curved 3D face surface. No source reference image is pasted into the scene. Open and sleeping siblings share eye-center, nose and muzzle coordinates.
- Layered iris gradients, curved eyelid rims, cream muzzle gradients, cheek blush, freckles, nose highlight, smiling mouth and tongue. Short blink swaps the registered open/sleep face, preserving replay behavior.
- Existing ears, fur tufts, paws and articulated head/pencil remain real geometry. This is a 3D model with vector facial texturing.

Meadow/tree:
- Reduce abrupt leaf hue/luminance changes, use nearby greens. Reduce grass height and density from 36k to 24k (9.5k low-memory).
- Add per-blade darker bases and brighter tips; reduce high-frequency terrain color variation, apply broad low-contrast shade. Retain 3D flower petals and stems.

Validation:
- Both actual SVG face surfaces rendered in browser and visually inspected. SVG XML parsed; landmark symmetry and eye/nose/mouth order checked.
- Actual Three.js construction, animation and foreground projected bounds tested at six viewport sizes, plus existing regression checks.
- Full shaded WebGL scene cannot be visually verified in the current cloud browser (previous context creation failure). No claim of 100% reference similarity. Face atlas preview validates authored artwork, not final 3D shading.
- No imagegen/concept work, no installer, ZIP or GitHub Actions.
