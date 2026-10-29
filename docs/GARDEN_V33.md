# Garden v33 implementation — 2026-10-30

Approved scope: real Three.js geometry only, no new generated concept images or search modal. Keep existing rail path, study machine, pencil, checklist and scene activity lifecycle.

Implemented:
- Shared golden lion face palette and geometry: round baby face, large glossy eyes, eye highlights, brows, cream muzzle, triangular nose, cheek freckles, short tufts, paw pads, subtle procedural surface bump. Main cub retains 3.6-second pencil replay; younger sibling shares face geometry and sleeps with gentle breathing on creased, flattened cardboard.
- Six red/green/yellow apples follow the existing closed rail, with stems and leaves; original book replaced with a sisal cat tower in the same footprint.
- Azure blue baby bird at original perch; two apple trees in place of two foreground conifers.
- White/neutral cloud materials, blue atmospheric fog, neutral daylight, brighter spring grass. Cloud drift 0.48–0.70 world units/sec left to right. New stock saturation/brightness 110%/102%, custom user settings preserved.
- Taller landing surface (minimum 820px desktop / 760px narrow). Foreground siblings fit against visible viewport, not the full minimum-height canvas, with a reserved 68px below main cub. Main cub replay hitbox and scroll button follow the projected bounds.
- Two 3D render passes with the same camera and lights protect foreground characters from terrain occlusion. The existing single activity loop, 24fps cap, hidden-tab/learning-tab suspension remain.

Validation:
- Real Three.js constructors generate 271 character/machine meshes, 160,608 triangles; vertex values and 100 animation steps checked.
- Projected main-cub bounds checked at 1440x900, 1920x1080, 1280x600, 768x1024, 390x844, 360x640: no viewport clipping; 48px+ below cub.
- Display default migration and existing typing/docking regression checks run locally; no Actions or installers.
- Browser preview loaded; cloud browser WebGL is disabled (GL_RENDERER Disabled / context creation failure). Actual shaded WebGL appearance, shadows, contact quality and 99% visual similarity are NOT verified. The generated reference is an art target, not a numerical visual match claim.

Remaining: inspect actual WebGL output on a GPU-enabled browser and refine silhouette/texture/light against approved character reference. Current implementation is procedural modeled geometry, not a downloaded production sculpt or fur simulation.
