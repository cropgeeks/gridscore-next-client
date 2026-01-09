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
          <div class="text-subtitle-2 mt-3">{{ $t('pageVisualizationHighlight') }}</div>
          <v-btn-toggle
            v-model="selectionMode"
            color="primary"
            variant="tonal"
            class="d-flex mb-5"
          >
            <v-btn class="flex-grow-1" value="germplasm" :prepend-icon="mdiSprout" :text="$t('tooltipChartHeatmapGermplasm')" />
            <v-btn class="flex-grow-1" value="reps" :disabled="!trialReps || trialReps.length === 0" :prepend-icon="mdiFormatListNumbered" :text="$t('tooltipChartHeatmapRep')" />
            <v-btn class="flex-grow-1" value="treatments" :disabled="!trialTreatments || trialTreatments.length === 0" :prepend-icon="mdiSprinklerFire" :text="$t('tooltipChartHeatmapTreatment')" />
          </v-btn-toggle>

          <CellAutocomplete
            v-if="selectionMode === 'germplasm'"
            :trial="trial"
            v-model="selectedGermplasm"
            :label="$t('formLabelStatisticsGermplasm')"
            :hint="$t('formDescriptionStatisticsGermplasm')"
            multiple
          />

          <v-select
            v-else-if="selectionMode === 'treatments'"
            :label="$t('formLabelStatisticsTreatments')"
            :hint="$t('formDescriptionStatisticsTreatments')"
            multiple
            clearable
            v-model="selectedTreatments"
            :items="trialTreatments"
          >
            <template #selection="{ item }">
              <v-chip density="compact" :text="item.title" variant="flat" />
            </template>
          </v-select>

          <v-select
            v-else-if="selectionMode === 'reps'"
            :label="$t('formLabelStatisticsReps')"
            :hint="$t('formDescriptionStatisticsReps')"
            multiple
            clearable
            v-model="selectedReps"
            :items="trialReps"
          >
            <template #selection="{ item }">
              <v-chip density="compact" :text="item.title" variant="flat" />
            </template>
          </v-select>
        </v-col>
      </v-row>
      <TraitTimelineChart
        v-for="trait in selectedTraits"
        :key="`trait-timeline-${trait.id}`"
        :trait="trait"
        :trial="trial"
        :user-selection="userSelection"
        class="my-5"
      />
    </div>
  </v-container>
</template>

<script lang="ts" setup>
  import PlotTraitCompletionChart from '@/components/chart/PlotTraitCompletionChart.vue'
  import type { UserSelection } from '@/components/chart/StatsChart.vue'
  import TraitDatapointCountChart from '@/components/chart/TraitDatapointCountChart.vue'
  import TraitTimelineChart from '@/components/chart/TraitTimelineChart.vue'
  import { getTrialRepsCached, getTrialTreatmentsCached } from '@/plugins/datastore'
  import { getTrialById } from '@/plugins/idb'
  import type { CellPlus, TraitPlus, TrialPlus } from '@/plugins/types/client'
  import { TraitDataType } from '@/plugins/types/gridscore'
  import { coreStore } from '@/stores/app'
  import { mdiFormatListNumbered, mdiSprinklerFire, mdiSprout } from '@mdi/js'

  const store = coreStore()
  const trial = ref<TrialPlus>()

  const trialReps = ref<string[]>([])
  const trialTreatments = ref<string[]>([])

  const selectionMode = ref<'germplasm' | 'reps' | 'treatments'>()
  const selectedTraits = ref<TraitPlus[]>([])
  const selectedGermplasm = ref<CellPlus[]>([])
  const selectedReps = ref<string[]>([])
  const selectedTreatments = ref<string[]>([])

  const userSelection: ComputedRef<UserSelection | undefined> = computed(() => {
    switch (selectionMode.value) {
      case 'germplasm':
        return {
          type: 'germplasm',
          selectedItems: selectedGermplasm.value.map(g => g.displayName || g.germplasm),
        }
      case 'reps':
        return {
          type: 'reps',
          selectedItems: selectedReps.value,
        }
      case 'treatments':
        return {
          type: 'treatments',
          selectedItems: selectedTreatments.value,
        }
      default:
        return undefined
    }
  })

  const singleValueTraits = computed(() => {
    if (trial.value) {
      return trial.value.traits.filter(t => !t.allowRepeats)
    } else {
      return []
    }
  })

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
