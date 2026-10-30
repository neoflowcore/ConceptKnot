# ConceptKnot Dot Landing v53 — static study stage & retouched cubs

## Baseline, deployment policy and rollback
- Based on the production v50/light-paper restore commit `8b750c164984b495643a550c2419ce967e28a80e`.
- A backup branch is created before the `main` change.
- Manual Vercel Production deployment only. No Actions, no installer, no ZIP artifact.

## Implemented
1. During landing, the 24 FPS animation and original six apple orbit / two moving mini clouds / owl head-bump continue unchanged.
2. Leaving landing stops requestAnimationFrame and hides all DOM scene primitives; a single WebP still (`ck-dot-study-still-v53.webp`) is shown fixed behind the study UI. CSS overrides the legacy `display:none!important` rule. On return, the scene and animation resume.
3. Front smiling cub: the disconnected dark stippled tail is transparent-cleared (no white paint rectangle), the outer rim of the viewer-left ear is softened/repaired, and the viewer-right upper heavy patch is reduced while retaining its dotted inner ear. Closed-eye sprite was edited with exactly the same non-eye mask; 352x342 alignment preserved.
4. Sleeping cub: viewer-right ear stipple outline repaired with sparse dots. Original box/paws/body otherwise untouched.
5. Notes: three visible notes, two on the left side and one on the right. An RGB sweep travels left -> middle -> right -> middle -> left continuously. Only 20% of note dots are mutable SVG circles; the rest stay merged in one path to limit rendering cost. Other cloud RGB edge dots unchanged.
6. Reduced-motion support retained. All nonlanding animations paused, no live WebGL.

## Limits
- A static WebP picture replaces the animated landscape on study tabs; this minimizes animation-driven GPU work but cannot make the browser GPU usage literally zero because normal UI rendering still uses hardware acceleration.
- The frozen image is a pre-baked approved scene from the v50 screenshot, not a frame captured at the exact moment of navigation. This preserves responsiveness without a heavy DOM-to-canvas screenshot operation.

## Checks
- `node --test tests/dot-landing-v53.test.cjs`
- Real Chromium renderer assertions on 1440px desktop / 430px mobile: scene present, three music notes, active frames increase on landing, frames stable on study screen, still WebP displayed, main SVG scene hidden, resume on landing.
