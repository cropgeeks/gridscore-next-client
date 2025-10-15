<template>
  <canvas class="d-block" ref="hScroll" :width="scaledWidth" :height="scaledHeight" v-if="dimensions" />
</template>

<script setup lang="ts">
  import type { Dimensions } from '@/components/data/DataCanvas.vue'
  import { coreStore } from '@/stores/app'

  const compProps = defineProps<{
    dimensions: Dimensions
    x: number
    columns: number
  }>()

  const store = coreStore()

  const scaledWidth = ref(5)
  const scaledHeight = ref(10)

  const hScroll = useTemplateRef('hScroll')

  let ctx: CanvasRenderingContext2D | null = null

  function draw () {
    if (!ctx) {
      return
    }

    ctx.clearRect(0, 0, compProps.dimensions.canvasWidth, compProps.dimensions.hScrollHeight)

    // Compute the height of the scrollbar handle. At least 10 pixels.
    const w = Math.max(10, compProps.dimensions.canvasWidth / (compProps.columns * compProps.dimensions.cellWidth) * compProps.dimensions.canvasWidth)

    // Calculate the y position based on the origin and the overall width.
    const x = Math.abs(-compProps.x / (compProps.columns * compProps.dimensions.cellWidth) * compProps.dimensions.canvasWidth)

    // Background color
    ctx.fillStyle = store.storeDarkMode ? '#8e8c84' : '#f2f2f2'
    ctx.fillRect(0, 0, compProps.dimensions.canvasWidth, compProps.dimensions.hScrollHeight)
    // Draw the handle
    ctx.fillStyle = store.storeDarkMode ? '#f2f2f2' : '#8e8c84'
    ctx.fillRect(x, 0, w, compProps.dimensions.hScrollHeight)
  }

  function reset () {
    const scale = window.devicePixelRatio
    const hsc = hScroll.value

    if (!hsc) {
      return
    }

    hsc.width = scaledWidth.value
    hsc.height = scaledHeight.value
    scaledWidth.value = compProps.dimensions.canvasWidth * window.devicePixelRatio
    scaledHeight.value = compProps.dimensions.hScrollHeight * window.devicePixelRatio

    hsc.style.height = compProps.dimensions.hScrollHeight + 'px'
    hsc.style.width = compProps.dimensions.canvasWidth + 'px'

    ctx = hsc.getContext('2d')
    ctx?.scale(scale, scale)

    nextTick(() => draw())
  }

  watch(() => compProps.x, async () => draw())
  watch(() => compProps.dimensions, async () => reset())
  watch(() => compProps.columns, async () => draw())
  watch(() => store.storeDarkMode, async () => draw())

  defineExpose({
    reset,
  })
</script>
