# ConceptKnot P4 v169 — Vercel Node 검증/수동 배포 확인

- 기준 GitHub main: `cd5ab7a90d89df38430c4e13d6ec4cc2ee261e41` (v168).
- 범위: **P4 v168의 Node 통합검증 실패 수정만**. 공식 A형 800문항/답, 선지별 초안, 사용자 필기·점수, TTS/P6 동작은 미수정.
- 준수 계획: `docs/V140_REMAINING_MASTER_PLAN_TTS_LAST_2026-11-08.md`, `docs/DATA_SOURCE_POLICY.md`, `docs/V168_P4_122_OPTION_DRAFTS_CHECKPOINT.md`.

## 재개 후 실행 증거

1. 실행 컨테이너: Node v22.16.0 확인. `git ls-remote https://github.com/neoflowcore/ConceptKnot.git HEAD`는 `Could not resolve host: github.com`으로 실패, 저장소 클론·로컬 전체 Node 실행 불가능. **사용자 PC의 문제가 아니라 이 실행 컨테이너의 DNS 문제**.
2. Vercel 연결된 기존 `conceptknot` 프로젝트를 찾아(프로젝트 ID `prj_gUGxZ99hLDXLvqLPyba7yjyiHRW2`) 최신 Git SHA `cd5ab7a90d89df38430c4e13d6ec4cc2ee261e41`를 명시한 **수동 preview 빌드** 실행.
3. 미리보기 배포 `dpl_822S3cW7PyU75gy8dsooVDXecKKB`: `node scripts/verify-p4-release-v168.cjs` 실제 실행. 400문항·2,000선지, AI 808·기존 332·정답 문맥 146·미작성 714, `study=true` 및 전문가 검수 0 사실을 확인.
4. 테스트 실패 원인: `tests/v162-substantive-next-100-options.test.cjs:125`의 과거 P4 오프라인 자산 개수 정규식 **13/13**이 현재 15/15와 불일치. 테스트가 기능 변경에 맞춰 갱신되지 않은 회귀검사 기대값 오류. `15/15`로 수정. 기능 동작·PWA 캐시 정량값은 이미 v168으로 전환되어 추가 수정 불필요.
5. 실제 Node 재실행 및 Production 수동 배포는 이 수정 커밋의 검증 이후 별도로 확인. 성공 전에는 테스트 및 Production READY를 기정사실로 쓰지 않는다.

## 테스트/출시 설계

- `vercel.json`: `buildCommand=node scripts/verify-p4-release-v168.cjs`. 원본 구조/선지수 감사 → 2,000선지 독립근거 원장 자가검사 → 12개 통합 Node 테스트 파일 → 전체 소스 읽기 전용 릴리스 검사.
- 해당 순서 중 하나라도 실패하면 Vercel 빌드 실패·Production 교체 차단. 기존 배포/사용자 데이터는 수정하지 않는다.
- `git.deploymentEnabled=false` 유지. GitHub Actions 워크플로 미생성, Git Push만으로 배포되지 않는다.
- 실제 원전 PDF 검독/전문가 감수 0/2,000 불변. 총 개발진행률 및 디자인 일치율 미측정.

## 사용자 수기검증(배포 READY 후 수행)

기존 운영 주소의 학습 데이터를 먼저 JSON 백업 → 새 코드가 반영된 화면에서 P4 해설·2,000선지 보기 → 2021~2023년 학개론 11~20번 신규 선지근거 및 미검수 안내 → TXT 내보내기와 필터 → Android Brave 비행기모드에서 서비스워커 v168/P4 선택자산 15개 확인 → 개인 저장기록 보존 확인. 사용자에게 PASS를 자동으로 표시하지 않는다.
