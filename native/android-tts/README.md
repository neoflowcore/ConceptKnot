# ConceptKnot Android native APK — A0/A1

Root: native/android-tts. Kotlin + Jetpack Compose, not a WebView. The paused Brave website and its study data remain untouched.

## Build
- JDK 17, Android SDK 36 / build-tools 35.0.0.
- Gradle Wrapper 8.13 (official JAR checksum 81a82aaea5abcc8ff68b3dfcb58b3c3c429378efd98e7433460610fecd7ae45f).
- Android Gradle Plugin 8.13.2 / Kotlin 2.2.21.
- First execute: sh scripts/prepare-sherpa-sdk.sh
- Then execute: ./gradlew :app:compileDebugKotlin :app:testDebugUnitTest --no-daemon
- No APK or automatic Actions workflow should be produced before device validation authorization.

## Native local voice A1
Model: Supertonic 3 INT8 Korean, female F1 / sid 0, preview default 1.5x speed.
Official archive size 128774318 bytes, SHA-256 82fa96f91c4ef8abaae3a14a3f4153facf88bed821d1f7331cec2700f432c427.
Official sherpa-onnx Android AAR v2.0.1 is 49441341 bytes,
SHA-256 a8d09d1d32f3eb8520482c6d3d43fae674681c5b050385967c70a3c2c9bf0ee7.
The setup script downloads the AAR to app/libs and verifies its digest; the binary is ignored by git.

The model download starts ONLY when the user selects the install button. The app verifies
the size and archive digest before extracting seven named files to staged app-private
storage. A per-file digest receipt is written and the verified directory is promoted
atomically. Existing matching versions are fully rehashed without making a network call.
Partial installs and failed downloads are not marked as successful.
A valid model persists over ordinary app restarts and updates. Uninstall or data clearing
removes it; it is not a cloud backup or permanent through uninstall.

Read test text is processed locally through sherpa-onnx native Android APIs. The UI
identifies AI-generated speech and cites the OpenRAIL-M terms. Model weight terms:
https://github.com/supertone-oss-archive/supertonic
https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models

A1 does not yet provide the full A2 background media service, audio-focus handling,
40-question continuous real-device playback or verified mobile speech performance.
See ../../docs/V176_ANDROID_A0_A1_CHECKPOINT.md.
