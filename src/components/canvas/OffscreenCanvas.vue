<template>
  <div />
</template>

<script>
import { CANVAS_SHAPE_SQUARE } from '@/plugins/constants'
import { mapGetters } from 'vuex'

const canvas = document.createElement('canvas')
let ctx = canvas.getContext('2d', { alpha: false })

export default {
  computed: {
    ...mapGetters([
      'storeDarkMode',
      'storeCanvasShape'
    ]),
    fillStyleWhite: function () {
      return this.storeDarkMode ? '#000000' : '#ffffff'
    },
    fillStyleLightGray: function () {
      return this.storeDarkMode ? '#0d0d0d' : '#f2f2f2'
    },
    fillStyleDarkGray: function () {
      return this.storeDarkMode ? '#1f1f1f' : '#e0e0e0'
    },
    fillStyleMarked: function () {
      return this.storeDarkMode ? '#415971' : '#c6d2de'
    },
    fillStyleHighlight: function () {
      return this.storeDarkMode ? '#1e1032' : '#e1efcd'
    },
    fillStyleHiddenTrait: function () {
      return this.storeDarkMode ? '#2c2c2c' : '#d3d3d3'
    },
    fillStyleControl: function () {
      return this.storeDarkMode ? '#0a3d62' : '#82ccdd'
    },
    circleCount: function () {
      return this.traits.length + 1
    }
  },
  props: {
    circleRadius: {
      type: Number,
      default: 10
    },
    traits: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    traits: function () {
      this.reset()
    },
    circleRadius: function () {
      this.reset()
    },
    storeDarkMode: function () {
      this.draw()
    }
  },
  methods: {
    reset: function () {
      const scale = window.devicePixelRatio
      const width = this.circleCount * this.circleRadius * 2 + this.circleCount + 1
      const height = this.circleRadius * 40 + this.circleCount + 1
      canvas.width = width * scale
      canvas.height = height * scale

      this.$nextTick(() => {
        canvas.style.width = width + 'px'
        canvas.style.height = height + 'px'

        this.$nextTick(() => {
          ctx = canvas.getContext('2d', { alpha: false })
          ctx.scale(scale, scale)

          this.draw()
        })
      })
    },
    /**
     * Draws the trait circle for the given parameters onto the target context
     */
    copyToCanvas: function (traitIndex, type, bgIndex, otherCtx, targetX, targetY) {
      // Calculate position of circle on the offscreen canvas
      const w = this.circleRadius * 2
      const sourceX = 1 + traitIndex * (w + 1)
      const sourceY = 1 + bgIndex * (this.circleRadius * 6 + 1) + (type === 'filled' ? 0 : (type === 'empty' ? w : 2 * w))
      // Draw it onto the target
      otherCtx.drawImage(canvas, sourceX * window.devicePixelRatio, sourceY * window.devicePixelRatio, w * window.devicePixelRatio, w * window.devicePixelRatio, targetX, targetY, w, w)
    },
    draw: function () {
      // Clear everything
      ctx.clearRect(0, 0, this.circleCount * this.circleRadius * 2 + this.circleCount + 1, this.circleRadius * 12 + this.circleCount + 1)
      // For each background colour
      for (let b = 0; b < 6; b++) {
        if (b === 0) {
          ctx.fillStyle = this.fillStyleWhite
        } else if (b === 1) {
          ctx.fillStyle = this.fillStyleLightGray
        } else if (b === 2) {
          ctx.fillStyle = this.fillStyleDarkGray
        } else if (b === 3) {
          ctx.fillStyle = this.fillStyleMarked
        } else if (b === 4) {
          ctx.fillStyle = this.fillStyleHighlight
        } else if (b === 5) {
          ctx.fillStyle = this.fillStyleControl
        }

        // Calculate y position
        const y = b * (this.circleRadius * 6 + 1)
        // Fill background
        ctx.fillRect(0, y, this.circleCount * this.circleRadius * 2 + this.circleCount + 1, this.circleRadius * 7 + 2)
        // Draw trait circles
        this.traits.forEach((t, i) => {
          if (this.storeCanvasShape === CANVAS_SHAPE_SQUARE) {
            ctx.lineWidth = 2
            const x = i * (this.circleRadius * 2 + 1) + 1

            // Filled square
            ctx.fillStyle = t.color
            ctx.fillRect(x, y, this.circleRadius * 2 + 1, this.circleRadius * 2 + 1)

            // Outlined square
            ctx.strokeStyle = t.color
            ctx.strokeRect(x + 0.5, y + (this.circleRadius * 2) + 1.5, this.circleRadius * 2 - 1, this.circleRadius * 2 - 1)

            // Semi square for multi traits
            ctx.strokeRect(x + 0.5, y + (this.circleRadius * 4) + 1.5, this.circleRadius * 2 - 1, this.circleRadius * 2 - 1)
            ctx.beginPath()
            ctx.moveTo(x + this.circleRadius * 2, y + (this.circleRadius * 4) + 1)
            ctx.lineTo(x, y + (this.circleRadius * 4) + 1)
            ctx.lineTo(x, y + (this.circleRadius * 4) + 1 + this.circleRadius * 2)
            ctx.fill()
          } else {
            ctx.lineWidth = 1
            const x = i * (this.circleRadius * 2 + 1) + 1 + this.circleRadius
            // Filled circle
            ctx.fillStyle = t.color
            ctx.beginPath()
            ctx.arc(x, 1 + y + this.circleRadius, this.circleRadius, 0, 2 * Math.PI)
            ctx.fill()

            // Outlined circle (-0.5px radius so it's the same size as the filled circle)
            ctx.strokeStyle = t.color
            ctx.beginPath()
            ctx.arc(x, 1 + y + this.circleRadius * 3, this.circleRadius - 0.5, 0, 2 * Math.PI)
            ctx.stroke()

            // Semi circle for multi traits
            ctx.beginPath()
            ctx.arc(x, 1 + y + this.circleRadius * 5, this.circleRadius - 0.5, 0, 2 * Math.PI)
            ctx.stroke()
            ctx.beginPath()
            ctx.arc(x, 1 + y + this.circleRadius * 5, this.circleRadius, (Math.PI / 180) * 90, (Math.PI / 180) * 270)
            ctx.fill()
          }
        })

        // Draw the disabled circles
        ctx.fillStyle = this.fillStyleHiddenTrait
        ctx.beginPath()
        ctx.arc(1 + this.circleRadius + (this.circleCount - 1) * (this.circleRadius * 2 + 1), 1 + y + this.circleRadius, this.circleRadius, 0, 2 * Math.PI)
        ctx.fill()

        // Outlined circle (-0.5px radius so it's the same size as the filled circle)
        ctx.strokeStyle = this.fillStyleHiddenTrait
        ctx.beginPath()
        ctx.arc(1 + this.circleRadius + (this.circleCount - 1) * (this.circleRadius * 2 + 1), 1 + y + this.circleRadius * 3, this.circleRadius - 0.5, 0, 2 * Math.PI)
        ctx.stroke()

        // Semi circle for multi traits
        ctx.beginPath()
        ctx.arc(1 + this.circleRadius + (this.circleCount - 1) * (this.circleRadius * 2 + 1), 1 + y + this.circleRadius * 5, this.circleRadius - 0.5, 0, 2 * Math.PI)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(1 + this.circleRadius + (this.circleCount - 1) * (this.circleRadius * 2 + 1), 1 + y + this.circleRadius * 5, this.circleRadius - 0.5, (Math.PI / 180) * 90, (Math.PI / 180) * 270)
        ctx.fill()
      }
    }
  },
  mounted: function () {
    window.addEventListener('resize', this.reset)
    this.reset()
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.reset)
  }
}
</script>

<style>

</style>
