# ConceptKnot v138 — 통합 음성 T1/T2 구현 상태

기준: 2026-11-08. 원본: docs/INTEGRATED_LATE_STAGE_MASTER_PLAN_2026-11-08.md

- 신규 controller: assets/ck-voice-controller-v138.js. 네이티브/AI 단일 큐, 취소 세대, 시작·종료 이벤트, 무음 watchdog, 40개 세그먼트, 텍스트 분할 재시도, 북마크 매핑 보존.
- 기존 CK76Voice 공개 API·공식 800문항·특수정답/개인 기록 수정 없음. v137 폴백 코드 유지.
- 기존 AI 엔진이 준비되지 않았을 때는 대량 모델을 자동 다운로드하지 않고 기기 음성으로 재생 시도. 모델은 고급 수동 준비 경로에만 남음.
- tests/v138-voice-integration.test.cjs: 소스 통합 검증 경로. 신규 큐의 독립 모의 시험 11/11 PASS (별도 실행 기록); 실제 OS 음성 인수 아님.
- 별도의 Windows/Android Brave 실제 실음성, AI 여성 모델 자체 호스팅, 모델 SHA/라이선스·메모리 확인, P4 법령 감수 및 DoCut D1 시각 QA는 **NOT_RUN/미완**.
- GitHub Actions 0회, 설치 아티팩트 0, 수동 Production 배포 아직 없음. 다음 게이트: 실제 기기 첫 소리·실제 40문항 연속 및 캐시 확인.
