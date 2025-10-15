<template>
  <div>
    <p>{{ $t('pageTrialLayoutMarkersText') }}</p>

    <v-switch v-model="markersEnabled" color="primary" :label="$t('formLabelUseMarkers')" />

    <div v-show="markersEnabled && markers">
      <v-row v-if="markers">
        <v-col cols="12" sm="6" md="4">
          <v-select :items="markerAnchorOptions" v-model="markers.anchor" :label="$t('formLabelMarkersCorner')" />
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <NumberInputWithFallback v-model="markers.everyRow" :label="$t('formLabelMarkersEveryRow')" :min="1" :max="model?.rows || 1" :default-value="1" />
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <NumberInputWithFallback v-model="markers.everyColumn" :label="$t('formLabelMarkersEveryColumn')" :min="1" :max="model?.columns || 1" :default-value="1" />
        </v-col>
      </v-row>

      <div ref="canvasWrapper" class="canvas-wrapper mh-100">
        <canvas class="cell d-block" ref="canvas" :width="width" :height="height" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Anchor, type Layout, type Markers } from '@/plugins/types/gridscore'
  import { coreStore } from '@/stores/app'
  import { useI18n } from 'vue-i18n'
  import NumberInputWithFallback from '@/components/inputs/NumberInputWithFallback.vue'

  const { t } = useI18n()
  const store = coreStore()

  const model = defineModel<Layout>()
  const markersEnabled = ref<boolean>(false)
  const markers = ref<Markers>({
    anchor: Anchor.topLeft,
    everyColumn: 1,
    everyRow: 1,
  })

  const width = ref(5)
  const height = ref(10)
  const redrawRunning = ref(false)

  const systemTheme = ref('dark')

  const canvasWrapper = useTemplateRef('canvasWrapper')
  const canvas = useTemplateRef('canvas')

  let ctx: CanvasRenderingContext2D | null = null

  const markerAnchorOptions = computed(() => {
    return [
      { title: t('formSelectMarkersTopLeft'), value: Anchor.topLeft },
      { title: t('formSelectMarkersTopRight'), value: Anchor.topRight },
      { title: t('formSelectMarkersBottomLeft'), value: Anchor.bottomLeft },
      { title: t('formSelectMarkersBottomRight'), value: Anchor.bottomRight },
    ]
  })

  const isValid = computed(() => {
    if (!markersEnabled.value) {
      return true
    }

    return markers.value && markers.value.everyColumn > 0 && markers.value.everyRow > 0
  })

  function draw () {
    if (!ctx || !model.value || !markers.value || !markersEnabled.value) {
      return
    }
    if (redrawRunning.value) {
      return
    }
    redrawRunning.value = true

    const dx = Math.max(1, markers.value.everyColumn)
    const dy = Math.max(1, markers.value.everyRow)

    const dark = (store.storeTheme === 'system' ? systemTheme.value : store.storeTheme) === 'dark'

    ctx.clearRect(0, 0, width.value, height.value)
    ctx.lineWidth = 1
    ctx.strokeStyle = dark ? 'white' : 'black'

    // Add extra padding, so the circles aren't cut off
    const extraPadding = 6
    // Calculate the actual dimensions of the drawable area
    const drawWidth = width.value - 2 * extraPadding
    const drawHeight = height.value - 2 * extraPadding
    // Calculate the size of each "cell"
    const w = Math.floor(drawWidth / model.value.columns)
    const h = Math.floor(drawHeight / model.value.rows)
    // Calculate the padding that's the result of the remainder of the floor division
    const px = (drawWidth - w * model.value.columns) / 2 + extraPadding
    const py = (drawHeight - h * model.value.rows) / 2 + extraPadding

    // Draw the vertical lines
    for (let x = 0; x <= model.value.columns; x++) {
      ctx.beginPath()
      ctx.moveTo(px + x * w, py)
      ctx.lineTo(px + x * w, height.value - py)
      ctx.stroke()
    }
    // Draw the horizontal lines
    for (let y = 0; y <= model.value.rows; y++) {
      ctx.beginPath()
      ctx.moveTo(px, py + y * h)
      ctx.lineTo(width.value - px, py + y * h)
      ctx.stroke()
    }

    // If there's nothing to draw, return
    if (w === 0 || h === 0 || !markersEnabled.value) {
      redrawRunning.value = false
      return
    }

    // Start position
    let x = px
    let y = py
    // While we haven't left the drawing area yet
    while (x <= width.value - px) {
      while (y <= height.value - py) {
        let finalX = x
        let finalY = y

        // Adjust the position based on the starting corner
        switch (markers.value.anchor) {
          case Anchor.topRight:
            finalX = 2 * px + model.value.columns * w - x
            break
          case Anchor.bottomLeft:
            finalY = 2 * py + model.value.rows * h - y
            break
          case Anchor.bottomRight:
            finalX = 2 * px + model.value.columns * w - x
            finalY = 2 * py + model.value.rows * h - y
            break
        }

        // Draw the circle
        ctx.fillStyle = store.storeTraitColors[1 % store.storeTraitColors.length] || '#00acef'
        ctx.beginPath()
        ctx.arc(finalX, finalY, 6, 0, 2 * Math.PI)
        ctx.fill()

        // Increase y
        y += h * dy
      }
      // Increase x
      x += w * dx
      // Reset y
      y = py
    }

    redrawRunning.value = false
  }

  function reset () {
    if (!canvasWrapper.value || !canvas.value) {
      return
    }

    width.value = canvasWrapper.value.offsetWidth
    height.value = canvasWrapper.value.offsetHeight
    const cc = canvas.value
    cc.width = width.value
    cc.height = height.value
    cc.style.height = height.value + 'px'
    cc.style.width = width.value + 'px'

    ctx = cc.getContext('2d')

    if (ctx) {
      ctx.lineWidth = 1

      nextTick(() => draw())
    }
  }

  watch(markers, async newValue => {
    nextTick(() => draw())

    if (model.value) {
      model.value.markers = newValue
    }
  }, { deep: true })
  watch(markersEnabled, async newValue => {
    nextTick(() => reset())

    if (model.value) {
      if (newValue) {
        model.value.markers = markers.value
      } else {
        model.value.markers = undefined
      }
    }
  })

  onMounted(() => {
    window.addEventListener('resize', reset)

    if (model.value?.markers) {
      markers.value = model.value.markers
      markersEnabled.value = true
    } else {
      nextTick(() => reset())
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', reset)
  })

  defineExpose({
    isValid,
    reset,
  })
</script>

<style scoped>
.canvas-wrapper {
  height: 400px;
}
</style>
