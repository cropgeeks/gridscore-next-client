<template>
  <div class="page-grid" ref="overallWrapper" v-if="trial && trialData">
    <div />
    <div class="column-headers" ref="columnHeader" :style="{ gridTemplateColumns: `repeat(${columns.length}, ${cellWidth}px)` }">
      <div v-for="column in columns" :class="{
        cell: true,
        'p-2': true,
        'text-center': true,
        'cell-column': column.index % 2 === 0,
        'header-marked': column.marked
      }" :key="`column-${column.index}`" @click="column.marked = !column.marked">{{ column.text }}</div>
    </div>
    <div class="row-headers" ref="rowHeader" :style="{ gridTemplateRows: `repeat(${rows.length}, ${cellHeight}px)` }">
      <div v-for="row in rows" :class="{
        cell: true,
        'p-2': true,
        'text-center': true,
        'cell-row': row.index % 2 === 0,
        'header-marked': row.marked
      }" :key="`row-${row.index}`" @click="row.marked = !row.marked">{{ row.text }}</div>
    </div>
    <div class="data-grid-wrapper" ref="wrapper">
      <div class="data-grid" :style="{ gridTemplateColumns: `repeat(${trial.layout.columns}, ${cellWidth}px)`, gridTemplateRows: `repeat(${trial.layout.rows}, ${cellHeight}px)` }">
        <template v-for="row in rows">
          <template v-for="column in columns">
            <!-- Temporary variable -->
            {{ (cell = trialData[`${row.index}|${column.index}`], null) }}
            <div
              :key="`cell-${row.index}-${column.index}`" @click="plotClicked(row.index, column.index)"
              :class="{
                cell: true,
                'text-center': true,
                'cell-marked': column.marked || row.marked,
                'cell-column': column.index % 2 === 0,
                'cell-row': row.index % 2 === 0,
                'cell-control': storeHighlightControls && cell && cell.categories && cell.categories.includes(CELL_CATEGORY_CONTROL)
              }">
              <template v-if="cell">
                <BIconBookmarkCheckFill class="bookmark" v-if="cell.isMarked" />
                <BIconChatRightTextFill class="comment" v-if="cell.comments && cell.comments.length > 0" />
                <BIconCheckSquareFill class="check" v-if="storeHighlightControls && cell && cell.categories && cell.categories.includes(CELL_CATEGORY_CONTROL)" />
                <div class="cell-text my-1">{{ cell.displayName }}</div>
                <template v-for="trait in visibleTraits">
                  <template v-if="cell.measurements[trait.id] && cell.measurements[trait.id].length > 0">
                    <span class="circle-full mx-1" :key="`cell-${row.index}-${column.index}-trait-full-${trait.id}`" :style="{ background: trait.color }" />
                  </template>
                  <template v-else>
                    <span class="circle-empty mx-1" :key="`cell-${row.index}-${column.index}-trait-empty-${trait.id}`" :style="{ borderColor: trait.color }" />
                  </template>
                </template>
                <div class="cell-text" v-if="visibleTraits.length === 1">
                  {{ singleTraitValues[`${row.index}|${column.index}`] }}
                </div>
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
import { DISPLAY_ORDER_BOTTOM_TO_TOP, DISPLAY_ORDER_RIGHT_TO_LEFT, CELL_CATEGORY_CONTROL } from '@/plugins/constants'
import { BIconBookmarkCheckFill, BIconChatRightTextFill, BIconCheckSquareFill } from 'bootstrap-vue'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconBookmarkCheckFill,
    BIconChatRightTextFill,
    BIconCheckSquareFill
  },
  data: function () {
    return {
      CELL_CATEGORY_CONTROL,
      trial: null,
      trialData: null,
      dataPointDiameter: 22,
      cellWidth: 100,
      cellHeight: 40,
      scrollSynced: false,
      columns: [],
      rows: []
    }
  },
  computed: {
    ...mapGetters([
      'storeHiddenTraits',
      'storeSelectedTrial',
      'storeDisplayMinCellWidth',
      'storeHighlightControls'
    ]),
    visibleTraits: function () {
      if (this.trial) {
        return this.trial.traits.filter(t => !this.storeHiddenTraits.includes(t.id))
      } else {
        return []
      }
    },
    singleTraitValues: function () {
      if (this.trial && this.visibleTraits.length === 1) {
        const result = {}

        Object.keys(this.trialData).forEach(k => {
          const cell = this.trialData[k]

          if (cell) {
            const traitMeasurements = cell.measurements[this.visibleTraits[0].id] || []
            const dp = traitMeasurements.filter(m => m.values !== undefined && m.values !== null && m.values.length > 0)

            let str
            if (this.visibleTraits[0].dataType === 'categorical') {
              str = dp.map(m => m.values.map(v => this.visibleTraits[0].restrictions.categories[v])).join(', ')
            } else {
              str = dp.map(m => m.values).join(', ')
            }
            result[k] = str
          }
        })

        return result
      } else {
        return {}
      }
    }
  },
  watch: {
    visibleTraits: function () {
      this.updateDimensions()
    }
  },
  methods: {
    jumpToCorner: function (corner) {
      const w = this.$refs.wrapper
      switch (corner) {
        case 'topLeft':
          w.scroll({ left: 0, top: 0 })
          break
        case 'top':
          w.scroll({ top: 0 })
          break
        case 'topRight':
          w.scroll({ left: w.scrollWidth, top: 0 })
          break
        case 'left':
          w.scroll({ left: 0 })
          break
        case 'right':
          w.scroll({ left: w.scrollWidth })
          break
        case 'bottomLeft':
          w.scroll({ left: 0, top: w.scrollHeight })
          break
        case 'bottom':
          w.scroll({ top: w.scrollHeight })
          break
        case 'bottomRight':
          w.scroll({ left: w.scrollWidth, top: w.scrollHeight })
          break
        case 'center':
          w.scroll({ left: w.scrollWidth / 2 - w.clientWidth / 2, top: w.scrollHeight / 2 - w.clientHeight / 2 })
          break
        case 'gps':
          // TODO
          break
      }
    },
    getCellClass: function (index) {
      const column = index % this.trial.layout.columns
      const row = Math.floor(index / this.trial.layout.columns)

      return ((row % 2 === 0) ? 1 : 0) + ((column % 2 === 0) ? 1 : 0)
    },
    plotClicked: function (row, column) {
      emitter.emit('plot-clicked', row, column)
    },
    loadTrial: function () {
      getTrialById(this.storeSelectedTrial).then(trial => {
        this.trial = trial

        this.columns = Array.from(Array(trial.layout.columns).keys()).map(col => {
          return {
            marked: false,
            text: this.trial.layout.columnOrder === DISPLAY_ORDER_RIGHT_TO_LEFT ? this.$n(this.trial.layout.columns - col) : this.$n(col + 1),
            index: col
          }
        })
        this.rows = Array.from(Array(trial.layout.rows).keys()).map(row => {
          return {
            marked: false,
            text: this.trial.layout.rowOrder === DISPLAY_ORDER_BOTTOM_TO_TOP ? this.$n(this.trial.layout.rows - row) : this.$n(row + 1),
            index: row
          }
        })

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
        this.cellWidth = Math.floor(Math.max(this.$refs.wrapper.clientWidth / this.trial.layout.columns, this.storeDisplayMinCellWidth * this.dataPointDiameter + (this.storeDisplayMinCellWidth - 1) * padding))
        const coreWidth = this.cellWidth - padding * 2

        let circlesPerRow = 1
        for (let t = this.visibleTraits.length; t > 0; t--) {
          const x = this.dataPointDiameter * t + padding / 2 * (t - 1)

          if (x <= coreWidth) {
            circlesPerRow = t
            break
          }
        }

        const circleRows = Math.ceil(this.visibleTraits.length / circlesPerRow)

        const heightProportion = this.$refs.wrapper.clientHeight / this.trial.layout.rows
        const textHeight = 30
        let tempHeight = Math.max(textHeight + circleRows * (this.dataPointDiameter + padding), heightProportion)

        if (this.visibleTraits.length === 1) {
          // Check if we need to increase the minimum height to allow space for the display of the trait value below the circles
          if (tempHeight > heightProportion) {
            tempHeight += textHeight - padding
          }
        }

        this.cellHeight = Math.floor(tempHeight)

        if (!this.scrollSynced) {
          this.$refs.wrapper.addEventListener('scroll', this.syncScroll)
        }
      }
    },
    syncScroll: function () {
      if (this.timeout) {
        window.cancelAnimationFrame(this.timeout)
      }

      this.timeout = window.requestAnimationFrame(() => {
        this.$refs.rowHeader.scrollTop = this.$refs.wrapper.scrollTop
        this.$refs.columnHeader.scrollLeft = this.$refs.wrapper.scrollLeft
      })
    },
    updateCellCache: function (row, column, trialId, cell) {
      if (this.trial.localId === trialId) {
        this.trialData[`${row}|${column}`] = cell
      }
    }
  },
  mounted: function () {
    if (this.storeSelectedTrial) {
      this.loadTrial()
    }

    emitter.on('trial-data-loaded', this.reset)
    emitter.on('jump-to-corner', this.jumpToCorner)
    emitter.on('plot-cache-changed', this.updateCellCache)
    window.addEventListener('resize', this.updateDimensions)
  },
  beforeDestroy: function () {
    emitter.off('trial-data-loaded', this.reset)
    emitter.off('jump-to-corner', this.jumpToCorner)
    emitter.off('plot-cache-changed', this.updateCellCache)
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
  overflow: auto;
  scrollbar-width: thin;
}

.page-grid:hover {
  cursor: pointer;
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

.cell {
  background: #ffffff;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
  position: relative;
}
.cell .bookmark {
  position: absolute;
  top: 0;
  right: 5px;
  color: #8e8c84;
}
.cell .comment {
  position: absolute;
  top: 5px;
  left: 5px;
  color: #8e8c84;
}
.cell .check {
  position: absolute;
  bottom: 5px;
  right: 5px;
  color: #8e8c84;
}
.cell-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-row, .cell-column {
  background: #f2f2f2;
}
.cell-row.cell-column {
  background: #e0e0e0;
}
.cell-marked {
  background: #c6d2de !important;
}
.header-marked {
  background: #aebfd0;
}
.cell-control {
  background: #82ccdd !important;
}
</style>
