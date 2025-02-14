<template>
  <div>
    <h5 class="mt-1">{{ $t('widgetTrialPreviewTitle') }}</h5>
    <canvas ref="canvas" v-if="layout" />
  </div>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'

export default {
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeDarkMode'
    ]),
    fillStyleDarkGray: function () {
      return this.storeDarkMode ? '#2f2f2f' : '#d0d0d0'
    },
    fillStyleHighlight: function () {
      return getComputedStyle(document.documentElement).getPropertyValue('--bs-primary')
    }
  },
  props: {
    layout: {
      type: Object,
      default: () => null
    },
    cells: {
      type: Array,
      default: () => []
    },
    row: {
      type: Number,
      default: 0
    },
    column: {
      type: Number,
      default: 0
    },
    path: {
      type: Array,
      default: () => []
    },
    width: {
      type: Number,
      default: 250
    },
    height: {
      type: Number,
      default: 250
    }
  },
  watch: {
    trial: function () {
      this.$nextTick(() => this.reset())
    },
    cells: function () {
      this.reset()
    },
    row: function () {
      this.reset()
    },
    column: function () {
      this.reset()
    },
    path: function () {
      this.reset()
    },
    storeDarkMode: function () {
      this.reset()
    }
  },
  methods: {
    drawArrowhead: function (context, from, to, radius) {
      const xCenter = to.x
      const yCenter = to.y

      let angle
      let x
      let y

      context.beginPath()

      angle = Math.atan2(to.y - from.y, to.x - from.x)
      x = radius * Math.cos(angle) + xCenter
      y = radius * Math.sin(angle) + yCenter

      context.moveTo(x, y)

      angle += (1.0/3.0) * (2 * Math.PI)
      x = radius * Math.cos(angle) + xCenter
      y = radius * Math.sin(angle) + yCenter

      context.lineTo(x, y)

      angle += (1.0/3.0) * (2 * Math.PI)
      x = radius *Math.cos(angle) + xCenter
      y = radius *Math.sin(angle) + yCenter

      context.lineTo(x, y)

      context.closePath()

      context.fill()
    },
    reset: function () {
      if (this.layout) {
        const scale = window.devicePixelRatio
        this.$refs.canvas.width = this.width * scale
        this.$refs.canvas.height = this.height * scale

        this.$nextTick(() => {
          this.$refs.canvas.style.width = this.width + 'px'
          this.$refs.canvas.style.height = this.height + 'px'

          this.$nextTick(() => {
            this.ctx = this.$refs.canvas.getContext('2d')
            this.ctx.translate(0.5, 0.5)
            this.ctx.scale(scale, scale)

            this.draw()
          })
        })
      }
    },
    draw: function () {
      this.ctx.clearRect(0, 0, this.width, this.height)

      let width = this.width / this.layout.columns
      let height = this.height / this.layout.rows
      const factor = 0.1
      const gap = Math.ceil(Math.min(height * factor, width * factor))
      width = (this.width - 2 * gap) / this.layout.columns
      height = (this.height - 2 * gap) / this.layout.rows

      for (let y = 0; y < this.layout.rows; y++) {
        const yStart = y * height + gap
        const yEnd = (y + 1) * height - gap

        for (let x = 0; x < this.layout.columns; x++) {
          const xStart = x * width + gap
          const xEnd = (x + 1) * width - gap

          if (this.column === x && this.row === y) {
            this.ctx.fillStyle = this.fillStyleHighlight
            this.ctx.fillRect(xStart, yStart, xEnd - xStart, yEnd - yStart)
          } else {
            this.ctx.fillStyle = this.fillStyleDarkGray
            this.ctx.fillRect(xStart, yStart, xEnd - xStart, yEnd - yStart)
          }
        }
      }

      if (this.cells) {
        this.ctx.lineWidth = 2
        this.ctx.strokeStyle = this.fillStyleHighlight
        this.cells.forEach(c => {
          const yStart = c.row * height + gap
          const yEnd = (c.row + 1) * height - gap
          const xStart = c.column * width + gap
          const xEnd = (c.column + 1) * width - gap
          this.ctx.beginPath()
          this.ctx.rect(xStart, yStart, xEnd - xStart, yEnd - yStart)
          this.ctx.stroke()
        })
      }

      if (this.path) {
        this.ctx.fillStyle = this.fillStyleHighlight
        this.ctx.strokeStyle = this.fillStyleHighlight

        const offset = gap / 2 - 1

        let dashed = false
        this.path.forEach((c, i) => {
          this.ctx.lineWidth = 2
          if (i === 0) {
            this.ctx.beginPath()
            this.ctx.moveTo((c.x + 0.5) * width + offset, (c.y + 0.5) * height + offset)
          }

          if (c.tts) {
            const prev = i > 0 ? this.path[i - 1] : null
            if (prev) {
              dashed = true
              this.ctx.stroke()
              this.ctx.beginPath()
              this.ctx.setLineDash([6, 4])
              this.ctx.moveTo((prev.x + 0.5) * width + offset, (prev.y + 0.5) * height + offset)
            }
          } else if (dashed) {
            const prev = i > 0 ? this.path[i - 1] : null
            if (prev) {
              dashed = false
              this.ctx.stroke()
              this.ctx.beginPath()
              this.ctx.setLineDash([])
              this.ctx.moveTo((prev.x + 0.5) * width + offset, (prev.y + 0.5) * height + offset)
            }
          }

          this.ctx.lineTo((c.x + 0.5) * width + offset, (c.y + 0.5) * height + offset)
          
          if (i === this.path.length - 1) {
            this.ctx.stroke()
            this.drawArrowhead(this.ctx, { x: (this.path[i - 1].x + 0.5) * width + offset, y: (this.path[i - 1].y + 0.5) * height + offset }, { x: (c.x + 0.5) * width + offset, y: (c.y + 0.5) * height + offset }, Math.min(height, width) / 1.5)
          }
        })
      }

      if (this.layout.markers && this.layout.markers.everyRow && this.layout.markers.everyColumn) {
        const markV = height * this.layout.markers.everyRow
        const markH = width * this.layout.markers.everyColumn

        const coords = []

        const totalWidth = this.layout.columns * width
        const totalHeight = this.layout.rows * height
        let x = 0
        let y = 0
        while (x <= totalWidth) {
          while (y <= totalHeight) {
            let finalX = x
            let finalY = y

            switch (this.layout.markers.anchor) {
              case 'topRight':
                finalX = totalWidth - x
                break
              case 'bottomLeft':
                finalY = totalHeight - y
                break
              case 'bottomRight':
                finalX = totalWidth - x
                finalY = totalHeight - y
                break
            }

            coords.push([finalX, finalY])
            y += markV
          }
          x += markH
          y = 0
        }

        const diameter = 2
        coords.forEach(c => {
          this.ctx.fillStyle = '#EE5A24'
          this.ctx.beginPath()
          // Draw the arc (circle)
          this.ctx.arc(
            Math.min(totalWidth - diameter, Math.max(diameter, c[0])),
            Math.min(totalHeight - diameter, Math.max(diameter, c[1])),
            diameter, 0, 2 * Math.PI)
          this.ctx.fill()
        })
      }
    }
  },
  mounted: function () {
    this.reset()
  }
}
</script>

<style>
</style>
