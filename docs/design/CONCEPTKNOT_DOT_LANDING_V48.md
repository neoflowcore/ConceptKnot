# ConceptKnot Dot Landing v48 — Reactive Cloud Notes

## 2026-10-30 change scope

This increment preserves the v47 pointillist cubs, baby owl and three-colored apples and implements the two pending cloud and motion requests plus three decorative dotted musical notes.

### Implemented

- **SCROLL DOWN:** Entire button gently floats up/down by 4px on a 2.9-second CSS animation, maintaining horizontal centering and keyboard accessibility. Its motion pauses immediately on non-landing tabs and obeys `prefers-reduced-motion`.
- **Owl/fruit alignment:** Lowers the owl-and-perch rig from SVG Y=503 to Y=596. The headbutt target is now the lower inner orbit at approximately (670, 563), with an eased sideways forehead nudge/tilt and a 2px response of the contacted colored apple. Cooldown keeps repeated attempts separated.
- **One large cumulus + two small dot clouds:** The large organically outlined raster cumulus stays unchanged. Two new lightweight pre-rendered SVG dot clouds move left-to-right independently and wrap without duplicates. Both sit below the cumulus at two different vertical offsets.
- **Reactive cumulus bottom:** The original alpha silhouette is sampled once during asset preparation. Exactly 66 additional boundary dots are placed near its bottom and are displaced at most about 12px upward as the lower clouds pass beneath; all original stipple remains static. No SVG filters or image-wide warp.
- **Three pointillist music notes:** Three small decorative note shapes appear on the lawn in the open spaces beside the cubs. Their points are split deterministically into a permanent base and a movable **upper ~20%**. Only these upper point groups shift 1–4px in rhythm with the passing clouds. This is visual only; no sound is played.

### Performance / accessibility

- One existing 24-FPS capped RAF clock updates 2 mini-cloud groups, 66 rim dots and 3 top-note groups; it does **not** animate thousands of source dots or redraw the backdrop.
- All background activity freezes outside the landing tab, when the tab is hidden/unfocused, and when reduced motion is requested.
- No WebGL. No GitHub Actions. No EXE/APK/ZIP artifacts.

### Files

- `assets/ck-dot-landing-v48.js` and `.css` — new versioned renderer and animation styles.
- `assets/ck-garden-25d-v36.js` — v48 bootstrap (legacy fallback only).
- `sw.js` — new cache name and v48 module/CSS pre-cache entries.
- `tests/dot-landing-v48.test.cjs` — static and JavaScript DOM clock tests for cloud positions, 3 notes, collision attempts and study-tab stop/resume.

### Release criteria

1. `node --check assets/ck-dot-landing-v48.js` passes.
2. `node tests/dot-landing-v48.test.cjs` passes.
3. Commit all changes together, then create one manual Vercel production deployment for the exact new SHA.
4. Verify READY state, commit SHA, production alias, build logs and recent runtime errors.
5. Browser screenshots/animation and mobile GPU behavior require manual real-device confirmation if a browser-interaction session is unavailable.
