<template>
  <div>
    <h5 class="mt-1">{{ $t('widgetTrialPreviewTitle') }}</h5>
    <canvas ref="canvas" v-if="layout" />
  </div>
</template>

<script setup lang="ts">
  import type { Step } from '@/plugins/guidedwalk'
  import type { XY } from '@/plugins/location'
  import type { Layout } from '@/plugins/types/gridscore'
  import { coreStore } from '@/stores/app'
  import { useTheme } from 'vuetify'

  interface TrialPreviewCanvasProps {
    layout: Layout
    cells?: (XY | undefined)[]
    path?: Step[]
    width?: number
    height?: number
    column: number
    row: number
  }

  const compProps = withDefaults(defineProps<TrialPreviewCanvasProps>(), {
    width: 250,
    height: 250,
  })

  const store = coreStore()
  const theme = useTheme()

  const canvas = useTemplateRef('canvas')

  const fillStyleHighlight = computed(() => theme.current.value.colors.primary)
  const fillStyleDarkGray = computed(() => store.storeDarkMode ? '#2f2f2f' : '#d0d0d0')

  let ctx: CanvasRenderingContext2D | null = null

  function drawArrowhead (context: CanvasRenderingContext2D, from: XY, to: XY, radius: number) {
    const xCenter = to.x
    const yCenter = to.y

    let angle
    let x
    let y

    context.beginPath()

    angle = Math.atan2(to.y - from.y, to.x - from.x)
    x = radius * Math.cos(angle) + xCenter
    y = radius * Math.sin(angle) + yCenter

    context.moveTo(x, y)

    angle += (1 / 3) * (2 * Math.PI)
    x = radius * Math.cos(angle) + xCenter
    y = radius * Math.sin(angle) + yCenter

    context.lineTo(x, y)

    angle += (1 / 3) * (2 * Math.PI)
    x = radius * Math.cos(angle) + xCenter
    y = radius * Math.sin(angle) + yCenter

    context.lineTo(x, y)

    context.closePath()

    context.fill()
  }

  function reset () {
    const canv = canvas.value
    if (compProps.layout && canv) {
      const scale = window.devicePixelRatio
      canv.width = compProps.width * scale
      canv.height = compProps.height * scale

      nextTick(() => {
        canv.style.width = compProps.width + 'px'
        canv.style.height = compProps.height + 'px'

        nextTick(() => {
          ctx = canv.getContext('2d')
          ctx?.translate(0.5, 0.5)
          ctx?.scale(scale, scale)

          draw()
        })
      })
    }
  }

  function draw () {
    if (!ctx) {
      return
    }

    ctx.clearRect(0, 0, compProps.width, compProps.height)

    let width = compProps.width / compProps.layout.columns
    let height = compProps.height / compProps.layout.rows
    const factor = 0.1
    const gap = Math.ceil(Math.min(height * factor, width * factor))
    width = (compProps.width - 2 * gap) / compProps.layout.columns
    height = (compProps.height - 2 * gap) / compProps.layout.rows

    for (let y = 0; y < compProps.layout.rows; y++) {
      const yStart = y * height + gap
      const yEnd = (y + 1) * height - gap

      for (let x = 0; x < compProps.layout.columns; x++) {
        const xStart = x * width + gap
        const xEnd = (x + 1) * width - gap

        if (compProps.column === x && compProps.row === y) {
          ctx.fillStyle = fillStyleHighlight.value
          ctx.fillRect(xStart, yStart, xEnd - xStart, yEnd - yStart)
        } else {
          ctx.fillStyle = fillStyleDarkGray.value
          ctx.fillRect(xStart, yStart, xEnd - xStart, yEnd - yStart)
        }
      }
    }

    if (compProps.cells) {
      ctx.lineWidth = 2
      ctx.strokeStyle = fillStyleHighlight.value
      compProps.cells.forEach(c => {
        const yStart = (c?.y || 0) * height + gap
        const yEnd = ((c?.y || 0) + 1) * height - gap
        const xStart = (c?.x || 0) * width + gap
        const xEnd = ((c?.x || 0) + 1) * width - gap
        ctx?.beginPath()
        ctx?.rect(xStart, yStart, xEnd - xStart, yEnd - yStart)
        ctx?.stroke()
      })
    }

    if (compProps.path) {
      ctx.fillStyle = fillStyleHighlight.value
      ctx.strokeStyle = fillStyleHighlight.value

      const offset = gap / 2 - 1

      let dashed = false
      compProps.path.forEach((c, i) => {
        if (!ctx) {
          return
        }
        ctx.lineWidth = 2
        if (i === 0) {
          ctx.beginPath()
          ctx.moveTo((c.x + 0.5) * width + offset, (c.y + 0.5) * height + offset)
        }

        if (c.tts) {
          // @ts-ignore
          const prev = i > 0 ? compProps.path[i - 1] : null
          if (prev) {
            dashed = true
            ctx.stroke()
            ctx.beginPath()
            ctx.setLineDash([6, 4])
            ctx.moveTo((prev.x + 0.5) * width + offset, (prev.y + 0.5) * height + offset)
          }
        } else if (dashed) {
          // @ts-ignore
          const prev = i > 0 ? compProps.path[i - 1] : null
          if (prev) {
            dashed = false
            ctx.stroke()
            ctx.beginPath()
            ctx.setLineDash([])
            ctx.moveTo((prev.x + 0.5) * width + offset, (prev.y + 0.5) * height + offset)
          }
        }

        ctx.lineTo((c.x + 0.5) * width + offset, (c.y + 0.5) * height + offset)

        // @ts-ignore
        if (i === compProps.path.length - 1) {
          ctx.stroke()
          // @ts-ignore
          drawArrowhead(ctx, { x: (compProps.path[i - 1].x + 0.5) * width + offset, y: (compProps.path[i - 1].y + 0.5) * height + offset }, { x: (c.x + 0.5) * width + offset, y: (c.y + 0.5) * height + offset }, Math.min(height, width) / 1.5)
        }
      })
    }

    if (compProps.layout.markers && compProps.layout.markers.everyRow && compProps.layout.markers.everyColumn) {
      const markV = height * compProps.layout.markers.everyRow
      const markH = width * compProps.layout.markers.everyColumn

      const coords = []

      const totalWidth = compProps.layout.columns * width
      const totalHeight = compProps.layout.rows * height
      let x = 0
      let y = 0
      while (x <= totalWidth) {
        while (y <= totalHeight) {
          let finalX = x
          let finalY = y

          switch (compProps.layout.markers.anchor) {
            case 'topRight':
              finalX = totalWidth - x
              break
            case 'bottomLeft':
              finalY = totalHeight - y
              break
            case 'bottomRight':
              finalX = totalWidth - x
              finalY = totalHeight - y
              break
          }

          coords.push([finalX, finalY])
          y += markV
        }
        x += markH
        y = 0
      }

      const diameter = 2
      coords.forEach(c => {
        if (!ctx) {
          return
        }

        ctx.fillStyle = '#EE5A24'
        ctx.beginPath()
        // Draw the arc (circle)
        ctx.arc(
          Math.min(totalWidth - diameter, Math.max(diameter, c[0] || 0)),
          Math.min(totalHeight - diameter, Math.max(diameter, c[1] || 0)),
          diameter, 0, 2 * Math.PI)
        ctx.fill()
      })
    }
  }

  watch(() => compProps.cells, async () => reset())
  watch(() => compProps.path, async () => reset())

  onMounted(() => reset())
</script>
