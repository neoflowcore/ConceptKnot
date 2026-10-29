# ConceptKnot v21 · 2026-10-29

## Design effects decision (Clay.com / Inspora reference)
- Keep existing rounded header and glass study surface.
- Eliminate restart/show-hide background animation on navigation. Change data-ck-v8-tab **before** DOM content render.
- Learn views: WebGL loop canceled; backing render buffer reduced to 1x1, shader canvas hidden; ambient SVG and all its WAAPI/CSS animation paused.
- Simple <200 ms opacity fade on study sheet instead of multiple 3D/background transitions. Respect reduced-motion.
- Charts animate only following explicit learner click, without any perpetual rAF. Pomodoro clock and deliberate S Pen interaction are not disabled as they are functional.

## Change inventory
1. GPU: 3D lowered DPR, antialias off, buffer 1x1 when paused, hidden study background, synchronized scene state.
2. Calculation tab: previous six problems plus 10 chart-related problems (demand along vs shift, supply, simultaneous changes, elasticity, price ceiling, stock/flow, PV, capitalization, cobweb).
3. Compare diagrams and charts: 17 dedicated SVG explanatory scenes; manually trigger one-shot transitions. User can return to linked official exam year/number.
4. 2016–2020 OCR: current source supports PDF links plus OCR-extracted TXT/MD import and human confirmation; **five missing years' full paper transcription is not complete**. Never claim 800 verified official questions until text/OCR QA done.
5. Recent five-year five sets: retain 5×80 question sets with shuffled choices and introduce 5×80 answer-acceptance judgement variants. Wording deliberately asks whether a choice was an *officially accepted answer*, not whether every statement is universally true. Multiple answers preserved.
6. Brand: reduced top-left font and original sky-blue / coral knot SVG.
7. Transition: update route before render; avoid abrupt scenic image first render; no motion stacking.
8. Mobile board: all tool controls on one horizontal scrolling row, S Pen pen/highlighter/eraser/width swap into the same bar (no extra toolbar). TXT/PDF icons beside note title, board height grip at bottom right, persisted local height.
9. Stylus: disable touch panning within writing area while S Pen is active, set touch-action:none on board writing surface, cancel touchmove while drawing. Actual device palm rejection requires Android+Samsung device QA.
10. Export: TXT and print-PDF contain memo heading and written date; suggested filename is memo-title_YYYY-MM-DD_ConceptKnot. Browser print dialog may control the PDF's final filename.
11. Mobile menu: single horizontally scrollable row with fixed no-wrap tabs.

## Static verification
- 19 inline scripts parsed. New chart/gpu/quiz scripts parsed.
- 17 charts + 10 exercises present.
- Five sets × 2 subjects × 40 = 400 questions for each of two variants; answer mapping tested, 0 errors.
- Browser/GPU hardware smoke and mobile stylus scroll behavior NOT yet verified.
- No GitHub Actions, no EXE/APK/ZIP. Git deployment toggle remains off.

## Manual QA
1. Compare GPU 3D chart on landing vs any study tab using browser performance panel. window.CK21Garden.getState() and window.CK3DPerformance.getState() should report suspended.
2. Switch study tabs and ensure scenery never flashes in the middle.
3. Compare graphs: demand price-along vs demand shift, supply curve, equilibrium; curves move once on click and remain stationary otherwise.
4. Narrow board and mobile 390px: one-row tabs and tools; S Pen writing must not scroll page; grip changes height.
5. Save TXT and print PDF and check title/date; keep local notes.
6. Five sets practice: switch shuffled vs answer-recognition mode and select opposite answer values. Do not present recognition as new independently written exam questions.
7. 2016–2020 official papers: until scanned text and final answer sheets are manually checked, treat them as PDF/TXT import rather than fully verified structure.
