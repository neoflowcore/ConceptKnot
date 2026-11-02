# ConceptKnot v88 — personal-data integrity layer

Base: 8a75ea861d5b41683fa9f62207c95e4698b10631

- Block editing and overwriting malformed persisted JSON in the v80 personal explanation, v81 review progress, v83 concept links and v84 study planner modules.
- Detect stale localStorage values before writes in these modules. Multi-tab simultaneous writes remain non-atomic in localStorage; users should avoid concurrent edits.
- Preserve known personal drafts rather than silently resetting them when parsing fails.
- Read-only v88 diagnostics for seven major local storage namespaces with non-destructive raw JSON export.
- Raw recovery download is NOT the same as a validated study-backup import; do not import it directly. Inspect/recover deliberately.
- Existing official 800 questions, final accepted answers, explanation status and curriculum material unchanged.
- No Actions, no automated deploy, no executable artifacts, no production deployment.
- JS syntax reviewed before committing; mobile S Pen, TTS, typing, PDF, OCR and UI smoke checks still require actual device testing.
