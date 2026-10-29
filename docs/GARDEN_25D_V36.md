# Approved artwork 2.5D transition — 2026-10-30

Replaces the active WebGL scene with a clean artwork background, separate transparent full-detail lion siblings, CSS breathing/replay movement, independent moving cloud layers, and six SVG apples following the background rail. Existing study screens and keyboard workflows retained.

Production assets derived from approved scene via image edit: taller 1536x1024 clean plate (no lions/clouds/rail apples), happy cub with red pencil alpha cutout, sleeping sibling/cardboard alpha cutout. WebP assets total approximately 1.03MB. Faces/fur/paws retain rich baked lighting; no vector face substitution.

Motion: gentle whole-character breathing; clicking main cub replays subtle squash/tilt. Cloud drift and 19-second apple orbit. Pencil/limbs/eyelids are NOT individually rigged in this initial transition. Bird/cat tower/trees/flowers are baked into the clean plate.

Lifecycle: one 24fps-capped apple loop on landing only; CSS animation paused in study tabs, blur, hidden document, reduced-motion. No WebGL canvas or Three.js import. Home return recomputes visible height; hidden host does not overwrite responsive dimensions with zero.

Browser verification: actual composed scene screenshot inspected, all three assets loaded; main cub click replays; typing tab suspends animation and display; home restores animation and cub dimensions (380px/420px at desktop viewport). No application console errors observed. Desktop browser visual verification complete; mobile real-device inspection pending.

No new search modal. No GitHub Actions, installer or ZIP.
