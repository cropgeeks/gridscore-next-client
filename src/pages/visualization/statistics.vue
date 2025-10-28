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
          <GermplasmAutocomplete
            :trial="trial"
            v-model="selectedGermplasm"
            :label="$t('formLabelStatisticsGermplasm')"
            :hint="$t('formDescriptionStatisticsGermplasm')"
            multiple
          />
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
            :selected-germplasm="selectedGermplasmNames"
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
  import StatsChart from '@/components/chart/StatsChart.vue'
  import GermplasmAutocomplete from '@/components/inputs/GermplasmAutocomplete.vue'
  import PlotDataInformation from '@/components/plot/PlotDataInformation.vue'
  import GpsTraitMap from '@/components/trait/GpsTraitMap.vue'
  import { getCell, getTrialById } from '@/plugins/idb'
  import type { CellPlus, TraitPlus, TrialPlus } from '@/plugins/types/client'
  import { TraitDataType } from '@/plugins/types/gridscore'
  import { coreStore } from '@/stores/app'

  const store = coreStore()

  const trial = ref<TrialPlus>()
  const selectedTraits = ref<TraitPlus[]>([])
  const selectedGermplasm = ref<CellPlus[]>([])
  const bottomSheetVisible = ref(false)
  const featuredCell = ref<CellPlus>()
  const featuredTrait = ref<TraitPlus>()

  const selectedGermplasmNames = computed(() => selectedGermplasm.value.map(g => g.displayName || g.germplasm))

  function showBottomSheet (row: number, column: number, trait: TraitPlus) {
    console.log(row, column, trait)

    getCell(store.storeSelectedTrial || '', row, column)
      .then(cell => {
        featuredTrait.value = trait
        featuredCell.value = cell

        nextTick(() => {
          bottomSheetVisible.value = true
        })
      })
  }

  onMounted(() => {
    getTrialById(store.storeSelectedTrial || '')
      .then(t => {
        trial.value = t
      })
  })
</script>
