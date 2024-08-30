<template>
  <div>
    <h5 class="mt-1">{{ $t('widgetTrialPreviewTitle') }}</h5>
    <canvas ref="canvas" v-if="trial" />
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
    trial: {
      type: Object,
      default: () => null
    },
    row: {
      type: Number,
      default: 0
    },
    column: {
      type: Number,
      default: 0
    }
  },
  data: function () {
    return {
      width: 400,
      height: 400
    }
  },
  watch: {
    trial: function () {
      this.$nextTick(() => this.reset())
    },
    row: function () {
      this.reset()
    },
    column: function () {
      this.reset()
    },
    storeDarkMode: function () {
      this.reset()
    }
  },
  methods: {
    reset: function () {
      if (this.trial) {
        const scale = window.devicePixelRatio
        this.width = 250
        this.height = 250
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

      const width = this.width / this.trial.layout.columns
      const height = this.height / this.trial.layout.rows
      const factor = 0.1
      const gap = Math.ceil(Math.min(height * factor, width * factor))

      for (let y = 0; y < this.trial.layout.rows; y++) {
        const yStart = y * height + gap
        const yEnd = (y + 1) * height - gap

        for (let x = 0; x < this.trial.layout.columns; x++) {
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
    }
  },
  mounted: function () {
    this.reset()
  }
}
</script>

<style>
</style>
