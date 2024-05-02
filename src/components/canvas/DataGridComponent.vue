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
      <template v-if="userPosition">
        <BIconCursorFill class="grid-icon gps-position" :style="{
          left: `${userPosition.x}px`,
          top: `${userPosition.y}px`,
          transform: `rotate(${userPosition.rotate}deg)`
        }" v-if="userPosition.heading !== undefined && userPosition.heading !== null" />
        <BIconRecordCircle class="grid-icon gps-position" :style="{
          left: `${userPosition.x}px`,
          top: `${userPosition.y}px`
        }" v-else />
      </template>
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
                'cell-highlight': userPosition && userPosition.column === column.index && userPosition.row === row.index,
                'cell-row': row.index % 2 === 0,
                'cell-control': storeHighlightControls && cell && cell.categories && cell.categories.includes(CELL_CATEGORY_CONTROL)
              }">
              <template>
                <template v-if="storeDisplayMarkerIndicators && markers[`${row.index}|${column.index}`]">
                  <BIconCircleFill class="grid-icon marker-top-left" v-if="markers[`${row.index}|${column.index}`].topLeft" />
                  <BIconCircleFill class="grid-icon marker-top-right" v-if="markers[`${row.index}|${column.index}`].topRight" />
                  <BIconCircleFill class="grid-icon marker-bottom-left" v-if="markers[`${row.index}|${column.index}`].bottomLeft" />
                  <BIconCircleFill class="grid-icon marker-bottom-right" v-if="markers[`${row.index}|${column.index}`].bottomRight" />
                </template>
                <template v-if="cell">
                  <BIconBookmarkCheckFill class="grid-icon bookmark" v-if="cell.isMarked" />
                  <BIconChatRightTextFill class="grid-icon comment" v-if="cell.comments && cell.comments.length > 0" />
                  <BIconCheckSquareFill class="grid-icon check" v-if="storeHighlightControls && cell && cell.categories && cell.categories.includes(CELL_CATEGORY_CONTROL)" />
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
import { BIconBookmarkCheckFill, BIconChatRightTextFill, BIconCheckSquareFill, BIconCircleFill, BIconRecordCircle, BIconCursorFill } from 'bootstrap-vue'
import { projectToEuclidean } from '@/plugins/location'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconCursorFill,
    BIconBookmarkCheckFill,
    BIconChatRightTextFill,
    BIconCheckSquareFill,
    BIconRecordCircle,
    BIconCircleFill
  },
  props: {
    geolocation: {
      type: Object,
      default: () => null
    }
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
      rows: [],
      gridProjection: null,
      markers: {}
    }
  },
  computed: {
    ...mapGetters([
      'storeHiddenTraits',
      'storeSelectedTrial',
      'storeDisplayMinCellWidth',
      'storeHighlightControls',
      'storeDisplayMarkerIndicators'
    ]),
    userPosition: function () {
      if (this.geolocation && this.gridProjection) {
        const euclideanPosition = this.gridProjection(this.geolocation.lng, this.geolocation.lat)

        const highlightRow = this.trial.layout.rows - Math.ceil(this.trial.layout.rows * (100 - euclideanPosition.y) / 100.0)
        const highlightColumn = Math.floor(this.trial.layout.columns * euclideanPosition.x / 100.0)

        if (highlightRow < 0 || highlightRow > this.trial.layout.rows - 1 || highlightColumn < 0 || highlightColumn > this.trial.layout.columns - 1) {
          return null
        } else {
          const dataWidth = this.cellWidth * this.trial.layout.columns
          const dataHeight = this.cellHeight * this.trial.layout.rows

          let rotate

          if (this.geolocation.heading !== undefined && this.geolocation.heading !== null) {
            const topX = (this.trial.layout.corners.topRight.lng + this.trial.layout.corners.topLeft.lng) / 2
            const bottomX = topX
            const topY = (this.trial.layout.corners.topRight.lat + this.trial.layout.corners.topLeft.lat) / 2
            const bottomY = topY + 1

            const topProjected = this.gridProjection(topX, topY)
            const bottomProjected = this.gridProjection(bottomX, bottomY)

            const dAx = topProjected.x - bottomProjected.x
            const dAy = topProjected.y - bottomProjected.y
            const dBx = 0
            const dBy = 0 - 100
            let angle = Math.atan2(dAx * dBy - dAy * dBx, dAx * dBx + dAy * dBy)
            if (angle < 0) {
              angle = angle * -1
            }
            rotate = angle * (180 / Math.PI)
            rotate = (rotate - 45 + this.geolocation.heading) % 360
          } else {
            rotate = -45
          }

          return {
            column: highlightColumn,
            row: highlightRow,
            x: dataWidth * euclideanPosition.x / 100 - 16,
            y: dataHeight * euclideanPosition.y / 100 - 16,
            euclideanX: euclideanPosition.x,
            euclideanY: euclideanPosition.y,
            rotate: rotate
          }
        }
      } else {
        return null
      }
    },
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

        if (trial && trial.layout && trial.layout.corners) {
          const c = trial.layout.corners
          this.gridProjection = projectToEuclidean([
            { x: c.topLeft.lng, y: c.topLeft.lat },
            { x: c.topRight.lng, y: c.topRight.lat },
            { x: c.bottomRight.lng, y: c.bottomRight.lat },
            { x: c.bottomLeft.lng, y: c.bottomLeft.lat }
          ])
        } else {
          this.gridProjection = null
        }

        if (this.storeDisplayMarkerIndicators && this.trial.layout.markers && this.trial.layout.markers.anchor && this.trial.layout.markers.everyRow && this.trial.layout.markers.everyColumn) {
          const m = this.trial.layout.markers
          const markers = {}

          if (m.anchor === 'topLeft') {
            for (let y = 0; y < this.trial.layout.rows; y++) {
              for (let x = 0; x < this.trial.layout.columns; x++) {
                if (y % m.everyRow === 0 && x % m.everyColumn === 0) {
                  // Top left circle
                  if (!markers[`${y}|${x}`]) {
                    markers[`${y}|${x}`] = {}
                  }
                  const cell = markers[`${y}|${x}`]
                  cell.topLeft = true
                }

                if (y === this.trial.layout.rows - 1 && x === this.trial.layout.columns - 1) {
                  if ((y + 1) % m.everyRow === 0 && (x + 1) % m.everyColumn === 0) {
                    // Bottom right circle
                    if (!markers[`${y}|${x}`]) {
                      markers[`${y}|${x}`] = {}
                    }
                    const cell = markers[`${y}|${x}`]
                    cell.bottomRight = true
                  }
                } else {
                  if (y === this.trial.layout.rows - 1) {
                    if ((y + 1) % m.everyRow === 0 && x % m.everyColumn === 0) {
                      // Bottom right circle
                      if (!markers[`${y}|${x}`]) {
                        markers[`${y}|${x}`] = {}
                      }
                      const cell = markers[`${y}|${x}`]
                      cell.bottomLeft = true
                    }
                  }
                  if (x === this.trial.layout.columns - 1) {
                    if (y % m.everyRow === 0 && (x + 1) % m.everyColumn === 0) {
                      // Bottom right circle
                      if (!markers[`${y}|${x}`]) {
                        markers[`${y}|${x}`] = {}
                      }
                      const cell = markers[`${y}|${x}`]
                      cell.topRight = true
                    }
                  }
                }
              }
            }
          }

          this.markers = markers
        }

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
  position: relative;
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

.gps-position {
  width: 32px;
  height: 32px;
  position: absolute;
  z-index: 1;
}

.cell {
  background: #ffffff;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
  position: relative;
}
.grid-icon {
  color: #8e8c84;
}
.cell .marker-top-left {
  position: absolute;
  top: -7.5px;
  left: -7.5px;
}
.cell .marker-top-right {
  position: absolute;
  top: -7.5px;
  right: -7.5px;
}
.cell .marker-bottom-left {
  position: absolute;
  bottom: -7.5px;
  left: -7.5px;
}
.cell .marker-bottom-right {
  position: absolute;
  bottom: -7.5px;
  right: -7.5px;
}
.cell .bookmark {
  position: absolute;
  top: 0;
  right: 5px;
}
.cell .comment {
  position: absolute;
  top: 5px;
  left: 5px;
}
.cell .check {
  position: absolute;
  bottom: 5px;
  right: 5px;
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
.cell-highlight {
  background: #A3CB38 !important;
}
</style>
