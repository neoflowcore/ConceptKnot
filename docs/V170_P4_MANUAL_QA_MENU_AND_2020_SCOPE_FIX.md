# ConceptKnot P4 v170 — 사용자 수기검증 메뉴 / 2020년 오탐 차단 수정

- 기준선: `main` `ca2fe73e5f4b68a0397a6ea513c9ac7980fe99ce` (v169, P4 v168 후보 122개·잔여 714).
- 사용자 제보: 2026-11-13 실제 Brave 화면에서 자료·분석 메뉴 깊숙이 있던 검사 화면에 "학습용 해설 발행 차단", "독립 선지 2,000건 원전 대조 준비 미완료", 잘못된 2020-1/2/3/4 표시. 실제 2021~2025 400문항 감사와 2016~2020년 400문항 학습 범위는 별도.
- 기존 마스터·검토 문서: `docs/V140_REMAINING_MASTER_PLAN_TTS_LAST_2026-11-08.md`, `docs/DATA_SOURCE_POLICY.md`, `docs/V168_P4_122_OPTION_DRAFTS_CHECKPOINT.md`, `docs/V169_P4_VERCEL_NODE_INTEGRATED_QA_CHECKPOINT.md`.

## 요구 ↔ 코드 ↔ 사용 흐름 ↔ 검증 계획

| 요구 | 구현 | 사용자 흐름과 검증 |
|---|---|---|
| 엉뚱한 2020년 불일치로 해설·선지 화면 전체 차단 | `assets/ck-study-workbench-v81.js`의 `recentP4Rows` | 800문항 작업대는 유지하며 `CK163PublicStudy.panel/clicked`, `CK160OptionUI.panel/clicked`만 2021~2025 400문항 전달. 원전 불일치 검사 완화 금지 |
| 바로 접근 가능한 수기 검증 메뉴 | `assets/ck-study-workbench-v81.js/.css` | 오른쪽 상단 **검증·자료** 드로어 맨 위 고정 검증센터: ① 400문항 해설 ② 2,000선지 검토 ③ 오프라인 캐시 ④ 수기 PASS/FAIL. 클릭 시 관련 부분만 보여 주고 나머지 접기 |
| 설정 탭에서만 작성되던 실기검증표 | `assets/ck-manual-qa-v115.js/.css` | 검증센터 버튼으로 같은 저장키 `ck115-manual-device-verification-v1` 검증표를 드로어에서 열기. 기출/해설·오프라인·전체 필터. 기존 PASS/FAIL/메모 저장 방식 불변 |
| 오프라인 캐시 검사 버튼 숨김 | `assets/ck-data-diagnostics-v88.js`의 상태검사 API 노출 | ③ 버튼 누르면 현재 브라우저의 필수 파일 11개/P4 선택파일 15개 및 현재 SW 세대 표시. 파일 준비는 실제 오프라인 조작 PASS와 구분 |
| 배포 후 변경 자산이 옛 캐시로 고정되지 않기 | `index.html`, `sw.js`, `assets/ck-data-diagnostics-v88.js`, 캐시 쿼리 | 자산 `?v=170` 고정/새 세대 `conceptknot-study-v170-p4-manual-qa-hub`. P0 11종/P2·P6 9종, 기존 P4 15종 유지 |
| 실제 회귀방지 | `tests/v170-p4-qa-hub-and-scope.test.cjs`, `scripts/verify-p4-release-v170.cjs` | 기존 Node P4 통합검사에 2020 데이터 혼입 실패/400문항 성공, 클릭/화면 연결, 메뉴/캐시/기록 저장키 정합성 검사 추가. 과거 버전 고정 테스트 현재 세대로 정리 |

## 산정/검증 및 제한

- 구현 항목·검증 통과/미통과·배포 여부는 Vercel 실제 빌드 로그와 운영 URL 조회로 판단. 정식 시험원전 PDF·2021~2025 당시 법령·판례 독립 검독 **0/2000**, 전문가 서명 **0/2000** 변경 없음.
- 전체 개발진도·디자인 일치율은 산정 근거 미확보 → **미측정**. 기존 학습용 해설 AI 개별선지 808, 기존 개별근거 332, 문항근거 문맥 146, 빈 선지 714, 후보 1286은 그대로. 사용자의 실제 동작을 자동으로 PASS라 표시하지 않음.
- `git.deploymentEnabled=false` 및 Actions 워크플로 없음. EXE/APK/ZIP 미생성.

## 사용자 검증 절차

1. `https://conceptknot.vercel.app/` 접속 → 오른쪽 위 **검증·자료** 탭 열기 → 검증센터가 상단에 보이는지 확인.
2. **① 기출 400문항 해설** → 2021년/학개론 선택 → 신규 후보 설명과 미검수 문구. 2020년 불일치 오탐 없음.
3. **② 선지 2,000개 검토** → 2021년/학개론 등 필터 → 5선지별 AI 후보/미작성 분리, PDF·전문가 미검수 표시.
4. **③ 오프라인 상태 검사** → 필수 11/11, P4 15/15, 현재 v170 세대 확인. Android Brave 비행기모드에서 실제 작동은 별도 조작.
5. **④ 수기 PASS/FAIL 기록** → 기출·해설/오프라인 필터 전환 → 항목을 직접 조작하고 PASS/FAIL·메모 저장 → 새로고침 후 보존 확인.
6. 오류 또는 실제 기기 상호작용은 화면 캡처로 회신. 자동 단위·빌드검증과 기기 수기검증을 구별.
