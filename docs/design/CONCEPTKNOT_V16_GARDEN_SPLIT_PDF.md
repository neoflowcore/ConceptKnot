# ConceptKnot v16 — garden / cards, responsive split controls, 3D pencil lion, official PDF access

## Implementation
- Separate `landing` garden route from `home` Today's Learning cards. CONCEPTKNOT wordmark opens garden-only. Today header displays actual learning widgets immediately. Scroll down on the landing scene or click Today to move into cards. Previously stored learning progress is unchanged; fresh profiles start in the garden.
- The procedural Three.js scene retains the resting cub, adds a second awake baby lion on the foreground left, holding and repeatedly pressing an original 3D short **red** pencil pointed down (~2.65s rhythm). No illustration overlay or replacement canvas.
- Transition on navigation: no old ViewTransition duplicated background. Full study stage enters with one 0.52s upward 69px fade over a fixed blurred Gaussian translucent sheet; 3D background remains mounted. Reduced-motion supported.
- Generic 2-card grid splitter (exam PDF/OMR, dashboard, theory, settings, compact, quiz where two cards are actually side-by-side). Thin white/gray line and grip, pointer/touch drag, arrow keys, double-click reset, per-tab localStorage persistence. One-column mobile stacks remain.
- CORS: original public 2016–2025 paper URLs are mapped by **ten fixed** Vercel external-origin rewrites `/exam-pdf/YYYY`, same-origin to PDF.js. No arbitrary URL input, no open SSRF proxy, no function compute. Native official PDF iframe and local-PDF upload stay as fallbacks. Rewrites can still fail if upstream blocks proxy access, returns HTML or redirects. Do not claim browser access is guaranteed before a real request succeeds.
- No automatic Vercel Git deployment, no GitHub Actions CI or install artifacts.

## Manual verification checklist
1. Logo shows garden only and two cubs; second cub presses downward red pencil. Today tab shows cards without first-fold cover.
2. Clicking any tab animates card sheet up smoothly; reduced-motion disables it.
3. Exam grid drag divider and arrow keys persist widths, PDF pen and OMR remain separate; dashboard and theory 2-card screens also resize.
4. Test GET `https://conceptknot.vercel.app/exam-pdf/2016` content-type and PDF signature; if upstream blocks, choose a locally downloaded PDF from upload field.
5. Confirm original 2016–2025 PDF references and source attribution remain; no arbitrary proxy.
