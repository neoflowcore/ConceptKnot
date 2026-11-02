# ConceptKnot v90 — Ten-year integration stability
Base: 5fd5353d0e65736772b334b47594838987cc64a9

Completed source changes:
- Display pending official 2016–2020 hydration rather than misleading 0-point results; show retry button and registered document count.
- Reject manual submission after timeout without first recording a timed-out result. Keyboard shortcuts ignore IME composition and repeats; paused answer option buttons disabled.
- Review list rebuilds after older official bank hydration; adaptive recall ranks due items.
- Study plan incorporates derived latest-exam due items and reduces remaining due count based on actually allocated recalls rather than question count, with previous exam-date setting exposed through CK79Study.snapshot.
- Prior-year study-plan launch hydrates bank before navigation.
- Backup validator blocks null nested object fields; read-only diagnostics includes final notes and main study records, 9 namespaces total.
- Updated service-worker cache version, no automatic Vercel deployment, no Actions workflows.
- Code tests: 10 annual 80-item official banks; 11 special accepted-answer questions; blank scoring; old-year active exam and derived queue; malformed bank rejection; rollback failure and Korean local calendar were exercised via mocked browser runtime. No actual mobile browser or visual similarity test.

Manual verification required: 2016/2020 exam, saved history refresh while slow/offline, timer expiry; JSON backup/restore; Android Brave S Pen; PDF night mode; 1.5x Korean TTS; GPU inactive on non-home tabs.
