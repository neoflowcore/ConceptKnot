package org.conceptknot.app.tts

import java.io.ByteArrayInputStream
import java.io.File
import java.io.IOException
import java.security.MessageDigest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ModelInstallCoreTest {
    private fun hash(bytes: ByteArray) =
        MessageDigest.getInstance("SHA-256").digest(bytes)
            .joinToString("") { "%02x".format(it) }

    private fun spec(bytes: ByteArray): ModelSpec = ModelSpec(
        "mock-model-1",
        "https://github.com/example/mock-model",
        bytes.size.toLong(),
        hash(bytes),
        "mock-root",
        listOf("model.onnx")
    )

    @Test fun verifiedInstallSurvivesRestartWithoutDownloadingAgain() {
        val bytes = "trusted archive".toByteArray()
        val root = createTempDir(prefix = "ck-model")
        var downloads = 0
        val source = ArtifactSource { downloads++; ByteArrayInputStream(bytes) }
        val extract = ArchiveExtractor { _, dest, _ ->
            File(dest, "model.onnx").writeText("valid weights")
        }
        try {
            val first = ModelInstallCore(root, source, extract).install(spec(bytes))
            assertEquals(1, downloads)
            val second = ModelInstallCore(root, source, extract).install(spec(bytes))
            assertEquals(first.canonicalPath, second.canonicalPath)
            assertEquals(1, downloads)
            assertNotNull(ModelInstallCore(root, source, extract).installedDirectory(spec(bytes)))
        } finally { root.deleteRecursively() }
    }

    @Test fun modifiedModelForcesFreshVerifiedDownload() {
        val bytes = "trusted archive".toByteArray()
        val root = createTempDir(prefix = "ck-model")
        var downloads = 0
        val source = ArtifactSource { downloads++; ByteArrayInputStream(bytes) }
        val extract = ArchiveExtractor { _, dest, _ ->
            File(dest, "model.onnx").writeText("valid weights")
        }
        try {
            val installer = ModelInstallCore(root, source, extract)
            File(installer.install(spec(bytes)), "model.onnx").writeText("tampered!")
            assertNull(installer.installedDirectory(spec(bytes)))
            installer.install(spec(bytes))
            assertEquals(2, downloads)
        } finally { root.deleteRecursively() }
    }

    @Test fun mismatchedDigestNeverLeavesInstalledModel() {
        val bytes = "trusted archive".toByteArray()
        val root = createTempDir(prefix = "ck-model")
        try {
            val installer = ModelInstallCore(
                root,
                ArtifactSource { ByteArrayInputStream("other payload".toByteArray()) },
                ArchiveExtractor { _, _, _ -> error("must not extract") }
            )
            try { installer.install(spec(bytes)); error("checksum should fail") }
            catch (_: IOException) {}
            assertNull(installer.installedDirectory(spec(bytes)))
            assertFalse(File(root, ".mock-model-1.part").exists())
        } finally { root.deleteRecursively() }
    }

    @Test fun cancellationLeavesNoInstalledReceipt() {
        val bytes = "trusted archive".toByteArray()
        val root = createTempDir(prefix = "ck-model")
        try {
            val installer = ModelInstallCore(
                root, ArtifactSource { ByteArrayInputStream(bytes) },
                ArchiveExtractor { _, _, _ -> error("must not extract") }
            )
            try { installer.install(spec(bytes), shouldContinue = { false }); error("expected cancel") }
            catch (_: InterruptedException) {}
            assertNull(installer.installedDirectory(spec(bytes)))
            assertFalse(File(root, ".mock-model-1.staging").exists())
        } finally { root.deleteRecursively() }
    }

    @Test fun releaseManifestIsPinnedAndOfflineByDefault() {
        val s = SupertonicModel.spec
        assertEquals(128774318L, s.expectedBytes)
        assertEquals(64, s.archiveSha256.length)
        assertTrue(s.downloadUrl.startsWith("https://github.com/"))
        assertEquals(7, s.requiredFiles.size)
    }
}
