<template>
  <div class="page-grid" ref="overallWrapper" v-if="trial && trialData">
    <div />
    <div class="column-headers" ref="columnHeader" :style="{ gridTemplateColumns: `repeat(${trial.layout.columns}, ${cellWidth}px)` }">
      <div v-for="column of trial.layout.columns" :class="`cell text-center p-1 cell-${(column - 1) % 2 === 0 ? 1 : 0}`" :key="`column-${column}`">{{ column }}</div>
    </div>
    <div class="row-headers" ref="rowHeader" :style="{ gridTemplateRows: `repeat(${trial.layout.rows}, ${cellHeight}px)` }">
      <div v-for="row of trial.layout.rows" :class="`cell text-center p-1 cell-${(row - 1) % 2 === 0 ? 1 : 0}`" class="cell p-1" :key="`row-${row}`">{{ row }}</div>
    </div>
    <div class="data-grid-wrapper" ref="wrapper">
      <div class="data-grid" :style="{ gridTemplateColumns: `repeat(${trial.layout.columns}, ${cellWidth}px)`, gridTemplateRows: `repeat(${trial.layout.rows}, ${cellHeight}px)` }">
        <template v-for="row of trial.layout.rows">
          <template v-for="column of trial.layout.columns">
            <div :class="`cell text-center p-1 cell-${(((row - 1) % 2 === 0) ? 1 : 0) + (((column - 1) % 2 === 0) ? 1 : 0)}`" :key="`cell-${row}-${column}`">
              <template v-if="trialData[`${row - 1}|${column - 1}`]">
                <div class="mb-1">{{ `${row}-${column}` }}</div>
                <template v-for="trait in trial.traits">
                  <template v-if="trialData[`${row - 1}|${column - 1}`].measurements[trait.id] && trialData[`${row - 1}|${column - 1}`].measurements[trait.id].length > 0">
                    <span class="circle-full mx-1" :key="`cell-${row}-${column}-trait-full-${trait.id}`" :style="{ background: trait.color }" />
                  </template>
                  <template v-else>
                    <span class="circle-empty mx-1" :key="`cell-${row}-${column}-trait-empty-${trait.id}`" :style="{ borderColor: trait.color }" />
                  </template>
                </template>
              </template>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getTrialById } from '@/plugins/idb'
import { getTrialDataCached } from '@/plugins/datastore'

const emitter = require('tiny-emitter/instance')

export default {
  data: function () {
    return {
      trial: null,
      trialData: null,
      dataPointDiameter: 22,
      cellWidth: 100,
      cellHeight: 40,
      scrollSynced: false
    }
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial',
      'storeDisplayMinCellWidth'
    ])
  },
  methods: {
    loadTrial: function () {
      getTrialById(this.storeSelectedTrial).then(trial => {
        this.trial = trial

        this.reset()
      })
    },
    reset: function () {
      this.trialData = getTrialDataCached()
      console.log(this.trialData)

      if (!this.trialData) {
        // TODO
      }

      this.$nextTick(() => this.updateDimensions())
    },
    updateDimensions: function () {
      if (this.$refs.wrapper) {
        const padding = 10
        this.cellWidth = Math.max(this.$refs.wrapper.clientWidth / this.trial.layout.columns, this.storeDisplayMinCellWidth * this.dataPointDiameter + (this.storeDisplayMinCellWidth - 1) * padding)
        const coreWidth = this.cellWidth - padding * 2

        let circlesPerRow = 1
        for (let t = this.trial.traits.length; t > 0; t--) {
          const x = this.dataPointDiameter * t + padding / 2 * (t - 1)

          if (x <= coreWidth) {
            circlesPerRow = t
            break
          }
        }

        const circleRows = Math.ceil(this.trial.traits.length / circlesPerRow)

        const heightProportion = this.$refs.wrapper.clientHeight / this.trial.layout.rows
        const textHeight = 30
        let tempHeight = Math.max(textHeight + circleRows * (this.dataPointDiameter + padding), heightProportion)

        if (this.trial.traits.length === 1) {
          // Check if we need to increase the minimum height to allow space for the display of the trait value below the circles
          if (tempHeight > heightProportion) {
            tempHeight += textHeight - padding
          }
        }

        this.cellHeight = tempHeight

        if (!this.scrollSynced) {
          this.$refs.wrapper.addEventListener('scroll', this.syncScroll)
        }
      }
    },
    syncScroll: function () {
      this.$refs.rowHeader.scrollTop = this.$refs.wrapper.scrollTop
      this.$refs.columnHeader.scrollLeft = this.$refs.wrapper.scrollLeft
    }
  },
  mounted: function () {
    if (this.storeSelectedTrial) {
      this.loadTrial()
    }

    emitter.on('trial-data-loaded', this.reset)
    window.addEventListener('resize', this.updateDimensions)
  },
  beforeDestroy: function () {
    emitter.off('trial-data-loaded', this.reset)
    window.removeEventListener('resize', this.updateDimensions)

    if (this.scrollSynced && this.$refs.wrapper) {
      this.$refs.wrapper.removeEventListener('scroll', this.syncScroll)
    }
  }
}
</script>

<style>
:root {
  --circle-diameter: 20px;
}

.data-grid-wrapper {
  overflow-x: auto;
}

.page-grid {
  height: 100vh;
  height: 100svh;
  max-height: 100vh;
  max-height: 100svh;
  display: grid;
  grid-template-columns: min-content 1fr;
  grid-template-rows: min-content 1fr;
  grid-template-areas:
    "tl colHeaders"
    "rowHeaders dataView"
}

.data-grid {
  display: grid;
}

.column-headers,
.row-headers {
  display: grid;
  overflow: hidden;
}

.row-headers > .cell {
  align-content: center;
}

.data-grid .circle-full {
  display: inline-block;
  width: var(--circle-diameter);
  height: var(--circle-diameter);
  border-radius: calc(var(--circle-diameter) / 2);
}

.data-grid .circle-empty {
  display: inline-block;
  width: calc(var(--circle-diameter) - 2px);
  height: calc(var(--circle-diameter) - 2px);
  border-radius: calc(calc(var(--circle-diameter) - 1px) / 2);
  background: transparent;
  border-width: 1px;
  border-style: solid;
  box-sizing: content-box;
}

.cell-2 {
  background: #e0e0e0;
}
.cell-1 {
  background: #f2f2f2;
}
.cell-0 {
  background: #ffffff;
}
</style>
