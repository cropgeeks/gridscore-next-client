<template>
  <canvas class="cell d-block" ref="colCanvas" :width="scaledWidth" :height="scaledHeight" v-if="dimensions" />
</template>

<script lang="ts" setup>
  import type { Dimensions } from '@/components/data/DataCanvas.vue'
  import { getTouchPosition } from '@/plugins/touchinput'
  import type { Layout } from '@/plugins/types/gridscore'
  import { getColumnLabel } from '@/plugins/util'
  import { coreStore } from '@/stores/app'
  import { useI18n } from 'vue-i18n'

  const store = coreStore()

  const { n } = useI18n()

  const emit = defineEmits(['column-marked'])

  const compProps = defineProps<{
    dimensions: Dimensions
    x: number
    markedColumns: boolean[]
    layout: Layout
  }>()

  const colCanvas = useTemplateRef('colCanvas')

  const resizeRunning = ref(false)
  const scaledWidth = ref(5)
  const scaledHeight = ref(10)

  let ctx: CanvasRenderingContext2D | null = null

  const fillStyleMarked = computed(() => store.storeDarkMode ? '#364a5e' : '#aebfd0')
  const fillStyleLightGray = computed(() => store.storeDarkMode ? '#0d0d0d' : '#f2f2f2')
  const fillStyleWhite = computed(() => store.storeDarkMode ? '#000000' : '#ffffff')
  const fillStyleText = computed(() => store.storeDarkMode ? '#ffffff' : '#000000')

  function reset () {
    if (resizeRunning.value) {
      return
    }
    resizeRunning.value = true
    const scale = window.devicePixelRatio
    scaledWidth.value = compProps.dimensions.canvasWidth * window.devicePixelRatio
    scaledHeight.value = compProps.dimensions.columnHeaderHeight * window.devicePixelRatio

    nextTick(() => {
      const cc = colCanvas.value
      if (cc) {
        cc.width = scaledWidth.value
        cc.height = scaledHeight.value

        nextTick(() => {
          cc.style.height = compProps.dimensions.columnHeaderHeight + 'px'
          cc.style.width = compProps.dimensions.canvasWidth + 'px'

          ctx = cc.getContext('2d')
          if (ctx) {
            ctx.scale(scale, scale)
            ctx.textBaseline = 'middle'
            ctx.textAlign = 'center'
            ctx.font = `${compProps.dimensions.fontSize}px sans-serif`
            ctx.lineWidth = 1

            cc.addEventListener('click', onColHeadClick)
          }

          draw()
          resizeRunning.value = false
        })
      }
    })
  }

  function onColHeadClick (e: any) {
    const ev = getTouchPosition(e)
    if (ev) {
      const col = Math.floor((-compProps.x + ev.x) / compProps.dimensions.cellWidth)

      if (col >= 0 && col < compProps.layout.columns) {
        emit('column-marked', col)

        updateColumnHeader(col)
      }
    }
  }

  function updateColumnHeader (col: number) {
    if (!ctx) {
      return
    }

    if (compProps.markedColumns[col]) {
      ctx.fillStyle = fillStyleMarked.value
    } else if (col % 2 === 0) {
      ctx.fillStyle = fillStyleLightGray.value
    } else {
      ctx.fillStyle = fillStyleWhite.value
    }

    const x = compProps.x + compProps.dimensions.cellWidth * col
    const y = 0

    ctx.fillRect(x, y, compProps.dimensions.cellWidth, compProps.dimensions.columnHeaderHeight)
    ctx.fillStyle = fillStyleText.value
    ctx.fillText(n(getColumnLabel(compProps.layout, col)), x + compProps.dimensions.cellWidth / 2, y + compProps.dimensions.padding + compProps.dimensions.fontSize / 2)
  }

  function draw () {
    if (!ctx) {
      return
    }

    ctx.clearRect(0, 0, compProps.dimensions.canvasWidth, compProps.dimensions.columnHeaderHeight)

    const minCol = Math.max(0, Math.floor(Math.abs(compProps.x) / compProps.dimensions.cellWidth))
    const maxCol = Math.min(minCol + Math.ceil(compProps.dimensions.canvasWidth / compProps.dimensions.cellWidth) + 1, compProps.layout.columns)

    for (let col = minCol; col < maxCol; col++) {
      updateColumnHeader(col)
    }
  }

  watch(() => compProps.x, async () => draw())
  watch(() => compProps.markedColumns, async () => draw())
  watch(() => compProps.dimensions, async () => draw())
  watch(() => store.storeIsDarkMode, async () => draw())

  onMounted(() => nextTick(() => reset()))

  defineExpose({
    reset,
  })
</script>

<style>

</style>
