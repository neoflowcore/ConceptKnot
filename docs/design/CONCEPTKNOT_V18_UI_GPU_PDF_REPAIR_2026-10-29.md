# ConceptKnot v18 UI/GPU/PDF repair — 2026-10-29

## Scope and baseline
Baseline main: 7ef78d1a8267f6e395ec6460a5352b3bb1c9e02b.
Handoff: 2026-10-29 ZIP, four groups (PDF spread, narrow panels, background GPU, dark theme) and six screenshots.

## Changes
- PDF spread: render two *real* PDF.js pages and separate right-page ink canvas, match responsive width, cancel stale raster work, sync toggle aria-pressed/labels, load-time preference, clean up child on page change. Detect HTML masquerading as a PDF and give an upload fallback. Paired navigation skips 2 and handles last odd page.
- 3D GPU: WebGL setup is deferred unless landing tab is active; every learning tab cancels requestAnimationFrame entirely, rather than slowing animation to 18%. Resumes only on landing and visible document. Reduce shadow cost, default GPU preference; study state hides WebGL canvas and pauses CSS ambient animations. Note the benefit is theoretical until hardware profiling.
- Resize: shrink main board from 132.5px to 86px and study column floor from 205px to 90px. Inner two-card splitter allows 5%-95% within 90px/65px practical minima; long headings wrap and panels allow min-width:0.
- Dark: additional surface rules for recall masks/concept lists, Supertonic/voice and speed controls, reverse queues, quiz number navigation, final A4 pages and buttons, and bottom-right pager. Light-gray text (#d8e2df) instead of pure white, while original PDF paper remains white for legibility.
- Offline: existing CSS/JS asset paths retained, GitHub Actions workflow not introduced, Vercel Git auto-deployment remains disabled.

## Status
Source updated; JS static syntax checks PASS (14 inline/asset scripts).
**Not yet browser/hardware verified.** No manual Vercel publish, Actions, EXE/APK/ZIP build, or release artifact during this work.

## Manual browser test (once deployed deliberately)
1. Hard reload website (Ctrl+Shift+R), ensure v18 CSS and JS served and Service Worker updated if needed.
2. Landing: check moving garden. Switch to any study tab: the 3D canvas becomes hidden, CK3DPerformance.getState().active === false (on window). Return landing: active === true, provided WebGL available.
3. Task Manager GPU 3D graph: compare idle study vs active landing (20s observation each); no claim of quantitative gain before measurement.
4. Official exam > PDF 보기 > two-page icon: actual 1+2 pages side-by-side, next 3+4, final odd page solitary; zoom, handwriting, undo, export. Remote PDF rewrite may return HTML/403—upload a local PDF to test actual 2-page viewer.
5. Drag workspace center handle: board 86px to maximum (right panel about 90px); drag inner divider: narrow either card; adjust at 1280px, 1920px, 940px, mobile.
6. Dark mode: verify clock/header, lower right pager, core theory recall panel, voice/speed including 2x, reverse list, quiz selection, final 1–5 page A4 editing, and PDF white paper.
7. Revisit tabs, ensure local notes, 400 registered official questions, and voice settings persist.

## Completion estimation policy
The previous phase ledger (2026-10-27) estimated MVP at ~66%. This UI patch does not finish outstanding 2016–2020 400-question registration nor prove test-device behavior. Avoid claiming 100% without content QA and manual verification.
