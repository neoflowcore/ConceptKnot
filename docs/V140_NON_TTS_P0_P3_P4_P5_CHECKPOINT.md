# ConceptKnot v140 - TTS deferred, P0/P3/P4/P5 development checkpoint

- Date: 2026-11-08 (Asia/Seoul)
- Repo: https://github.com/neoflowcore/ConceptKnot
- Prior main: aa95c91331b1abeafc9f2943503840b05763b9ce
- Master plan: docs/INTEGRATED_LATE_STAGE_MASTER_PLAN_2026-11-08.md (ConceptKnot P0-P7 only)
- Decision: AI Korean voice is too slow and breaks mid-sentence; postpone TTS T0-T8 until nonvoice backlog is finished. No new AI model downloads or caching changes in this revision.
- Governance: one batch commit, no auto GitHub Actions or install artifacts. Canonical A-form questions, correct answer keys, and all private user notes/answers/OCR/typing records immutable.

## Code changes
1. P3 assets/ck-full-exam-v82.js: block flag toggling during paused and submitted states, matching the existing answer lock and UI-disabled button. Exam scoring and timer unchanged.
2. P5 assets/ck-mixed-review-v131.js: read-only merged weakness queue across CK129 five mixed A-form sets and CK82 official year-based integrated papers. Validate both store revisions, require no active unsubmitted paper, recalculate grades from canonical bank, merge wrong*5 + blank*3 + flag*1, expose source-specific submission stats and new trend labels. TXT export guards against changes to BOTH original storage keys.
3. P4 scripts/build-explanation-review-packets-v140.cjs: source-locked human legal review packets with all five official options, accepted answer rules, prior draft, sources, and explicit empty evidence/law-reference slots. CLI supports --year, --status, --limit, --offset, --json. Does not publish or fabricate legal reasoning.
4. P0 sw.js, index.html, assets/ck-data-diagnostics-v88.js: v140 file-query cache invalidation and v140 SW generation. Correct v139 diagnostic mismatch that still asked for diagnostics v137. Critical and minimum offline lists match exactly 11 files; 398MB AI model NOT in PWA essentials.
5. Tests: tests/v140-unified-official-weakness.test.cjs (7), tests/v140-explanation-packets.test.cjs (4), tests/v140-non-tts-release-guard.test.cjs (4). Old URL expectations in v131/v133/v134/check-release-readonly adjusted to v140.

## Evidence boundary
- Actual 2021-2025 explanation JSON: 400 records, 32 draft (8%), 368 unstarted, 0 verified/published, 0/2000 source-checked options; 7 recent 5-year special-answer records. Never confuse the 5-year 7 records with 10-year 8 all-accepted + 3 multiple-answer cases.
- Actual five JSON bundles tested with source-locked review-packet code: 400 linked, 32 drafts, 368 unstarted, 7 special, 400 need evidence, zero structural key mismatches.
- Fake-browser CK82+CK129 simulation: 1 official + 1 mixed submitted, sources counted separately, 152 distinct question IDs across two 80-question papers, priorities and subject counts reproduced. Not Windows/Android manual QA.
- SW CRITICAL versus diagnostic OFFLINE_MINIMUM: exact same 11 paths. Actual installed/offline browser check NOT_RUN.
- Full P0-P7 overall phase percentages, hardware pass rates, and design fidelity are NOT_MEASURED. Do not extrapolate completion from code presence.

## Remaining work before TTS
- P0 personal-data backup/restore in isolated browser profile and cached SW real-device verification.
- P2 Korean IME composition/caret, S Pen physical eraser button and touch auto-release, two-page PDF writing.
- P3 100-minute timer boundary, multi-answer/all-accepted score and pass threshold, OMR and numeric/Ctrl-arrow shortcuts device QA.
- P4 368 missing drafts require sourced research plus human review of 400 questions and 2000 options.
- P5 source-verified 800 concept tags, recall intervals, multi-session personal queue on real browser.
- P6 800-question search, 17 charts values/units/axes, OCR and editable formatting device QA.
- P7 final Windows/Android Brave evidence and production SHA check.
- TTS T0-T8 postponed: voice latency and mid-utterance breakup remain UNSOLVED; model cache and high-quality local neural speech NOT_COMPLETE.

## Manual verification
1. Download and inspect full personal study JSON, official CK82 and mixed CK129 results, PDF/S Pen and OCR backups BEFORE testing. Never delete site data.
2. Official 2025 practice: pick answer, pause and verify flag + answer locked; resume and verify enabled, 100min countdown, 40+40 subjects, threshold and saved history.
3. Submit a mixed 80-question paper; open Personal weakness review after official submission; verify both source counts, wrong/blank/flagged filters, original IDs, unchanged results.
4. Keep one exam unsubmitted and confirm answer-reveal in merged review is blocked. In a second tab update one result; verify stale TXT export is refused.
5. Verify v140 controller/11-of-11 critical files and optional mixed/review assets. Confirm offline only on actual Windows/Android Brave.
6. TTS AI still not solved; do not mark any audio playback PASS without audible output.

## Manual terminal gates only (no Actions)
node --test tests/v140-unified-official-weakness.test.cjs tests/v140-explanation-packets.test.cjs tests/v140-non-tts-release-guard.test.cjs
node scripts/build-explanation-review-packets-v140.cjs --year=2025 --status=unstarted --limit=5
node scripts/check-release-readonly.cjs

GitHub main SHA and Vercel production SHA are verified separately; browser use requires user-hardware evidence.
