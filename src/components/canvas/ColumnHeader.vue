<template>
  <canvas class="cell d-block" ref="colCanvas" :width="scaledWidth" :height="scaledHeight" v-if="dimensions" />
</template>

<script>
import { mapGetters } from 'vuex'
import { getTouchPosition } from '@/plugins/touchinput'
import { DISPLAY_ORDER_RIGHT_TO_LEFT } from '@/plugins/constants'

export default {
  props: {
    dimensions: {
      type: Object,
      default: () => null
    },
    x: {
      type: Number,
      default: 0
    },
    markedColumns: {
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
    ...mapGetters([
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
    x: function () {
      this.draw()
    },
    markedColumns: function () {
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

      this.ctx.clearRect(0, 0, this.dimensions.canvasWidth, this.dimensions.columnHeaderHeight)

      const minCol = Math.max(0, Math.floor(Math.abs(this.x) / this.dimensions.cellWidth))
      const maxCol = Math.min(minCol + Math.ceil(this.dimensions.canvasWidth / this.dimensions.cellWidth) + 1, this.trial.layout.columns)

      for (let col = minCol; col < maxCol; col++) {
        this.updateColumnHeader(col)
      }
    },
    updateColumnHeader: function (col) {
      if (this.markedColumns && this.markedColumns[col]) {
        this.ctx.fillStyle = this.fillStyleMarked
      } else if (col % 2 === 0) {
        this.ctx.fillStyle = this.fillStyleLightGray
      } else {
        this.ctx.fillStyle = this.fillStyleWhite
      }

      const x = this.x + this.dimensions.cellWidth * col
      const y = 0

      this.ctx.fillRect(x, y, this.dimensions.cellWidth, this.dimensions.columnHeaderHeight)
      this.ctx.fillStyle = this.fillStyleText
      this.ctx.fillText(this.trial.layout.columnOrder === DISPLAY_ORDER_RIGHT_TO_LEFT ? this.$n(this.trial.layout.columns - col) : this.$n(col + 1), x + this.dimensions.cellWidth / 2, y + this.dimensions.padding + this.dimensions.fontSize / 2)
    },
    reset: function () {
      if (this.resizeRunning) {
        return
      }
      this.resizeRunning = true
      const scale = window.devicePixelRatio
      this.scaledWidth = this.dimensions.canvasWidth * window.devicePixelRatio
      this.scaledHeight = this.dimensions.columnHeaderHeight * window.devicePixelRatio

      this.$nextTick(() => {
        const cc = this.$refs.colCanvas
        cc.width = this.scaledWidth
        cc.height = this.scaledHeight

        this.$nextTick(() => {
          cc.style.height = this.dimensions.columnHeaderHeight + 'px'
          cc.style.width = this.dimensions.canvasWidth + 'px'

          this.ctx = cc.getContext('2d')
          this.ctx.scale(scale, scale)
          this.ctx.textBaseline = 'middle'
          this.ctx.textAlign = 'center'
          this.ctx.font = `${this.dimensions.fontSize}px sans-serif`
          this.ctx.lineWidth = 1

          cc.onclick = this.onColHeadClick

          this.draw()
          this.resizeRunning = false
        })
      })
    },
    onColHeadClick: function (e) {
      const ev = getTouchPosition(e)
      const col = Math.floor((-this.x + ev.x) / this.dimensions.cellWidth)

      if (col >= 0 && col < this.trial.layout.columns) {
        this.$emit('column-marked', col)

        this.updateColumnHeader(col)
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
