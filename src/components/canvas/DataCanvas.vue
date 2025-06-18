<template>
  <div ref="canvasWrapper" class="grid" v-if="trial">
    <div class="corner" @click="clearMarkedRowsCols" />
    <ColumnHeader :dimensions="dimensions"
                  :trial="trial"
                  :x="origin.x"
                  :markedColumns="markedColumns"
                  @column-marked="onColumnMarked"
                  id="data-canvas-header"
                  ref="colHead" />
    <div class="corner" />
    <RowHeader :dimensions="dimensions"
              :trial="trial"
              :y="origin.y"
              :markedRows="markedRows"
              @row-marked="onRowMarked"
              ref="rowHead" />
    <PlotCanvas :geolocation="geolocation" :traitCutoff="traitCutoff" :dimensions="dimensions" :markedColumns="markedColumns" :markedRows="markedRows" :trial="trial" @origin-changed="setOrigin" ref="plotCanvas" />
    <VScroll :dimensions="dimensions" :y="origin.y" :rows="trial.layout.rows" ref="vScroll" />
    <div class="corner" />
    <HScroll :dimensions="dimensions" :x="origin.x" :columns="trial.layout.columns" ref="hScroll" />
    <div class="corner" />
  </div>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import { getTrialById } from '@/plugins/idb'

