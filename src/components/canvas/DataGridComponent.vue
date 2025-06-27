<template>
  <div class="page-grid" ref="overallWrapper" v-if="trial && trialData">
    <div @click="clearMarkedRowsCols" />
    <div class="column-headers force-ltr" ref="columnHeader" id="data-canvas-header" :style="{ gridTemplateColumns: `repeat(${columns.length}, ${cellWidth}px)` }">
      <div v-for="column in columns" :class="{
        cell: true,
        'p-2': true,
        'text-center': true,
        'cell-column': column.index % 2 === 0,
        'header-marked': column.marked
      }" :key="`column-${column.index}`" @click="column.marked = !column.marked">{{ column.text }}</div>
    </div>
    <div class="row-headers force-ltr" ref="rowHeader" :style="{ gridTemplateRows: `repeat(${rows.length}, ${cellHeight}px)` }">
      <div v-for="row in rows" :class="{
        cell: true,
        'p-2': true,
        'text-center': true,
        'cell-row': row.index % 2 === 0,
        'header-marked': row.marked
      }" :key="`row-${row.index}`" @click="row.marked = !row.marked">{{ row.text }}</div>
    </div>
    <div :class="`data-grid-wrapper force-ltr ${disableScroll ? 'no-scroll' : ''}`" ref="wrapper">
      <teleport to="body">
        <div class="top-0 end-0 toast-container position-fixed p-3">
          <b-toast id="marking-restriction-toast" :title="$t('toastDataInputRestrictedTitle')" :model-value="5000" :interval="100" v-model="showRestrictionToast" v-if="storeRestrictInputToMarked">
            <p>{{ $t('toastDataInputRestrictedText') }}</p>
            <div class="d-flex justify-content-between">
              <b-button @click="disableMarkingRestriction" variant="warning">{{ $t('buttonDisable') }}</b-button>
              <b-button @click="showRestrictionToast = false" variant="secondary">{{ $t('buttonClose') }}</b-button>
            </div>
          </b-toast>
        </div>
      </teleport>
      <template v-if="userPosition">
        <IBiCursorFill class="grid-icon gps-position" :style="{
          left: `${userPosition.x}px`,
          top: `${userPosition.y}px`,
          transform: `rotate(${userPosition.rotate}deg)`
        }" v-if="userPosition.heading !== undefined && userPosition.heading !== null" />
        <IBiRecordCircle class="grid-icon gps-position" :style="{
          left: `${userPosition.x}px`,
          top: `${userPosition.y}px`
        }" v-else />
      </template>
      <IBiCircleFill class="grid-icon position-absolute marker" v-for="(marker, mIndex) in markers" :key="`marker-${mIndex}`" :style="{ left: marker[0], top: marker[1] }" />
      <div class="data-grid" :style="{ gridTemplateColumns: `repeat(${trial.layout.columns}, ${cellWidth}px)`, gridTemplateRows: `repeat(${trial.layout.rows}, ${cellHeight}px)` }">
        <template v-for="row in rows">
          <template v-for="column in columns" :key="`cell-${row.index}-${column.index}`">
            <!-- Temporary variable -->
            {{ (cell = trialData[`${row.index}|${column.index}`], null) }}
            <div
               @click="plotClicked(row.index, column.index)"
              :class="[{
                'cell-empty': cell === undefined,
                'cell-marked': column.marked || row.marked,
                'cell-column': column.index % 2 === 0,
                'cell-highlight': userPosition && userPosition.column === column.index && userPosition.row === row.index,
                'cell-row': row.index % 2 === 0,
                'cell-control': storeHighlightControls && cell && cell.categories && cell.categories.includes(CELL_CATEGORY_CONTROL)
              }, cellClass]">
              <template v-if="cell">
                <IBiBookmarkCheckFill class="grid-icon bookmark" v-if="cell.isMarked" />
                <IBiChatRightTextFill class="grid-icon comment" v-if="cell.comments && cell.comments.length > 0" />
                <IBiCheckSquareFill class="grid-icon check" v-if="storeHighlightControls && cell && cell.categories && cell.categories.includes(CELL_CATEGORY_CONTROL)" />
                <div class="cell-text my-1">{{ cell[storePlotDisplayField] }}</div>
                <template v-for="trait in visibleTraits">
                  <template v-if="cell.measurements[trait.id] && cell.measurements[trait.id].length > 0 && (!traitCutoff || !cell.latestDates || !cell.latestDates[trait.id] || (cell.latestDates[trait.id] > traitCutoff))">
                    <template v-if="trait.allowRepeats">
                      <svg xmlns="http://www.w3.org/2000/svg" :key="`cell-${row.index}-${column.index}-square-trait-full-${trait.id}`" :width="circleDiameter" :height="circleDiameter" fill="currentColor" :style="[{ color: trait.color }, circleStyle]" class="circle circle-full" viewBox="0 0 16 16" v-if="storeCanvasShape === CANVAS_SHAPE_SQUARE">
                        <path d="M 1,15 15,1 v 14 z m 15,1 V 0 H 0 v 16 z"/>
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" :key="`cell-${row.index}-${column.index}-circle-trait-full-${trait.id}`" :width="circleDiameter" :height="circleDiameter" fill="currentColor" :style="[{ color: trait.color }, circleStyle]" class="circle circle-full" viewBox="0 0 16 16" v-else>
                        <path d="M8 15A7 7 0 1 0 8 1zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16"/>
                      </svg>
                    </template>
                    <span class="circle circle-full" :key="`cell-${row.index}-${column.index}-trait-full-${trait.id}`" :style="[{ background: trait.color }, circleStyle]" v-else />
                  </template>
                  <template v-else>
                    <span class="circle circle-empty" :key="`cell-${row.index}-${column.index}-trait-empty-${trait.id}`" :style="[{ borderColor: trait.color }, circleStyle]" />
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
import { toRef } from 'vue'
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import { getTrialById } from '@/plugins/idb'
import { getTrialDataCached } from '@/plugins/datastore'
import { CANVAS_DENSITY_HIGH, CANVAS_DENSITY_MEDIUM, CANVAS_DENSITY_LOW, CANVAS_SHAPE_SQUARE, CELL_CATEGORY_CONTROL, NAVIGATION_MODE_JUMP, CANVAS_SIZE_SMALL, CANVAS_SIZE_LARGE, CANVAS_SIZE_MEDIUM } from '@/plugins/constants'
import { projectToEuclidean } from '@/plugins/location'

