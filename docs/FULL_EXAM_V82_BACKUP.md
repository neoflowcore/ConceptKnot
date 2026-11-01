# v82 backup integration follow-up

- Current `ck79Backup()` now includes the separate v81 review workbench and v82 full exam session keys alongside the v80 personal editorial notes and custom final sheets.
- Existing restore path validates v81 records via `CK81Workbench.sanitizeProgress` and v82 exam sessions via `CK82FullExam.cleanStore` before persisting separate local keys. Malformed extras are skipped; legacy backups without the keys remain accepted.
- Existing 8MB backup file ceiling remains in place. No canonical official question/answer data or default-state format changed.
- Offline service worker revision bumped to refresh the HTML shell while leaving the v82 static JS/CSS names unchanged.
- Full end-to-end Android/Brave restore and multi-tab same-second edit collisions remain manual verification items.