import ColumnHeader from '@/components/canvas/ColumnHeader.vue'
import HScroll from '@/components/canvas/HScroll.vue'
import RowHeader from '@/components/canvas/RowHeader.vue'
import VScroll from '@/components/canvas/VScroll.vue'
import PlotCanvas from '@/components/canvas/PlotCanvas.vue'
import { CANVAS_DENSITY_MEDIUM, CANVAS_DENSITY_HIGH, CANVAS_DENSITY_LOW, CANVAS_SIZE_MEDIUM, CANVAS_SIZE_SMALL, CANVAS_SIZE_LARGE } from '@/plugins/constants'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    ColumnHeader,
    HScroll,
    PlotCanvas,
    RowHeader,
    VScroll
  },
  props: {
    geolocation: {
      type: Object,
      default: () => null
    },
    traitCutoff: {
      type: String,
      default: null
    }
  },
  data: function () {
    return {
      trial: null,
      dimensions: {
        canvasWidth: 1,
        canvasHeight: 1,
        scaledCanvasWidth: 1,
        scaledCanvasHeight: 1,
        fontSize: 14,
        circleRadius: 8,
        padding: 16,
        columnHeaderHeight: 1,
        rowHeaderWidth: 1,
        vScrollWidth: 5,
        hScrollHeight: 5,
        cellWidth: 1,
        cellHeight: 1,
        textPartHeight: 1,
        circleRows: 1,
        coreWidth: 1,
        circlesPerRow: 1,
        visibleTraitCount: 1
      },
      isInitting: false,
      isResetting: false,
      markedColumns: [],
      markedRows: [],
      origin: {
        x: 0,
        y: 0
      }
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeDarkMode',
      'storeSelectedTrial',
      'storeHiddenTraits',
      'storeDisplayMinCellWidth',
      'storeCanvasDensity',
      'storeCanvasSize',
      'storePlotDisplayField'
    ])
  },
  watch: {
    storeSelectedTrial: function () {
      this.updateTrial()
    },
    storeHiddenTraits: function () {
      this.reset()
    }
  },
  methods: {
    clearMarkedRowsCols: function () {
      this.markedColumns = Array.from(Array(this.trial.layout.columns).keys()).map(() => false)
      this.markedRows = Array.from(Array(this.trial.layout.rows).keys()).map(() => false)
    },
    setOrigin: function (newOrigin) {
      this.origin = {
        x: newOrigin.x,
        y: newOrigin.y
      }
    },
    updateTrial: function () {
      getTrialById(this.storeSelectedTrial).then(trial => {
        this.trial = trial

        this.markedColumns = Array.from(Array(trial.layout.columns).keys()).map(() => false)
        this.markedRows = Array.from(Array(trial.layout.rows).keys()).map(() => false)

        this.reset()
      })
    },
    getCirclesPerRow: function () {
      for (let t = this.dimensions.visibleTraitCount; t > 0; t--) {
        const x = this.dimensions.circleRadius * 2 * t + this.dimensions.padding / 2 * (t - 1)

        if (x <= this.dimensions.coreWidth) {
          return t
        }
      }

      return 1
    },
    onColumnMarked: function (col) {
      const temp = this.markedColumns.concat()
      temp[col] = !temp[col]
      this.markedColumns = temp

      emitter.emit('plausible-event', { key: 'data-view-updated', props: { type: 'column-marked' } })
    },
    onRowMarked: function (row) {
      const temp = this.markedRows.concat()
      temp[row] = !temp[row]
      this.markedRows = temp

      emitter.emit('plausible-event', { key: 'data-view-updated', props: { type: 'row-marked' } })
    },
    init: function () {
      if (this.isInitting) {
        return
      }
      this.isInitting = true

      if (this.$refs.plotCanvas) {
        this.$refs.plotCanvas.reset()
          .then(() => {
            this.isInitting = false
          })
      }
    },
    update: function () {
      if (this.$refs.plotCanvas) {
        this.$refs.plotCanvas.update()
      }
    },
    reset: function () {
      if (this.isResetting || !this.trial) {
        return
      }
      this.isResetting = true

      this.$nextTick(() => {
        if (this.storeHiddenTraits) {
          this.dimensions.visibleTraitCount = this.trial.traits.filter(t => !this.storeHiddenTraits.includes(t.id)).length
        } else {
          this.dimensions.visibleTraitCount = this.trial.traits.length
        }

        this.dimensions.rowHeaderWidth = this.dimensions.padding + (this.dimensions.fontSize * `${this.trial.layout.rows}`.length)
        this.dimensions.canvasWidth = this.$refs.canvasWrapper.offsetWidth - this.dimensions.rowHeaderWidth - this.dimensions.hScrollHeight
        this.dimensions.columnHeaderHeight = 2 * this.dimensions.padding + this.dimensions.fontSize
        this.dimensions.canvasHeight = window.innerHeight - this.dimensions.columnHeaderHeight - this.dimensions.vScrollWidth
        this.dimensions.cellWidth = Math.max(this.dimensions.canvasWidth / this.trial.layout.columns, this.dimensions.padding * 2 + this.storeDisplayMinCellWidth * this.dimensions.circleRadius * 2 + (this.storeDisplayMinCellWidth - 1) * this.dimensions.padding / 2)
        this.dimensions.coreWidth = this.dimensions.cellWidth - this.dimensions.padding * 2
        this.dimensions.circlesPerRow = this.getCirclesPerRow()
        this.dimensions.textPartHeight = this.storePlotDisplayField === null ? this.dimensions.padding : (this.dimensions.fontSize + 2 * this.dimensions.padding)
        this.dimensions.circleRows = Math.ceil(this.dimensions.visibleTraitCount / this.dimensions.circlesPerRow)
        this.dimensions.scaledCanvasHeight = this.dimensions.canvasHeight * window.devicePixelRatio
        this.dimensions.scaledCanvasWidth = this.dimensions.canvasWidth * window.devicePixelRatio

        const heightProportion = this.dimensions.canvasHeight / this.trial.layout.rows
        let tempHeight = Math.max(this.dimensions.textPartHeight + this.dimensions.circleRows * (this.dimensions.circleRadius * 2 + this.dimensions.padding), heightProportion)

        if (this.dimensions.visibleTraitCount === 1) {
          // Check if we need to increase the minimum height to allow space for the display of the trait value below the circles
          if (tempHeight > heightProportion) {
            tempHeight += this.dimensions.textPartHeight - this.dimensions.padding
          }
        }

        this.dimensions.cellHeight = tempHeight

        this.$nextTick(() => {
          this.init()
          if (this.$refs.colHead) {
            this.$refs.colHead.reset()
          }
          if (this.$refs.rowHead) {
            this.$refs.rowHead.reset()
          }
          if (this.$refs.vScroll) {
            this.$refs.vScroll.reset()
          }
          if (this.$refs.hScroll) {
            this.$refs.hScroll.reset()
          }
          this.$nextTick(() => {
            if (requestAnimationFrame in window) {
              requestAnimationFrame(() => this.update())
            } else {
              this.update()
            }

            // if (scrollToCorner) {
            //   this.$nextTick(() => this.scrollToCorner(scrollToCorner))
            // }
            this.isResetting = false
          })
        })
      })
    }
  },
  created: function () {
    if (this.storeCanvasSize) {
      if (this.storeCanvasSize === CANVAS_SIZE_SMALL) {
        this.dimensions.circleRadius = 8
      } else if (this.storeCanvasSize === CANVAS_SIZE_MEDIUM) {
        this.dimensions.circleRadius = 10
      } else if (this.storeCanvasSize === CANVAS_SIZE_LARGE) {
        this.dimensions.circleRadius = 12
      }
    }

    if (this.storeCanvasDensity) {
      if (this.storeCanvasDensity === CANVAS_DENSITY_LOW) {
        this.dimensions.padding = this.dimensions.circleRadius * 2
      } else if (this.storeCanvasDensity === CANVAS_DENSITY_MEDIUM) {
        this.dimensions.padding = this.dimensions.circleRadius * 1.25
      } else if (this.storeCanvasDensity === CANVAS_DENSITY_HIGH) {
        this.dimensions.padding = this.dimensions.circleRadius * 0.5
      }
    }
  },
  mounted: function () {
    this.updateTrial()

    window.addEventListener('resize', this.reset)
  },
  beforeUnmount: function () {
    window.removeEventListener('resize', this.reset)
  }
}
</script>

<style scoped>
.grid {
  height: 100vh;
  height: 100svh;
  max-height: 100vh;
  max-height: 100svh;
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  grid-template-rows: min-content 1fr min-content;
  grid-template-areas:
    "tl colHeaders tr"
    "rowHeaders dataView vScroll"
    "bl hScroll br"
}
.grid .cell:hover {
  cursor: pointer;
}
</style>

<style>
.grid .corner {
  background-color: #ffffff;
}
html.dark-mode .grid .corner {
  background-color: #000000;
}
</style>
