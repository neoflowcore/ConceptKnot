package org.conceptknot.app

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

private val background = Color(0xFF101713)
private val surface = Color(0xFF1C2720)
private val lime = Color(0xFFC5EE88)
private val secondaryText = Color(0xFFB0BCAF)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = lime,
                    onPrimary = background,
                    background = background,
                    onBackground = Color(0xFFF3F5EF),
                    surface = surface,
                    onSurface = Color(0xFFF3F5EF)
                )
            ) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    ConceptKnotHome()
                }
            }
        }
    }
}

@Composable
fun ConceptKnotHome() {
    val context = LocalContext.current
    val preferences = remember(context) {
        context.getSharedPreferences("conceptknot_android_a0", Context.MODE_PRIVATE)
    }
    var localMark by remember { mutableStateOf(preferences.getBoolean("local_mark", false)) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(background)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "ConceptKnot",
            style = MaterialTheme.typography.headlineMedium,
            color = lime,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "공인중개사 1차 · Android 네이티브",
            style = MaterialTheme.typography.bodyMedium,
            color = secondaryText
        )
        Card(
            colors = CardDefaults.cardColors(containerColor = surface),
            shape = RoundedCornerShape(20.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("A0 · Android 기본 화면", color = lime, fontWeight = FontWeight.Bold)
                Text(
                    "웹뷰가 아닌 Kotlin·Compose 학습 앱의 출발점입니다.",
                    style = MaterialTheme.typography.bodyLarge
                )
                Text(
                    "Android 네이티브 기반과 A1 로컬 TTS 모델 설치 기능을 연결했습니다. 실제 기기 낭독 검증은 별도 단계입니다.",
                    style = MaterialTheme.typography.bodySmall,
                    color = secondaryText
                )
            }
        }

        OfflineVoicePanel()

        Text("개발 단계", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Roadmap.stages.forEach { stage -> StageRow(stage) }
        }

        HorizontalDivider(color = Color(0xFF35443B))
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text("이 기기에서 준비 화면 확인", fontWeight = FontWeight.SemiBold)
                Text(
                    if (localMark) "확인 선택 저장됨 (앱 내부)" else "미확인 · 선택은 앱 내부에만 저장됩니다",
                    style = MaterialTheme.typography.bodySmall,
                    color = secondaryText
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Switch(
                checked = localMark,
                onCheckedChange = { value ->
                    localMark = value
                    preferences.edit().putBoolean("local_mark", value).apply()
                }
            )
        }
        Text(
            "기존 Brave 웹앱은 잠정중단·보존 상태입니다. 이 화면은 기존 웹 학습기록을 읽거나 변경하지 않습니다.",
            style = MaterialTheme.typography.bodySmall,
            color = secondaryText
        )
        Spacer(modifier = Modifier.height(8.dp))
    }
}

@Composable
private fun StageRow(stage: Stage) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(surface, RoundedCornerShape(14.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = stage.code,
            color = lime,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.width(40.dp)
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(stage.title, fontWeight = FontWeight.SemiBold)
            Text(
                stage.description,
                style = MaterialTheme.typography.bodySmall,
                color = secondaryText
            )
        }
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            if (stage.status == StageStatus.SOURCE_ONLY) "소스" else "예정",
            color = if (stage.status == StageStatus.SOURCE_ONLY) lime else secondaryText,
            style = MaterialTheme.typography.labelSmall
        )
    }
}
