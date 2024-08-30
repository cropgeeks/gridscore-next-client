<template>
  <div>
    <b-form @submit.prevent>
      <b-row>
        <b-col cols=12 sm=6 md=3>
          <b-form-group label-for="useMarkers" :label="$t('formLabelUseMarkers')">
            <b-form-checkbox switch v-model="useMarkers">
              {{ useMarkers ? $t('buttonYes') : $t('buttonNo') }}
            </b-form-checkbox>
          </b-form-group>
        </b-col>
        <b-col cols=12 sm=6 md=3>
          <b-form-group label-for="markers-anchor" :label="$t('formLabelMarkersCorner')">
            <b-form-select id="markers-anchor" :options="markerAnchorOptions" v-model="markers.anchor" :disabled="!useMarkers" />
          </b-form-group>
        </b-col>
        <b-col cols=12 sm=6 md=3>
          <b-form-group label-for="markers-row" :label="$t('formLabelMarkersEveryRow')">
            <b-form-input id="markers-row" v-model.number="markers.everyRow" type="number" :min="1" :max="layout.rows" :disabled="!useMarkers" />
          </b-form-group>
        </b-col>
        <b-col cols=12 sm=6 md=3>
          <b-form-group label-for="markers-column" :label="$t('formLabelMarkersEveryColumn')">
            <b-form-input id="markers-column" v-model.number="markers.everyColumn" type="number" :min="1" :max="layout.columns" :disabled="!useMarkers" />
          </b-form-group>
        </b-col>
      </b-row>
    </b-form>
    <div ref="canvasWrapper" class="canvas-wrapper mh-100">
      <canvas class="cell d-block" ref="canvas" :width="width" :height="height" />
    </div>
  </div>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'

export default {
  props: {
    layout: {
      type: Object,
      default: null
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeTraitColors',
      'storeDarkMode'
    ]),
    markerAnchorOptions: function () {
      return [
        { text: this.$t('formSelectMarkersTopLeft'), value: 'topLeft' },
        { text: this.$t('formSelectMarkersTopRight'), value: 'topRight' },
        { text: this.$t('formSelectMarkersBottomLeft'), value: 'bottomLeft' },
        { text: this.$t('formSelectMarkersBottomRight'), value: 'bottomRight' }
      ]
    }
  },
  watch: {
    layout: {
      deep: true,
      immediate: true,
      handler: function () {
        this.reset()
      }
    },
    'markers.anchor': function () {
      this.draw()

      this.emitData()
    },
    'markers.everyColumn': function () {
      this.draw()

      this.emitData()
    },
    'markers.everyRow': function () {
      this.draw()

      this.emitData()
    },
    useMarkers: function () {
      this.draw()

      this.emitData()
    },
    storeDarkMode: function () {
      this.draw()
    }
  },
  data: function () {
    return {
      width: 5,
      height: 10,
      useMarkers: false,
      markers: {
        anchor: 'topLeft',
        everyColumn: 1,
        everyRow: 1
      }
    }
  },
  methods: {
    emitData: function () {
      this.$emit('data-changed', this.useMarkers ? JSON.parse(JSON.stringify(this.markers)) : null)
    },
    getMarkerConfig: function () {
      if (this.useMarkers) {
        return this.markers
      } else {
        return null
      }
    },
    draw: function () {
      if (!this.ctx || !this.layout || !this.markers) {
        return
      }
      if (this.markers.everyColumn === '' || this.markers.everyRow === '') {
        return
      }
      if (this.redrawRunning) {
        return
      }
      this.redrawRunning = true

      const dx = Math.max(1, this.markers.everyColumn)
      const dy = Math.max(1, this.markers.everyRow)

      this.ctx.clearRect(0, 0, this.width, this.height)
      this.ctx.lineWidth = 1
      this.ctx.strokeStyle = this.storeDarkMode ? 'white' : 'black'

      // Add extra padding, so the circles aren't cut off
      const extraPadding = 6
      // Calculate the actual dimensions of the drawable area
      const drawWidth = this.width - 2 * extraPadding
      const drawHeight = this.height - 2 * extraPadding
      // Calculate the size of each "cell"
      const w = Math.floor(drawWidth / this.layout.columns)
      const h = Math.floor(drawHeight / this.layout.rows)
      // Calculate the padding that's the result of the remainder of the floor division
      const px = (drawWidth - w * this.layout.columns) / 2 + extraPadding
      const py = (drawHeight - h * this.layout.rows) / 2 + extraPadding

      // Draw the vertical lines
      for (let x = 0; x <= this.layout.columns; x++) {
        this.ctx.beginPath()
        this.ctx.moveTo(px + x * w, py)
        this.ctx.lineTo(px + x * w, this.height - py)
        this.ctx.stroke()
      }
      // Draw the horizontal lines
      for (let y = 0; y <= this.layout.rows; y++) {
        this.ctx.beginPath()
        this.ctx.moveTo(px, py + y * h)
        this.ctx.lineTo(this.width - px, py + y * h)
        this.ctx.stroke()
      }

      // If there's nothing to draw, return
      if (w === 0 || h === 0 || !this.useMarkers) {
        this.redrawRunning = false
        return
      }

      // Start position
      let x = px
      let y = py
      // While we haven't left the drawing area yet
      while (x <= this.width - px) {
        while (y <= this.height - py) {
          let finalX = x
          let finalY = y

          // Adjust the position based on the starting corner
          switch (this.markers.anchor) {
            case 'topRight':
              finalX = 2 * px + this.layout.columns * w - x
              break
            case 'bottomLeft':
              finalY = 2 * py + this.layout.rows * h - y
              break
            case 'bottomRight':
              finalX = 2 * px + this.layout.columns * w - x
              finalY = 2 * py + this.layout.rows * h - y
              break
          }

          // Draw the circle
          this.ctx.fillStyle = this.storeTraitColors[1 % this.storeTraitColors.length]
          this.ctx.beginPath()
          this.ctx.arc(finalX, finalY, 6, 0, 2 * Math.PI)
          this.ctx.fill()

          // Increase y
          y += h * dy
        }
        // Increase x
        x += w * dx
        // Reset y
        y = py
      }

      this.redrawRunning = false
    },
    update: function () {
      if (this.layout && this.layout.markers) {
        this.useMarkers = true
        this.markers = JSON.parse(JSON.stringify(this.layout.markers))
      } else {
        this.useMarkers = false
      }

      this.draw()
    },
    reset: function () {
      if (!this.$refs.canvasWrapper) {
        return
      }

      this.width = this.$refs.canvasWrapper.offsetWidth
      this.height = this.$refs.canvasWrapper.offsetHeight
      const cc = this.$refs.canvas
      cc.width = this.width
      cc.height = this.height
      cc.style.height = this.height + 'px'
      cc.style.width = this.width + 'px'

      this.ctx = cc.getContext('2d')
      this.ctx.lineWidth = 1

      this.$nextTick(() => this.update())
    }
  },
  mounted: function () {
    window.addEventListener('resize', this.reset)

    this.$nextTick(() => this.reset())
  },
  beforeUnmount: function () {
    window.removeEventListener('resize', this.reset)
  }
}
</script>

<style scoped>
.canvas-wrapper {
  height: 400px;
}
</style>
