# ConceptKnot Dot v52 — upper foreground restoration

- Starting point: v50 original dot scene (cubs, line lawn, flowers, notes, owl, rail, clouds, scroll).
- Do not render full-color-derived garden background raster, which leaves dot noise in the empty area.
- Restore both original high-resolution pointillist cubs, eye blink frames, lawn, 3 flowers and notes.
- Shift the lawn visually upward; fade it smoothly away around 82% of viewport height.
- Lift and slightly resize cubs so they sit in the *upper half* of the original bottom scene without clipping.
- Keep the lower section as blank white space except for the floating SCROLL DOWN control.
- Preserve navigation behavior, looping clouds, orbit, owl, home-only animation, 24fps cap and accessibility settings.
- Restore points: `backup/dot-v50-before-blank-foreground-20261030` (v50), and `backup/dot-v51-before-upper-lawn-restore-20261030` (v51).
