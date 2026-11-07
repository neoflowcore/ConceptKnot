# ConceptKnot v139 — TTS 통합 모델 캐시/큐 후반부 작업 체크포인트

작성: 2026-11-08 (Asia/Seoul)
원본 계획: `docs/INTEGRATED_LATE_STAGE_MASTER_PLAN_2026-11-08.md`
기준선: GitHub main `6be416f006492315440f6fa707954d55c0e27402` (v138, 실제 변경 전 HEAD)
범위: T1~T5와 P1 안정화의 **코드 구현**. 실제 기기 실청취·모델 자체 호스팅·완성률 증거와 구분.

## 기능 변경
1. `assets/ck-voice-controller-v138.js`: 재생 중 일시정지하면 종료 watchdog 잔여시간을 보류하고 재개 때 다시 타이머를 걸어 오탐 오류를 방지. 기존 세대 토큰·40문장 큐·반복/취소 안전 유지.
2. `assets/ck-tts-model-manager-v139.js`: 동일 출처/고정 리비전 모델만 허용, 명시적 동의/셀룰러 차단/저장공간 확인, 크기 및 SHA256 스트리밍 검사, 전용 CacheStorage로 기본 오프라인 자산과 분리, 성공 후 검증 영수증, 재방문·오프라인 캐시 검사.
3. `models/tts/manifest.json`: 고정 원본 SHA 및 11개 예상 구성. **distributionReady=false** / bytes·sha256 미측정 표시. 가중치 실제 정적 호스팅과 배포권한 확정 전 모델 준비 완료를 사칭하지 않는다.
4. `neural-tts.mjs`: 올바른 동일 출처 `/models/tts/supertonic-3/<revision>/` 모델 URL을 선택적으로 수용; 구형 고정 외부 HF 수신은 고급 메뉴에서 *수동 클릭*했을 때만 유지.
5. `index.html`: 1클릭 기본 OS 한국어 음성 원칙 유지; AI 모델 고급 영역에 수신 동의·SHA 검증·진행 상태 추가. 준비 전에는 모델 자동 수신 없이 네이티브 음성을 사용. 중지·세션 변경 후 늦은 모델 준비 완료 UI/자동 재생 차단.
6. `sw.js`/`assets/ck-data-diagnostics-v88.js`: 서비스워커 세대 v139, 필수 오프라인 파일 11개 유지, 모델은 HOT/CRITICAL 제외, 서명된 별도 캐시만 조회.
7. 회귀 테스트: `tests/v138-voice-controller.test.cjs` 11건, `tests/v139-tts-model-manager.test.cjs` 6건(로컬 fake-device 노드 시뮬레이션 17/17 PASS). 기존 앱 통합 및 기기 실제 스피커 실청취는 별도 검증.

## 사실관계·미완 항목
- 기출 원문 2016~2025 800개는 기존 등록 기준. 이 작업에서 공식 문항/정답/사용자 OCR·필기·오답·개인 백업 데이터 수정 없음. 실제 사용자 데이터 무손실 실증은 별도.
- Supertonic 공식 모델: https://huggingface.co/supertone-oss-archive/supertonic-3 (원본 고정 revision aafc6e32416a594460b32413efc49d7fe4ce6d46); 예제 코드 MIT vs 모델 OpenRAIL-M. 실물 파일별 byte/SHA, 재배포 고지와 모델 런타임 로컬 제공, Vercel 요금/속도 확인 후 `distributionReady` 전환 필요.
- 브라우저에서 실제 여성 음성, Android Brave, Windows Brave, 앱 잠금·배터리·메모리, 브라우저 GPU, 40/80문항 오디오 시퀀스 **NOT_RUN**.
- Github Actions, 설치 아티팩트 EXE/APK/ZIP 사용 없음. 기존 `vercel.json.git.deploymentEnabled=false` 유지.
- Vercel Production READY = 최신 GitHub SHA와 별도 확인. 운영 배포 후 연결된 commit SHA·도메인을 기록.

## 다음 Phase
T3: 파일별 모델 SHA/라이선스·재배포 사양 실제 계측 → T4: 버전 고정 정적 저장소 연결·동일 출처 또는 허용된 URL → T5: 실제 AI 음색·캐시/복구 → T6: 800문항 낭독 용어 QA → T7: 사용자 Windows/Android Brave 실기 → T8: 릴리스 인수. 별도 P4: 최근 5년 해설 400문항·2000 선지 출처 확인, 검수 전 공개 금지. DoCut은 자체 저장소 독립 개발.
