package org.conceptknot.app.tts

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Test

/**
 * Optional developer-side integration check. Does not download or bundle the model;
 * provide CONCEPTKNOT_MODEL_ARCHIVE to test exact official archive extraction.
 */
class OfficialArchiveIntegrationTest {
    @Test fun officialArchiveUnpacksAndNeverRedownloadsOnValidRestart() {
        val fixture = System.getenv("CONCEPTKNOT_MODEL_ARCHIVE")
        assumeTrue("Opt-in model fixture not supplied", fixture != null)
        val archive = File(fixture ?: "")
        assumeTrue(archive.isFile)
        val output = createTempDir(prefix = "ck-real-supertonic")
        var opened = 0
        try {
            val installer = ModelInstallCore(
                output,
                ArtifactSource { opened++; archive.inputStream() },
                SafeTarBz2Extractor()
            )
            val installed = installer.install(SupertonicModel.spec)
            assertEquals(1, opened)
            assertTrue(SupertonicModel.spec.requiredFiles.all { File(installed, it).isFile })
            val restored = installer.installedDirectory(SupertonicModel.spec)
            assertEquals(installed.canonicalPath, restored?.canonicalPath)
            installer.install(SupertonicModel.spec)
            assertEquals(1, opened)
        } finally {
            output.deleteRecursively()
        }
    }
}
