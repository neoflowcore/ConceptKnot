package org.conceptknot.app

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RoadmapTest {
    @Test fun allEightStagesHaveStableIds() {
        assertEquals((0..7).map { "A$it" }, Roadmap.stages.map { it.code })
    }

    @Test fun unimplementedStagesAreNotAdvertisedAsReady() {
        assertEquals(StageStatus.SOURCE_ONLY, Roadmap.stages.first().status)
        assertTrue(Roadmap.stages.drop(1).all { it.status == StageStatus.PENDING })
    }
}
