<template>
  <v-container fluid>
    <h1 class="text-h4 mb-3">{{ $t('pageVisualizationStatisticsTitle') }}</h1>
    <v-divider class="mb-3" />
    <p>{{ $t('pageVisualizationStatisticsText') }}</p>

    <template v-if="trial">
      <v-row>
        <v-col cols="12" md="6">
          <TraitSelect
            v-model="selectedTraits"
            multiple
            :traits="trial.traits"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-btn-toggle
            v-model="selectionMode"
            color="primary"
            variant="tonal"
            class="d-flex mb-4"
          >
            <v-btn class="flex-grow-1" value="germplasm" :prepend-icon="mdiSprout" :text="$t('tooltipChartHeatmapGermplasm')" />
            <v-btn class="flex-grow-1" value="reps" :disabled="!trialReps || trialReps.length === 0" :prepend-icon="mdiFormatListNumbered" :text="$t('tooltipChartHeatmapRep')" />
            <v-btn class="flex-grow-1" value="treatments" :disabled="!trialTreatments || trialTreatments.length === 0" :prepend-icon="mdiSprinklerFire" :text="$t('tooltipChartHeatmapTreatment')" />
          </v-btn-toggle>

          <GermplasmAutocomplete
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

      <v-row v-if="selectedTraits && selectedTraits.length > 0">
        <v-col cols="12" lg="6" v-for="trait in selectedTraits" :key="`stats-chart-${trait.id || ''}`">
          <GpsTraitMap
            :trial="trial"
            :trait="trait"
            :selected-germplasm="selectedGermplasmNames"
            @cell-clicked="(row: number, column: number) => showBottomSheet(row, column, trait)"
            v-if="trait.dataType === TraitDataType.gps"
          />
          <StatsChart
            :trial="trial"
            :trait="trait"
            :user-selection="userSelection"
            @cell-clicked="(row: number, column: number) => showBottomSheet(row, column, trait)"
            v-else
          />
        </v-col>
      </v-row>
    </template>

    <v-bottom-sheet
      v-model="bottomSheetVisible"
      inset
      scrollable
      max-height="75vh"
      v-if="featuredCell && trial && featuredTrait"
    >
      <v-card :title="featuredCell.displayName || featuredCell.germplasm">
        <PlotDataInformation :trial="trial" :cell="featuredCell" :trait="featuredTrait" />
      </v-card>
    </v-bottom-sheet>
  </v-container>
</template>

<script setup lang="ts">
  import StatsChart, { type UserSelection } from '@/components/chart/StatsChart.vue'
  import GermplasmAutocomplete from '@/components/inputs/GermplasmAutocomplete.vue'
  import PlotDataInformation from '@/components/plot/PlotDataInformation.vue'
  import GpsTraitMap from '@/components/trait/GpsTraitMap.vue'
  import TraitSelect from '@/components/trait/TraitSelect.vue'
  import { getTrialRepsCached, getTrialTreatmentsCached } from '@/plugins/datastore'
  import { getCell, getTrialById } from '@/plugins/idb'
  import type { CellPlus, TraitPlus, TrialPlus } from '@/plugins/types/client'
  import { TraitDataType } from '@/plugins/types/gridscore'
  import { coreStore } from '@/stores/app'
  import { mdiFormatListNumbered, mdiSprinklerFire, mdiSprout } from '@mdi/js'

  const store = coreStore()

  const selectionMode = ref<'germplasm' | 'reps' | 'treatments'>()
  const trial = ref<TrialPlus>()
  const selectedTraits = ref<TraitPlus[]>([])
  const selectedGermplasm = ref<CellPlus[]>([])
  const selectedReps = ref<string[]>([])
  const selectedTreatments = ref<string[]>([])
  const bottomSheetVisible = ref(false)
  const featuredCell = ref<CellPlus>()
  const featuredTrait = ref<TraitPlus>()

  const trialReps = ref<string[]>([])
  const trialTreatments = ref<string[]>([])

  const selectedGermplasmNames = computed(() => selectedGermplasm.value.map(g => g.displayName || g.germplasm))

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

  function showBottomSheet (row: number, column: number, trait: TraitPlus) {
    getCell(store.storeSelectedTrial || '', row, column)
      .then(cell => {
        featuredTrait.value = trait
        featuredCell.value = cell

        nextTick(() => {
          bottomSheetVisible.value = true
        })
      })
  }

  watch(selectionMode, async () => {
    selectedGermplasm.value = []
    selectedReps.value = []
    selectedTreatments.value = []
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
