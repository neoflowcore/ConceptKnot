# ConceptKnot v81: P4 review workbench (2026-11-02)

Base commit: c05c3c914982f65521d14bc5ce8696407bdaf5b1.

## Implemented

- 2021–2025 400 official A-form questions, with year/subject review matrix.
- Browse with year/subject/stage filters, search in questions and five options, priority and progress sorting, and 20-record pagination.
- Show official explanation status distinctly from personal drafts; incomplete explanation draft field checklist (8 entries: easy summary, answer rationale, evidence and five independent option reasons).
- Personal status: backlog, researching, on hold, ready for personal cross-check. Bookmarks and review progress live under isolated `ck81-review-workbench-v1` localStorage key. Never alters official answer key or published status.
- Spaced-review due and unresolved mistakes from CK79Study; official multi-/all-accepted answers flagged as grading statuses, not option truth.
- Open existing analysis modal and inline personal editor without duplicate editor, copy a question-specific verification prompt, CSV listing (spreadsheet formula injection guarded), versioned JSON export and validated JSON import with overlap confirmation.
- Mobile responsive controls and reduced-motion treatment, no extra animations on the home background.
- Page and service-worker version integration for cache busting.

## Safeguards and remaining work

- New personal workbench progress is a separate local key. **Use its own JSON export/import** for cross-device transfer. Existing personal explanation draft backup is separate. User progress is not an official verification.
- Earlier generic learning JSON backup does not yet automatically carry the v81 workbench key; do not assume it is included.
- Published source-reviewed explanations still 0/400, option truth verdicts source-reviewed 0/2000. Existing 32 drafts are not legal review or authoritative legal reasoning. No fabricated legal citations.
- No production deployment, GitHub Actions workflow, EXE/APK/ZIP generation or physical device testing. User must explicitly request manual production deployment or installation artifact.
- Manual check: light/dark, mobile 1-row navigation, open queue > filter > edit > save personal draft > return > refresh; CSV/JSON export-import; backup/restore; offline service-worker updates; all-accepted question; SPen and TTS are independent device checks.
