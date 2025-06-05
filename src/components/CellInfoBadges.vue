<template>
  <div v-if="cell">
    <b-badge class="me-2" v-b-tooltip="$t('tooltipChartHeatmapGermplasm')"><IBiFlower1 /> {{ cell.germplasm }}</b-badge>
    <b-badge class="me-2" v-b-tooltip="$t('tooltipChartHeatmapRep')" v-if="cell.rep"><IBiListOl /> {{ cell.rep }}</b-badge>
    <b-badge class="me-2" v-b-tooltip="$t('tooltipChartHeatmapFriendlyName')" v-if="cell.friendlyName"><IBiEyeglasses /> {{ cell.friendlyName }}</b-badge>
    <b-badge class="me-2" v-b-tooltip="$t('tooltipChartHeatmapRow')"><IBiLayoutThreeColumns :style="{ transform: 'rotate(90deg)' }" /> {{ $n(cell.displayRow) }}</b-badge>
    <b-badge class="me-2" v-b-tooltip="$t('tooltipChartHeatmapColumn')"><IBiLayoutThreeColumns /> {{ $n(cell.displayColumn) }}</b-badge>
    <b-badge class="me-2" v-b-tooltip="$t('tooltipChartHeatmapPedigree')" v-if="cell.pedigree"><IBiDiagram2 :style="{ transform: 'rotate(180deg)' }" /> {{ cell.pedigree }}</b-badge>
    <b-badge class="me-2" v-b-tooltip="$t('tooltipChartHeatmapBarcode')" v-if="cell.barcode"><IBiUpc /> {{ cell.barcode }}</b-badge>
    <b-badge class="me-2" v-b-tooltip="$t('tooltipChartHeatmapTreatment')" v-if="cell.treatment"><IBiDropletHalf /> {{ cell.treatment }}</b-badge>
    <template v-if="cell && cell.categories">
      <b-badge class="me-2" v-for="cat in cell.categories" :key="`cell-category-${cell.row}-${cell.column}-${cat}`" :variant="CELL_CATEGORIES[cat].variant">
        <component :is="CELL_CATEGORIES[cat].icon" /> {{ $t(CELL_CATEGORIES[cat].title) }}
      </b-badge>
    </template>
  </div>
</template>

<script>
import { CELL_CATEGORIES } from '@/plugins/constants'

export default {
  data: function () {
    return {
      CELL_CATEGORIES
    }
  },
  props: {
    cell: {
      type: Object,
      default: () => null
    }
  }
}
</script>