# ConceptKnot v175 — Android A0 bootstrap checkpoint

> Date: 2026-11-14 · Track: Android first · Status: **A0 SOURCE IMPLEMENTED / ANDROID BUILD & DEVICE VERIFICATION PENDING**

## Baseline and boundaries

- Restored main HEAD 51d3c5a1add3c512ce6b2e4f040017a5ccae299e (v174).
- Sources of truth: V174_ANDROID_APK_MASTER_PLAN.md and V174_WEB_APP_PAUSE_AND_PRESERVATION.md.
- Web freeze checkpoint: b864fc2e04b70af09fe23ed15ae3cd39737896b0.
- Do not modify web code, the production deployment, official question data,
  existing study records, TTS web model manifests, or browser storage.
- Android is a true Kotlin/Compose app, not a WebView packaging of the paused site.

## Source delivered

1. Standalone Android Gradle project rooted at native/android-tts; :app module.
2. Pinned AGP 8.13.2 / Kotlin+Compose compiler 2.2.21 / Gradle 8.13 /
   Compose BOM 2025.10.00 / SDK 36, targeting 35, minimum 26.
3. Launcher manifest, Korean app label, vector owl launcher icon, basic accessible
   Compose vertical-scrolling homepage with truthful A0-A7 state descriptions.
4. Persisted local-only A0 screen acknowledgement (SharedPreferences).
5. Existing LocalReadingQueue.kt included as module source without edits or
   renaming. No sherpa-onnx model, network permission, or microphone permission.
6. JVM-level roadmap/queue regression tests and Android UI launch smoke-test source.
7. No new Actions workflow, APK, signing materials, or web deployment.

## Requirements -> source -> UI -> evidence

| Requirement | Source | UI / behavior | Evidence and state |
|---|---|---|---|
| A0 Gradle native project | settings.gradle.kts / build.gradle.kts / app/build.gradle.kts | Android Activity | Source prepared; Gradle compile **not executed** |
| Minimum native screen | MainActivity.kt / AndroidManifest.xml | Compose A0 status and stages | UI code prepared; emulator/device launch **not executed** |
| Preserve queue | v172 LocalReadingQueue.kt linked through sourceSets | TTS flagged pending; no fake install | Existing source unchanged; Kotlin-only test source |
| Preserve web/data | Only native/android-tts and this checkpoint touched | No WebView/browser-storage hooks | Compare tree/diff before push |
| Local data isolation | AndroidManifest.xml / SharedPreferences | Device-only setting toggle | Runtime persistence test pending |
| No premature APK/CI | Build scripts only | No install/download claims | No generated APK or new CI workflow |

## Environment and release gate

In this session Android SDK, Gradle executable, Gradle wrapper JAR and Android
hardware/emulator were unavailable; outbound git/network from the shell was not
available. The GitHub connector is used for source commits. A0 **cannot be marked
complete** before a genuine Gradle compilation and Android UI launch test.

A trusted Android dev environment must generate the official Gradle wrapper files
using Gradle 8.13. Validate gradle-wrapper.jar SHA-256 against Gradle's official
checksum (81a82aaea5abcc8ff68b3dfcb58b3c3c429378efd98e7433460610fecd7ae45f).
The Gradle 8.13 distribution SHA-256 is pinned in wrapper properties:
20f1b1176237254a6fc204d8434196fa11a4cfb387567519c61556e8710aed78.

Do not build/release an APK until explicitly requested for hands-on device testing.

## Next exact actions

1. Add/verify official Gradle wrapper, run Gradle sync, :app:compileDebugKotlin
   and :app:testDebugUnitTest.
2. Execute LaunchSmokeTest on Android hardware/emulator, test portrait/landscape
   and reopening the app with local-mark state retained.
3. Begin A1: inspect official sherpa-onnx Android TTS example/version, identify
   a licensed Korean female voice actually supported by that SDK, record model
   files/checksums/sizes and redistribution terms; *then* implement a consented,
   checksum-verified one-time installation using app-private storage.
4. Update the completion ledger only with test evidence. Preserve v174 plans
   as the immutable decision baseline; append further checkpoints instead.

## Source-level verification executed in this session

- Ran installed kotlinc-jvm 1.9.0 (JDK 21) against an isolated mirror of the unchanged v172 LocalReadingQueue and the new pure-Kotlin Roadmap model.
- Five assertions passed: stable A0–A7 identifiers, truthful pending statuses, skipping blank sentences, advancing the cursor after playback returns, and one transient-error retry.
- This **does not validate** the Android Gradle plugin, Compose build, instrumentation tests, sherpa-onnx, real audio output, or device execution. The mirror was used solely because no Android SDK/Gradle distribution was installed.
