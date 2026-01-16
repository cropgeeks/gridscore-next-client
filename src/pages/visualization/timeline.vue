<template>
  <v-container fluid>
    <h1 class="text-h4 mb-3">{{ $t('pageVisualizationTimelineTitle') }}</h1>
    <v-divider class="mb-3" />
    <p>{{ $t('pageVisualizationTimelineText') }}</p>

    <v-row v-if="trial">
      <v-col class="d-flex" cols="12" :lg="multiValueTraits.length > 0 ? 6 : 12">
        <PlotTraitCompletionChart class="mb-5" :trial="trial" :traits="trial.traits" />
      </v-col>
      <v-col class="d-flex" cols="12" lg="6" v-if="multiValueTraits.length > 0">
        <TraitDatapointCountChart class="mb-5" :trial="trial" />
      </v-col>
    </v-row>

    <div v-if="trial && multiValueTraits && multiValueTraits.length > 0">
      <h2>{{ $t('pageVisualizationRepeatTraitsTitle') }}</h2>
      <p>{{ $t('pageVisualizationRepeatTraitsText') }}</p>

      <v-row>
        <v-col cols="12" md="6">
          <TraitSelect
            v-model="selectedTraits"
            class="mt-7"
            multiple
            hint="formDescriptionTimelineTrait"
            :traits="multiValueTraits"
          />
        </v-col>
        <v-col cols="12" md="6">
          <HighlightSelect
            :trial="trial"
            :allow-cell-select="false"
            ref="highlightSelect"
          />
        </v-col>
      </v-row>
      <TraitTimelineChart
        v-for="trait in selectedTraits"
        :key="`trait-timeline-${trait.id}`"
        :trait="trait"
        :trial="trial"
        :user-selection="highlightSelect?.userSelection"
        class="my-5"
      />
    </div>
  </v-container>
</template>

<script lang="ts" setup>
  import PlotTraitCompletionChart from '@/components/chart/PlotTraitCompletionChart.vue'
  import TraitDatapointCountChart from '@/components/chart/TraitDatapointCountChart.vue'
  import TraitTimelineChart from '@/components/chart/TraitTimelineChart.vue'
  import { getTrialRepsCached, getTrialTreatmentsCached } from '@/plugins/datastore'
  import { getTrialById } from '@/plugins/idb'
  import type { TraitPlus, TrialPlus } from '@/plugins/types/client'
  import { TraitDataType } from '@/plugins/types/gridscore'
  import { coreStore } from '@/stores/app'

  const store = coreStore()
  const trial = ref<TrialPlus>()

  const trialReps = ref<string[]>([])
  const trialTreatments = ref<string[]>([])

  const selectedTraits = ref<TraitPlus[]>([])

  const highlightSelect = useTemplateRef('highlightSelect')

  const multiValueTraits = computed(() => {
    if (trial.value) {
      return trial.value.traits.filter(t => t.allowRepeats && TraitDataType.isNumeric(t.dataType))
    } else {
      return []
    }
  })

  onMounted(() => {
    getTrialById(store.storeSelectedTrial || '')
      .then(t => {
        trial.value = t

        trialReps.value = getTrialRepsCached()
        trialTreatments.value = getTrialTreatmentsCached()
      })
  })
</script>
