# ConceptKnot 관리형 Supertonic 3 배포 게이트 (T3–T5)

2026-11-08. 통합 계획서: docs/INTEGRATED_LATE_STAGE_MASTER_PLAN_2026-11-08.md

- 고정 upstream: https://huggingface.co/supertone-oss-archive/supertonic-3/tree/aafc6e32416a594460b32413efc49d7fe4ce6d46
- 현재 models/tts/manifest.json의 **distributionReady=false**는 실제 약 398MB 모델과 라이선스/검증값이 배치되지 않았다는 사실을 의미한다. 준비되지 않은 모델을 '설치 완료'로 표시하거나 398MB를 자동 다운로드하지 않는다.
- 모델 가중치 OpenRAIL-M, 예제 코드 MIT. 기본 저장소 vendor/SUPERTONIC-LICENSE.txt 및 vendor/SUPERTONIC-MODEL-LICENSE.txt도 참고한다. 재배포 전 원문 고지·적용 제한을 검토한다.
- 준비 과정: (1) 가중치 라이선스 확인 (2) 원본 revision 고정 (3) 배포될 ONNX 4종·JSON 2종·F1~F5 5종의 bytes와 SHA-256을 실물로 측정 (4) 동일 출처 정적 호스팅 또는 비용 승인된 스토리지 배치 (5) `distributionReady=true` 전환 (6) 브라우저에서 명시적 동의 후 1회 다운로드·SHA검증·기본 캐시 외 분리 저장 (7) Windows Brave/Android Brave 실제 여성 음색·메모리·오프라인 확인.
- `assets/ck-tts-model-manager-v139.js`는 증거가 있는 호스트만 수용하며, 저장 공간 부족/모바일 데이터 절약/파일 변조에서 캐시 설치를 거부한다. 학습 기록·오답·필기·공식문항을 건드리지 않는다.
- 서비스워커는 사용자가 검증 설치한 `ck-managed-tts-<revision>` 캐시만 조회하며 공식 기출/PWA 핵심 자산의 설치와 독립된다.
- 현재 브라우저 추론용 ONNX Runtime Web helper는 외부 jsDelivr를 사용한다. 라이선스 검토 및 로컬 런타임 자산 확보 전까지 **완전 오프라인 AI TTS PASS가 아니다**.
- 구형 Hugging Face 고정 리비전 모델 다운로드 버튼은 기본 UI가 아닌 고급 영역에서 사용자의 명시적인 클릭 시에만 동작한다.

## 확인한 원본 구조
- 4종 ONNX: duration_predictor, text_encoder, vector_estimator, vocoder
- 2종 설정: tts.json, unicode_indexer.json
- 여성 스타일: F1~F5
- 모델 크기 공개 목록 약 398MB. 개별 SHA가 없는 값을 추측해 채우지 않는다.

## 품질 게이트 (현재 상태)
- T3 라이선스와 모델 목록 조사/버전 고정: 코드·문서 반영, 독립 라이선스 최종 검토 필요.
- T4 자체 정적 모델 URL/바이너리/실물 해시: **NOT_DONE**.
- T5 동의형 해시 캐시 코드·오프라인 조회 경로: 코드 반영, 실제 398MB 모바일 실기 **NOT_RUN**.
