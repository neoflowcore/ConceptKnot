# ConceptKnot v87 — review and local-data reliability
Base: 1801b3a736fc4da50ae511f03ef553263d2ea379

## Changes
- Exam-derived review uses the **latest submitted response per official question**, not a permanent union of all historical wrong answers. Newer correct responses supersede earlier wrong ones. Unanswered is still a due item. A future individual recall schedule takes precedence. No permanent duplicate writes.
- Support official accepted answers stored as strings or numbers when deriving recent results.
- 7/30 day analytics now handles string/number accepted answers identically and includes derived pending mock entries in distinct due-question counts.
- Personal OCR/text material storage has a corrupt-JSON write-lock and a read-only raw backup download, instead of silently initializing and overwriting invalid stored data.
- Offline cache version incremented. No changes to canonical 800-question bank, final answer keys, or publication status.

## Limits
- LocalStorage remains nontransactional and simultaneous writes are not guaranteed atomic.
- Source-verification of legal answers and OCR accuracy is separate, not claimed completed.
- Web browser and mobile S Pen/TTS live testing still required; script grammar and injected edge-case examples were checked.
- GitHub Actions workflow absent, Vercel git.deploymentEnabled false, no EXE/APK/ZIP, no production deployment.
