<template>
  <canvas class="d-block" ref="vScroll" :width="scaledWidth" :height="scaledHeight" v-if="dimensions" />
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'

export default {
  props: {
    y: {
      type: Number,
      default: 0
    },
    dimensions: {
      type: Object,
      default: () => null
    },
    rows: {
      type: Number,
      default: 1
    }
  },
  data: function () {
    return {
      scaledWidth: 5,
      scaledHeight: 10
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeDarkMode'
    ])
  },
  watch: {
    y: function () {
      this.draw()
    },
    dimensions: function () {
      this.reset()
    },
    storeDarkMode: function () {
      this.draw()
    },
    rows: function () {
      this.draw()
    }
  },
  methods: {
    draw: function () {
      if (!this.ctx) {
        return
      }

      this.ctx.clearRect(0, 0, this.dimensions.vScrollWidth, this.dimensions.canvasHeight)

      // Compute the height of the scrollbar handle. At least 10 pixels.
      const h = Math.max(10, Math.round(this.dimensions.canvasHeight / (this.rows * this.dimensions.cellHeight) * this.dimensions.canvasHeight))

      // Calculate the y position based on the origin and the overall height.
      const y = Math.round(Math.abs(-this.y / (this.rows * this.dimensions.cellHeight) * this.dimensions.canvasHeight))

      // Background color
      this.ctx.fillStyle = this.storeDarkMode ? '#8e8c84' : '#f2f2f2'
      this.ctx.fillRect(0, 0, this.dimensions.vScrollWidth, this.dimensions.canvasHeight)
      // Draw the handle
      this.ctx.fillStyle = this.storeDarkMode ? '#f2f2f2' : '#8e8c84'
      this.ctx.fillRect(0, y, this.dimensions.vScrollWidth, h)
    },
    reset: function () {
      const scale = window.devicePixelRatio
      const vsc = this.$refs.vScroll
      vsc.width = this.scaledWidth
      vsc.height = this.scaledHeight
      this.scaledWidth = this.dimensions.vScrollWidth * window.devicePixelRatio
      this.scaledHeight = this.dimensions.canvasHeight * window.devicePixelRatio

      vsc.style.height = this.dimensions.canvasHeight + 'px'
      vsc.style.width = this.dimensions.vScrollWidth + 'px'

      this.ctx = vsc.getContext('2d')
      this.ctx.scale(scale, scale)

      this.$nextTick(() => {
        this.draw()
      })
    }
  },
  mounted: function () {
    this.$nextTick(() => this.reset())
  }
}
</script>

<style>

</style>
