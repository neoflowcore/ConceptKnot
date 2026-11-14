package org.conceptknot.app.tts

import java.io.File
import java.io.IOException
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream

/** Read only the model allowlist and reject traversal, tar links and bombs. */
class SafeTarBz2Extractor : ArchiveExtractor {
    override fun extract(archive: File, destination: File, spec: ModelSpec) {
        val required = spec.requiredFiles.toSet()
        val found = HashSet<String>()
        val prefix = spec.archiveRoot + "/"
        val root = destination.canonicalFile.toPath()
        var entries = 0
        var expanded = 0L
        TarArchiveInputStream(
            BZip2CompressorInputStream(archive.inputStream().buffered())
        ).use { tar ->
            while (true) {
                val entry = tar.nextTarEntry ?: break
                if (++entries > 64) throw IOException("Too many archive entries")
                if (entry.isSymbolicLink || entry.isLink) throw IOException("Archive link refused")
                val path = entry.name.removePrefix("./")
                if (path.startsWith("/") || path.contains('\\') ||
                    path.split('/').any { it == ".." || it == "." }
                ) throw IOException("Unsafe archive path")
                if (entry.isDirectory) continue
                if (!entry.isFile || !path.startsWith(prefix))
                    throw IOException("Unsupported archive member")
                val relative = path.removePrefix(prefix)
                if (relative !in required) {
                    if (entry.size < 0 || entry.size > 4L * 1024 * 1024)
                        throw IOException("Unexpected archive member")
                    continue
                }
                if (!found.add(relative)) throw IOException("Duplicate model entry")
                if (entry.size <= 0L || entry.size > 256L * 1024 * 1024)
                    throw IOException("Invalid model member size")
                expanded += entry.size
                if (expanded > 512L * 1024 * 1024)
                    throw IOException("Archive expansion limit")
                val output = File(destination, relative).canonicalFile
                if (!output.toPath().startsWith(root))
                    throw IOException("Archive traversal")
                output.outputStream().buffered().use { sink ->
                    val buf = ByteArray(65536)
                    var left = entry.size
                    while (left > 0) {
                        val n = tar.read(buf, 0, minOf(left, buf.size.toLong()).toInt())
                        if (n < 0) throw IOException("Truncated model entry")
                        sink.write(buf, 0, n)
                        left -= n
                    }
                }
            }
        }
        if (found != required) throw IOException("Missing model entries: " + (required - found))
    }
}
