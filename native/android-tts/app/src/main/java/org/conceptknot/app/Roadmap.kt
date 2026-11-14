package org.conceptknot.app

/** Source availability never implies physical Android/device validation. */
enum class StageStatus { SOURCE_ONLY, PENDING }

data class Stage(
    val code: String,
    val title: String,
    val description: String,
    val status: StageStatus = StageStatus.PENDING
)

object Roadmap {
    val stages: List<Stage> = listOf(
        Stage("A0", "Android 앱 기반", "공식 Gradle Wrapper 준비 · Android 빌드 검증", StageStatus.SOURCE_ONLY),
        Stage("A1", "로컬 AI 음성", "한국어 여성 F1 · 1회 다운로드 및 SHA-256 검증 · 실기검증 대기", StageStatus.SOURCE_ONLY),
        Stage("A2", "긴 글 완독", "문장 대기열·재시도·이어듣기·1.5배속"),
        Stage("A3", "10개년 기출", "800문항 실제 데이터·정답·검수상태 이관"),
        Stage("A4", "모의고사·오답", "80문항 100분·채점·약점 복습"),
        Stage("A5", "인터랙티브 그래프", "수요·공급 이동 및 전후 설명"),
        Stage("A6", "S펜 필기", "펜·손가락 분리와 제스처"),
        Stage("A7", "통합·실기검증", "오프라인·배터리·데이터 보존 점검")
    )
}