import emitter from 'tiny-emitter/instance'
import { getColumnLabel, getRowLabel } from '@/plugins/misc'

export default {
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
      CANVAS_SHAPE_SQUARE,
      CELL_CATEGORY_CONTROL,
      trial: null,
      trialData: null,
      cellWidth: 100,
      cellHeight: 40,
      scrollSynced: false,
      columns: [],
      rows: [],
      gridProjection: null,
      markers: {},
      showRestrictionToast: false
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeHiddenTraits',
      'storeSelectedTrial',
      'storeDisplayMinCellWidth',
      'storeHighlightControls',
      'storeDisplayMarkerIndicators',
      'storeRestrictInputToMarked',
      'storeNavigationMode',
      'storeCanvasSize',
      'storeCanvasShape',
      'storeCanvasDensity',
      'storePlotDisplayField'
    ]),
    cellClass: function () {
      return {
        cell: true,
        small: this.storeCanvasSize === CANVAS_SIZE_SMALL,
        medium: this.storeCanvasSize === CANVAS_SIZE_MEDIUM,
        large: this.storeCanvasSize === CANVAS_SIZE_LARGE,
        'rounded-dp': this.storeCanvasShape !== CANVAS_SHAPE_SQUARE,
        'text-center': true
      }
    },
    circleDiameter: function () {
      if (this.storeCanvasSize) {
        if (this.storeCanvasSize === CANVAS_SIZE_SMALL) {
          return 16
        } else if (this.storeCanvasSize === CANVAS_SIZE_MEDIUM) {
          return 20
        } else if (this.storeCanvasSize === CANVAS_SIZE_LARGE) {
          return 24
        }
      }

      return 20
    },
    circlePadding: function () {
      let result = this.circleDiameter / 4 * 1.25

      if (this.storeCanvasDensity) {
        if (this.storeCanvasDensity === CANVAS_DENSITY_LOW) {
          result = this.circleDiameter / 4 * 2
        } else if (this.storeCanvasDensity === CANVAS_DENSITY_MEDIUM) {
          result = this.circleDiameter / 4 * 1.25
        } else if (this.storeCanvasDensity === CANVAS_DENSITY_HIGH) {
          result = this.circleDiameter / 4 * 0.5
        }
      }

      return result
    },
    circleStyle: function () {
      return {
        margin: `${this.circlePadding / 2}px`
      }
    },
    disableScroll: function () {
      return this.storeNavigationMode === NAVIGATION_MODE_JUMP
    },
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
            rotate
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
    clearMarkedRowsCols: function () {
      this.columns.forEach(c => {
        c.marked = false
      })
      this.rows.forEach(r => {
        r.marked = false
      })
    },
    moveInDirection: function (direction) {
      const w = this.$refs.wrapper
      switch (direction) {
        case 'topLeft':
          w.scroll({ left: w.scrollLeft - this.cellWidth, top: w.scrollTop - this.cellHeight })
          break
        case 'top':
          w.scroll({ top: w.scrollTop - this.cellHeight })
          break
        case 'topRight':
          w.scroll({ left: w.scrollLeft + this.cellWidth, top: w.scrollTop - this.cellHeight })
          break
        case 'left':
          w.scroll({ left: w.scrollLeft - this.cellWidth })
          break
        case 'right':
          w.scroll({ left: w.scrollLeft + this.cellWidth })
          break
        case 'bottomLeft':
          w.scroll({ left: w.scrollLeft - this.cellWidth, top: w.scrollTop + this.cellHeight })
          break
        case 'bottom':
          w.scroll({ top: w.scrollTop + this.cellHeight })
          break
        case 'bottomRight':
          w.scroll({ left: w.scrollLeft + this.cellWidth, top: w.scrollTop + this.cellHeight })
          break
      }
    },
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
          if (this.userPosition) {
            w.scroll({ left: w.scrollWidth * this.userPosition.euclideanX / 100, top: w.scrollHeight * this.userPosition.euclideanY / 100 })
          }
          break
      }
    },
    getCellClass: function (index) {
      const column = index % this.trial.layout.columns
      const row = Math.floor(index / this.trial.layout.columns)

      return ((row % 2 === 0) ? 1 : 0) + ((column % 2 === 0) ? 1 : 0)
    },
    disableMarkingRestriction: function () {
      this.coreStore.setRestrictInputToMarked(false)
    },
    plotClicked: function (row, column) {
      if (this.storeRestrictInputToMarked) {
        const anyMarked = this.rows.some(r => r.marked) || this.columns.some(c => c.marked)

        if (anyMarked) {
          if (!this.columns[column].marked && !this.rows[row].marked) {
            this.showRestrictionToast = true
            return
          }
        }
      }

      const cell = this.trialData[`${row}|${column}`]

      if (cell) {
        // Emit an event to handle user selections
        emitter.emit('plot-clicked', row, column)
      }
    },
    loadTrial: function () {
      getTrialById(this.storeSelectedTrial).then(trial => {
        this.trial = trial

        this.columns = Array.from(Array(trial.layout.columns).keys()).map(col => {
          return {
            marked: false,
            text: this.$n(getColumnLabel(this.trial.layout, col)),
            index: col
          }
        })
        this.rows = Array.from(Array(trial.layout.rows).keys()).map(row => {
          return {
            marked: false,
            text: this.$n(getRowLabel(this.trial.layout, row)),
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

        this.reset()
      })
    },
    reset: function () {
      this.trialData = JSON.parse(JSON.stringify(getTrialDataCached()))

      if (!this.trialData) {
        // TODO
      } else {
        Object.values(this.trialData).forEach(c => {
          c.latestDates = {}
          this.trial.traits.forEach(t => {
            if (t.allowRepeats && c.measurements[t.id] && c.measurements[t.id].length > 0) {
              c.latestDates[t.id] = new Date(c.measurements[t.id][c.measurements[t.id].length - 1].timestamp).toISOString().split('T')[0]
            }
          })
        })
      }

      this.$nextTick(() => this.updateDimensions())
    },
    updateDimensions: function () {
      if (this.$refs.wrapper) {
        const padding = this.circlePadding

        this.cellWidth = Math.ceil(Math.max(this.$refs.wrapper.clientWidth / this.trial.layout.columns, this.storeDisplayMinCellWidth * (this.circleDiameter + this.circlePadding)))
        const coreWidth = this.cellWidth

        let circlesPerRow = 1
        for (let t = this.visibleTraits.length; t > 0; t--) {
          const x = (this.circleDiameter + this.circlePadding) * t

          if (x <= coreWidth) {
            circlesPerRow = t
            break
          }
        }

        const circleRows = Math.ceil(this.visibleTraits.length / circlesPerRow)

        const heightProportion = this.$refs.wrapper.clientHeight / this.trial.layout.rows
        const textHeight = this.storePlotDisplayField === null ? 0 : 30
        let tempHeight = Math.max(textHeight + circleRows * (this.circleDiameter + padding) + padding, heightProportion)

        if (this.visibleTraits.length === 1) {
          // Check if we need to increase the minimum height to allow space for the display of the trait value below the circles
          if (tempHeight >= heightProportion) {
            tempHeight += textHeight
          }
        }

        this.cellHeight = Math.floor(tempHeight)

        if (this.storeDisplayMarkerIndicators && this.trial.layout.markers && this.trial.layout.markers.anchor && this.trial.layout.markers.everyRow && this.trial.layout.markers.everyColumn) {
          const markV = this.cellHeight * this.trial.layout.markers.everyRow
          const markH = this.cellWidth * this.trial.layout.markers.everyColumn

          const coords = []

          const width = this.trial.layout.columns * this.cellWidth
          const height = this.trial.layout.rows * this.cellHeight
          let x = 0
          let y = 0
          const iconWidth = 16
          while (x <= width) {
            while (y <= height) {
              let finalX = x
              let finalY = y

              switch (this.trial.layout.markers.anchor) {
                case 'topRight':
                  finalX = width - x
                  break
                case 'bottomLeft':
                  finalY = height - y
                  break
                case 'bottomRight':
                  finalX = width - x
                  finalY = height - y
                  break
              }

              coords.push([finalX - iconWidth / 2, finalY - iconWidth / 2])
              y += markV
            }
            x += markH
            y = 0
          }

          this.markers = coords
        }

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
        this.trialData[`${row}|${column}`] = toRef(cell)
      }
    }
  },
  mounted: function () {
    if (this.storeSelectedTrial) {
      this.loadTrial()
    }

    emitter.on('trial-data-loaded', this.reset)
    emitter.on('jump-to-corner', this.jumpToCorner)
    emitter.on('move-to-corner', this.moveInDirection)
    emitter.on('plot-cache-changed', this.updateCellCache)
    window.addEventListener('resize', this.updateDimensions)
  },
  beforeUnmount: function () {
    emitter.off('trial-data-loaded', this.reset)
    emitter.off('jump-to-corner', this.jumpToCorner)
    emitter.off('move-to-corner', this.moveInDirection)
    emitter.off('plot-cache-changed', this.updateCellCache)
    window.removeEventListener('resize', this.updateDimensions)

    if (this.scrollSynced && this.$refs.wrapper) {
      this.$refs.wrapper.removeEventListener('scroll', this.syncScroll)
    }
  }
}
</script>

<style>
.data-grid-wrapper {
  overflow: auto;
  scrollbar-width: thin;
  position: relative;
}

.data-grid-wrapper.no-scroll {
  overflow: hidden;
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

.data-grid .circle {
  display: inline-block;
}
.data-grid .cell.rounded-dp .circle {
  border-radius: 100px;
}
.data-grid .circle-empty {
  background: transparent;
  border-width: 1px;
  border-style: solid;
  box-sizing: content-box;
}
.data-grid .cell svg.circle {
  vertical-align: unset;
}

.data-grid .cell.small .circle-full {
  width: 16px;
  height: 16px;
}
.data-grid .cell.medium .circle-full {
  width: 20px;
  height: 20px;
}
.data-grid .cell.large .circle-full {
  width: 24px;
  height: 24px;
}
.data-grid .cell.small .circle-empty {
  width: 14px;
  height: 14px;
}
.data-grid .cell.medium .circle-empty {
  width: 18px;
  height: 18px;
}
.data-grid .cell.large .circle-empty {
  width: 22px;
  height: 22px;
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
.data-grid .cell {
  line-height: 0px;
}
.grid-icon {
  color: #8e8c84;
  pointer-events: none;
}
.marker {
  z-index: 1;
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
  line-height: 1.5em;
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
.cell-empty:hover {
  cursor: not-allowed;
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
.force-ltr {
  direction: ltr;
}
</style>
