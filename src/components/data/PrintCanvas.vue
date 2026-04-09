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
    cellHeight: 0,
    totalWidth: 0,
    totalHeight: 0,
    paddingLeft: 0,
    paddingTop: 0,
    columnTextWidths: [] as number[],
  }

  function init () {
    const canv = canvas.value
    if (canv) {
      plot()
    }
  }

  async function plot () {
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

    let columnTextWidths = Array.from(new Array(compProps.trial.layout.columns + 1).keys()).map(() => 0)
    let textHeight = 0

    for (let y = 0; y < compProps.trial.layout.rows; y++) {
      const str = n(getRowLabel(compProps.trial.layout, y))
      columnTextWidths[0] = Math.max(columnTextWidths[0] || 0, ctxx.measureText(str).width)
    }
    for (let x = 0; x < compProps.trial.layout.columns; x++) {
      const str = n(getColumnLabel(compProps.trial.layout, x))
      columnTextWidths[x + 1] = Math.max(columnTextWidths[x + 1] || 0, ctxx.measureText(str).width)
    }

    Object.keys(trialData).forEach(key => {
      const td = trialData[key]
      if (td && td.germplasm) {
        const [row, column] = key.split('|').map(Number)
        const dims = ctxx.measureText(td.displayName || '')

        textHeight = Math.max(textHeight, dims.fontBoundingBoxAscent + dims.fontBoundingBoxDescent)
        columnTextWidths[(column || 0) + 1] = Math.max(columnTextWidths[(column || 0) + 1] || 0, dims.width)
      }
    })

    textHeight = Math.ceil(textHeight)
    columnTextWidths = columnTextWidths.map(c => Math.ceil(c + config.padding))

    config.totalWidth = columnTextWidths.reduce((a, b) => a + b, 0)
    config.totalHeight = ((textHeight + config.padding) * compProps.trial.layout.rows)
    config.cellHeight = config.totalHeight / compProps.trial.layout.rows
    config.paddingLeft = (columnTextWidths[0] || 0)
    config.paddingTop = config.cellHeight
    config.columnTextWidths = columnTextWidths
    config.totalHeight += config.paddingTop

    const canvasWidth = config.totalWidth
    const canvasHeight = config.totalHeight

    canvass.width = canvasWidth
    canvass.height = canvasHeight
    canvass.style.width = `${canvasWidth}px`
    canvass.style.height = `${canvasHeight}px`

    nextTick(() => {
      // 1. Check if the browser downsized it immediately (common in iOS)
      if (canvass.width !== canvasWidth || canvass.height !== canvasHeight) {
        setError()
        return
      }

      ctx = canvas.value?.getContext('2d')

      if (!ctx) {
        setError()
        return
      }

      try {
        // 2. Try to draw and read a single pixel.
        // If the canvas is over the limit, this usually throws an error
        // or returns an empty/transparent pixel where it shouldn't.
        ctx.fillRect(canvasWidth - 1, canvasHeight - 1, 1, 1)
        const data = ctx.getImageData(canvasWidth - 1, canvasHeight - 1, 1, 1).data

        // Check if the fill actually worked (alpha should be 255)
        if (data[3] !== 255) {
          setError()
          return
        }

        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        ctx.font = '14px sans-serif'

        plotCells(ctx, trialData)
      } catch {
        // 3. If the browser hits a hardware limit, getImageData often throws.
        setError()
        return
      }
    })
  }

  function setError () {
    loading.value = false
    errorMessage.value = 'errorMessagePrintCanvasTooBig'
  }

  function plotCells (ctx: CanvasRenderingContext2D, trialData: { [key: string]: CellPlus }) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, config.totalWidth, config.totalHeight)

    // Row headers
    for (let r = 0; r < compProps.trial.layout.rows; r++) {
      ctx.fillStyle = '#ffffff'
      // Determine the background color
      if (r % 2 === 0) {
        ctx.fillStyle = '#f2f2f2'
      }

      const str = n(getRowLabel(compProps.trial.layout, r))
      const y = r * config.cellHeight + config.paddingTop
      ctx.fillRect(0, y, config.columnTextWidths[0] || 0, config.cellHeight)
      ctx.fillStyle = 'black'
      ctx.fillText(str, config.paddingLeft / 2, y + config.cellHeight / 2)
    }

    // Column headers
    let x = config.paddingLeft
    for (let c = 0; c < compProps.trial.layout.columns; c++) {
      ctx.fillStyle = '#ffffff'
      // Determine the background color
      if (c % 2 === 0) {
        ctx.fillStyle = '#f2f2f2'
      }

      const str = n(getColumnLabel(compProps.trial.layout, c))
      ctx.fillRect(x, 0, (config.columnTextWidths[c + 1] || 0), config.cellHeight)
      ctx.fillStyle = 'black'
      ctx.fillText(str, x + (config.columnTextWidths[c + 1] || 0) / 2, config.paddingTop / 2)

      x += config.columnTextWidths[c + 1] || 0
    }

    for (let row = 0; row < compProps.trial.layout.rows; row++) {
      x = config.paddingLeft
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

        const y = row * config.cellHeight + config.paddingTop
        ctx.fillRect(x, y, (config.columnTextWidths[column + 1] || 0), config.cellHeight)

        const td = trialData[`${row}|${column}`]
        if (td) {
          ctx.fillStyle = 'black'
          ctx.fillText(td.displayName || '', x + (config.columnTextWidths[column + 1] || 0) / 2, y + config.cellHeight / 2)
        }

        x += config.columnTextWidths[column + 1] || 0
      }
    }

    ctx.strokeRect(0, 0, config.totalWidth - 1, config.totalHeight - 1)

    loading.value = false
  }

  onMounted(() => {
    errorMessage.value = undefined
    loading.value = true
    init()
  })
</script>
