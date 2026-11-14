package org.conceptknot.app

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RoadmapTest {
    @Test fun allEightStagesHaveStableIds() {
        assertEquals((0..7).map { "A$it" }, Roadmap.stages.map { it.code })
    }
    @Test fun implementationAndDeviceValidationAreDistinguished() {
        assertTrue(Roadmap.stages.take(2).all { it.status == StageStatus.SOURCE_ONLY })
        assertTrue(Roadmap.stages.drop(2).all { it.status == StageStatus.PENDING })
    }
}
