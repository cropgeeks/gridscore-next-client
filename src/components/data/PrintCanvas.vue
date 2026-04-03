<template>
  <div class="h-100 position-relative">
    <p class="text-error" v-if="errorMessage">{{ $t(errorMessage) }}</p>
    <v-overlay contained class="align-center justify-center" v-model="loading">
      <v-progress-circular indeterminate color="primary" size="48" />
    </v-overlay>
    <canvas ref="canvas" v-if="!errorMessage" />
  </div>
</template>

<script setup lang="ts">
  import { getTrialData } from '@/plugins/idb'
  import type { CellPlus, TrialPlus } from '@/plugins/types/client'
  import { getColumnLabel, getRowLabel } from '@/plugins/util'

  import canvasSize from 'canvas-size'
  import { useI18n } from 'vue-i18n'

  const canvas = useTemplateRef('canvas')
  const loading = ref(false)
  const errorMessage = ref<string | undefined>()

  const { n } = useI18n()

  const compProps = defineProps<{
    trial: TrialPlus
  }>()

  let ctx: CanvasRenderingContext2D | null | undefined = undefined
  const config = {
    padding: 10,
    cellWidth: 0,
    cellHeight: 0,
    totalWidth: 0,
    totalHeight: 0,
    paddingLeft: 0,
    paddingTop: 0,
  }

  function init () {
    const canv = canvas.value
    if (canv) {
      canvasSize.maxArea({
        max: 20_000,
        min: 1,
        step: 100,
        useWorker: true,
        usePromise: true,
      }).then(result => {
        loading.value = false
        plot(result.width, result.height)
      })
    }
  }

  async function plot (width: number, height: number) {
    const trialData = await getTrialData(compProps.trial.localId || '')

    ctx = canvas.value?.getContext('2d', { alpha: false })

    if (!ctx) {
      return
    }

    ctx.translate(0.5, 0.5)
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.font = '14px sans-serif'

    const ctxx = ctx
    const canvass = canvas.value

    if (!trialData || !ctxx || !canvass) {
      return
    }

    let rowTextWidth = 0
    let columnTextWidth = 0
    let textWidth = 0
    let textHeight = 0

    for (let y = 0; y < compProps.trial.layout.rows; y++) {
      const str = n(getRowLabel(compProps.trial.layout, y))
      rowTextWidth = Math.max(rowTextWidth, ctxx.measureText(str).width)
    }
    for (let x = 0; x < compProps.trial.layout.columns; x++) {
      const str = n(getColumnLabel(compProps.trial.layout, x))
      columnTextWidth = Math.max(columnTextWidth, ctxx.measureText(str).width)
    }

    Object.values(trialData).forEach(td => {
      if (td && td.germplasm) {
        const dims = ctxx.measureText(td.displayName || '')

        textHeight = Math.max(textHeight, dims.fontBoundingBoxAscent + dims.fontBoundingBoxDescent)
        textWidth = Math.max(textWidth, dims.width)
      }
    })

    textWidth = Math.ceil(textWidth)
    textHeight = Math.ceil(textHeight)
    rowTextWidth = Math.ceil(rowTextWidth)
    columnTextWidth = Math.ceil(columnTextWidth)
    textWidth = Math.max(textWidth, columnTextWidth)

    if (((textWidth + config.padding) * compProps.trial.layout.columns < width) && ((textHeight + config.padding) * compProps.trial.layout.rows) < height) {
      // Easy case, everything fits perfectly within the max size of the canvas
      config.totalWidth = ((textWidth + config.padding) * compProps.trial.layout.columns)
      config.totalHeight = ((textHeight + config.padding) * compProps.trial.layout.rows)
      config.cellWidth = config.totalWidth / compProps.trial.layout.columns
      config.cellHeight = config.totalHeight / compProps.trial.layout.rows
      config.paddingLeft = rowTextWidth + config.padding
      config.paddingTop = config.cellHeight

      canvass.width = config.totalWidth + config.paddingLeft
      canvass.height = config.totalHeight + config.paddingTop
      canvass.style.width = `${config.totalWidth + config.paddingLeft}px`
      canvass.style.height = `${config.totalHeight + config.paddingTop}px`

      nextTick(() => {
        ctx = canvas.value?.getContext('2d', { alpha: false })

        if (ctx) {
          ctx.textBaseline = 'middle'
          ctx.textAlign = 'center'
          ctx.font = '14px sans-serif'

          plotCells(ctx, trialData)
        }
      })
    } else {
      errorMessage.value = 'errorMessagePrintCanvasTooBig'
    }
  }

  function plotCells (ctx: CanvasRenderingContext2D, trialData: { [key: string]: CellPlus }) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, config.totalWidth + config.paddingLeft, config.totalHeight + config.paddingTop)

    for (let r = 0; r < compProps.trial.layout.rows; r++) {
      ctx.fillStyle = '#ffffff'
      // Determine the background color
      if (r % 2 === 0) {
        ctx.fillStyle = '#f2f2f2'
      }

      const str = n(getRowLabel(compProps.trial.layout, r))
      const y = r * config.cellHeight + config.paddingTop
      ctx.fillRect(0, y, config.cellWidth, config.cellHeight)
      ctx.fillStyle = 'black'
      ctx.fillText(str, config.paddingLeft / 2, y + config.cellHeight / 2)
    }

    for (let c = 0; c < compProps.trial.layout.columns; c++) {
      ctx.fillStyle = '#ffffff'
      // Determine the background color
      if (c % 2 === 0) {
        ctx.fillStyle = '#f2f2f2'
      }

      const str = n(getColumnLabel(compProps.trial.layout, c))
      const x = c * config.cellWidth + config.paddingLeft
      ctx.fillRect(x, 0, config.cellWidth, config.cellHeight)
      ctx.fillStyle = 'black'
      ctx.fillText(str, x + config.cellWidth / 2, config.paddingTop / 2)
    }

    for (let row = 0; row < compProps.trial.layout.rows; row++) {
      for (let column = 0; column < compProps.trial.layout.columns; column++) {
        let count = 0
        // Determine the background color
        if (row % 2 === 0) {
          count++
        }
        if (column % 2 === 0) {
          count++
        }
        switch (count) {
          case 0:
            ctx.fillStyle = '#ffffff'
            break
          case 1:
            ctx.fillStyle = '#f2f2f2'
            break
          default:
            ctx.fillStyle = '#e0e0e0'
            break
        }

        const x = column * config.cellWidth + config.paddingLeft
        const y = row * config.cellHeight + config.paddingTop
        ctx.fillRect(x, y, config.cellWidth, config.cellHeight)

        const td = trialData[`${row}|${column}`]
        if (td) {
          ctx.fillStyle = 'black'
          ctx.fillText(td.displayName || '', x + config.cellWidth / 2, y + config.cellHeight / 2)
        }
      }
    }

    ctx.strokeRect(0, 0, config.totalWidth + config.paddingLeft - 1, config.totalHeight + config.paddingTop - 1)
  }

  onMounted(() => {
    errorMessage.value = undefined
    loading.value = true
    init()
  })
</script>
