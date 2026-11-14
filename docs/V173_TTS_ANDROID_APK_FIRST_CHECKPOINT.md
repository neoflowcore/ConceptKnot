# ConceptKnot v173 — TTS Android APK first (decision checkpoint)

**Decision date:** 2026-11-14
**Status:** Android native TTS ACTIVE / Brave neural TTS PAUSED.
**Reason:** User explicitly suspended further Brave/web-app TTS development and prioritized Android APK implementation. This supersedes v172's equal-priority dual-platform plan. This does **not** mean deleting the existing website or disabling its current speech fallback.

## Scope boundaries
- **Continue:** Android Kotlin native TTS engine with sherpa-onnx, licensed Korean model, offline install/verification, arbitrary-text reading, sentence queue, pause/resume, foreground service and media controls, study-content integration, Android device tests.
- **Pause:** Brave Supertonic model hosting/download, OPFS/CacheStorage neural TTS work, browser-specific neural synthesis UI, browser-only TTS optimization. Retain existing web code and tests without feature expansion.
- **Preserve:** ConceptKnot P4 MVP, official questions, analyses, charts, existing web deployment and fallback speech. No web feature deletion, no forced production redeployment.
- **Package restriction:** No APK/ZIP creation until user requests a device-validation/install artifact. Source implementation and source-level tests are allowed.

## Implementation phases
1. Pin upstream sherpa-onnx Android SDK release and compatible licensed Korean female voice; record source, model size, checksum, performance limits and redistribution conditions.
2. Add native Gradle application and adapter behind `LocalReadingQueue.Renderer`; provide app-specific storage, explicit model install, integrity checks and no repeat downloads.
3. Implement text ingestion from ConceptKnot question/explanation screens, law/math pronunciation normalization, 1.5x playback, state persistence, long-text segmentation, failure recovery and background audio controls.
4. Run source-level tests, Android instrumented tests and real-device offline/long-read/memory tests. Build an APK **only** when requested for hands-on verification.
5. Revisit Brave neural TTS only after explicit reprioritization.

## Current evidence (not claims of finished native TTS)
- Commit `edabc51f43ad93119dee691ebc4df7b1a1ea8377`: shared JavaScript reading queue, Kotlin native queue contract, v172 tests and plan.
- Vercel preview build for that commit: Node test suite **88 passed, 0 failed**; this does **not** verify Kotlin compilation, Android SDK integration, model operation, or device playback.
- `native/android-tts/` is a source staging area, **not** an installable Android project yet.
- `models/tts/manifest.json` has `distributionReady:false`; do not imply neural voice model installation works.
- Android source/SDK verification, device tests, APK, and production deployment: **not completed**.

## Resume rule
The next coding session must begin with **Android native sherpa-onnx** work, not Brave neural TTS. Do not change website functionality while implementing the native runtime unless required for a carefully scoped content bridge. Reconcile this checkpoint with latest main before changing code.
