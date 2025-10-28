<template>
  <div v-if="cell" tabindex="-1">
    <v-chip-group tabindex="-1" column>
      <v-chip tabindex="-1" size="small" label :prepend-icon="mdiSprout" :text="cell.germplasm" v-tooltip:top="$t('tooltipChartHeatmapGermplasm')" />
      <v-chip tabindex="-1" size="small" label :prepend-icon="mdiFormatListNumbered" :text="cell.rep" v-tooltip:top="$t('tooltipChartHeatmapRep')" v-if="cell.rep" />
      <v-chip tabindex="-1" size="small" label :prepend-icon="mdiEyeCheck" :text="cell.friendlyName" v-tooltip:top="$t('tooltipChartHeatmapFriendlyName')" v-if="cell.friendlyName" />
      <v-chip tabindex="-1" size="small" label :prepend-icon="mdiLandRowsHorizontal" :text="$n(cell.displayRow || 1)" v-tooltip:top="$t('tooltipChartHeatmapRow')" />
      <v-chip tabindex="-1" size="small" label :prepend-icon="mdiLandRowsVertical" :text="$n(cell.displayColumn || 1)" v-tooltip:top="$t('tooltipChartHeatmapColumn')" />
      <v-chip tabindex="-1" size="small" label :prepend-icon="mdiFamilyTree" :text="cell.pedigree" v-tooltip:top="$t('tooltipChartHeatmapPedigree')" v-if="cell.pedigree" />
      <v-chip tabindex="-1" size="small" label :prepend-icon="mdiBarcode" :text="cell.barcode" v-tooltip:top="$t('tooltipChartHeatmapBarcode')" v-if="cell.barcode" />
      <v-chip tabindex="-1" size="small" label :prepend-icon="mdiSprinklerFire" :text="cell.treatment" v-tooltip:top="$t('tooltipChartHeatmapTreatment')" v-if="cell.treatment" />
      <template v-if="cell.categories">
        <v-chip tabindex="-1" size="small" label v-for="cat in cell.categories" :key="`cell-category-${cell.row}-${cell.column}-${cat}`" :color="CELL_CATEGORIES[cat]?.color">
          {{ $t(CELL_CATEGORIES[cat]?.title || '') }}
        </v-chip>
      </template>
    </v-chip-group>
  </div>
</template>

<script setup lang="ts">
  import { CELL_CATEGORIES } from '@/plugins/constants'
  import type { CellPlus } from '@/plugins/types/client'
  import { mdiBarcode, mdiEyeCheck, mdiFamilyTree, mdiFormatListNumbered, mdiLandRowsHorizontal, mdiLandRowsVertical, mdiSprinklerFire, mdiSprout } from '@mdi/js'

  defineProps<{
    cell: CellPlus
  }>()
</script>
