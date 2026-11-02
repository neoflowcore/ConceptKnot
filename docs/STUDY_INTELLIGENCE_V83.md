# ConceptKnot v83 · Adaptive personal study suite (2026-11-02)

Base: f3c02dcf3ac59df49fc089fc75cbf074925e0a18.

## Implemented
- CK83Recall: 10–15 minute revisit after failed recall, 1/3/6/12/20/28 day success-based intervals, recent-failure interval shortening, max 1,200 locally retained events. This is a heuristic, not an experimentally validated predictor.
- Existing CK79Study.markRecall now calls the scheduler; old records with no events remain usable. On storage failure changes roll back.
- CK83Links: 800 registered question selection, up to 10 individually chosen concepts per question, evidence notes, inverse search, candidate keywords clearly identified as unreviewed, dedicated local JSON export/import and validation.
- CK83Analytics: 7/30 day activity, typed completion, recall events, scored exam attempts, per-subject average, repeated-question earliest-to-latest comparison, individual concept-linked accuracy with sample count. No automatic attribution of unverified candidate concept frequencies.
- CK82FullExam.getAttempts returns deep copies of recorded submissions for local analytics without editing exam data.
- Legacy learning JSON backup includes `ck83-personal-concept-links-v1` with sanitation on restore. Recall events are in the main state.
- Main page, modular CSS and service worker v83 integration; no push-triggered CI or automatic deployment.

## Data integrity
- Official 800 questions, final answer keys and the 32 draft explanations are unchanged.
- Published source-verified explanations: 0/400; reviewed option verdicts 0/2000. Keyword candidates remain candidates and do not count toward frequency.
- All learnings stay in localStorage, with no remote tracking or AI requests.
- Historical attempts before v82 cannot be reconstructed into time series; empty dashboards show data not available.
- Full mobile/Brave/S Pen/TTS, PDF and GPU manual verification remains outstanding.

## Manual verification after optional manual deployment
1. Open 2025 exam or restored v82 attempt; submit and ensure 7/30-day dashboard only records real submissions.
2. On official 2025 question, link two concepts with source evidence; inverse search shows this question and JSON export/restore preserves it.
3. Answer a recall item as 'again' and check 15-minute due; mark 'remember' and confirm adaptive spacing, historical record preservation.
4. Select 7 and 30 days, each subject, and compare data to actual personal records.
5. Perform full learning backup and restore in another clean profile; no corruption on older backups, no AI/published status promotion.
6. Test Dark/Light, Android Brave, S Pen, voice, multi-tab and offline cache. No actual device test was performed in this source-only change.
