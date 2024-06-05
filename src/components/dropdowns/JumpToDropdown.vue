<template>
  <b-dropdown :title="$t('toolbarJumpTo')" ref="cornerDropdown" v-if="trial">
    <template v-slot:button-content>
      <IBiArrowsFullscreen /> <span class="d-none d-lg-inline-block">{{ $t('toolbarJumpTo') }}</span>
    </template>

    <div class="direction-grid px-2">
      <div><b-button @click="scrollTo('topLeft')"><IBiArrowUp :style="{ transform: 'rotate(-45deg)' }" /></b-button></div>
      <div><b-button @click="scrollTo('top')"><IBiArrowUp :style="{ transform: 'rotate(0deg)' }" /></b-button></div>
      <div><b-button @click="scrollTo('topRight')"><IBiArrowUp :style="{ transform: 'rotate(45deg)' }" /></b-button></div>
      <div><b-button @click="scrollTo('left')"><IBiArrowUp :style="{ transform: 'rotate(-90deg)' }" /></b-button></div>
      <div><b-button @click="scrollTo('center')"><IBiCircleFill /></b-button></div>
      <div><b-button @click="scrollTo('right')"><IBiArrowUp :style="{ transform: 'rotate(90deg)' }" /></b-button></div>
      <div><b-button @click="scrollTo('bottomLeft')"><IBiArrowUp :style="{ transform: 'rotate(-135deg)' }" /></b-button></div>
      <div><b-button @click="scrollTo('bottom')"><IBiArrowUp :style="{ transform: 'rotate(180deg)' }" /></b-button></div>
      <div><b-button @click="scrollTo('bottomRight')"><IBiArrowUp :style="{ transform: 'rotate(135deg)' }" /></b-button></div>
      <b-button @click="scrollTo('gps')" class="gps-button" v-if="storeGpsEnabled"><IBiGeoAltFill /> {{ $t('buttonGPS') }}</b-button>
      <b-button @click="setSearchMatches(true)" class="gps-button" v-if="hasMarkedPlots"><IBiListCheck /> {{ $t('buttonMarkedPlots') }}</b-button>
    </div>

    <SearchMatchModal :searchMatches="searchMatches" ref="searchMatchModal" v-if="searchMatches.length > 0" @hidden="setSearchMatches(false)" />
  </b-dropdown>
</template>

<script>
import { mapGetters } from 'vuex'
import { getTrialDataCached } from '@/plugins/datastore'
import SearchMatchModal from '@/components/modals/SearchMatchModal.vue'
import { DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_TOP_TO_BOTTOM } from '@/plugins/constants'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    SearchMatchModal
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      markedPlots: {},
      searchMatches: []
    }
  },
  computed: {
    ...mapGetters([
      'storeGpsEnabled'
    ]),
    hasMarkedPlots: function () {
      return this.markedPlotList.length > 0
    },
    markedPlotList: function () {
      if (this.markedPlots) {
        return Object.keys(this.markedPlots).filter(m => this.markedPlots[m])
      } else {
        return []
      }
    }
  },
  methods: {
    setSearchMatches: function (set) {
      if (set) {
        const data = getTrialDataCached()

        this.searchMatches = this.markedPlotList.map(l => {
          const c = data[l]

          return {
            row: c.row,
            column: c.column,
            displayName: c.displayName,
            rep: c.rep,
            name: c.germplasm,
            displayRow: this.trial.layout.rowOrder === DISPLAY_ORDER_TOP_TO_BOTTOM ? (c.row + 1) : (this.trial.layout.rows - c.row),
            displayColumn: this.trial.layout.columnOrder === DISPLAY_ORDER_LEFT_TO_RIGHT ? (c.column + 1) : (this.trial.layout.columns - c.column)
          }
        })

        this.$nextTick(() => this.$refs.searchMatchModal.show())
      } else {
        this.searchMatches = []
      }
    },
    scrollTo: function (corner) {
      emitter.emit('jump-to-corner', corner)
      this.$refs.cornerDropdown.hide()
    },
    resetCellCache: function () {
      const result = {}

      const data = getTrialDataCached()

      if (data) {
        Object.values(data).forEach(c => {
          result[`${c.row}|${c.column}`] = c.isMarked === true
        })

        this.markedPlots = result
      } else {
        this.markedPlots = {}
      }
    },
    updateCellCache: function (row, column, trialId, cell) {
      this.markedPlots[`${row}|${column}`] = cell.isMarked === true
    }
  },
  mounted: function () {
    emitter.on('plot-cache-changed', this.updateCellCache)
    emitter.on('trial-data-loaded', this.resetCellCache)

    this.resetCellCache()
  },
  beforeUnmount: function () {
    emitter.off('plot-cache-changed', this.updateCellCache)
    emitter.off('trial-data-loaded', this.resetCellCache)
  }
}
</script>

<style scoped>
.direction-grid {
  display: grid;
  grid-gap: 1px;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 10px;
  row-gap: 10px;
  /* Force the direction here to keep the buttons in place. They shouldn't change based on the language. */
  direction: ltr;
}
.direction-grid > div {
  justify-self: center;
  align-self: center;
}
.direction-grid .gps-button {
  grid-column: 1 / span 3;
}
</style>
