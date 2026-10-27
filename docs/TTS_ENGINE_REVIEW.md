# 한국어 여성 TTS 검토 · 2026-10-28

## 선택

Supertonic 3: 한국어 지원, F1~F5 여성 스타일, ONNX 브라우저 WASM 합성. API 키와 합성 서버 없이 실행. 기존 기본 음성은 명시적으로 선택할 수 있도록 유지.

- 소스: https://github.com/supertone-oss-archive/supertonic
- 검토 소스 커밋: 1e9799e964ea4c0dad7cde993b65c3c813a7b373
- 가중치: https://huggingface.co/supertone-oss-archive/supertonic-3
- 가중치 고정 리비전: aafc6e32416a594460b32413efc49d7fe4ce6d46
- 코드 MIT, 가중치 OpenRAIL 계열. 원본 라이선스 vendor/에 보존.
- 공식 저장소는 2026-09-09 보관 처리됨. 유지보수 중인 엔진으로 표기하지 않음.
- 첫 준비 약 380MB 다운로드. 자동 로딩하지 않고 사용자가 AI 여성 음성 준비 버튼을 눌러 시작. WASM 1스레드로 호환 우선.
- 합성 속도로 배속을 적용하며, 준비 중 중지/화면 전환 시 뒤늦게 음성이 재생되지 않도록 토큰 처리. 실제 음색 평가는 출력 확인 전까지 미확정.

## 비교

Kokoro/Kitten은 이번에 한국어 기본 모델로 선택하지 않음. 임의로 영어 모델에 한국어 입력해 품질을 보장하지 않음. Qwen 계열 대형 모델은 모바일 다운로드/메모리 부담 때문에 이번 정적 앱 경로에서는 제외. 브라우저 시스템 TTS는 설치 음성에 따라 음질이 달라 개선의 주 경로로 삼지 않음.

참고 구현: https://github.com/cskwork/supertonic-tts (코드는 복제하지 않고 공식 MIT helper 사용).
