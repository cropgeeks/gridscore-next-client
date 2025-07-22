<template>
  <div class="canvas-wrapper cell d-block position-relative" v-if="dimensions">
    <canvas id="main-canvas" class="position-absolute" ref="plotCanvas" :width="dimensions.scaledCanvasWidth" :height="dimensions.scaledCanvasHeight" />
    <canvas id="user-position-canvas" class="position-absolute" ref="userCanvas" :width="dimensions.scaledCanvasWidth" :height="dimensions.scaledCanvasHeight" />

    <OffscreenCanvas :circleRadius="dimensions.circleRadius" :traits="trial.traits" ref="offscreenCanvas" />

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
  </div>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import OffscreenCanvas from '@/components/canvas/OffscreenCanvas.vue'
import { CELL_CATEGORY_CONTROL, NAVIGATION_MODE_DRAG } from '@/plugins/constants'
import { projectToEuclidean } from '@/plugins/location'
import { getTrialDataCached } from '@/plugins/datastore'

import emitter from 'tiny-emitter/instance'

const commentImg = new Image()
commentImg.src = 'data:image/svg+xml,%3Csvg viewBox="0 0 16 16" width="1em" height="1em" focusable="false" role="img" aria-label="chat right text fill" xmlns="http://www.w3.org/2000/svg" fill="%238e8c84"%3E%3Cg %3E%3Cpath d="M16 2a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9.586a1 1 0 0 1 .707.293l2.853 2.853a.5.5 0 0 0 .854-.353V2zM3.5 3h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1 0-1zm0 2.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1 0-1zm0 2.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1z"%3E%3C/path%3E%3C/g%3E%3C/svg%3E'
const userPositionImg = new Image()
userPositionImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiM4ZThjODQiIHZpZXdCb3g9IjAgMCAxNiAxNiIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPiA8cGF0aCBkPSJNIDcuOTk5ODcxMiwwLjk5OTU3OTg5IEEgMC41LDAuNSAwIDAgMSA4LjQ2NjU2MTcsMS4zMjA2MDY0IEwgMTMuNDY2NTE0LDE0LjMyMDc2NSBhIDAuNSwwLjUgMCAwIDEgLTAuNjUzMzY3LDAuNjQzNDY3IEwgNy45OTk4NzEyLDEzLjAzNzM2NiAzLjE4NTE4MTEsMTQuOTY0MjMyIEEgMC41LDAuNSAwIDAgMSAyLjUzMzIyODcsMTQuMzIwNzY1IEwgNy41MzMxODA3LDEuMzIwNjA2NCBBIDAuNSwwLjUgMCAwIDEgNy45OTkxNjQxLDEuMDAwMjg3IFoiIC8+IDwvc3ZnPg=='
const userPositionNoHeadingImg = new Image()
userPositionNoHeadingImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9IiM4ZThjODQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgY2xhc3M9ImJpIGJpLXJlY29yZC1jaXJjbGUiIHZpZXdCb3g9IjAgMCAxNiAxNiI+CiAgPHBhdGggZD0iTTggMTVBNyA3IDAgMSAxIDggMWE3IDcgMCAwIDEgMCAxNG0wIDFBOCA4IDAgMSAwIDggMGE4IDggMCAwIDAgMCAxNiIvPgogIDxwYXRoIGQ9Ik0xMSA4YTMgMyAwIDEgMS02IDAgMyAzIDAgMCAxIDYgMCIvPgo8L3N2Zz4='
const bookmarkImg = new Image()
bookmarkImg.src = 'data:image/svg+xml,%3Csvg viewBox="0 0 16 16" width="1em" height="1em" focusable="false" role="img" aria-label="bookmark check fill" xmlns="http://www.w3.org/2000/svg" fill="%238e8c84" %3E%3Cg %3E%3Cpath fill-rule="evenodd" d="M2 15.5V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5zm8.854-9.646a.5.5 0 0 0-.708-.708L7.5 7.793 6.354 6.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3z"%3E%3C/path%3E%3C/g%3E%3C/svg%3E'
const controlImg = new Image()
controlImg.src = 'data:image/svg+xml,%3Csvg viewBox="0 0 16 16" width="1em" height="1em" focusable="false" role="img" aria-label="bookmark check fill" xmlns="http://www.w3.org/2000/svg" fill="%238e8c84" %3E%3Cg %3E%3Cpath fill-rule="evenodd" d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm10.03 4.97a.75.75 0 0 1 .011 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.75.75 0 0 1 1.08-.022z"%3E%3C/path%3E%3C/g%3E%3C/svg%3E'

