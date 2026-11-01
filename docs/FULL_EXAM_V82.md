# ConceptKnot v82 — Integrated official exam practice
Baseline: `c0ad4bfe8ee4677f5eb872ece53c8574fd1bd756`

## Completed source
- One self-contained exam on existing mock tab: 80 official A-form questions (40+40), 100-minute countdown, 1–5 key input, OMR 80-click navigation, review flags, blanks, answer clearing and immediate browser-local persistence.
- Exit / resume / explicit pause with remaining time, background elapsed-time deadline check on restore, auto submission on expiration.
- Manual submit confirmation, score split, 40-point per-subject and 60 average condition, 20-attempt local history, post-exam wrong and unanswered navigation.
- 2016–2025 selector; checks all 80 official records, 5 options and accepted answers prior to starting.
- Keeps canonical official answer keys unchanged; multiple-accepted options accepted, all-accepted graded only on marked responses. No unverified explanations or pass guarantee.
- Separate `ck82-exam-sessions-v1` persistent record and `CK82FullExam` status facade. No server, paid API or install build required.
- Responsive light/dark inherited design, reduced-motion, no extra home background GPU loops.
- Script/style wired in index and service-worker cache v82.
- Does not alter existing per-subject shuffled/inverted practice sets, memo, typing or voice.

## Caveats
- Pause/resume is a practice feature, not an actual uninterrupted licensing examination. Pauses are counted and disclosed.
- Timed practice does not force full-screen or background activity restriction. Tab switching with running session still counts wall-clock time.
- Exam official source OCR may contain figure/table transcription discrepancies. Always compare Q-Net paper when diagrams are involved.
- Exam session persists separately in localStorage. Cross-browser migration of this key not yet integrated with previous generic learning backup; keep the browser profile unless exported separately.
- Official legal and option-level explanations 0 reviewed. No score should be interpreted as an official qualification notice.
- Browser, Android/Brave, SPen and speech need physical manual checks later. No auto Vercel push build, Actions, artifacts or production deploy.
