# UI restoration v32

Base: feed21f. Scope: six reported regressions.

- Ctrl alone exposes tab KeyTips even when a typing editor retains focus. Release Ctrl and type 1–13. Existing browser-reserved Ctrl+number combinations remain browser behavior.
- The display modal opens with study background presets and custom HEX/color selection visible.
- Pencil cub is larger and moves forward; the scroll cue stays near the viewport bottom in front of the scene. Existing single-scene and render suspension logic is preserved.
- Root cause: deferred ck-typing-layout-v31.js referenced lexical study-engine functions from outside their closure, throwing before its listeners were registered. Execute the extension inside that closure before first render; keep the standalone file as the canonical maintained copy. Tests compare the embedded copy.
- Enter/Space controls, answer jump, docking and collapse now register in the live engine scope. Added above-content docking; left/right swap and below docking preserve mounted input/pen nodes.
- Compact page status anchored bottom right. Service worker cache bumped; assets use network-first with offline fallback to prevent old JS/CSS from mixing with fresh HTML.

Validation: 18 focused Node checks passed, including deployed embedded extension events and input mapping. Browser extension connection unavailable; visual placement and real browser interaction remain unverified.

Progress: implementation 6/6 (100% of this repair scope); focused automated checks 18/18. This does not assert overall product or device verification completion. No GitHub Actions, installer, or ZIP build. Git automatic deployment remains disabled.
