# ConceptKnot v177 — Android A1 APK 실기검증 산출물

> 작성일: 2026-11-14 · 원본 소스 커밋: fb8a6955befe0f19ab9da21a82054a15f1ea5a62 · 상태: APK 빌드 및 정적 검증 완료 / 실제 기기 검증 대기

## 빌드 요약
- 앱: Kotlin + Jetpack Compose / sherpa-onnx v2.0.1 / Supertonic 3 INT8 한국어 F1
- 모듈: native/android-tts/app
- 설치 테스트용 debug APK / ARM64-only (arm64-v8a) / 앱 패키지 org.conceptknot.android
- versionCode: 2 / versionName: 0.2.0-a1
- minSdk 26 / targetSdk 35 / compileSdk 36
- Gradle 8.13 / Android Gradle Plugin 8.13.2 / JDK 17 / Android SDK 36, build-tools 35.0.0
- 실행 명령: ./gradlew :app:assembleDebug :app:testDebugUnitTest --no-daemon --console=plain
- 종료 코드: 0 (BUILD_AND_TEST_PASS)
- APK 크기: **44,055,060 bytes** (약 44.1 MB, 십진)
- SHA-256: `84958fd336d3946729f7e5c0290f48d81d781a5542ef93b9b3229d9e2f29efcd`
- SHA-1: `b96b5d8dbd917f4587f55c6d739c0a09b6c46a58`
- apksigner verify: **Verified using v2 scheme: true** / number of signers: 1
- aapt badging: native-code arm64-v8a, minSdkVersion 26, targetSdkVersion 35
- 테스트: 이전 v176의 10개 JVM/통합 테스트 통과. 금번 assembleDebug와 testDebugUnitTest 빌드 종료 코드 0.
- 모델 가중치는 APK에 포함하지 않음. 최초 사용자 동의 시 HTTPS 1회 다운로드, SHA-256 검증, 앱 내부 로컬 보관.

## 파일 전달 및 주의
- 개발 검증용 빌드로 **프로덕션 릴리스 키가 아닌 Android debug 키로 서명**됨.
- 생성된 바이너리는 검증 환경에 보관하고 HTTP 다운로드 링크로 제공. 빌드된 APK 바이너리는 Git 저장소에 업로드하지 않음.
- 검증 환경의 일시적인 URL은 영구 호스팅이 아니며, 서비스 중지 후 다운로드가 불가능해질 수 있음. **영구 배포 링크로 기록하지 않는다.**
- 실제 기기 설치, 네이티브 모델 로딩, 한국어 여성 음성 출력, 비행기 모드 재실행, 전원/배터리 효율은 미검증.
- APK 설치 이후 기존 웹앱 데이터에 접근하지 않음. 기존 Vercel 웹 서비스/자동배포는 보존.
- Android debug 서명과 ABI 필터를 변경한 빌드는 별도 APK로 검증 후 최종 릴리스에 사용.

## 향후 검증 및 개선
1. Android ARM64 기기에 설치하고 앱 실행 확인.
2. 앱의 1회 모델 설치 버튼을 눌러 다운로드/검증 완료를 확인.
3. 첫 문장을 한국어 여성 음성으로 읽는지 확인. 음성 실패 시 라이브러리 및 모델 로딩 로그 점검.
4. 비행기 모드로 앱 완전 종료/재실행 후 추가 다운로드 0회 및 새 텍스트 음성 읽기 점검.
5. 장문 낭독 A2, 백그라운드 미디어 서비스는 이후 구현.
6. 실기검증에서 통과한 뒤에만 릴리스 서명 및 지속 가능한 설치 파일 배포 방식을 결정.
