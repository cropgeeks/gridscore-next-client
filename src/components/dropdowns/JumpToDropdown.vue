<template>
  <b-dropdown :title="$t('toolbarJumpTo')" ref="cornerDropdown" v-if="trial">
    <template v-slot:button-content>
      <BIconArrowsFullscreen /> <span class="d-none d-lg-inline-block">{{ $t('toolbarJumpTo') }}</span>
    </template>

    <div class="direction-grid px-2">
      <div><b-button @click="scrollTo('topLeft')"><BIconArrowUp :rotate="-45" /></b-button></div>
      <div><b-button @click="scrollTo('top')"><BIconArrowUp :rotate="0" /></b-button></div>
      <div><b-button @click="scrollTo('topRight')"><BIconArrowUp :rotate="45" /></b-button></div>
      <div><b-button @click="scrollTo('left')"><BIconArrowUp :rotate="-90" /></b-button></div>
      <div><b-button @click="scrollTo('center')"><BIconCircleFill /></b-button></div>
      <div><b-button @click="scrollTo('right')"><BIconArrowUp :rotate="90" /></b-button></div>
      <div><b-button @click="scrollTo('bottomLeft')"><BIconArrowUp :rotate="-135" /></b-button></div>
      <div><b-button @click="scrollTo('bottom')"><BIconArrowUp :rotate="180" /></b-button></div>
      <div><b-button @click="scrollTo('bottomRight')"><BIconArrowUp :rotate="135" /></b-button></div>
      <b-button @click="scrollTo('gps')" class="gps-button" v-if="storeGpsEnabled"><BIconGeoAltFill /> {{ $t('buttonGPS') }}</b-button>
      <b-button @click="setSearchMatches(true)" class="gps-button" v-if="hasMarkedPlots"><BIconListCheck /> {{ $t('buttonMarkedPlots') }}</b-button>
    </div>

    <SearchMatchModal :searchMatches="searchMatches" ref="searchMatchModal" v-if="searchMatches.length > 0" @hidden="setSearchMatches(false)" />
  </b-dropdown>
</template>

<script>
import Vue from 'vue'
import { mapGetters } from 'vuex'
import { BIconArrowsFullscreen, BIconArrowUp, BIconGeoAltFill, BIconCircleFill, BIconListCheck } from 'bootstrap-vue'
import { getTrialDataCached } from '@/plugins/datastore'
import SearchMatchModal from '@/components/modals/SearchMatchModal'
import { DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_TOP_TO_BOTTOM } from '@/plugins/constants'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconArrowsFullscreen,
    BIconArrowUp,
    BIconCircleFill,
    BIconGeoAltFill,
    BIconListCheck,
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
      Vue.set(this.markedPlots, `${row}|${column}`, cell.isMarked === true)
    }
  },
  mounted: function () {
    emitter.on('plot-cache-changed', this.updateCellCache)
    emitter.on('trial-data-loaded', this.resetCellCache)

    this.resetCellCache()
  },
  beforeDestroy: function () {
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
}
.direction-grid > div {
  justify-self: center;
  align-self: center;
}
.direction-grid .gps-button {
  grid-column: 1 / span 3;
}
</style>
