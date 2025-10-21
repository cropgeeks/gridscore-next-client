<template>
  <v-container fluid>
    <h1 class="text-h4 mb-3">{{ $t('pageVisualizationHeatmapTitle') }}</h1>
    <v-divider class="mb-3" />
    <p>{{ $t('pageVisualizationHeatmapText') }}</p>

    <v-row v-if="trial">
      <v-col cols="12" :lg="layoutColumns">
        <FieldLayoutHeatmap :trial="trial" />
      </v-col>
      <v-col cols="12" :lg="layoutColumns">
        <ReplicateHeatmap :trial="trial" @update:rep-count="setRepCount" v-if="repCount > 1" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  import FieldLayoutHeatmap from '@/components/chart/FieldLayoutHeatmap.vue'
  import ReplicateHeatmap from '@/components/chart/ReplicateHeatmap.vue'
  import { getTrialById } from '@/plugins/idb'
  import type { TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'

  const store = coreStore()

  const repCount = ref(10)
  const trial = ref<TrialPlus>()

  const layoutColumns: ComputedRef<number> = computed(() => {
    if (trial.value && repCount.value) {
      if (repCount.value > 0 && repCount.value < 16 && trial.value.layout.columns < 16) {
        return 6
      } else {
        return 12
      }
    } else {
      return 12
    }
  })

  function setRepCount (reps: number) {
    repCount.value = reps
  }

  onMounted(() => {
    getTrialById(store.storeSelectedTrial || '')
      .then(t => {
        trial.value = t
      })
  })
</script>
