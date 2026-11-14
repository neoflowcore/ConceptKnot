package org.conceptknot.app

import androidx.compose.ui.test.assertExists
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import org.junit.Rule
import org.junit.Test

class LaunchSmokeTest {
    @get:Rule val rule = createAndroidComposeRule<MainActivity>()

    @Test fun showsNativeShellWithoutClaimingTtsIsReady() {
        rule.onNodeWithText("ConceptKnot").assertExists()
        rule.onNodeWithText("A0 · Android 기본 화면").assertExists()
        rule.onNodeWithText("로컬 AI 음성").assertExists()
    }
}
