# ConceptKnot v19 — 2026-10-29

## Scope
- Dark theme audit: PDF paper night-view (display only, original PDF/export untouched), bottom-right page switcher, quiz number buttons, reverse question list, concepts and hidden-answer panel, speech/neural voice settings and rate buttons, final-page note and analog clock.
- PDF auto-follow dark mode, moon/sun toggle in the PDF toolbar. Shift-click restores automatic mode. Stored under ck19-pdf-view.
- Pomodoro training sets: configurable 1–5 sets, each independent focus (5–180 min) and rest (1–60 min); last set ends after focus with no unnecessary final break; automatic transition and background elapsed-time catch-up; pause/resume, reset, manual stop; regular single timer stays usable.
- Keyboard: Alt triggers number badges, 1–9 or 10–13 by quick digits; F2 fallback to show keytips. Ctrl+Z and Ctrl+X navigate typing questions. Ctrl+WASD spatially moves focus across controls; Alt+Shift+WASD fallback because some Ctrl combinations are browser-reserved. Ctrl+Enter triggers focused control. Escape closes keytips.
- Client source only; no actions, install packages, build artifacts or auto deployment. Service Worker version advances to v19.

## Verification
- Static JS parsing confirmed for all 13 inline scripts plus new JS.
- Logic checks for 3x set sequence, 5-set cap, background time catch-up, regular timer, PDF night-state toggles, Alt keytip routing, Ctrl+Z/X navigation passed.
- User must manually verify the following in an actual deployed browser: PDF dark and annotations, CSS specificity, keyboard browser conflicts, and timer visibility across tabs. Existing app remains manually deployed.
- Git auto-deploy: disabled in vercel.json; workflows not added.

## Follow-up test
1. Deploy manually only on explicit user request; hard refresh and ensure v19 SW activation.
2. Toggle dark theme and open PDF: dark reading mode starts; click PDF moon button to revert to white; verify saved annotations unaffected.
3. Inspect all screenshot locations, quiz numbers, reverse list, voice card, analog clock and pager.
4. Configure 3 sets 50/5, 40/10, 30/5; start, pause/resume, skip and test auto transition with short values; final focus must terminate without a rest.
5. Alt then 2; Alt then 1,2 quickly; Ctrl+Z/X in typing; Ctrl+W/A/S/D or Alt+Shift+WASD; focus outline and Ctrl+Enter.
