package org.conceptknot.app.tts

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import com.k2fsa.sherpa.onnx.GenerationConfig
import com.k2fsa.sherpa.onnx.OfflineTts
import com.k2fsa.sherpa.onnx.OfflineTtsConfig
import com.k2fsa.sherpa.onnx.OfflineTtsModelConfig
import com.k2fsa.sherpa.onnx.OfflineTtsSupertonicModelConfig
import java.io.Closeable
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import org.conceptknot.tts.LocalReadingQueue

/** sherpa-onnx 2.0.1; queue advances only when physical audio playback completes. */
class SupertonicReadingRenderer(
    private val directory: File,
    private val speed: Float = 1.5f,
) : LocalReadingQueue.Renderer, Closeable {
    private val lock = Any()
    private var tts: OfflineTts? = null
    @Volatile private var track: AudioTrack? = null
    @Volatile private var sampleRate = 24000

    override suspend fun synthesize(text: String): FloatArray =
        withContext(Dispatchers.Default) {
            currentCoroutineContext().ensureActive()
            synchronized(lock) {
                val engine = tts ?: openEngine().also { tts = it }
                val output = engine.generateWithConfig(
                    text, GenerationConfig(
                        sid = 0, // F1; ids 0..4 correspond to female voices F1..F5
                        speed = speed,
                        numSteps = 8,
                        extra = mapOf("lang" to "ko"),
                    )
                )
                check(output.samples.isNotEmpty()) { "Empty TTS output" }
                sampleRate = output.sampleRate
                output.samples
            }
        }

    private fun openEngine(): OfflineTts {
        fun file(name: String) = File(directory, name).absolutePath
        return OfflineTts(
            config = OfflineTtsConfig(
                model = OfflineTtsModelConfig(
                    supertonic = OfflineTtsSupertonicModelConfig(
                        durationPredictor = file("duration_predictor.int8.onnx"),
                        textEncoder = file("text_encoder.int8.onnx"),
                        vectorEstimator = file("vector_estimator.int8.onnx"),
                        vocoder = file("vocoder.int8.onnx"),
                        ttsJson = file("tts.json"),
                        unicodeIndexer = file("unicode_indexer.bin"),
                        voiceStyle = file("voice.bin"),
                    ),
                    numThreads = 2,
                    provider = "cpu",
                )
            )
        )
    }

    override suspend fun play(samples: FloatArray): Unit = withContext(Dispatchers.IO) {
        val minBytes = AudioTrack.getMinBufferSize(
            sampleRate, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_FLOAT
        )
        check(minBytes > 0) { "AudioTrack unsupported" }
        val speaker = AudioTrack(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build(),
            AudioFormat.Builder()
                .setEncoding(AudioFormat.ENCODING_PCM_FLOAT)
                .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                .setSampleRate(sampleRate)
                .build(),
            maxOf(minBytes, 8192),
            AudioTrack.MODE_STREAM,
            AudioManager.AUDIO_SESSION_ID_GENERATE,
        )
        track = speaker
        try {
            speaker.play()
            var sent = 0
            while (sent < samples.size) {
                currentCoroutineContext().ensureActive()
                val n = speaker.write(
                    samples, sent, minOf(2048, samples.size - sent), AudioTrack.WRITE_BLOCKING
                )
                check(n > 0) { "PCM write failed" }
                sent += n
            }
            // Blocking writes only fill buffers: wait for playback head to reach the last sample.
            while (speaker.playbackHeadPosition.toLong() < samples.size.toLong()) {
                currentCoroutineContext().ensureActive()
                check(speaker.playState == AudioTrack.PLAYSTATE_PLAYING)
                delay(10)
            }
        } finally {
            if (track === speaker) track = null
            try { speaker.pause(); speaker.flush() } catch (_: Exception) {}
            speaker.release()
        }
    }

    fun cancelPlayback() {
        track?.let { try { it.pause(); it.flush() } catch (_: Exception) {} }
    }

    override fun close() {
        cancelPlayback()
        synchronized(lock) { tts?.release(); tts = null }
    }
}
