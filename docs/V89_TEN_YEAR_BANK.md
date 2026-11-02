# ConceptKnot v89 — Ten-year bank integration
- 2016–2020 official records were already present in data/official-2016-2020.json, but only 2021–2025 400 records were registered in the page at initial load.
- Add exact 400-record validation and guarded hydration; reject duplicate IDs, incomplete years, invalid five-choice answers, or collision with previously registered official records. Zero invented content.
- v82 100-minute / 80-question exam can initiate loading for older selected years, and will not grade until a complete verified year exists.
- v83 personal concept links allow old-year personal records to remain present before async hydration and refresh when the bank is ready.
- Refresh analytics when old-year bank is ready. Service-worker precaches immutable 2016–2020 dataset.
- No automated deployment, GitHub Actions, install artifact, or device test.
- Manual verify: use 2016 and 2019 all-accepted keys; start 80-item mock for 2016 and 2020, submit, restore an old-year attempt, check links; confirm offline re-entry.