export default {
  components: {
    OffscreenCanvas
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    },
    traitCutoff: {
      type: String,
      default: null
    },
    dimensions: {
      type: Object,
      default: () => null
    },
    markedRows: {
      type: Array,
      default: () => []
    },
    markedColumns: {
      type: Array,
      default: () => []
    },
    geolocation: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      followGps: false,
      isDrawing: false,
      drag: {
        active: false,
        start: null,
        startTime: null,
        position: null,
        originStart: {
          x: 0,
          y: 0
        }
      },
      origin: {
        x: 0,
        y: 0
      },
      showRestrictionToast: false
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeNavigationMode',
      'storeDarkMode',
      'storeHiddenTraits',
      'storeDisplayMarkerIndicators',
      'storeRestrictInputToMarked',
      'storeHighlightControls',
      'storePlotDisplayField'
    ]),
    userPosition: function () {
      if (this.geolocation && this.gridProjection) {
        const euclideanPosition = this.gridProjection(this.geolocation.lng, this.geolocation.lat)

        const highlightRow = this.trial.layout.rows - Math.ceil(this.trial.layout.rows * (100 - euclideanPosition.y) / 100.0)
        const highlightColumn = Math.floor(this.trial.layout.columns * euclideanPosition.x / 100.0)

        if (highlightRow < 0 || highlightRow > this.trial.layout.rows - 1 || highlightColumn < 0 || highlightColumn > this.trial.layout.columns - 1) {
          return null
        } else {
          const dataWidth = this.dimensions.cellWidth * this.trial.layout.columns
          const dataHeight = this.dimensions.cellHeight * this.trial.layout.rows

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
            rotate = (rotate + this.geolocation.heading) % 360
          } else {
            rotate = null
          }

          return {
            column: highlightColumn,
            row: highlightRow,
            x: this.origin.x + dataWidth * euclideanPosition.x / 100,
            y: this.origin.y + dataHeight * euclideanPosition.y / 100,
            euclideanX: euclideanPosition.x,
            euclideanY: euclideanPosition.y,
            rotate
          }
        }
      } else {
        return null
      }
    },
    mappedTraits: function () {
      if (!this.trial) {
        return []
      } else {
        return this.trial.traits.map((t, i) => {
          return {
            original: t,
            originalIndex: i,
            visible: this.storeHiddenTraits ? !this.storeHiddenTraits.includes(t.id) : true
          }
        })
      }
    },
    markerPositions: function () {
      if (!this.trial || !this.dimensions) {
        return []
      } else {
        if (this.trial.layout.markers && this.trial.layout.markers.anchor && this.trial.layout.markers.everyRow && this.trial.layout.markers.everyColumn) {
          const markV = this.dimensions.cellHeight * this.trial.layout.markers.everyRow
          const markH = this.dimensions.cellWidth * this.trial.layout.markers.everyColumn

          const coords = []

          const width = this.trial.layout.columns * this.dimensions.cellWidth
          const height = this.trial.layout.rows * this.dimensions.cellHeight
          let x = 0
          let y = 0
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

              coords.push([finalX, finalY])
              y += markV
            }
            x += markH
            y = 0
          }

          return coords
        } else {
          return []
        }
      }
    },
    visibleTraits: function () {
      return this.mappedTraits.filter(t => t.visible)
    },
    fillStyleWhite: function () {
      return this.storeDarkMode ? '#000000' : '#ffffff'
    },
    fillStyleLightGray: function () {
      return this.storeDarkMode ? '#0d0d0d' : '#f2f2f2'
    },
    fillStyleDarkGray: function () {
      return this.storeDarkMode ? '#1f1f1f' : '#e0e0e0'
    },
    fillStyleHighlight: function () {
      return this.storeDarkMode ? '#833471' : '#A3CB38'
    },
    fillStyleMarked: function () {
      return this.storeDarkMode ? '#415971' : '#c6d2de'
    },
    fillStyleHiddenTrait: function () {
      return this.storeDarkMode ? '#2c2c2c' : '#d3d3d3'
    },
    fillStyleText: function () {
      return this.storeDarkMode ? '#ffffff' : '#000000'
    },
    fillStyleControl: function () {
      return this.storeDarkMode ? '#0a3d62' : '#82ccdd'
    }
  },
  watch: {
    trial: {
      immediate: true,
      handler: function (newValue) {
        if (newValue && newValue.layout && newValue.layout.corners) {
          const c = newValue.layout.corners
          this.gridProjection = projectToEuclidean([
            { x: c.topLeft.lng, y: c.topLeft.lat },
            { x: c.topRight.lng, y: c.topRight.lat },
            { x: c.bottomRight.lng, y: c.bottomRight.lat },
            { x: c.bottomLeft.lng, y: c.bottomLeft.lat }
          ])
        } else {
          this.gridProjection = null
        }
      }
    },
    userPosition: function () {
      this.updateUserPosition()
    },
    storeDarkMode: function () {
      this.reset()
    },
    markedColumns: function (newValue, oldValue) {
      if (oldValue !== undefined && oldValue !== null) {
        for (let i = 0; i < newValue.length; i++) {
          if (newValue[i] !== oldValue[i]) {
            this.onColumnMarked(i)
          }
        }
      }
    },
    markedRows: function (newValue, oldValue) {
      if (oldValue !== undefined && oldValue !== null) {
        for (let i = 0; i < newValue.length; i++) {
          if (newValue[i] !== oldValue[i]) {
            this.onRowMarked(i)
          }
        }
      }
    },
    traitCutoff: function () {
      this.update()
    }
  },
  methods: {
    disableMarkingRestriction: function () {
      this.coreStore.setRestrictInputToMarked(false)
    },
    onColumnMarked: function (col) {
      const minRow = Math.max(0, Math.floor(Math.abs(this.origin.y) / this.dimensions.cellHeight))
      const maxRow = Math.min(minRow + Math.ceil(this.dimensions.canvasHeight / this.dimensions.cellHeight) + 1, this.trial.layout.rows)

      for (let row = minRow; row < maxRow; row++) {
        this.updateCell(row, col)
      }

      this.updateMarkers()
    },
    onRowMarked: function (row) {
      const minCol = Math.max(0, Math.floor(Math.abs(this.origin.x) / this.dimensions.cellWidth))
      const maxCol = Math.min(minCol + Math.ceil(this.dimensions.canvasWidth / this.dimensions.cellWidth) + 1, this.trial.layout.columns)

      for (let col = minCol; col < maxCol; col++) {
        this.updateCell(row, col)
      }

      this.updateMarkers()
    },
    update: function (scrollToRow, scrollToColumn) {
      if (!this.ctx) {
        return
      }
      if (this.isDrawing) {
        return
      }
      this.isDrawing = true

      this.ctx.clearRect(0, 0, this.dimensions.canvasWidth, this.dimensions.canvasHeight)

      if (!this.trialData || Object.keys(this.trialData).length < 1) {
        return
      }

      // Calculate row and column bounds that need to be redrawn
      const minRow = Math.max(0, Math.floor(Math.abs(this.origin.y) / this.dimensions.cellHeight))
      const maxRow = Math.min(minRow + Math.ceil(this.dimensions.canvasHeight / this.dimensions.cellHeight) + 1, this.trial.layout.rows)
      const minCol = Math.max(0, Math.floor(Math.abs(this.origin.x) / this.dimensions.cellWidth))
      const maxCol = Math.min(minCol + Math.ceil(this.dimensions.canvasWidth / this.dimensions.cellWidth) + 1, this.trial.layout.columns)

      // Draw all cells
      for (let row = minRow; row < maxRow; row++) {
        for (let col = minCol; col < maxCol; col++) {
          this.updateCell(row, col)
        }
      }

      this.updateMarkers()

      if (this.geolocation) {
        this.updateUserPosition()
      }

      this.isDrawing = false

      if (scrollToRow !== undefined && scrollToRow !== null && scrollToColumn !== undefined && scrollToColumn !== null) {
        const x = scrollToColumn / this.trial.layout.columns * 100
        const y = scrollToRow / this.trial.layout.rows * 100
        this.scrollTo(x, y)
      }
    },
    reset: async function () {
      this.trialData = getTrialDataCached()

      if (!this.trialData) {
        return
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

      return new Promise(resolve => {
        const scale = window.devicePixelRatio
        const c = this.$refs.plotCanvas
        const uc = this.$refs.userCanvas
        c.width = this.dimensions.scaledCanvasWidth
        c.height = this.dimensions.scaledCanvasHeight
        uc.width = this.dimensions.scaledCanvasWidth
        uc.height = this.dimensions.scaledCanvasHeight

        this.$nextTick(() => {
          c.style.width = this.dimensions.canvasWidth + 'px'
          c.style.height = this.dimensions.canvasHeight + 'px'
          uc.style.width = this.dimensions.canvasWidth + 'px'
          uc.style.height = this.dimensions.canvasHeight + 'px'

          this.$nextTick(() => {
            this.ctx = c.getContext('2d', { alpha: false })
            this.ctx.scale(scale, scale)
            this.ctx.textBaseline = 'middle'
            this.ctx.textAlign = 'center'
            this.ctx.font = `${this.dimensions.fontSize}px sans-serif`

            this.uctx = uc.getContext('2d', { alpha: true })
            this.uctx.scale(scale, scale)

            this.drag = {
              active: false,
              start: null,
              startTime: null,
              position: null,
              originStart: {
                x: 0,
                y: 0
              }
            }

            if (this.storeNavigationMode === NAVIGATION_MODE_DRAG) {
              c.onmousedown = this.onMouseDown
              c.ontouchstart = this.onMouseDown
              c.onmouseup = this.onMouseUp
              c.ontouchend = this.onMouseUp
              c.onmouseleave = this.onMouseLeave
              c.ontouchleave = this.onMouseLeave
              c.onmousemove = this.onMouseMove
              c.ontouchmove = this.onMouseMove
              c.onwheel = this.onMouseWheel
            } else {
              c.onmousedown = this.onMouseDown
              c.ontouchstart = this.onMouseDown
              c.onmouseup = this.onMouseUp
              c.ontouchend = this.onMouseUp
            }

            this.update()

            resolve()
          })
        })
      })
    },
    onMouseWheel: function (e) {
      let newX = this.origin.x
      let newY = this.origin.y

      if (e.deltaX) {
        newX = Math.round(Math.max(Math.min(0, this.origin.x - e.deltaX), -(this.trial.layout.columns * this.dimensions.cellWidth - this.dimensions.canvasWidth)))
      } else if (e.shiftKey) {
        newX = Math.round(Math.max(Math.min(0, this.origin.x - e.deltaY), -(this.trial.layout.columns * this.dimensions.cellWidth - this.dimensions.canvasWidth)))
      } else {
        newY = Math.round(Math.max(Math.min(0, this.origin.y - e.deltaY), -(this.trial.layout.rows * this.dimensions.cellHeight - this.dimensions.canvasHeight)))

        // Prevent scrolling up the page while the table hasn't reached the top yet
        if (e.deltaY < 0 && newY !== 0) {
          e.preventDefault()
          e.stopPropagation()
        }
        // Prevent scrolling the table if the page hasn't scrolled to the bottom yet
        if (e.deltaY > 0 && (window.innerHeight + window.scrollY) < document.body.offsetHeight) {
          return
        }
      }

      const cvdx = this.origin.x - newX
      const cvdy = this.origin.y - newY

      this.origin = {
        x: newX,
        y: newY
      }

      this.$emit('origin-changed', { x: newX, y: newY })

      this.updateFast(cvdx, cvdy)
    },
    onMouseDown: function (e) {
      // Stop any fling motion
      if (this.flingInterval !== null) {
        clearInterval(this.flingInterval)
        this.flingInterval = null
      }
      const ev = this.getTouchPosition(e)
      if (ev) {
        this.drag.active = true
        this.drag.start = {
          x: ev.x,
          y: ev.y
        }
        this.drag.originStart = {
          x: this.origin.x,
          y: this.origin.y
        }
        this.drag.position = ev
        this.drag.startTime = Date.now()
      }
    },
    getCenterPosition: function () {
      const centerX = this.$refs.plotCanvas.offsetWidth / 2
      const centerY = this.$refs.plotCanvas.offsetHeight / 2
      const row = Math.floor((-this.origin.y + centerY) / this.dimensions.cellHeight)
      const column = Math.floor((-this.origin.x + centerX) / this.dimensions.cellWidth)

      return {
        column,
        row
      }
    },
    onMouseUp: function (e) {
      this.drag.active = false

      const ev = this.getTouchPosition(e)

      if (ev !== null && (Math.sqrt(Math.pow(ev.x - this.drag.start.x, 2) + Math.pow(ev.y - this.drag.start.y, 2)) < 10)) {
        // This is a click
        const row = Math.floor((-this.origin.y + ev.y) / this.dimensions.cellHeight)
        const column = Math.floor((-this.origin.x + ev.x) / this.dimensions.cellWidth)

        if (row >= 0 && row < this.trial.layout.rows && column >= 0 && column < this.trial.layout.columns) {
          if (this.storeRestrictInputToMarked) {
            const anyMarked = this.markedColumns.some(c => c) || this.markedRows.some(r => r)

            if (anyMarked) {
              if (!this.markedColumns[column] && !this.markedRows[row]) {
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
        }
      } else if (this.storeNavigationMode === NAVIGATION_MODE_DRAG && (e.type === 'touchend' || e.type === 'touchcancel')) {
        const deltaT = Math.abs(Date.now() - this.drag.startTime)
        // We have to use dragPosition here, because the end/cancel events don't provide location information
        const deltaX = Math.round((this.drag.position.x - this.drag.start.x) / deltaT * 10)
        const deltaY = Math.round((this.drag.position.y - this.drag.start.y) / deltaT * 10)
        this.drag.position = null

        let counter = 0
        // Define an update interval
        this.flingInterval = setInterval(() => {
          // Run 25 iterations
          if (counter++ < 25) {
            const i = 1 - counter / 25.0
            // Calculate the velocity in both dimensions
            const velocityX = (1 - Math.pow(1 - i, 5)) * deltaX
            const velocityY = (1 - Math.pow(1 - i, 5)) * deltaY
            // Adjust the origin accordingly
            const newX = Math.round(Math.max(Math.min(0, this.origin.x + velocityX), -(this.trial.layout.columns * this.dimensions.cellWidth - this.dimensions.canvasWidth)))
            const newY = Math.round(Math.max(Math.min(0, this.origin.y + velocityY), -(this.trial.layout.rows * this.dimensions.cellHeight - this.dimensions.canvasHeight)))

            this.origin = {
              x: newX,
              y: newY
            }

            this.$emit('origin-changed', { x: newX, y: newY })

            if (requestAnimationFrame in window) {
              if (this.timer) {
                window.cancelAnimationFrame(this.timer)
              }
              this.timer = window.requestAnimationFrame(() => this.update())
            } else {
              this.update()
            }
          } else {
            if (this.flingInterval) {
              clearInterval(this.flingInterval)
              this.flingInterval = null
            }
          }
        }, 10)
      }
    },
    onMouseLeave: function () {
      this.drag.active = false
    },
    onMouseMove: function (e) {
      if (this.drag.active) {
        const ev = this.getTouchPosition(e)
        if (ev) {
          const now = Date.now()

          const deltaYSinceLast = ev.y - this.drag.position.y
          // Prevent scrolling up the page while the table hasn't reached the top yet
          if (deltaYSinceLast >= 0 && this.origin.y !== 0 && e.cancelable) {
            e.preventDefault()
          }

          // Throttle to one draw per 20 milliseconds
          if (!this.lastMove || (now - this.lastMove) > 20) {
            const deltaX = Math.round(ev.x - this.drag.start.x)
            const deltaY = Math.round(ev.y - this.drag.start.y)
            const newX = Math.round(Math.max(Math.min(0, this.drag.originStart.x + deltaX), -(this.trial.layout.columns * this.dimensions.cellWidth - this.dimensions.canvasWidth)))
            const newY = Math.round(Math.max(Math.min(0, this.drag.originStart.y + deltaY), -(this.trial.layout.rows * this.dimensions.cellHeight - this.dimensions.canvasHeight)))

            this.origin = {
              x: newX,
              y: newY
            }

            this.$emit('origin-changed', { x: newX, y: newY })

            this.drag.position = ev

            if (requestAnimationFrame in window) {
              if (this.timer) {
                window.cancelAnimationFrame(this.timer)
              }
              this.timer = window.requestAnimationFrame(() => this.update())
            } else {
              this.update()
            }

            this.lastMove = now
          }
        }
      }
    },
    updateMarkers: function () {
      // Draw markers
      if (this.storeDisplayMarkerIndicators && this.markerPositions && this.markerPositions.length > 0) {
        this.ctx.fillStyle = '#8e8c84'

        this.markerPositions.forEach(m => {
          const x = m[0] - Math.abs(this.origin.x)
          const y = m[1] - Math.abs(this.origin.y)
          const diameter = 6
          if (x >= 0 && x <= this.dimensions.canvasWidth && y >= 0 && y <= this.dimensions.canvasHeight) {
            this.ctx.beginPath()
            // Draw the arc (circle)
            this.ctx.arc(
              Math.min(this.dimensions.canvasWidth - diameter, Math.max(diameter, x)),
              Math.min(this.dimensions.canvasHeight - diameter, Math.max(diameter, y)),
              diameter, 0, 2 * Math.PI)
            this.ctx.fill()
          }
        })
      }
    },
    getTouchPosition: function (e) {
      if (e.touches) {
        if (e.touches.length === 1) {
          const rect = this.$refs.plotCanvas.getBoundingClientRect()
          return {
            x: e.touches[0].clientX + rect.left,
            y: e.touches[0].clientY + rect.top
          }
        } else {
          return null
        }
      } else {
        return {
          x: e.offsetX,
          y: e.offsetY
        }
      }
    },
    fittingString: function (str, maxWidth, fromStart = true) {
      let width = this.ctx.measureText(str).width
      const ellipsis = '…'
      const ellipsisWidth = this.ctx.measureText(ellipsis).width
      if (width <= maxWidth || width <= ellipsisWidth) {
        return str
      } else {
        while (width >= maxWidth - ellipsisWidth && str.length > 0) {
          if (fromStart) {
            str = str.substring(0, str.length - 1)
          } else {
            str = str.substring(1, str.length)
          }
          width = this.ctx.measureText(str).width
        }

        return fromStart ? (str + ellipsis) : (ellipsis + str)
      }
    },
    updateFast: function (cvdx, cvdy) {
      cvdx = Math.round(cvdx)
      cvdy = Math.round(cvdy)
      this.ctx.drawImage(this.$refs.plotCanvas, 0, 0, this.dimensions.scaledCanvasWidth, this.dimensions.scaledCanvasHeight, -cvdx, -cvdy, this.dimensions.canvasWidth, this.dimensions.canvasHeight)

      const minCol = Math.max(0, Math.floor(Math.abs(this.origin.x) / this.dimensions.cellWidth))
      const maxCol = Math.min(minCol + Math.ceil(this.dimensions.canvasWidth / this.dimensions.cellWidth) + 2, this.trial.layout.columns)
      const minRow = Math.max(0, Math.floor(Math.abs(this.origin.y) / this.dimensions.cellHeight))
      const maxRow = Math.min(minRow + Math.ceil(this.dimensions.canvasHeight / this.dimensions.cellHeight) + 2, this.trial.layout.rows)

      const rowCount = Math.ceil(Math.abs(cvdy) / this.dimensions.cellHeight) + 2
      const colCount = Math.ceil(Math.abs(cvdx) / this.dimensions.cellWidth) + 2

      // Prevent drawing cells twice
      const done = new Set()

      if (cvdy !== 0) {
        for (let y = 0; y <= rowCount; y++) {
          const row = cvdy > 0 ? (maxRow - y - 1) : (minRow + y - 1)
          for (let col = minCol; col < maxCol; col++) {
            done.add(`${row}-${col}`)
            this.updateCell(row, col)
          }
        }
      }

      if (cvdx !== 0) {
        for (let x = 0; x <= colCount; x++) {
          const col = cvdx > 0 ? (maxCol - x - 1) : (minCol + x - 1)
          for (let row = minRow; row < maxRow; row++) {
            if (!done.has(`${row}-${col}`)) {
              this.updateCell(row, col)
            }
          }
        }
      }

      this.updateMarkers()

      if (this.userPosition) {
        this.updateUserPosition()
      }
    },
    updateUserPosition: function () {
      if (!this.uctx) {
        return
      }

      this.uctx.clearRect(0, 0, this.dimensions.canvasWidth, this.dimensions.canvasHeight)

      if (this.userPosition) {
        this.uctx.fillStyle = this.fillStyleHighlight
        // Calculate x and y of this grid cell
        const x = this.origin.x + this.dimensions.cellWidth * this.userPosition.column
        const y = this.origin.y + this.dimensions.cellHeight * this.userPosition.row

        // Fill the background
        this.uctx.globalAlpha = 0.3
        this.uctx.fillRect(x, y, this.dimensions.cellWidth, this.dimensions.cellHeight)
        this.uctx.globalAlpha = 1.0

        this.uctx.save()
        this.uctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, this.userPosition.x * window.devicePixelRatio, this.userPosition.y * window.devicePixelRatio)
        if (this.userPosition.rotate !== undefined && this.userPosition.rotate !== null) {
          this.uctx.rotate(this.userPosition.rotate * Math.PI / 180)
          this.uctx.drawImage(userPositionImg, -8, -8)
        } else {
          this.uctx.drawImage(userPositionNoHeadingImg, -8, -8)
        }
        this.uctx.restore()

        if (this.followGps) {
          this.scrollTo(this.userPosition.euclideanX, this.userPosition.euclideanY)
        }
      }
    },
    updateCellCache: function (row, column, trialId, cell) {
      if (this.trial.localId === trialId) {
        this.trialData[`${row}|${column}`] = cell

        this.updateCell(row, column)
        this.updateMarkers()
      }
    },
    updateCell: function (row, col) {
      const cell = this.trialData[`${row}|${col}`]

      let count = 0
      if (this.storeHighlightControls && cell && cell.categories && cell.categories.includes(CELL_CATEGORY_CONTROL)) {
        count = 5
        this.ctx.fillStyle = this.fillStyleControl
      } else if ((this.markedRows && this.markedRows[row]) || (this.markedColumns && this.markedColumns[col])) {
        count = 3
        this.ctx.fillStyle = this.fillStyleMarked
      } else {
        // Determine the background color
        if (row % 2 === 0) {
          count++
        }
        if (col % 2 === 0) {
          count++
        }
        switch (count) {
          case 0:
            this.ctx.fillStyle = this.fillStyleWhite
            break
          case 1:
            this.ctx.fillStyle = this.fillStyleLightGray
            break
          case 2:
          default:
            this.ctx.fillStyle = this.fillStyleDarkGray
            break
        }
      }

      // Calculate x and y of this grid cell
      const x = this.origin.x + this.dimensions.cellWidth * col
      const y = this.origin.y + this.dimensions.cellHeight * row

      // Fill the background
      this.ctx.fillRect(x, y, this.dimensions.cellWidth, this.dimensions.cellHeight)

      if (!cell || !cell.displayName) {
        return
      }

      let maxY
      // Add the name text
      if (this.storePlotDisplayField !== null) {
        const text = this.fittingString(cell[this.storePlotDisplayField] || 'N/A', this.dimensions.coreWidth)
        this.ctx.fillStyle = this.fillStyleText
        this.ctx.fillText(text, x + this.dimensions.cellWidth / 2, y + this.dimensions.padding + this.dimensions.fontSize / 2)
        maxY = y + this.dimensions.padding + this.dimensions.fontSize / 2
      } else {
        maxY = y + this.dimensions.padding
      }

      // How many circle rows do we need?
      let traitCounter = 0
      for (let r = 0; r < this.dimensions.circleRows; r++) {
        // How many circles are in this row?
        const circlesInThisRow = Math.min(this.dimensions.circlesPerRow, this.visibleTraits.length - r * this.dimensions.circlesPerRow)
        // Add extra padding depending on the number of circles
        const extraPadding = this.dimensions.coreWidth - circlesInThisRow * this.dimensions.circleRadius * 2 - (circlesInThisRow - 1) * this.dimensions.padding / 2

        for (let t = 0; t < circlesInThisRow; t++) {
          const trait = this.visibleTraits[traitCounter++]
          const traitMeasurements = cell.measurements[trait.original.id] || []

          let fill
          if (!trait.original.allowRepeats) {
            // Single measurement traits only need to have SOME value
            fill = traitMeasurements.some(m => m.values && m.values.length > 0) ? 'filled' : 'empty'
          } else {
            // For all others, check if the last set of recorded values has the full `setSize`.
            // Also check trait cutoff point.
            const matchingCount = traitMeasurements.filter(m => m.values && m.values.length === trait.original.setSize && (!this.traitCutoff || !cell.latestDates || !cell.latestDates[trait.original.id] || cell.latestDates[trait.original.id] > this.traitCutoff)).length
            if (matchingCount > 0) {
              fill = 'semi'
            } else {
              fill = 'empty'
            }
          }

          const targetX = Math.round(extraPadding / 2 + x + this.dimensions.padding + t * (this.dimensions.circleRadius * 2 + this.dimensions.padding / 2))
          const targetY = Math.round(y + this.dimensions.textPartHeight + r * (this.dimensions.circleRadius * 2 + this.dimensions.padding))
          this.$refs.offscreenCanvas.copyToCanvas(trait.originalIndex, fill, count, this.ctx, targetX, targetY)
          maxY = targetY
        }
      }

      // IF only one is visible, show the last values for it
      if (this.visibleTraits.length === 1) {
        const traitMeasurements = cell.measurements[this.visibleTraits[0].original.id] || []
        const dp = traitMeasurements.filter(m => m.values !== undefined && m.values !== null && m.values.length > 0)

        let str
        if (this.visibleTraits[0].original.dataType === 'categorical') {
          str = dp.map(m => m.values.map(v => this.visibleTraits[0].original.restrictions.categories[v])).join(', ')
        } else {
          str = dp.map(m => m.values).join(', ')
        }
        const traitValue = this.fittingString(str || '', this.dimensions.coreWidth, false)
        this.ctx.fillStyle = this.fillStyleText
        this.ctx.fillText(traitValue, x + this.dimensions.cellWidth / 2, maxY + this.dimensions.textPartHeight - this.dimensions.padding + this.dimensions.fontSize / 2)
      }

      // Add a bookmark symbol if required
      if (cell.isMarked) {
        this.drawBookmark(x + this.dimensions.cellWidth - 20, y)
      }
      if (cell.comments && cell.comments.length > 0) {
        this.drawComment(x + 5, y + 5)
      }
      if (cell.categories && cell.categories.includes(CELL_CATEGORY_CONTROL)) {
        this.drawControl(x + this.dimensions.cellWidth - 20, y + this.dimensions.cellHeight - 20)
      }
    },
    drawComment: function (x, y) {
      this.ctx.drawImage(commentImg, x, y)
    },
    drawBookmark: function (x, y) {
      this.ctx.drawImage(bookmarkImg, x, y)
    },
    drawControl: function (x, y) {
      this.ctx.drawImage(controlImg, x, y)
    },
    moveInDirection: function (direction) {
      switch (direction) {
        case 'topLeft':
          this.scrollBy(this.dimensions.cellWidth, this.dimensions.cellHeight)
          break
        case 'top':
          this.scrollBy(0, this.dimensions.cellHeight)
          break
        case 'topRight':
          this.scrollBy(-this.dimensions.cellWidth, this.dimensions.cellHeight)
          break
        case 'left':
          this.scrollBy(this.dimensions.cellWidth, 0)
          break
        case 'right':
          this.scrollBy(-this.dimensions.cellWidth, 0)
          break
        case 'bottomLeft':
          this.scrollBy(this.dimensions.cellWidth, -this.dimensions.cellHeight)
          break
        case 'bottom':
          this.scrollBy(0, -this.dimensions.cellHeight)
          break
        case 'bottomRight':
          this.scrollBy(-this.dimensions.cellWidth, -this.dimensions.cellHeight)
          break
      }
    },
    jumpToCorner: function (corner) {
      switch (corner) {
        case 'topLeft':
          this.scrollTo(0, 0)
          break
        case 'top':
          this.scrollTo(null, 0)
          break
        case 'topRight':
          this.scrollTo(100, 0)
          break
        case 'left':
          this.scrollTo(0, null)
          break
        case 'right':
          this.scrollTo(100, null)
          break
        case 'bottomLeft':
          this.scrollTo(0, 100)
          break
        case 'bottom':
          this.scrollTo(null, 100)
          break
        case 'bottomRight':
          this.scrollTo(100, 100)
          break
        case 'center':
          this.scrollTo(50, 50)
          break
        case 'gps':
          if (this.userPosition) {
            this.scrollTo(this.userPosition.euclideanX, this.userPosition.euclideanY)
          }
          break
      }
    },
    scrollBy: function (x, y) {
      const newX = Math.round(Math.max(Math.min(0, this.origin.x + x), -(this.trial.layout.columns * this.dimensions.cellWidth - this.dimensions.canvasWidth)))
      const newY = Math.round(Math.max(Math.min(0, this.origin.y + y), -(this.trial.layout.rows * this.dimensions.cellHeight - this.dimensions.canvasHeight)))

      const cvdx = this.origin.x - newX
      const cvdy = this.origin.y - newY

      this.origin.x = newX
      this.origin.y = newY

      this.$emit('origin-changed', { x: this.origin.x, y: this.origin.y })

      this.updateFast(cvdx, cvdy)
    },
    scrollTo: function (x, y) {
      if (x !== null && x >= 0 && x <= 100) {
        this.origin.x = Math.round(-(this.trial.layout.columns * this.dimensions.cellWidth - this.dimensions.canvasWidth) * x / 100.0)
      }
      if (y !== null && y >= 0 && y <= 100) {
        this.origin.y = Math.round(-(this.trial.layout.rows * this.dimensions.cellHeight - this.dimensions.canvasHeight) * y / 100.0)
      }

      this.$emit('origin-changed', { x: this.origin.x, y: this.origin.y })

      if (requestAnimationFrame in window) {
        if (this.timer) {
          window.cancelAnimationFrame(this.timer)
        }
        this.timer = window.requestAnimationFrame(() => this.update())
      } else {
        this.update()
      }
    }
  },
  mounted: function () {
    emitter.on('jump-to-corner', this.jumpToCorner)
    emitter.on('move-to-corner', this.moveInDirection)
    emitter.on('trial-data-loaded', this.reset)
    emitter.on('plot-cache-changed', this.updateCellCache)
  },
  beforeUnmount: function () {
    emitter.off('jump-to-corner', this.jumpToCorner)
    emitter.off('move-to-corner', this.moveInDirection)
    emitter.off('trial-data-loaded', this.reset)
    emitter.off('plot-cache-changed', this.updateCellCache)
  }
}
</script>

<style scoped>
#user-position-canvas {
  pointer-events: none;
}
.canvas-wrapper {
  /* This is added to "fix" the main data display on RTL languages. */
  direction: ltr !important;
}
</style>
