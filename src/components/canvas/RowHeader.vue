<template>
  <canvas class="cell d-block" ref="rowCanvas" :width="scaledWidth" :height="scaledHeight" v-if="dimensions" />
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import { getTouchPosition } from '@/plugins/touchinput'
import { getRowLabel } from '@/plugins/misc'

export default {
  props: {
    dimensions: {
      type: Object,
      default: () => null
    },
    y: {
      type: Number,
      default: 0
    },
    markedRows: {
      type: Array,
      default: () => []
    },
    trial: {
      type: Object,
      default: () => {}
    }
  },
  data: function () {
    return {
      scaledWidth: 5,
      scaledHeight: 10,
      resizeRunning: false
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeDarkMode'
    ]),
    fillStyleMarked: function () {
      return this.storeDarkMode ? '#364a5e' : '#aebfd0'
    },
    fillStyleLightGray: function () {
      return this.storeDarkMode ? '#0d0d0d' : '#f2f2f2'
    },
    fillStyleWhite: function () {
      return this.storeDarkMode ? '#000000' : '#ffffff'
    },
    fillStyleHiddenTrait: function () {
      return this.storeDarkMode ? '#2c2c2c' : '#d3d3d3'
    },
    fillStyleText: function () {
      return this.storeDarkMode ? '#ffffff' : '#000000'
    }
  },
  watch: {
    y: function () {
      this.draw()
    },
    markedRows: function () {
      this.draw()
    },
    dimensions: {
      deep: true,
      handler: function () {
        this.reset()
      }
    },
    storeDarkMode: function () {
      this.reset()
    }
  },
  methods: {
    draw: function () {
      if (!this.ctx) {
        return
      }

      this.ctx.clearRect(0, 0, this.dimensions.rowHeaderWidth, this.dimensions.canvasHeight)

      const minRow = Math.max(0, Math.floor(Math.abs(this.y) / this.dimensions.cellHeight))
      const maxRow = Math.min(minRow + Math.ceil(this.dimensions.canvasHeight / this.dimensions.cellHeight) + 1, this.trial.layout.rows)

      for (let row = minRow; row < maxRow; row++) {
        this.updateRowHeader(row)
      }
    },
    updateRowHeader: function (row) {
      if (this.markedRows && this.markedRows[row]) {
        this.ctx.fillStyle = this.fillStyleMarked
      } else if (row % 2 === 0) {
        this.ctx.fillStyle = this.fillStyleLightGray
      } else {
        this.ctx.fillStyle = this.fillStyleWhite
      }

      const x = this.dimensions.rowHeaderWidth / 2
      const y = this.y + this.dimensions.cellHeight * row

      this.ctx.fillRect(0, y, this.dimensions.rowHeaderWidth, this.dimensions.cellHeight)
      this.ctx.fillStyle = this.fillStyleText
      this.ctx.fillText(this.$n(getRowLabel(this.trial.layout, row)), x, y + this.dimensions.cellHeight / 2)
    },
    reset: function () {
      if (this.resizeRunning) {
        return
      }
      this.resizeRunning = true
      const scale = window.devicePixelRatio
      this.scaledWidth = this.dimensions.rowHeaderWidth * window.devicePixelRatio
      this.scaledHeight = this.dimensions.canvasHeight * window.devicePixelRatio

      this.$nextTick(() => {
        const rc = this.$refs.rowCanvas
        rc.width = this.scaledWidth
        rc.height = this.scaledHeight

        this.$nextTick(() => {
          rc.style.height = this.dimensions.canvasHeight + 'px'
          rc.style.width = this.dimensions.rowHeaderWidth + 'px'

          this.ctx = rc.getContext('2d')
          this.ctx.scale(scale, scale)
          this.ctx.textBaseline = 'middle'
          this.ctx.textAlign = 'center'
          this.ctx.font = `${this.dimensions.fontSize}px sans-serif`
          this.ctx.lineWidth = 1

          rc.onclick = this.onRowHeaderClicked

          this.draw()
          this.resizeRunning = false
        })
      })
    },
    onRowHeaderClicked: function (e) {
      const ev = getTouchPosition(e)
      const row = Math.floor((-this.y + ev.y) / this.dimensions.cellHeight)

      if (row >= 0 && row < this.trial.layout.rows) {
        this.$emit('row-marked', row)

        this.updateRowHeader(row)
      }
    }
  },
  mounted: function () {
    this.$nextTick(() => this.reset())
  }
}
</script>

<style>

</style>
