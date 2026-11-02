# ConceptKnot v84: personalized calendar and personal learning materials
Base: dc5aeac7c09a02903af2a436076c89ce33dff7ea

## Added
- Exam-date aware rolling learning calendar with daily time (30–600m), 20–80% estate weighting, recurring rest weekdays and up to 100 holidays. Estimated allocation includes pending recall, practice questions and reading time. Time zone Asia/Seoul.
- PDF text extraction via the existing pdfjs version, up to 12 pages per selected file. OCR is explicit opt-in through Tesseract.js 5 and Korean/English model, up to 8 PDF pages or one image. There is no upload of document bytes to a proprietary app backend. CDN runtime/model retrieval requires connectivity.
- Editable extracted text, paginated question and 5-choice candidate preview with warnings, 35 personal material entries (45,000 chars each, 600,000 chars combined), optional official question cross-reference, local search, JSON export and import.
- Revision-checked local material writes detect another tab's stored revision (not a transactional atomic compare-and-swap; concurrent simultaneous writes still need manual test).
- Both local data keys included in existing study JSON backup. Validation on restore; legacy backups without them stay supported.
- CSS responsive styling inherited from active light/dark/wood-brown theme. No home animation or GPU overhead from new panels at rest.
- Cache revision v84; repository has no Actions workflows and Vercel deploymentEnabled remains false.

## Data and caveats
- Registered official 800 original items, final answers and official rationales are untouched.
- No OCR answer is marked correct, no source review automatically granted; manuscripts, scanned math and two-column pages require human verification.
- OCR language/model download may be blocked by CORS/network/CSP; direct text mode and paste remains available.
- PDF original binaries are never persisted by the new material module; locally edited extracted text is stored under ck84-personal-materials-v1.
- Plan is an allocation heuristic, not a guarantee of exam performance.
- 32 recent-year explanation drafts / 400; source-reviewed published explanations 0; source-verified option verdicts 0/2000.
- Physical device, Android Brave, S Pen, voice, offline and exact design match NOT independently measured.

## Suggested final one-pass manual check
1. Plan: set exam date 2026-11-20, 180 minutes per day and Wednesdays off. Confirm number of scheduled study days and D-day.
2. Plan: save/refresh, switch 7/14/30 days, open source question and export TXT.
3. Materials: paste TXT, parse question + five choices, manually fix warning, save note with 2025-1 link, reload.
4. Materials: PDF text mode, Korean scanned PDF OCR after opting into model download, image OCR, abort, unsupported file and 25MB limits.
5. Search local material and official keywords, export/import JSON, validate malformed import rejection.
6. Whole-study backup and restore, including v81 review, v82 exam, v83 concept links and v84 plan/materials, in a clean browser profile.
7. Dark mode, narrow mobile single-line nav, typing cursor stability, S Pen eraser, PDF two-page view, TTS and home GPU stop policy.
