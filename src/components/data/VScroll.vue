<template>
  <canvas class="d-block" ref="vScroll" :width="scaledWidth" :height="scaledHeight" v-if="dimensions" />
</template>

<script setup lang="ts">
  import type { Dimensions } from '@/components/data/DataCanvas.vue'
  import { coreStore } from '@/stores/app'

  const compProps = defineProps<{
    dimensions: Dimensions
    y: number
    rows: number
  }>()

  const store = coreStore()

  const scaledWidth = ref(5)
  const scaledHeight = ref(10)

  const vScroll = useTemplateRef('vScroll')

  let ctx: CanvasRenderingContext2D | null = null

  function draw () {
    if (!ctx) {
      return
    }

    ctx.clearRect(0, 0, compProps.dimensions.vScrollWidth, compProps.dimensions.canvasHeight)

    // Compute the height of the scrollbar handle. At least 10 pixels.
    const h = Math.max(10, Math.round(compProps.dimensions.canvasHeight / (compProps.rows * compProps.dimensions.cellHeight) * compProps.dimensions.canvasHeight))

    // Calculate the y position based on the origin and the overall height.
    const y = Math.round(Math.abs(-compProps.y / (compProps.rows * compProps.dimensions.cellHeight) * compProps.dimensions.canvasHeight))

    // Background color
    ctx.fillStyle = store.storeDarkMode ? '#8e8c84' : '#f2f2f2'
    ctx.fillRect(0, 0, compProps.dimensions.vScrollWidth, compProps.dimensions.canvasHeight)
    // Draw the handle
    ctx.fillStyle = store.storeDarkMode ? '#f2f2f2' : '#8e8c84'
    ctx.fillRect(0, y, compProps.dimensions.vScrollWidth, h)
  }

  function reset () {
    const scale = window.devicePixelRatio
    const vsc = vScroll.value

    if (!vsc) {
      return
    }

    vsc.width = scaledWidth.value
    vsc.height = scaledHeight.value
    scaledWidth.value = compProps.dimensions.vScrollWidth * window.devicePixelRatio
    scaledHeight.value = compProps.dimensions.canvasHeight * window.devicePixelRatio

    vsc.style.height = compProps.dimensions.canvasHeight + 'px'
    vsc.style.width = compProps.dimensions.vScrollWidth + 'px'

    ctx = vsc.getContext('2d')
    ctx?.scale(scale, scale)

    nextTick(() => draw())
  }

  watch(() => compProps.y, async () => draw())
  watch(() => compProps.dimensions, async () => reset())
  watch(() => compProps.rows, async () => draw())
  watch(() => store.storeDarkMode, async () => draw())

  defineExpose({
    reset,
  })
</script>
