<template>
  <div>
    <div class="text-subtitle-2 mt-3">{{ $t('pageVisualizationHighlight') }}</div>
    <v-btn-toggle
      v-model="selectionMode"
      color="primary"
      variant="tonal"
      class="d-flex mb-5"
    >
      <v-btn class="flex-grow-1" value="germplasm" :prepend-icon="mdiSprout" :text="$t('tooltipChartHeatmapGermplasm')" />
      <v-btn class="flex-grow-1" value="cell" :prepend-icon="mdiViewGridPlus" :text="$t('tooltipChartHeatmapPlot')" v-if="allowCellSelect" />
      <v-btn class="flex-grow-1" value="reps" :disabled="!trialReps || trialReps.length === 0" :prepend-icon="mdiFormatListNumbered" :text="$t('tooltipChartHeatmapRep')" />
      <v-btn class="flex-grow-1" value="treatments" :disabled="!trialTreatments || trialTreatments.length === 0" :prepend-icon="mdiSprinklerFire" :text="$t('tooltipChartHeatmapTreatment')" />
      <v-btn class="flex-grow-1" value="controls" :disabled="!trialControls || trialControls.length === 0" :prepend-icon="mdiCheckboxMarked" :text="$t('tooltipChartHeatmapControl')" v-if="allowControlSelect" />
    </v-btn-toggle>

    <GermplasmAutocomplete
      v-if="selectionMode === 'germplasm'"
      :trial="trial"
      v-model="selectedGermplasm"
      :label="$t('formLabelStatisticsGermplasm')"
      :hint="$t('formDescriptionStatisticsGermplasm')"
      multiple
    />

    <CellAutocomplete
      v-else-if="selectionMode === 'cell' && allowCellSelect"
      :trial="trial"
      v-model="selectedCells"
      :label="$t('formLabelStatisticsPlots')"
      :hint="$t('formDescriptionStatisticsPlots')"
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
  </div>
</template>

<script setup lang="ts">
  import { getTrialControlsCached, getTrialRepsCached, getTrialTreatmentsCached } from '@/plugins/datastore'
  import type { CellPlus, TrialPlus } from '@/plugins/types/client'
  import { CellCategory } from '@/plugins/types/gridscore'
  import { mdiCheckboxMarked, mdiFormatListNumbered, mdiSprinklerFire, mdiSprout, mdiViewGridPlus } from '@mdi/js'

  export interface UserSelection {
    type: 'cell' | 'germplasm' | 'reps' | 'treatments' | 'controls'
    selectedItems: string[]
  }

  export interface HighlightSelectionProps {
    trial: TrialPlus
    allowCellSelect?: boolean
    allowControlSelect?: boolean
  }

  const compProps = withDefaults(defineProps<HighlightSelectionProps>(), {
    allowCellSelect: true,
    allowControlSelect: false,
  })

  const selectionMode = ref<'cell' | 'germplasm' | 'reps' | 'treatments' | 'controls'>()

  const selectedGermplasm = defineModel<string[]>('germplasm')
  const selectedCells = defineModel<CellPlus[]>('cells')
  const selectedReps = defineModel<string[]>('reps')
  const selectedTreatments = defineModel<string[]>('treatments')

  const trialReps = ref<string[]>([])
  const trialTreatments = ref<string[]>([])
  const trialControls = ref<string[]>([])

  const userSelection: ComputedRef<UserSelection | undefined> = computed(() => {
    switch (selectionMode.value) {
      case 'cell':
        return {
          type: selectionMode.value,
          selectedItems: (selectedCells.value || []).map(g => g.displayName || g.germplasm),
        }
      case 'germplasm':
        return {
          type: selectionMode.value,
          selectedItems: (selectedGermplasm.value || []).concat(),
        }
      case 'reps':
        return {
          type: selectionMode.value,
          selectedItems: selectedReps.value || [],
        }
      case 'treatments':
        return {
          type: selectionMode.value,
          selectedItems: selectedTreatments.value || [],
        }
      case 'controls':
        return {
          type: selectionMode.value,
          selectedItems: [CellCategory.CONTROL],
        }
      default:
        return undefined
    }
  })

  watch(selectionMode, async () => {
    selectedCells.value = []
    selectedReps.value = []
    selectedTreatments.value = []
  })

  function update () {
    trialReps.value = getTrialRepsCached()
    trialTreatments.value = getTrialTreatmentsCached()
    trialControls.value = [...getTrialControlsCached()]
  }

  onMounted(() => update())

  watch(() => compProps.trial, async () => update())

  defineExpose({
    userSelection,
  })
</script>
