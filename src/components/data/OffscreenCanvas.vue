<template>
  <div />
</template>

<script setup lang="ts">
  import { categoricalColors } from '@/plugins/color'
  import { CanvasShape, type TraitPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'

  const compProps = defineProps<{
    traits: TraitPlus[]
    circleRadius: number
  }>()

  const canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d', { alpha: false })

  const store = coreStore()

  const fillStyleWhite = computed(() => store.storeIsDarkMode ? '#000000' : '#ffffff')
  const fillStyleLightGray = computed(() => store.storeIsDarkMode ? '#0d0d0d' : '#f2f2f2')
  const fillStyleDarkGray = computed(() => store.storeIsDarkMode ? '#1f1f1f' : '#e0e0e0')
  const fillStyleMarked = computed(() => store.storeIsDarkMode ? '#415971' : '#c6d2de')
  const fillStyleHighlight = computed(() => store.storeIsDarkMode ? '#1e1032' : '#e1efcd')
  const fillStyleHiddenTrait = computed(() => store.storeIsDarkMode ? '#2c2c2c' : '#d3d3d3')
  const fillStyleControl = computed(() => store.storeIsDarkMode ? '#0a3d62' : '#82ccdd')
  const circleCount = computed(() => compProps.traits.length + 1)

  const colors = computed(() => {
    const cols = [fillStyleWhite.value, fillStyleLightGray.value, fillStyleDarkGray.value, fillStyleMarked.value, fillStyleHighlight.value]
    const catCols = store.storeIsDarkMode ? categoricalColors.HighlightDark : categoricalColors.HighlightPastel
    catCols.forEach(c => cols.push(c))
    return cols
  })

  watch(() => compProps.traits, async () => reset())
  watch(() => compProps.circleRadius, async () => reset())
  watch(() => store.storeDarkMode, async () => draw())

  function reset () {
    const scale = window.devicePixelRatio
    const width = circleCount.value * compProps.circleRadius * 2 + circleCount.value + 1
    const height = compProps.circleRadius * (colors.value.length + 1) * 6 + circleCount.value + 1
    canvas.width = width * scale
    canvas.height = height * scale

    nextTick(() => {
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'

      nextTick(() => {
        ctx = canvas.getContext('2d', { alpha: false })

        if (ctx) {
          ctx.scale(scale, scale)

          draw()
        }
      })
    })
  }

  function draw () {
    const ccctx = ctx

    if (!ccctx) {
      return
    }

    // Clear everything
    ccctx.clearRect(0, 0, circleCount.value * compProps.circleRadius * 2 + circleCount.value + 1, compProps.circleRadius * 12 + circleCount.value + 1)

    // For each background colour
    colors.value.forEach((color, b) => {
      ccctx.fillStyle = color
      // Calculate y position
      const y = b * (compProps.circleRadius * 6 + 1)
      // Fill background
      ccctx.fillRect(0, y, circleCount.value * compProps.circleRadius * 2 + circleCount.value + 1, compProps.circleRadius * 7 + 2)
      // Draw trait circles
      compProps.traits.forEach((t, i) => {
        if (store.storeCanvasShape === CanvasShape.SQUARE) {
          ccctx.lineWidth = 2
          const x = i * (compProps.circleRadius * 2 + 1) + 1

          // Filled square
          ccctx.fillStyle = t.color || 'grey'
          ccctx.fillRect(x, y, compProps.circleRadius * 2 + 1, compProps.circleRadius * 2 + 1)

          // Outlined square
          ccctx.strokeStyle = t.color || 'grey'
          ccctx.strokeRect(x + 0.5, y + (compProps.circleRadius * 2) + 1.5, compProps.circleRadius * 2 - 1, compProps.circleRadius * 2 - 1)

          // Semi square for multi traits
          ccctx.strokeRect(x + 0.5, y + (compProps.circleRadius * 4) + 1.5, compProps.circleRadius * 2 - 1, compProps.circleRadius * 2 - 1)
          ccctx.beginPath()
          ccctx.moveTo(x + compProps.circleRadius * 2, y + (compProps.circleRadius * 4) + 1)
          ccctx.lineTo(x, y + (compProps.circleRadius * 4) + 1)
          ccctx.lineTo(x, y + (compProps.circleRadius * 4) + 1 + compProps.circleRadius * 2)
          ccctx.fill()
        } else {
          ccctx.lineWidth = 1
          const x = i * (compProps.circleRadius * 2 + 1) + 1 + compProps.circleRadius
          // Filled circle
          ccctx.fillStyle = t.color || 'grey'
          ccctx.beginPath()
          ccctx.arc(x, 1 + y + compProps.circleRadius, compProps.circleRadius, 0, 2 * Math.PI)
          ccctx.fill()

          // Outlined circle (-0.5px radius so it's the same size as the filled circle)
          ccctx.strokeStyle = t.color || 'grey'
          ccctx.beginPath()
          ccctx.arc(x, 1 + y + compProps.circleRadius * 3, compProps.circleRadius - 0.5, 0, 2 * Math.PI)
          ccctx.stroke()

          // Semi circle for multi traits
          ccctx.beginPath()
          ccctx.arc(x, 1 + y + compProps.circleRadius * 5, compProps.circleRadius - 0.5, 0, 2 * Math.PI)
          ccctx.stroke()
          ccctx.beginPath()
          ccctx.arc(x, 1 + y + compProps.circleRadius * 5, compProps.circleRadius, (Math.PI / 180) * 90, (Math.PI / 180) * 270)
          ccctx.fill()
        }
      })

      // Draw the disabled circles
      ccctx.fillStyle = fillStyleHiddenTrait.value
      ccctx.beginPath()
      ccctx.arc(1 + compProps.circleRadius + (circleCount.value - 1) * (compProps.circleRadius * 2 + 1), 1 + y + compProps.circleRadius, compProps.circleRadius, 0, 2 * Math.PI)
      ccctx.fill()

      // Outlined circle (-0.5px radius so it's the same size as the filled circle)
      ccctx.strokeStyle = fillStyleHiddenTrait.value
      ccctx.beginPath()
      ccctx.arc(1 + compProps.circleRadius + (circleCount.value - 1) * (compProps.circleRadius * 2 + 1), 1 + y + compProps.circleRadius * 3, compProps.circleRadius - 0.5, 0, 2 * Math.PI)
      ccctx.stroke()

      // Semi circle for multi traits
      ccctx.beginPath()
      ccctx.arc(1 + compProps.circleRadius + (circleCount.value - 1) * (compProps.circleRadius * 2 + 1), 1 + y + compProps.circleRadius * 5, compProps.circleRadius - 0.5, 0, 2 * Math.PI)
      ccctx.stroke()
      ccctx.beginPath()
      ccctx.arc(1 + compProps.circleRadius + (circleCount.value - 1) * (compProps.circleRadius * 2 + 1), 1 + y + compProps.circleRadius * 5, compProps.circleRadius - 0.5, (Math.PI / 180) * 90, (Math.PI / 180) * 270)
      ccctx.fill()
    })

    // for (let b = 0; b < 6; b++) {
    //   switch (b) {
    //     case 0:
    //       ccctx.fillStyle = fillStyleWhite.value
    //       break
    //     case 1:
    //       ccctx.fillStyle = fillStyleLightGray.value
    //       break
    //     case 2:
    //       ccctx.fillStyle = fillStyleDarkGray.value
    //       break
    //     case 3:
    //       ccctx.fillStyle = fillStyleMarked.value
    //       break
    //     case 4:
    //       ccctx.fillStyle = fillStyleHighlight.value
    //       break
    //     case 5:
    //       ccctx.fillStyle = fillStyleControl.value
    //       break
    //   }
    // }
  }

  function copyToCanvas (traitIndex: number, type: 'filled' | 'empty' | 'semi', bgIndex: number, otherCtx: CanvasRenderingContext2D, targetX: number, targetY: number) {
    // Calculate position of circle on the offscreen canvas
    const w = compProps.circleRadius * 2
    const sourceX = 1 + traitIndex * (w + 1)
    const sourceY = 1 + bgIndex * (compProps.circleRadius * 6 + 1) + (type === 'filled' ? 0 : (type === 'empty' ? w : 2 * w))
    // Draw it onto the target
    otherCtx.drawImage(canvas, sourceX * window.devicePixelRatio, sourceY * window.devicePixelRatio, w * window.devicePixelRatio, w * window.devicePixelRatio, targetX, targetY, w, w)
  }

  onMounted(() => {
    reset()
    window.addEventListener('resize', reset)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', reset)
  })

  defineExpose({
    copyToCanvas,
    reset,
  })
</script>
