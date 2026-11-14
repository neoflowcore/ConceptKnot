package org.conceptknot.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.conceptknot.app.tts.ModelInstallCore
import org.conceptknot.app.tts.ReleaseAssetSource
import org.conceptknot.app.tts.SafeTarBz2Extractor
import org.conceptknot.app.tts.SupertonicModel
import org.conceptknot.app.tts.SupertonicReadingRenderer
import org.conceptknot.tts.LocalReadingQueue

/**
 * No auto-download. Clicking install is explicit consent. Hash checks operate
 * locally; after an installed model is verified, airplane mode is supported.
 */
@Composable
fun OfflineVoicePanel() {
    val context = LocalContext.current
    val installer = remember(context) {
        ModelInstallCore(
            File(context.filesDir, "tts/models"),
            ReleaseAssetSource(),
            SafeTarBz2Extractor()
        )
    }
    val scope = rememberCoroutineScope()
    var modelDir by remember { mutableStateOf<File?>(null) }
    var status by remember { mutableStateOf("저장된 모델 확인 중") }
    var progress by remember { mutableStateOf(0) }
    var installing by remember { mutableStateOf(false) }
    var reading by remember { mutableStateOf(false) }
    var sample by remember { mutableStateOf("부동산학개론의 수요와 공급을 이해해 봅시다.") }
    var installJob by remember { mutableStateOf<Job?>(null) }
    var readJob by remember { mutableStateOf<Job?>(null) }
    var renderer by remember { mutableStateOf<SupertonicReadingRenderer?>(null) }

    LaunchedEffect(installer) {
        modelDir = withContext(Dispatchers.IO) {
            installer.installedDirectory(SupertonicModel.spec)
        }
        status = if (modelDir != null) "설치 확인 완료 · 오프라인 사용 가능"
                 else "음성 모델 미설치"
    }
    DisposableEffect(Unit) {
        onDispose {
            installJob?.cancel()
            readJob?.cancel()
            renderer?.cancelPlayback()
            // Renderer is closed by playback coroutine after cancellation.
        }
    }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text("A1 · 한국어 오프라인 AI 음성")
            Text("Supertonic 3 · 여성 F1 · 기본 1.5배속")
            Text(status)
            if (installing) LinearProgressIndicator(
                progress = { progress / 100f },
                modifier = Modifier.fillMaxWidth()
            )
            if (installing) Text("다운로드 및 검증 · $progress%")
            if (modelDir == null) {
                Text(
                    "모델 약 129MB를 처음 한 번 내려받습니다. 명시적으로 설치를 선택해야 다운로드가 시작됩니다. 앱 업데이트 후에도 로컬에 보관되지만 앱 삭제·데이터 초기화 시 사라집니다."
                )
                Row {
                    Button(
                        enabled = !installing,
                        onClick = {
                            installing = true
                            progress = 0
                            status = "다운로드 진행 중"
                            installJob = scope.launch(Dispatchers.IO) {
                                try {
                                    var last = -1
                                    val installed = installer.install(
                                        SupertonicModel.spec,
                                        onProgress = { bytes, total ->
                                            val percent = (bytes * 100 / total).toInt()
                                            if (percent != last) {
                                                last = percent
                                                progress = percent
                                            }
                                        },
                                        shouldContinue = { isActive },
                                    )
                                    withContext(Dispatchers.Main) {
                                        modelDir = installed
                                        status = "SHA-256 검증 완료 · 오프라인 사용 가능"
                                    }
                                } catch (e: Exception) {
                                    withContext(Dispatchers.Main) {
                                        status = "설치 중단: " + (e.message ?: "다시 시도하세요")
                                    }
                                } finally {
                                    withContext(Dispatchers.Main) { installing = false }
                                }
                            }
                        }
                    ) { Text("모델 1회 설치") }
                    if (installing) TextButton(onClick = { installJob?.cancel() }) {
                        Text("취소")
                    }
                }
            } else {
                OutlinedTextField(
                    value = sample, onValueChange = { sample = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("읽을 한국어 문장") },
                    minLines = 2, maxLines = 5,
                )
                Row {
                    Button(
                        enabled = !reading && sample.isNotBlank(),
                        onClick = {
                            val model = modelDir ?: return@Button
                            reading = true
                            status = "기기에서 음성 합성·재생 중"
                            readJob = scope.launch(Dispatchers.IO) {
                                val engine = SupertonicReadingRenderer(model)
                                renderer = engine
                                try {
                                    val queue = LocalReadingQueue(engine)
                                    val result = queue.read(listOf(sample))
                                    withContext(Dispatchers.Main) {
                                        status = if (result.state == LocalReadingQueue.State.FINISHED)
                                            "낭독 완료" else "낭독 상태: " + result.state
                                    }
                                } catch (e: Exception) {
                                    withContext(Dispatchers.Main) {
                                        status = "낭독 오류: " + (e.message ?: "확인 필요")
                                    }
                                } finally {
                                    engine.close()
                                    renderer = null
                                    withContext(Dispatchers.Main) { reading = false }
                                }
                            }
                        }
                    ) { Text("오프라인 읽기") }
                    if (reading) TextButton(onClick = {
                        renderer?.cancelPlayback()
                        readJob?.cancel()
                        status = "낭독 중지"
                    }) { Text("중지") }
                }
            }
            Text("합성 음성은 AI 생성 콘텐츠입니다. 모델 라이선스: OpenRAIL-M. 개인 학습용이며 모델 이용 제한이 적용됩니다.")
            Text("기본 모델과 문장은 외부 TTS 서버에 전송하지 않습니다.")
        }
    }
}
