<template>
  <div v-if="cell && traits && traits.length > 0">
    <h4>{{ cell.displayName }}</h4>
    <p class="text-muted">{{ $t('pageVisualizationMapPlotInfo', { row: rowIndex, column: columnIndex }) }}</p>

    <div v-if="cell.measurements">
      <section v-for="trait in traits" :key="`trait-section-${trait.id}`" class="mt-3">
        <h5 class="mb-1 mr-3">
          <span :style="{ color: trait.color }"><TraitIcon :trait="trait" /> {{ trait.name }}</span>
        </h5>
        <b-list-group class="map-measurement-list" v-if="cell.measurements[trait.id] && cell.measurements[trait.id].length > 0">
          <b-list-group-item class="flex-column align-items-start" v-for="(measure, index) in cell.measurements[trait.id]" :key="`selected-measure-${trait.id}-${index}`">
            <div class="d-flex w-100 justify-content-between align-items-center">
              <template v-if="trait.dataType === 'categorical'">
                {{ measure.values.map(v => trait.restrictions.categories[v]).join(', ') }}
              </template>
              <template v-else>
                {{ measure.values.join(', ') }}
              </template>
              <small v-b-tooltip="new Date(measure.timestamp).toLocaleString()"><BIconCalendar3 /> {{ getDaysAgoIn(measure.timestamp) }}</small>
            </div>
          </b-list-group-item>
        </b-list-group>
        <p v-else>{{ $t('pageVisualizationMapNoTraitData') }}</p>
      </section>
    </div>
  </div>
</template>

<script>
import TraitIcon from '@/components/icons/TraitIcon'
import { BIconCalendar3 } from 'bootstrap-vue'
import { DISPLAY_ORDER_BOTTOM_TO_TOP, DISPLAY_ORDER_RIGHT_TO_LEFT } from '@/plugins/constants'

export default {
  components: {
    BIconCalendar3,
    TraitIcon
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    },
    traits: {
      type: Array,
      default: () => []
    },
    cell: {
      type: Object,
      default: () => null
    }
  },
  computed: {
    rowIndex: function () {
      if (this.trial && this.cell) {
        return this.trial.layout.rowOrder === DISPLAY_ORDER_BOTTOM_TO_TOP ? (this.trial.layout.rows - this.cell.row) : (this.cell.row + 1)
      } else {
        return null
      }
    },
    columnIndex: function () {
      if (this.trial && this.cell) {
        return this.trial.layout.columnOrder === DISPLAY_ORDER_RIGHT_TO_LEFT ? (this.trial.layout.columns - this.cell.column) : (this.cell.column + 1)
      } else {
        return null
      }
    }
  },
  methods: {
    getDaysAgoIn: function (timestamp) {
      const diffDays = Math.floor((new Date() - new Date(timestamp)) / (1000 * 60 * 60 * 24))
      if (diffDays > -14 && diffDays < 0) {
        return this.$tc('ttsDaysIn', Math.abs(diffDays))
      } else if (diffDays < 14) {
        return this.$tc('ttsDaysAgo', Math.abs(diffDays))
      } else {
        return new Date(timestamp).toLocaleDateString()
      }
    }
  }
}
</script>

<style>

</style>
