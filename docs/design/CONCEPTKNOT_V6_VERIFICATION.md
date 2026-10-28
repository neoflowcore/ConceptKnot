# ConceptKnot v6 release smoke checklist

Run `node tests/workspace-v6.cjs` for source integrity, or `python tests/workspace-v6-smoke.py` for optional manual browser UI.

Expected:
- Header and workspace stage have equal outer gutters, across desktop viewports.
- Left note and right study content have subtle 1px borders and gentle transparent glass.
- Slim vertical drag handle changes note width; a small circular button immediately below swaps panels without losing live typing or pen input.
- Swap preference persists through tab navigation/reload; reverse direction drag is natural.
- Mobile changes the vertical order; reduced-motion suppresses FLIP transition.
- 3D hill scene has 16 edge trees, school stationery, an oscillating seesaw with rolling ball and a blue ball rolling over the terrain, and focuses stop motion.
- Low-power/reduced-motion mode sees the original fallback props artwork.
- Deployment via manual Vercel integration. No new .github workflows or installation artifacts.
