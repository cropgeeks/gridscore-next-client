<template>
  <div v-if="cell && traits && traits.length > 0">
    <h4>{{ cell.displayName }}</h4>

    <p v-if="cell && cell.categories">
      <b-badge v-for="cat in cell.categories" :key="`cell-category-${cell.row}-${cell.column}-${cat}`" :variant="CELL_CATEGORIES[cat].variant">
        <component :is="CELL_CATEGORIES[cat].icon" /> {{ $t(CELL_CATEGORIES[cat].title) }}
      </b-badge>
    </p>

    <p class="text-muted">{{ $t('pageVisualizationMapPlotInfo', { row: rowIndex, column: columnIndex }) }}</p>

    <div v-if="cell.measurements">
      <section v-for="trait in traits" :key="`trait-section-${trait.id}`" class="mt-3">
        <h5 class="mb-1 me-3">
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
              <small v-b-tooltip="new Date(measure.timestamp).toLocaleString()"><IBiCalendar3 /> {{ getDaysAgoIn(measure.timestamp) }}</small>
            </div>
          </b-list-group-item>
        </b-list-group>
        <p v-else>{{ $t('pageVisualizationMapNoTraitData') }}</p>
      </section>
    </div>
  </div>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import TraitIcon from '@/components/icons/TraitIcon.vue'
import { CELL_CATEGORIES, CELL_CATEGORY_CONTROL } from '@/plugins/constants'

export default {
  components: {
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
  data: function () {
    return {
      CELL_CATEGORIES
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeHighlightControls'
    ]),
    isControl: function () {
      if (this.trial && this.cell) {
        return this.storeHighlightControls && (this.cell.categories || []).includes(CELL_CATEGORY_CONTROL)
      } else {
        return null
      }
    },
    rowIndex: function () {
      if (this.trial && this.cell) {
        return this.cell.displayRow
      } else {
        return null
      }
    },
    columnIndex: function () {
      if (this.trial && this.cell) {
        return this.cell.displayColumn
      } else {
        return null
      }
    }
  },
  methods: {
    getDaysAgoIn: function (timestamp) {
      const diffDays = Math.floor((new Date() - new Date(timestamp)) / (1000 * 60 * 60 * 24))
      if (diffDays > -14 && diffDays < 0) {
        return this.$t('ttsDaysIn', Math.abs(diffDays))
      } else if (diffDays < 14) {
        return this.$t('ttsDaysAgo', Math.abs(diffDays))
      } else {
        return new Date(timestamp).toLocaleDateString()
      }
    }
  }
}
</script>

<style>

</style>
