# ConceptKnot Android native application (A0 source bootstrap)

This directory is the **Android Gradle project root**, not a WebView wrapper.
The v172 Kotlin queue remains at
[src/main/kotlin/org/conceptknot/tts/LocalReadingQueue.kt](src/main/kotlin/org/conceptknot/tts/LocalReadingQueue.kt)
and is referenced by the app module's main source set without copying it.

## A0 configuration

- Module: app, package: org.conceptknot.android, native Kotlin + Jetpack Compose.
- Android Gradle Plugin 8.13.2, Kotlin/Compose compiler 2.2.21, Gradle 8.13, JDK 17.
- compileSdk 36, targetSdk 35, minSdk 26; Compose BOM 2025.10.00.
- Local confirmation is stored only in app-private SharedPreferences. No web storage is accessed.
- AndroidManifest contains no INTERNET permission. No neural model has been installed.
- No web source or PWA deployment is modified by this phase.

## Build/test status

**Gradle/Android SDK and device execution are not available in the development session that created this source.**
Source-level Kotlin validation is separate from a genuine Android build and is not sufficient to
declare A0 complete. No APK, artifact or CI workflow is created.

The distribution checksum is pinned in gradle/wrapper/gradle-wrapper.properties, but
the standard Gradle wrapper scripts/JAR could not be generated in this environment.
To finish bootstrapping on a trusted Android development machine, use a local Gradle
installation to generate the *official* wrapper (Gradle 8.13), verify its JAR against
https://gradle.org/release-checksums/ (expected Gradle 8.13 wrapper checksum:
81a82aaea5abcc8ff68b3dfcb58b3c3c429378efd98e7433460610fecd7ae45f),
then commit the generated wrapper files. Do not substitute an unverified downloaded JAR.

After the wrapper is in place, sync the native/android-tts project in Android Studio,
run :app:compileDebugKotlin and :app:testDebugUnitTest, and run the
LaunchSmokeTest instrumentation on a real/emulated Android device. Only create an
APK when the user explicitly requests a device-validation/install artifact.

## Roadmap

- A0: source scaffolding added; actual Gradle compilation and device launch pending.
- A1: verify a Korean female sherpa-onnx-compatible voice, redistribution license,
  official SDK API and exact checksums; then implement local model installation.
- A2-A7: see [Android master plan](../../docs/V174_ANDROID_APK_MASTER_PLAN.md).
- Web: see [preservation policy](../../docs/V174_WEB_APP_PAUSE_AND_PRESERVATION.md).

Current checkpoint: [V175](../../docs/V175_ANDROID_A0_BOOTSTRAP_CHECKPOINT.md).
