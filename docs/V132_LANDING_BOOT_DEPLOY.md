# ConceptKnot v132 · 로고 홈 복귀 백지 화면 수정 · v131 수동 운영 배포

기준: 2026-11-07, `main` v131 `e32db530cdea14c1224220dbd9fcef9cf13450a4`.

## 재현 및 근본 원인
1. 사용자가 기존 학습기록에서 `state.view='home'`을 복원하면 첫 화면이 '오늘의 학습'이다.
2. 기존 `index.html` 랜더러는 `landing`일 때만 `#ck-v8-ambient`를 만든다.
3. `ck-garden-25d-v36.js`는 `DOMContentLoaded` 후 `ck-dot-landing-v57.js`를 동적 import한다.
4. 기존 Dot renderer의 `boot()`는 초기 `#ck-v8-ambient`가 없으면 **즉시 return**한다. 같은 모듈은 재초기화되지 않는다.
5. 로고 클릭으로 `landing`에 돌아와도 메인 콘텐츠는 빈 문자열(`renderers.landing:()=>''`)이고 배경 화면은 준비되지 않아 흰 페이지만 보인다. 통합 검색 launcher도 함께 누락된다.

## 실제 수정
- `ck-dot-landing-v57.js`: 초기 화면이 학습 탭이어도 `ensureHost()`가 `#ck-v8-ambient`를 한 번만 생성하고 `scene()`을 초기화. 기존 호스트를 재사용하며, 중복 init은 `booted`로 차단한다.
- 초기 학습 탭에서는 기존 `allowed()`가 false이므로 SVG/RAF 24FPS를 시작하지 않는다. 로고 클릭 뒤 `ck:scene-activity`에서 원래 Dot renderer가 즉시 재개된다. 사용자가 선택한 배경/학습 데이터/페이지 이동 상태를 초기화하지 않는다.
- `ck-garden-25d-v36.js`: Dot 로딩 실패 시 fallback garden도 초기 호스트 부재를 복구하며, 동적 import를 `?v=132`로 고정하여 구버전 JS 캐시 재사용 방지.
- HTML의 garden launcher URL을 `?v=132`로 업데이트. 서비스워커 세대 `conceptknot-study-v132-landing-first-boot`, 변경 JS의 캐시 경로 동기화. `ck-data-diagnostics-v88.js`도 세대 일치.
- 설정의 기존 28개 수기 검증 ID/기록 그대로 유지, 상단 UI 검증문에 **오늘의 학습 첫 진입→로고→점묘화 + 통합 검색** 항목 추가.
- v131 혼합 5세트, 개인 약점 복습, TTS, 800문항 JSON, 공식 인정 정답과 해설, 저장소 키는 변경하지 않았다.
- GitHub Actions 미추가, `vercel.json.git.deploymentEnabled=false`, 자동 Push 빌드 없음. 배포는 사용자 명시 요청으로 수동 수행.

## 코드 수준 확인과 한계
- 격리 V8 mock에서 **home-first → host 생성/idle → logo landing → 기존 장면 재활성**, direct landing, 기존 host 재사용·중복 방지, 동적 import 버전, 검색 검색기 클릭 연결, v132 HTML/SW 경로 정합성을 점검.
- `tests/v132-landing-restoration.test.cjs`를 수동 Node 회귀검사로 추가. 빌드 배포 확인과 Android/Windows Brave 실기, SVG/이미지 렌더·GPU 계측은 구분한다.
- 스캔 OCR, S Pen 물리 버튼, TTS 실제 음성, 공식 해설 법령/판례 의미·800문항 전문가 검증은 이 수정의 대상이 아니다.

## 수기 실기검증 — 사용자 PC/Android
1. **현재 통합 학습 JSON, CK129 혼합 시험 기록 JSON, PDF 필기 JSON, OCR 자료, 개인 근거/교재 JSON을 각자 백업하고 파일 열기 확인. 로컬 데이터 삭제·스토리지 초기화 금지.**
2. 새 탭/기존 프로필에서 처음 `오늘의 학습`을 연 뒤 좌상단 부엉이 로고 클릭 → 흑백 점묘화·부엉이·공식 기출 통합 검색 표시 확인. 연속 3회 왕복, 다크모드·새로고침에서도 백지/이전 장면 노출 없음.
3. 통합 검색 필드 마우스 클릭 및 키보드 Enter/Space → 기존 검색 모달, 공식 기출 검색 및 해당 문항 이동 확인.
4. 뒤로가기·탭 전환·브라우저 숨김/복귀 시 GPU·FPS가 학습 탭에서 idle인지 확인. 기존 데이터 및 S Pen 손글씨 보존.
5. v131 혼합 1~5세트(각 80문항, 100분, 학개론 40/민법 40), 응답/보류/제출, 오답·미응답 필터, 개인 약점 복습/근거 연결/TXT 다운로드 확인.
6. 설정 안전 점검: 현재 SW `v132`, 최소 캐시 11/11, 혼합 시험 JS/CSS 2/2, v131 복습 JS/CSS 2/2. 오프라인 자체 실동작은 별도 확인.
7. 설정의 28개 사용자 직접 실기검증표에 PASS/FAIL/미확인과 재현절차 기록. `node --test tests/v132-landing-restoration.test.cjs` 및 `node scripts/check-release-readonly.cjs`는 **자동 CI가 아닌 로컬 수동 검사**.

## 완료율
이전 운영 통합 실기 체크포인트 19/30 ≈ 63%, P0~P2 80%, P3 60%, P4~P5 40%는 과거 기준선이다. 현재 기능 코드 개수·실기 Pass·디자인 일치율을 재산정하지 않았다.
