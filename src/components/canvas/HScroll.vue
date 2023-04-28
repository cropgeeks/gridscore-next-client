<template>
  <canvas class="d-block" ref="hScroll" :width="scaledWidth" :height="scaledHeight" v-if="dimensions" />
</template>

<script>
import { mapGetters } from 'vuex'

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
    columns: {
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
    ...mapGetters([
      'storeDarkMode'
    ])
  },
  watch: {
    x: function () {
      this.draw()
    },
    dimensions: function () {
      this.reset()
    },
    storeDarkMode: function () {
      this.draw()
    },
    columns: function () {
      this.draw()
    }
  },
  methods: {
    draw: function () {
      if (!this.ctx) {
        return
      }

      this.ctx.clearRect(0, 0, this.dimensions.canvasWidth, this.dimensions.hScrollHeight)

      // Compute the height of the scrollbar handle. At least 10 pixels.
      const w = Math.max(10, this.dimensions.canvasWidth / (this.columns * this.dimensions.cellWidth) * this.dimensions.canvasWidth)

      // Calculate the y position based on the origin and the overall width.
      const x = Math.abs(-this.x / (this.columns * this.dimensions.cellWidth) * this.dimensions.canvasWidth)

      // Background color
      this.ctx.fillStyle = this.storeDarkMode ? '#8e8c84' : '#f2f2f2'
      this.ctx.fillRect(0, 0, this.dimensions.canvasWidth, this.dimensions.hScrollHeight)
      // Draw the handle
      this.ctx.fillStyle = this.storeDarkMode ? '#f2f2f2' : '#8e8c84'
      this.ctx.fillRect(x, 0, w, this.dimensions.hScrollHeight)
    },
    reset: function () {
      const scale = window.devicePixelRatio
      const hsc = this.$refs.hScroll
      hsc.width = this.scaledWidth
      hsc.height = this.scaledHeight
      this.scaledWidth = this.dimensions.canvasWidth * window.devicePixelRatio
      this.scaledHeight = this.dimensions.hScrollHeight * window.devicePixelRatio

      hsc.style.height = this.dimensions.hScrollHeight + 'px'
      hsc.style.width = this.dimensions.canvasWidth + 'px'

      this.ctx = hsc.getContext('2d')
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
