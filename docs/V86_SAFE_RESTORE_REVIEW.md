# ConceptKnot v86 — Guarded backup and exam review bridge

Base: 823b2cf5ce3be4ddc3fe93e626aae8ae3a33625b

## Implemented
- Full JSON backup import prevalidates main state and all included recognized extra localStorage keys before any write.
- Sequential localStorage writes with best-effort rollback of previously modified keys on failure; no reload or in-memory state replacement until success.
- Backward-compatible backup extras with per-module validators. Unknown extras are ignored, malformed recognized extras cause import refusal.
- Restored state only contains known defaults to avoid arbitrary imported field injection. Earlier backups lacking extra keys remain supported.
- v82 submitted official 80-item exam wrong and unanswered items appear in the existing review queue via v86 derived bridge; no change to the canonical answer key or unverified explanations.
- The bridge deduplicates repeated question IDs and defers entries where a scheduled future recall exists; marked recall continues to use CK83Recall.
- v86 static source and service worker cache version registered. GitHub Actions/automatic Vercel deployment remain disabled.

## Remaining risks
- localStorage updates across multiple keys are not atomic; rollback is best effort and can also fail under storage/quota errors.
- Mock review bridge only reflects up to 20 stored submitted attempts and does not write a permanent queue or resolve already-corrected historical attempts.
- Full handwritten/official-answer provenance, data migration on corrupted source, live browser/Android Brave/SPen/TTS and GPU measurement require manual testing.
- Prior format versions of the legacy main state may contain custom nested fields not exhaustively schema validated.
- Source-verified explanations / option verdicts must not be declared completed from generated drafts.

## One-pass verification
1. Export full current study record. Import valid backup and verify study state, exam history, concepts, notes, calendar and materials after reload.
2. Attempt malformed v82 or v84 extra in an edited backup; verify import is refused and existing storage unchanged.
3. Simulate localStorage quota failure in an isolated profile to observe partial-write rollback message and avoid trusting import.
4. Submit 80-item mock with wrong/blank answers; review queue should display derived entries once, not duplicate on repeated open.
5. Mark one due mock item as remembered and verify it disappears until next due time.
6. Run dark/light, mobile single-row navigation, IME, typing glass, PDF night + two-page, SPen, TTS, idle GPU in physical browser.
