<template>
  <canvas class="cell d-block" ref="rowCanvas" :width="scaledWidth" :height="scaledHeight" v-if="dimensions" />
</template>

<script lang="ts" setup>
  import type { Dimensions } from '@/components/data/DataCanvas.vue'
  import { getTouchPosition } from '@/plugins/touchinput'
  import type { Layout } from '@/plugins/types/gridscore'
  import { getRowLabel } from '@/plugins/util'
  import { coreStore } from '@/stores/app'
  import { useI18n } from 'vue-i18n'

  const store = coreStore()

  const { n } = useI18n()

  const emit = defineEmits(['row-marked'])

  const compProps = defineProps<{
    dimensions: Dimensions
    y: number
    markedRows: boolean[]
    layout: Layout
  }>()

  const rowCanvas = useTemplateRef('rowCanvas')

  const resizeRunning = ref(false)
  const scaledWidth = ref(10)
  const scaledHeight = ref(5)

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
    scaledWidth.value = compProps.dimensions.rowHeaderWidth * window.devicePixelRatio
    scaledHeight.value = compProps.dimensions.canvasHeight * window.devicePixelRatio

    nextTick(() => {
      const cc = rowCanvas.value
      if (cc) {
        cc.width = scaledWidth.value
        cc.height = scaledHeight.value

        nextTick(() => {
          cc.style.height = compProps.dimensions.canvasHeight + 'px'
          cc.style.width = compProps.dimensions.rowHeaderWidth + 'px'

          ctx = cc.getContext('2d')
          if (ctx) {
            ctx.scale(scale, scale)
            ctx.textBaseline = 'middle'
            ctx.textAlign = 'center'
            ctx.font = `${compProps.dimensions.fontSize}px sans-serif`
            ctx.lineWidth = 1

            cc.addEventListener('click', onRowHeadClick)
          }

          draw()
          resizeRunning.value = false
        })
      }
    })
  }

  function onRowHeadClick (e: any) {
    const ev = getTouchPosition(e)
    if (ev) {
      const row = Math.floor((-compProps.y + ev.y) / compProps.dimensions.cellHeight)

      if (row >= 0 && row < compProps.layout.rows) {
        emit('row-marked', row)

        updateRowHeader(row)
      }
    }
  }

  function updateRowHeader (row: number) {
    if (!ctx) {
      return
    }

    if (compProps.markedRows[row]) {
      ctx.fillStyle = fillStyleMarked.value
    } else if (row % 2 === 0) {
      ctx.fillStyle = fillStyleLightGray.value
    } else {
      ctx.fillStyle = fillStyleWhite.value
    }

    const x = compProps.dimensions.rowHeaderWidth / 2
    const y = compProps.y + compProps.dimensions.cellHeight * row

    ctx.fillRect(0, y, compProps.dimensions.rowHeaderWidth, compProps.dimensions.cellHeight)
    ctx.fillStyle = fillStyleText.value
    ctx.fillText(n(getRowLabel(compProps.layout, row)), x, y + compProps.dimensions.cellHeight / 2)
  }

  function draw () {
    if (!ctx) {
      return
    }

    ctx.clearRect(0, 0, compProps.dimensions.rowHeaderWidth, compProps.dimensions.canvasHeight)

    const minRow = Math.max(0, Math.floor(Math.abs(compProps.y) / compProps.dimensions.cellHeight))
    const maxRow = Math.min(minRow + Math.ceil(compProps.dimensions.canvasHeight / compProps.dimensions.cellHeight) + 1, compProps.layout.rows)

    for (let row = minRow; row < maxRow; row++) {
      updateRowHeader(row)
    }
  }

  watch(() => compProps.y, async () => draw())
  watch(() => compProps.markedRows, async () => draw())
  watch(() => compProps.dimensions, async () => draw())
  watch(() => store.storeIsDarkMode, async () => draw())

  onMounted(() => nextTick(() => reset()))

  defineExpose({
    reset,
  })
</script>

<style>

</style>
