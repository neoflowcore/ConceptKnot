# ConceptKnot v176 — Android A0/A1 checkpoint
Date: 2026-11-14. Base main: d0f4922d8cb0838eaa742f1b9ba17f4afb33e9f2.
Governed by v174 Android master plan and web preservation policy.

## A0 results and proof
- Official Gradle 8.13 distribution SHA-256 verified:
  20f1b1176237254a6fc204d8434196fa11a4cfb387567519c61556e8710aed78.
- Official Gradle wrapper scripts and binary included; wrapper JAR SHA-256 verified:
  81a82aaea5abcc8ff68b3dfcb58b3c3c429378efd98e7433460610fecd7ae45f.
- JDK 17, Android SDK 36, Android build-tools 35 installed in independent verifier.
- Initial isolated sandbox stopped after compile began; its final exit was unavailable.
- A fresh independent Android environment then successfully ran
  ./gradlew :app:compileDebugKotlin :app:testDebugUnitTest --no-daemon.
  Final process exit code 0, BUILD SUCCESSFUL. **9/9 regular JVM tests passed**.
- The full source (including A1 TTS SDK adapter and Compose screen) compiled with AGP 8.13.2,
  Kotlin 2.2.21, verified Gradle 8.13 wrapper and official v2.0.1 Android AAR.
- No APK, AAB, signing key or new CI workflow created.

## A1 implementation
- sherpa-onnx v2.0.1 Android API and Supertonic 3 INT8 Korean F1 female speaker id 0.
- Official AAR: 49441341 bytes / SHA-256:
  a8d09d1d32f3eb8520482c6d3d43fae674681c5b050385967c70a3c2c9bf0ee7.
- Official model archive: 128774318 bytes / SHA-256:
  82fa96f91c4ef8abaae3a14a3f4153facf88bed821d1f7331cec2700f432c427.
  The archive was independently downloaded, hashed, and members inspected.
- Android ModelInstallCore accepts the model only after exact SHA/size verification.
- Safe tar.bz2 extraction and a hashed receipt, staged atomic rename, restart integrity
  check, re-download skip, and recovery from corrupt or incomplete installations.
- Compose installation button is explicit opt-in, progress/cancel shown, local text demo.
- Renderer binds to verified sherpa-onnx OfflineTts.generateWithConfig, Korean voice
  style 0 and Android AudioTrack, with intended playback completion tracking.
- JVM tests cover no duplicate download, tampering, mismatched SHA and cancellation:
  ModelInstallCoreTest 5, RoadmapTest 2, LocalReadingQueueTest 2; all passed.
- An opt-in OfficialArchiveIntegrationTest was executed with the exact official downloaded
  model archive. **1 test passed (0 skipped/errors)** in 20.338 seconds:
  SHA-256 and length, real tar.bz2 extraction, seven files, verified receipt,
  re-hash on restart, and no duplicate download. Full Gradle run BUILD SUCCESSFUL.
- Total unique tests evidenced across the standard and fixture-based runs: **10 passed**.

## Requirements-to-evidence status
A0 Wrapper: verified source/binary. A0 compiled Android app: PASSED (Gradle exit 0).
A1 model archive and Android API: verified official artifacts and configuration.
A1 app source, install handling and preview UI: compiled and JVM-tested. Real model
archive extraction and one-time install independently passed in a JVM fixture test.
A1 actual device synthesis/playback and offline reopen: NOT YET VERIFIED.
Web code, question data, Vercel deploy: untouched. No APK artifacts requested or built.

## Next validation
1. Real Android device: opt-in initial model download, audible Korean speech, airplane-mode relaunch.
2. Verify interruption recovery and zero network requests on app restart with a network logger.
3. Measure voice quality, first synthesis latency, battery/RAM, audio cancellation.
4. A2 follows: long reading and foreground media service; APK only at authorized hands-on gate.
