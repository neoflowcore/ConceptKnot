# 3D study environment v6

- Real Three.js geometries: pencil, notebook with spiral loops, flip memo, magnifier, ruler, colored cubes, seesaw, striped balls.
- Seesaw's 0.72m ball moves across the plank and rotates proportionally to distance. Independent blue grass ball rolls back and forth at a different speed while following terrain height.
- Trees: reduced from 44 to 16, all planted toward the edges (center valley reserved for study objects).
- Saturated ground brush variation, colored props and clay clearcoat. No third-party 3D image assets copied.
- Updates occur inside the existing requestAnimationFrame; animation pauses when focused on note editing and on hidden tabs; reduced-motion/WebGL fallback uses an original SVG plus a CSS rolling ball.
- Three.js is already vendored locally; no new runtime network dependency.
