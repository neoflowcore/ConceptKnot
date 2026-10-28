# ConceptKnot v6 — functional workspace swap and fine glass (2026-10-28)
- Baseline: f1c21a1e5018f3ac279c90100b73652740a6c0ca
- Uses the existing two-panel HTML, note records, image/pen canvas and typing input. The swap changes **grid placement only**, never rerenders the question or rewrites the note input.
- Persistent `ck6Swapped` key is added to the existing `recallgraph-first-exam-v1` state (including JSON backups).
- Thin separator is still draggable and keyboard accessible; when reversed, the drag delta is inverted to keep pointer direction intuitive. 30px clipped-looking glass swap button below divider.
- Quick 340ms FLIP-style panel translate animation, disabled under reduced-motion. Small widths show vertical order change with a swap control; resize handle is hidden.
- Shared gutter token gives the header and content exactly the same left/right outer margin.
- No changes to question data, TTS models or automatic CI.