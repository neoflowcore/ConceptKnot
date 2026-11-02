# ConceptKnot v85 — Integrity repair batch

Base commit: 4d9c8b566dea3681e90821db22bc9f0e000c88c5.

## Corrected
- Official 80-question mock: clear a marked answer to `null` instead of `Number(null) === 0`. Time expiry now blocks navigation and review-flag writes and manual submit is recorded as timed-out if deadline already passed.
- Exam store: revision-checked writes prevent overwriting a change observed from another tab. Corrupt JSON is read-only until repaired and its raw source can be exported; no silent empty overwrite. A same-instant simultaneous race remains possible with localStorage (not transactional).
- Personal multiple-concept editor: selected links persist while searching/filtered checkboxes are rerendered, including manually chosen candidate links not currently visible.
- Personal calendar: sessionMinutes now affects displayed focus-set counts, countdown stage is calculated per scheduled date, and shortened fatigue days count actual learning days.
- Personal OCR material editor: in-progress title, text, personal note and linked official ID are retained in local component state while UI reconstructs; selecting a different source clears prior note and reference.
- Service worker version bump to invalidate stale HTML/module cache. Existing official 800-question source and final answer keys unchanged.
- No automatic Vercel deployment or GitHub workflows.

## Test scope
- Runtime mock tests: answer selection and clearing, stored nullable answer, score of accepted-all special question, submission history, revision conflict rejection and corrupted storage write protection.
- JavaScript syntax verified for updated exam / concept links / planner / material scripts.
- Full browser or Android Brave/S Pen/TTS performance tests **not** run; user must manually test after explicit deployment. Design-image similarity not measured.
