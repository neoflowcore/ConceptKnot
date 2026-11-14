package org.conceptknot.app.tts

import java.io.FilterInputStream
import java.io.IOException
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

/** HTTPS release download with explicit GitHub CDN allowlisting. */
class ReleaseAssetSource : ArtifactSource {
    override fun open(url: String): InputStream {
        var current = URL(url)
        repeat(6) {
            if (current.protocol != "https" || !approvedHost(current.host))
                throw IOException("Untrusted model host")
            val conn = (current.openConnection() as HttpURLConnection).apply {
                instanceFollowRedirects = false
                connectTimeout = 15000
                readTimeout = 30000
                setRequestProperty("Accept", "application/octet-stream")
            }
            try {
                when (val status = conn.responseCode) {
                    HttpURLConnection.HTTP_OK ->
                        return object : FilterInputStream(conn.inputStream) {
                            override fun close() {
                                try { super.close() } finally { conn.disconnect() }
                            }
                        }
                    HttpURLConnection.HTTP_MOVED_PERM, HttpURLConnection.HTTP_MOVED_TEMP,
                    HttpURLConnection.HTTP_SEE_OTHER, 307, 308 -> {
                        val location = conn.getHeaderField("Location")
                            ?: throw IOException("Missing redirect Location")
                        current = URL(current, location)
                        conn.disconnect()
                    }
                    else -> throw IOException("Model download HTTP $status")
                }
            } catch (e: Exception) {
                conn.disconnect()
                throw e
            }
        }
        throw IOException("Too many redirects")
    }
    private fun approvedHost(host: String): Boolean =
        host.equals("github.com", ignoreCase = true) ||
        host.equals("release-assets.githubusercontent.com", ignoreCase = true) ||
        host.equals("objects.githubusercontent.com", ignoreCase = true)
}
