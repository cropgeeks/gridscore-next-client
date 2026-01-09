<template>
  <div>
    <TraitSection :trait="trait" :show-subtitle="false" v-if="showTraitHeading" />

    <v-tooltip text="Tooltip" location="bottom">
      <div>
        <div class="d-flex justify-space-between">
          <span class="d-block"><v-icon :icon="mdiArrowUpBold" /> {{ $t('widgetScaleMax') }} </span>
          <span class="ms-2">{{ formattedMax }}</span>
        </div>
        <div class="d-flex justify-space-between">
          <span class="d-block" :style="{ color: 'var(--primary)' }"><v-icon :icon="mdiDiameterVariant" /> {{ $t('widgetScaleAvg') }} </span>
          <span class="ms-2">{{ formattedAvg }}</span>
        </div>
        <div class="d-flex justify-space-between">
          <span class="d-block"><v-icon :icon="mdiArrowDownBold" /> {{ $t('widgetScaleMin') }} </span>
          <span class="ms-2">{{ formattedMin }}</span>
        </div>
        <div class="d-flex justify-space-between">
          <span class="d-block"><v-icon :icon="mdiNumeric" /> {{ $t('widgetScaleCount') }} </span>
          <span class="ms-2">{{ getNumberWithSuffix(traitStats.count, 2) }}</span>
        </div>
        <v-divider />
        <div class="d-flex justify-space-between">
          <span class="d-block text-primary"><v-icon :icon="mdiSprout" /> {{ $t('widgetScaleGermplasm') }} </span>
          <span class="ms-2">{{ formattedGermplasmAvg || $t('widgetChartNoData') }}</span>
        </div>
      </div>

      <template #activator="{ props }">
        <div class="d-flex my-2" :id="`scale-${id}`" v-bind="props">
          <div class="d-flex align-center scale-container w-100" :style="{ backgroundColor: 'rgb(var(--v-theme-surface-light))' }">
            <div class="scale-marker" :style="{ backgroundColor: trait.color, marginLeft: `calc(${germplasmPercentage}% - 1px)` }" />
            <div class="scale-marker scale-marker-avg" :style="{ marginLeft: `calc(${traitAveragePercentage}% - 1px)`, backgroundColor: store.storeIsDarkMode ? 'white' : 'black' }" />
          </div>
        </div>
      </template>
    </v-tooltip>
  </div>
</template>

<script setup lang="ts">
  import { getNumberWithSuffix } from '@/plugins/formatting'
  import { getId } from '@/plugins/id'
  import type { TraitPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'
  import { mdiArrowDownBold, mdiArrowUpBold, mdiDiameterVariant, mdiNumeric, mdiSprout } from '@mdi/js'

  export interface BaseStats {
    avg: number
    total: number
    count: number
  }

  export interface TraitStats extends BaseStats {
    min: number
    max: number
  }

  const compProps = defineProps<{
    trait: TraitPlus
    traitStats: TraitStats
    germplasmStats: BaseStats
    showTraitHeading: boolean
  }>()

  const store = coreStore()
  const id = ref<string>(getId())

  const germplasmPercentage = computed(() => {
    if (compProps.germplasmStats && compProps.germplasmStats.count > 0 && compProps.traitStats) {
      return (compProps.germplasmStats.avg - compProps.traitStats.min) * (100 - 0) / (compProps.traitStats.max - compProps.traitStats.min)
    } else {
      return 33
    }
  })

  const traitAveragePercentage = computed(() => {
    if (compProps.germplasmStats && compProps.germplasmStats.count > 0 && compProps.traitStats) {
      return (compProps.traitStats.avg - compProps.traitStats.min) * (100 - 0) / (compProps.traitStats.max - compProps.traitStats.min)
    } else {
      return 33
    }
  })
  const formattedMin = computed(() => {
    if (compProps.trait.dataType === 'date') {
      return new Date(compProps.traitStats.min * (1000 * 60 * 60 * 24)).toLocaleDateString()
    } else {
      return compProps.traitStats.min.toFixed(4)
    }
  })
  const formattedMax = computed(() => {
    if (compProps.trait.dataType === 'date') {
      return new Date(compProps.traitStats.max * (1000 * 60 * 60 * 24)).toLocaleDateString()
    } else {
      return compProps.traitStats.max.toFixed(4)
    }
  })
  const formattedAvg = computed(() => {
    if (compProps.trait.dataType === 'date') {
      return new Date(compProps.traitStats.avg * (1000 * 60 * 60 * 24)).toLocaleDateString()
    } else {
      return compProps.traitStats.avg.toFixed(4)
    }
  })
  const formattedGermplasmAvg = computed(() => {
    if (compProps.germplasmStats && compProps.germplasmStats.count > 0) {
      if (compProps.trait.dataType === 'date') {
        return new Date(compProps.germplasmStats.avg * (1000 * 60 * 60 * 24)).toLocaleDateString()
      } else {
        return compProps.germplasmStats.avg.toFixed(4)
      }
    } else {
      return null
    }
  })
</script>

<style scoped>
.scale-container {
  height: 1rem;
  margin: .25rem 0;
  position: relative;
  border-radius: 0.25em;
}
.scale-marker {
  width: 2px;
  height: 1.5rem;
  position: absolute;
}
.scale-marker-avg {
  width: 1px;
}
</style>
