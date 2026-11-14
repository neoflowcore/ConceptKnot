# ConceptKnot v172 — Dual Local TTS Development Plan (Android + Brave)

## Decision
User explicitly chose **both** Android native application TTS and Android Brave browser TTS. This supersedes the earlier web-only/Android-later plan. Keep the existing ConceptKnot study website and all P4 data/OMR/notes intact. No APK/ZIP unless requested.

## One shared reading contract
`assets/ck-reading-queue-v172.js` is a platform-neutral, injected async reader. It accepts arbitrary text via a segmenter and a synthesis/playback pair, retries a failed segment a bounded number of times, never increments a cursor before playback resolves, preserves the failed cursor for explicit resume, and cancels stale in-flight audio. No remote TTS call or predownload occurs. Unit tests: `tests/v172-dual-tts-contract.test.cjs`.

## Two runtime targets
**Brave PWA:** retain current native SpeechSynthesis as working fallback. Integrate verified Supertonic ONNX + local CacheStorage/OPFS model persistence via existing v139 manager only when all model binaries and SHA-256 values are provided and validated. Current `models/tts/manifest.json` has `distributionReady:false`, null checksums/sizes, and cannot honestly install a model. Browser UI should expose an arbitrary text input, install progress, model verification and offline complete-read tests in the next batch.

**Android native:** build a small Kotlin app/foreground playback service using sherpa-onnx Android API and a compatible licensed Korean TTS model, rather than shipping a WebView-only APK. Keep model weights in app-specific storage and expose one-time import/download, hash verification, resume state, media controls, and a bridge into ConceptKnot study content. The sherpa-onnx model format differs from Supertonic: share **text, queue semantics, user-facing settings, progress**, not model binaries or ONNX runtime assumptions. Native inference must be tested against the actual upstream Android SDK before marking functional. Kotlin/Gradle/SDK toolchain and actual APK have not yet been verified or generated.

## Acceptance gates
1. Download each platform's model once, verify SHA-256, restart offline and verify no network requests.
2. Read arbitrary Korean text, including 40 questions and long pasted passages, without skips; synthesize next segment ahead of playback if resources permit.
3. Force error in segment N: bounded retries and user-resume from N; cancel must not emit stale audio.
4. Korean law/article numbering, real-estate math, female voice, 1.5x, and mobile memory/audio quality measured on actual Android Brave and native device.
5. Preserve notes, official question text and grading; avoid cloud TTS uploads without explicit consent.

## Delivery status
Shared queue + tests: code authored, actual Node test results pending.
Browser neural model installation: BLOCKED by unhosted/unchecked model files, no fake success.
Android sherpa-onnx inference: PLANNED, not implemented or device-verified.
No new paid infrastructure, model hosting, APK, automatic CI or deployment enabled.
