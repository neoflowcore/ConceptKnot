# ConceptKnot v15 — PDF handwriting, cursor newline, night-mode audit and smooth navigation

Date: 2026-10-29. Design-taste app-screen rule: motion is feedback, not a promotional entrance. The 3D garden remains the unchanged persistent substrate.

Changes
1. Remove extra Pomodoro explanation from popup. The timer's controls and persistent deadline remain.
2. Fix Return/Enter in chalk notes by measuring a 0-width inline DOM probe **after** each newline span, not by using a zero-height collapsed Range rect and falling back to the first row. Normalize split text after measuring. Textarea/mirror font metrics remain equal. Keep Hangul IME and 12–36px selection.
3. Night mode: darken all functional cards, including bright memory scenes, quiz question and options, stats, subject selectors, exam OMR, and PDF UI. Text follows contrast. Paper PDF render itself remains true white.
4. Navigation: remove old 650ms ck4-changing class and non-home staggered card reveal, keep 3D garden alive, capture only the study stage with 105ms fade-out + 190ms fade-in. Reduce motion on user preference.
5. Exam sheet: remove the redundant separate `inkPad(exam-...)` area. Official transcribed question is immediately followed by OMR in right column.
6. Original PDF: replace cross-origin iframe as the primary view with PDF.js 6.3.289 canvas and an S Pen layer, page navigation, 50–450% zoom, Ctrl+wheel, pinch, double-click, double-click+vertical drag, hand pan, pen, eraser, undo/redo and local annotation persistence keyed by source/year/page. Annotated PDF export uses pdf-lib 1.17.1, preserving underlying PDF text when source bytes load. Do not upload the source to a backend.
7. Remote PDF *may refuse cross-origin access*; on error, the existing embedded native PDF and original open/download links remain. User-selected downloaded PDF enables editable PDF.js rendering. The first PDF.js load and annotated export require CDN connectivity; browser/offline old PDF fallback does not yield per-page annotation. Saved annotations are keyed to the selected file and year; loaded PDFs themselves are not persisted across reload.
8. No GitHub Actions automatic CI, installer, archive builds or automatic Vercel Git deployment.

QA
- Node test: node --test tests/study-v15-pdf-ink.test.cjs
- Other regression tests: ai-companion-native-link.test.cjs, study-v14-polish.test.cjs, ui-compact-glass-v13.cjs, home-minimal-v5.cjs.
- For real Chrome/Brave: test Enter, Hangul text at 12/18/36px; night theme on visual+typing+exam; local PDF upload, pen/pinch/zoom and annotated PDF download. Full browser UI verification requires an actual browser with CDN access.
