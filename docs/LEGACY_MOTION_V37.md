# Legacy animation reuse in artwork scene — 2026-10-30

Scope: clouds, central apple rail and bird only. Approved 2.5D cub layers retained.

- Reuse the exact eleven control points, closed centripetal CatmullRom curve (tension .46), original camera projection and equal-world-arc sampling from ck-kinetic-garden-v8.js. 721 samples normalized to existing artwork rail footprint. Orbit restored from 19s to original 17s; apple axial movement follows original .45 rad/sec timing.
- Reuse the 0.62s sin(pi*t)^1.1 peck envelope, 1.15s cooldown, distance enter/exit hysteresis and 9.3 smoothing response from ck-landscape3d.js. Reaction thresholds are mapped to artwork coordinates. Bird image head and lower body use separate SVG clipping layers. This ports animation logic, not a literal WebGL renderer.
- Clouds reuse five-puff proportions and sin(j*.83) vertical profile, independently shaded white/gray puffs, slow left-to-right movement on the shared scene clock.
- Clean background removes baked rail and bird; separate SVG rail and transparent bird avoid duplicates. Existing grass/trees/cat tower/pencil/checklist and cub assets remain in the composite.
- No permanent extra loop: six apples, clouds and bird share the existing 24fps capped loop. All freeze in study views/hidden/blur/reduced-motion.

Validation: legacy path closure/finite samples and bird reaction-zone reachability; browser screenshot and actual layer movement; study-tab suspend and home-resume checks. No search/typing/TTS features included in this narrow change.
