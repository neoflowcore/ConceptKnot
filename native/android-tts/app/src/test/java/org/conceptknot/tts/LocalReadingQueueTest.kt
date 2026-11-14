package org.conceptknot.tts

import kotlin.coroutines.Continuation
import kotlin.coroutines.EmptyCoroutineContext
import kotlin.coroutines.startCoroutine
import org.junit.Assert.assertEquals
import org.junit.Test

class LocalReadingQueueTest {
    @Test fun playbackCompletionMovesTheCursor() {
        val played = mutableListOf<Float>()
        val queue = LocalReadingQueue(object : LocalReadingQueue.Renderer {
            override suspend fun synthesize(text: String): FloatArray =
                floatArrayOf(text.length.toFloat())
            override suspend fun play(samples: FloatArray) {
                played.add(samples.single())
            }
        })

        val result = immediately { queue.read(listOf("첫 문장", " ", "둘째 문장")) }
        assertEquals(LocalReadingQueue.State.FINISHED, result.state)
        assertEquals(2, result.position)
        assertEquals(2, result.total)
        assertEquals(2, played.size)
    }

    @Test fun aFailedSynthesisRetriesTheSamePosition() {
        var attempts = 0
        val queue = LocalReadingQueue(object : LocalReadingQueue.Renderer {
            override suspend fun synthesize(text: String): FloatArray {
                attempts++
                if (attempts == 1) error("transient failure")
                return floatArrayOf(0.1f)
            }
            override suspend fun play(samples: FloatArray) = Unit
        }, maxRetries = 1)

        val result = immediately { queue.read(listOf("retry me")) }
        assertEquals(LocalReadingQueue.State.FINISHED, result.state)
        assertEquals(1, result.position)
        assertEquals(2, attempts)
    }

    private fun <T> immediately(block: suspend () -> T): T {
        var result: Result<T>? = null
        block.startCoroutine(object : Continuation<T> {
            override val context = EmptyCoroutineContext
            override fun resumeWith(value: Result<T>) { result = value }
        })
        return requireNotNull(result) { "Test renderer must not suspend asynchronously" }.getOrThrow()
    }
}
