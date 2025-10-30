<template>
  <div ref="canvasWrapper" class="grid" v-if="trial">
    <div class="corner" @click="clearMarkedRowsCols" />
    <ColumnHeader
      :dimensions="dimensions"
      :layout="trial.layout"
      :x="origin.x"
      :marked-columns="markedColumns"
      @column-marked="onColumnMarked"
      id="data-canvas-header"
      ref="colHead"
    />
    <div class="corner" />
    <RowHeader
      :dimensions="dimensions"
      :layout="trial.layout"
      :y="origin.y"
      :marked-rows="markedRows"
      @row-marked="onRowMarked"
      ref="rowHead"
    />
    <PlotCanvas
      :geolocation="geolocation"
      :trait-cutoff="traitCutoff"
      :dimensions="dimensions"
      :marked-columns="markedColumns"
      :marked-rows="markedRows"
      :trial="trial"
      @origin-changed="setOrigin"
      ref="plotCanvas"
    />
    <VScroll :dimensions="dimensions" :y="origin.y" :rows="trial.layout.rows" ref="vScroll" />
    <div class="corner" />
    <HScroll :dimensions="dimensions" :x="origin.x" :columns="trial.layout.columns" ref="hScroll" />
    <div class="corner" />
  </div>
</template>

<script setup lang="ts">
  import type { XY } from '@/plugins/location'
  import { type TrialPlus, type Geolocation, CanvasSize, CanvasDensity } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'

  import emitter from 'tiny-emitter/instance'
  import RowHeader from '@/components/data/RowHeader.vue'
  import ColumnHeader from '@/components/data/ColumnHeader.vue'
  import PlotCanvas from '@/components/data/PlotCanvas.vue'
  import VScroll from '@/components/data/VScroll.vue'
  import HScroll from '@/components/data/HScroll.vue'

  export interface Dimensions {
    canvasWidth: number
    canvasHeight: number
    scaledCanvasWidth: number
    scaledCanvasHeight: number
    fontSize: number
    circleRadius: number
    padding: number
    columnHeaderHeight: number
    rowHeaderWidth: number
    vScrollWidth: number
    hScrollHeight: number
    cellWidth: number
    cellHeight: number
    textPartHeight: number
    circleRows: number
    coreWidth: number
    circlesPerRow: number
    visibleTraitCount: number
  }

  const compProps = defineProps<{
    trial: TrialPlus
    geolocation?: Geolocation
    traitCutoff?: string
  }>()

  const canvasWrapper = useTemplateRef('canvasWrapper')
  const colHead = useTemplateRef('colHead')
  const rowHead = useTemplateRef('rowHead')
  const hScroll = useTemplateRef('hScroll')
  const vScroll = useTemplateRef('vScroll')
  const plotCanvas = useTemplateRef('plotCanvas')

  const store = coreStore()
  const emit = defineEmits(['click:plot'])

  const markedColumns = ref<boolean[]>([])
  const markedRows = ref<boolean[]>([])
  const origin = ref<XY>({ x: 0, y: 0 })
  const scrollToPosition = ref<XY>()
  const dimensions = ref<Dimensions>({
    canvasWidth: 1,
    canvasHeight: 1,
    scaledCanvasWidth: 1,
    scaledCanvasHeight: 1,
    fontSize: 14,
    circleRadius: 8,
    padding: 16,
    columnHeaderHeight: 1,
    rowHeaderWidth: 1,
    vScrollWidth: 5,
    hScrollHeight: 5,
    cellWidth: 1,
    cellHeight: 1,
    textPartHeight: 1,
    circleRows: 1,
    coreWidth: 1,
    circlesPerRow: 1,
    visibleTraitCount: 1,
  })
  const isResetting = ref(false)
  const isInitting = ref(false)

  function setOrigin (newOrigin: XY) {
    origin.value = newOrigin
  }

  function clearMarkedRowsCols () {
    markedRows.value = Array.from(new Array(compProps.trial.layout.rows).keys()).map(() => false)
    markedColumns.value = Array.from(new Array(compProps.trial.layout.columns).keys()).map(() => false)
  }

  function onColumnMarked (column: number) {
    const temp = markedColumns.value.concat()
    temp[column] = !temp[column]
    markedColumns.value = temp

    emitter.emit('plausible-event', { key: 'data-view-updated', props: { type: 'column-marked' } })
  }

  function onRowMarked (row: number) {
    const temp = markedRows.value.concat()
    temp[row] = !temp[row]
    markedRows.value = temp

    emitter.emit('plausible-event', { key: 'data-view-updated', props: { type: 'row-marked' } })
  }

  function reset () {
    if (isResetting.value || !compProps.trial) {
      return
    }
    isResetting.value = true

    nextTick(() => {
      if (store.storeHideTraitCircles) {
        dimensions.value.visibleTraitCount = 0
      } else {
        if (store.storeHiddenTraits) {
          dimensions.value.visibleTraitCount = compProps.trial.traits.filter(t => !store.storeHiddenTraits.includes(t.id || '')).length
        } else {
          dimensions.value.visibleTraitCount = compProps.trial.traits.length
        }
      }

      dimensions.value.rowHeaderWidth = dimensions.value.padding + (dimensions.value.fontSize * `${compProps.trial.layout.rows}`.length)
      dimensions.value.canvasWidth = (canvasWrapper.value?.offsetWidth || 0) - dimensions.value.rowHeaderWidth - dimensions.value.hScrollHeight
      dimensions.value.columnHeaderHeight = 2 * dimensions.value.padding + dimensions.value.fontSize
      dimensions.value.canvasHeight = window.innerHeight - dimensions.value.columnHeaderHeight - dimensions.value.vScrollWidth
      dimensions.value.cellWidth = Math.max(dimensions.value.canvasWidth / compProps.trial.layout.columns, dimensions.value.padding * 2 + store.storeDisplayMinCellWidth * dimensions.value.circleRadius * 2 + (store.storeDisplayMinCellWidth - 1) * dimensions.value.padding / 2)
      dimensions.value.coreWidth = dimensions.value.cellWidth - dimensions.value.padding * 2
      dimensions.value.circlesPerRow = getCirclesPerRow()
      dimensions.value.textPartHeight = store.storePlotDisplayField === null ? dimensions.value.padding : (dimensions.value.fontSize + 2 * dimensions.value.padding)
      dimensions.value.circleRows = Math.ceil(dimensions.value.visibleTraitCount / dimensions.value.circlesPerRow)
      dimensions.value.scaledCanvasHeight = dimensions.value.canvasHeight * window.devicePixelRatio
      dimensions.value.scaledCanvasWidth = dimensions.value.canvasWidth * window.devicePixelRatio

      const heightProportion = dimensions.value.canvasHeight / compProps.trial.layout.rows
      let tempHeight = Math.max(dimensions.value.textPartHeight + dimensions.value.circleRows * (dimensions.value.circleRadius * 2 + dimensions.value.padding), heightProportion)

      if (dimensions.value.visibleTraitCount === 1 && tempHeight > heightProportion) {
        // Check if we need to increase the minimum height to allow space for the display of the trait value below the circles
        tempHeight += dimensions.value.textPartHeight - dimensions.value.padding
      }

      dimensions.value.cellHeight = tempHeight

      nextTick(() => {
        init()
        colHead.value?.reset()
        rowHead.value?.reset()
        vScroll.value?.reset()
        hScroll.value?.reset()
        nextTick(() => {
          // @ts-ignore
          if (requestAnimationFrame in window) {
            requestAnimationFrame(() => update())
          } else {
            update()
          }

          isResetting.value = false
        })
      })
    })
  }

  function update () {
    if (plotCanvas.value) {
      if (scrollToPosition.value) {
        plotCanvas.value.update(scrollToPosition.value.y, scrollToPosition.value.x)
        scrollToPosition.value = undefined
      } else {
        plotCanvas.value.update()
      }
    }
  }

  function init () {
    if (isInitting.value) {
      return
    }
    isInitting.value = true

    if (plotCanvas.value) {
      plotCanvas.value.reset()
        .then(() => {
          isInitting.value = false
        })
    }
  }

  function getCirclesPerRow () {
    for (let t = dimensions.value.visibleTraitCount; t > 0; t--) {
      const x = dimensions.value.circleRadius * 2 * t + dimensions.value.padding / 2 * (t - 1)

      if (x <= dimensions.value.coreWidth) {
        return t
      }
    }

    return 1
  }

  onBeforeMount(() => {
    if (store.storeCanvasSize) {
      switch (store.storeCanvasSize) {
        case CanvasSize.SMALL:
          dimensions.value.circleRadius = 8
          break
        case CanvasSize.MEDIUM:
          dimensions.value.circleRadius = 10
          break
        case CanvasSize.LARGE:
          dimensions.value.circleRadius = 12
          break
      }
    }

    if (store.storeCanvasDensity) {
      switch (store.storeCanvasDensity) {
        case CanvasDensity.LOW:
          dimensions.value.padding = dimensions.value.circleRadius * 2
          break
        case CanvasDensity.MEDIUM:
          dimensions.value.padding = dimensions.value.circleRadius * 1.25
          break
        case CanvasDensity.HIGH:
          dimensions.value.padding = dimensions.value.circleRadius * 0.5
          break
      }
    }
  })

  watch(() => compProps.trial, async newValue => {
    if (newValue) {
      markedRows.value = Array.from(new Array(compProps.trial.layout.rows).keys()).map(() => false)
      markedColumns.value = Array.from(new Array(compProps.trial.layout.columns).keys()).map(() => false)

      reset()
    }
  }, { immediate: true })

  watch(() => store.storeHiddenTraits, async () => {
    if (plotCanvas.value) {
      scrollToPosition.value = plotCanvas.value.getCenterPosition()
    }
    reset()
  })

  watch(() => store.storeHideTraitCircles, async () => reset())

  onMounted(() => {
    window.addEventListener('resize', reset)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', reset)
  })
</script>

<style scoped>
.grid {
  height: 100vh;
  height: 100svh;
  max-height: 100vh;
  max-height: 100svh;
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  grid-template-rows: min-content 1fr min-content;
  grid-template-areas:
    "tl colHeaders tr"
    "rowHeaders dataView vScroll"
    "bl hScroll br"
}
.grid .cell:hover {
  cursor: pointer;
}
</style>
