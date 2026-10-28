# ConceptKnot Design v5 — 2026-10-28

## Screenshot-driven corrections
- Reference: user screenshots of ConceptKnot and clay.com; reproduce close-to-edge header layout, not third-party code or graphics.
- Eliminate the blue strip above the navigation: top 0 and no main top padding.
- The navigation spans the width, with only 8 px horizontal gutters and a rounded lower silhouette; no empty 15 px band before the landscape.
- Remove the giant translucent intro card entirely, including generic headline, badge, explanatory paragraph and CTA buttons.
- Keep only `SCROLL TO EXPLORE` with its functional scroll arrow and bottom-right note `한 문제씩, 매일.`; remove other note copy.
- Notes must remain visible on mobile; keep app content and saved learning keys unchanged.
- Rebalance original Three.js terrain/foliage/sky colors to higher green-blue saturation, and reduce excessive scene exposure.
- Preserve pointer-reactive birds/trees, keyboard/mouse study, local autosave, TTS, S-Pen, typing and Q-Net data.

## Taste Skill v2
- Vendored **complete upstream skill and data/scripts** in `.agents/skills/design-taste-frontend` (source upstream revision 12af471f627f866411b4bd785b19646d3672784c).
- MIT license retained. It is for coding-agent design reviews, not browser runtime or a new dependency.
- Adapted its audit-first/no-template direction: one strong environmental visual, no marketing filler, clear active nav, short purposeful easing, less glass.

## Release policy and cache
- V5 filenames avoid previous service worker cache-first stale assets.
- New SW version claims clients after install; no automatic GitHub workflows are created.
- Existing `vercel.json` has `git.deploymentEnabled=false`; production is deployed manually once after code review.
- Manual sanity guard: `node tests/home-minimal-v5.cjs` (no CI invocation).

## Verification
- Source-level syntax/pattern checks: JavaScript parser + contract asserts. Full real-browser visual review remains a separate device check unless explicitly performed.
