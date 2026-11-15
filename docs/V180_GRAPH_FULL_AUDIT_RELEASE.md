# ConceptKnot v180 — 차트·도형 전수 검사 및 수동 배포 체크포인트

기준: GitHub v179 `4a45d803e0634b7a21357b13447d5fdedfaed3c0` · 2026-11-15

## 출시 전에 검증한 사항
- 도식 17개 모두 실제 Chromium에서 `390px`과 `1280px`으로 차트 변경 후 기본 SVG 한 개가 보이고, 3단계 학습 패널이 존재하며 가로 넘침·페이지 오류가 없는지 순회함(34개 화면).
- 초기 v179 테스트 9/9 통과. 확대 테스트 19개 파일 169개 검사에서 157 통과·12 실패: 주로 과거 릴리스 세대 고정 검사와 검증센터 open() 구형 문자열 검사. 이전 릴리스용 역사 테스트는 current 릴리스 검증과 별개로 기록.
- 계산형 3개와 추가 이론모형 6개의 독립 엔진은 각 주제별 회귀테스트 대상으로 유지. 17개 SVG + 9개 계산형 = 총 26개 주제. 기본 화면에서는 SVG 한 개만 보이고 계산 모듈은 코드에 보존.
- 설정 이동 실기 오류 발견: SPA 설정 탭에서는 `#main`의 최상위 DOM이 교체되지 않아 검증센터가 body 아래 남아 감춰짐. `data-ck-v8-tab` 변경 감시 후 동일 DOM을 설정 그리드로 이동하도록 수정. Chromium 양쪽 폭에서 설정 그리드 아래 드로어가 표시되는 것을 다시 확인.
- 기존 v171 버전 자산을 실제 출시에서 오해하지 않도록 `index.html`, `sw.js`, `ck-data-diagnostics-v88.js` 버전을 **v180**으로 묶음 변경. 기존 저장 기록을 지우지 않는다.

## 변경과 캐시
- `index.html`: `ck-release=v180-single-chart-qa-release`, 주요 수정 스크립트·CSS 요청 `?v=180`.
- `sw.js`: 새 캐시 세대 `conceptknot-study-v180-single-chart-qa-release`, `CK179ChartLearning` JS/CSS 오프라인 목록 등록.
- `assets/ck-data-diagnostics-v88.js`: 동일 세대/자산 버전 고정.
- `assets/ck-study-workbench-v81.js`: 설정 진입 시 DOM 이전 안정화.
- `tests/v170-p4-qa-hub-and-scope.test.cjs`, `tests/v171-tts-graph-bridge.test.cjs`: 최신 릴리스 대상 검사값 갱신(기능 기대값은 유지).
- `scripts/check-release-readonly.cjs`: 현재 cache/v180 진단 일치.
- `scripts/verify-p4-release-v180.cjs`: P4 기존 검사와 v178/v179 차트 검사 함께 실행; GitHub CI 자동 트리거 추가 없음.
- `vercel.json`: `buildCommand=node scripts/verify-p4-release-v180.cjs`; `git.deploymentEnabled=false` 유지.

## 배포 품질 게이트
1. `node --test tests/v179-single-graph-settings-board.test.cjs tests/v178-single-chart-compact.test.cjs`
2. `node scripts/verify-p4-release-v180.cjs`
3. `node scripts/check-release-readonly.cjs`
4. Vercel 프로젝트 `conceptknot`, 연결된 GitHub 저장소 `neoflowcore/ConceptKnot`, 정확한 커밋 확인 후 **수동** 배포.
5. READY 상태, 응답 자산 버전, 운영 alias가 같은 배포를 가리키는지 확인.

## 미검증 / 주의
- 손가락·실물 S Pen 터치 정밀도 및 Android Brave 오프라인 업데이트·필기 저장·개인 학습기록의 실제 장시간 사용은 별도 기기 실기 점검 필요.
- 공식 800문항의 전문가 검수율(전문가 출처 검독)은 코드 QA로 완료로 바뀌지 않음.
- 배포 성공은 기기 기능 전수실기 PASS와 별도.
