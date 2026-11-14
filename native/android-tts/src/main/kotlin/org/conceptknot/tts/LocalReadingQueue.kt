package org.conceptknot.tts

/**
 * Native Android queue contract. The sherpa-onnx adapter must implement Renderer;
 * no Android SDK/model dependencies are assumed or silently downloaded here.
 * Each call completes only when audio playback has completed.
 */
class LocalReadingQueue(
    private val renderer: Renderer,
    private val maxRetries: Int = 2
) {
    interface Renderer {
        suspend fun synthesize(text: String): FloatArray
        suspend fun play(samples: FloatArray)
    }
    data class Progress(val position: Int, val total: Int, val state: State)
    enum class State { IDLE, READING, FAILED, FINISHED, STOPPED }
    private var sentences = emptyList<String>()
    private var position = 0
    private var epoch = 0
    private var state = State.IDLE
    fun progress() = Progress(position, sentences.size, state)
    fun stop() { epoch++; state = State.STOPPED }
    suspend fun read(parts: List<String>): Progress {
        stop()
        sentences = parts.filter { it.isNotBlank() }
        position = 0
        return resume()
    }
    suspend fun resume(): Progress {
        if (state != State.STOPPED && state != State.FAILED) return progress()
        val token = ++epoch
        state = State.READING
        while (position < sentences.size && token == epoch) {
            var succeeded = false
            for (attempt in 0..maxRetries.coerceIn(0, 4)) {
                if (token != epoch) break
                try {
                    val audio = renderer.synthesize(sentences[position])
                    if (token != epoch) break
                    renderer.play(audio)
                    if (token != epoch) break
                    position++
                    succeeded = true
                    break
                } catch (_: Exception) {
                    if (attempt == maxRetries.coerceIn(0, 4)) {
                        state = State.FAILED
                        return progress()
                    }
                }
            }
            if (!succeeded && token == epoch) {
                state = State.FAILED
                return progress()
            }
        }
        if (token == epoch) state = State.FINISHED
        return progress()
    }
}
