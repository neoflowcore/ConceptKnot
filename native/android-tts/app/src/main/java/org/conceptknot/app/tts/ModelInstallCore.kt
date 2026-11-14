package org.conceptknot.app.tts

import java.io.File
import java.io.IOException
import java.io.InputStream
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.security.MessageDigest
import java.util.Properties

/** Immutable release asset specification. */
data class ModelSpec(
    val id: String,
    val downloadUrl: String,
    val expectedBytes: Long,
    val archiveSha256: String,
    val archiveRoot: String,
    val requiredFiles: List<String>,
) {
    init {
        require(id.matches(Regex("[a-zA-Z0-9._-]{1,90}")))
        require(archiveRoot.matches(Regex("[a-zA-Z0-9._-]{1,130}")))
        require(downloadUrl.startsWith("https://"))
        require(expectedBytes > 0L && archiveSha256.matches(Regex("[a-f0-9]{64}")))
        require(requiredFiles.isNotEmpty() && requiredFiles.distinct().size == requiredFiles.size)
        require(requiredFiles.all { it.matches(Regex("[a-zA-Z0-9._-]{1,100}")) })
    }
}
object SupertonicModel {
    // Official release digest and content length from k2-fsa/sherpa-onnx tts-models asset.
    val spec = ModelSpec(
        "supertonic-3-int8-2026-05-11",
        "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/sherpa-onnx-supertonic-3-tts-int8-2026-05-11.tar.bz2",
        128774318L,
        "82fa96f91c4ef8abaae3a14a3f4153facf88bed821d1f7331cec2700f432c427",
        "sherpa-onnx-supertonic-3-tts-int8-2026-05-11",
        listOf("duration_predictor.int8.onnx", "text_encoder.int8.onnx",
            "vector_estimator.int8.onnx", "vocoder.int8.onnx", "tts.json",
            "unicode_indexer.bin", "voice.bin"),
    )
}
fun interface ArtifactSource { fun open(url: String): InputStream }
fun interface ArchiveExtractor { fun extract(archive: File, destination: File, spec: ModelSpec) }

/** No network calls on restart: installed assets are rehashed against a receipt. */
class ModelInstallCore(
    private val storage: File,
    private val source: ArtifactSource,
    private val extractor: ArchiveExtractor,
) {
    private val lock = Any()
    fun installedDirectory(spec: ModelSpec): File? = synchronized(lock) {
        val dir = File(storage, spec.id)
        val receipt = File(dir, "receipt.properties")
        if (!receipt.isFile) return@synchronized null
        val p = Properties()
        try {
            receipt.inputStream().use { p.load(it) }
            if (p.getProperty("id") != spec.id ||
                p.getProperty("archiveSha256") != spec.archiveSha256 ||
                p.getProperty("expectedBytes") != spec.expectedBytes.toString()
            ) return@synchronized null
            for (name in spec.requiredFiles) {
                val f = File(dir, name)
                if (!f.isFile || f.length() == 0L ||
                    p.getProperty("hash.$name") != sha256Hex(f)
                ) return@synchronized null
            }
            dir
        } catch (_: IOException) { null } catch (_: IllegalArgumentException) { null }
    }

    /** Blocking, call on Dispatchers.IO. Valid installations never download twice. */
    fun install(
        spec: ModelSpec,
        onProgress: (Long, Long) -> Unit = { _, _ -> },
        shouldContinue: () -> Boolean = { true },
    ): File = synchronized(lock) {
        installedDirectory(spec)?.let { return@synchronized it }
        check(storage.isDirectory || storage.mkdirs())
        val part = File(storage, "." + spec.id + ".part")
        val stage = File(storage, "." + spec.id + ".staging")
        val final = File(storage, spec.id)
        if (part.exists()) check(part.delete())
        if (stage.exists()) check(stage.deleteRecursively())
        check(stage.mkdirs())
        var installed = false
        try {
            val sha = MessageDigest.getInstance("SHA-256")
            var count = 0L
            source.open(spec.downloadUrl).use { input ->
                part.outputStream().buffered().use { out ->
                    val buf = ByteArray(65536)
                    while (true) {
                        if (!shouldContinue()) throw InterruptedException("Download cancelled")
                        val n = input.read(buf)
                        if (n < 0) break
                        count += n
                        if (count > spec.expectedBytes) throw IOException("Oversized archive")
                        sha.update(buf, 0, n)
                        out.write(buf, 0, n)
                        onProgress(count, spec.expectedBytes)
                    }
                }
            }
            if (!shouldContinue()) throw InterruptedException("Download cancelled")
            if (count != spec.expectedBytes) throw IOException("Truncated model download")
            if (sha.digest().joinToString("") { "%02x".format(it) } != spec.archiveSha256)
                throw IOException("SHA-256 mismatch")
            extractor.extract(part, stage, spec)
            val p = Properties()
            p.setProperty("id", spec.id)
            p.setProperty("archiveSha256", spec.archiveSha256)
            p.setProperty("expectedBytes", spec.expectedBytes.toString())
            for (name in spec.requiredFiles) {
                val f = File(stage, name)
                if (!f.isFile || f.length() == 0L) throw IOException("Missing model: $name")
                p.setProperty("hash.$name", sha256Hex(f))
            }
            File(stage, "receipt.properties").outputStream().use {
                p.store(it, "SHA-256 verified; app private, no personal data")
            }
            if (!shouldContinue()) throw InterruptedException("Installation cancelled")
            if (final.exists() && !final.deleteRecursively())
                throw IOException("Unable to replace corrupted install")
            Files.move(stage.toPath(), final.toPath(), StandardCopyOption.ATOMIC_MOVE)
            installed = true
            final
        } finally {
            part.delete()
            if (!installed) stage.deleteRecursively()
        }
    }
    companion object {
        fun sha256Hex(f: File): String {
            val sha = MessageDigest.getInstance("SHA-256")
            f.inputStream().buffered().use {
                val b = ByteArray(65536)
                while (true) {
                    val n = it.read(b)
                    if (n < 0) break
                    sha.update(b, 0, n)
                }
            }
            return sha.digest().joinToString("") { "%02x".format(it) }
        }
    }
}
