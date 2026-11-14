# Android native source staging (v172)

This directory contains the shared Kotlin **queue contract**, not an APK and not a completed sherpa-onnx Android integration. `LocalReadingQueue.Renderer` must be backed by the real sherpa-onnx Android API (verified against the exact SDK release) and an audio output that completes on playback end. The renderer must support cancellation and a foreground media service for background reading. The current queue is a starting point; its coroutine cancellation and audio output shutdown need device testing before use. Never label this an installed offline model.

No Gradle wrapper, downloaded model, APK, signing key or GitHub Action is included. Next: pin a tested sherpa-onnx version, select a licensed Korean female model, add a native Gradle module and instrumented tests, then validate on Android hardware.
