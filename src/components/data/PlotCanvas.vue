<template>
  <div class="canvas-wrapper cell d-block position-relative" v-if="dimensions">
    <canvas id="main-canvas" class="position-absolute" ref="plotCanvas" :width="dimensions.scaledCanvasWidth" :height="dimensions.scaledCanvasHeight" />
    <canvas id="user-position-canvas" class="position-absolute" ref="userCanvas" :width="dimensions.scaledCanvasWidth" :height="dimensions.scaledCanvasHeight" />

    <OffscreenCanvas :circle-radius="dimensions.circleRadius" :traits="trial.traits" ref="offscreenCanvas" />
  </div>
</template>

<script setup lang="ts">
  import OffscreenCanvas from '@/components/data/OffscreenCanvas.vue'
  import type { Dimensions } from '@/components/data/DataCanvas.vue'
  import { type CellPlus, type TrialPlus, type Geolocation, NavigationMode } from '@/plugins/types/client'
  import { isGeographyValid, projectToEuclidean, type XY } from '@/plugins/location'
  import { coreStore } from '@/stores/app'

  import emitter from 'tiny-emitter/instance'
  import { CellCategory } from '@/plugins/types/gridscore'
  import { getTrialDataCached } from '@/plugins/datastore'
  import { getTouchPosition } from '@/plugins/touchinput'
  import { categoricalColors } from '@/plugins/color'

  interface DragConfig {
    active: boolean
    start: XY | undefined
    startTime: number | undefined
    position: XY | undefined
    originStart: XY | undefined
  }

  const commentImg = new Image()
  commentImg.src = 'data:image/svg+xml,%3Csvg viewBox="0 0 16 16" width="1em" height="1em" focusable="false" role="img" aria-label="chat right text fill" xmlns="http://www.w3.org/2000/svg" fill="%238e8c84"%3E%3Cg %3E%3Cpath d="M16 2a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9.586a1 1 0 0 1 .707.293l2.853 2.853a.5.5 0 0 0 .854-.353V2zM3.5 3h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1 0-1zm0 2.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1 0-1zm0 2.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1z"%3E%3C/path%3E%3C/g%3E%3C/svg%3E'
  const userPositionImg = new Image()
  userPositionImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiM4ZThjODQiIHZpZXdCb3g9IjAgMCAxNiAxNiIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPiA8cGF0aCBkPSJNIDcuOTk5ODcxMiwwLjk5OTU3OTg5IEEgMC41LDAuNSAwIDAgMSA4LjQ2NjU2MTcsMS4zMjA2MDY0IEwgMTMuNDY2NTE0LDE0LjMyMDc2NSBhIDAuNSwwLjUgMCAwIDEgLTAuNjUzMzY3LDAuNjQzNDY3IEwgNy45OTk4NzEyLDEzLjAzNzM2NiAzLjE4NTE4MTEsMTQuOTY0MjMyIEEgMC41LDAuNSAwIDAgMSAyLjUzMzIyODcsMTQuMzIwNzY1IEwgNy41MzMxODA3LDEuMzIwNjA2NCBBIDAuNSwwLjUgMCAwIDEgNy45OTkxNjQxLDEuMDAwMjg3IFoiIC8+IDwvc3ZnPg=='
  const userPositionNoHeadingImg = new Image()
  userPositionNoHeadingImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9IiM4ZThjODQiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgY2xhc3M9ImJpIGJpLXJlY29yZC1jaXJjbGUiIHZpZXdCb3g9IjAgMCAxNiAxNiI+CiAgPHBhdGggZD0iTTggMTVBNyA3IDAgMSAxIDggMWE3IDcgMCAwIDEgMCAxNG0wIDFBOCA4IDAgMSAwIDggMGE4IDggMCAwIDAgMCAxNiIvPgogIDxwYXRoIGQ9Ik0xMSA4YTMgMyAwIDEgMS02IDAgMyAzIDAgMCAxIDYgMCIvPgo8L3N2Zz4='
  const bookmarkImg = new Image()
  bookmarkImg.src = 'data:image/svg+xml,%3Csvg viewBox="0 0 16 16" width="1em" height="1em" focusable="false" role="img" aria-label="bookmark check fill" xmlns="http://www.w3.org/2000/svg" fill="%238e8c84" %3E%3Cg %3E%3Cpath fill-rule="evenodd" d="M2 15.5V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5zm8.854-9.646a.5.5 0 0 0-.708-.708L7.5 7.793 6.354 6.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3z"%3E%3C/path%3E%3C/g%3E%3C/svg%3E'
  const controlImg = new Image()
  controlImg.src = 'data:image/svg+xml,%3Csvg viewBox="0 0 16 16" width="1em" height="1em" focusable="false" role="img" aria-label="bookmark check fill" xmlns="http://www.w3.org/2000/svg" fill="%238e8c84" %3E%3Cg %3E%3Cpath fill-rule="evenodd" d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm10.03 4.97a.75.75 0 0 1 .011 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.75.75 0 0 1 1.08-.022z"%3E%3C/path%3E%3C/g%3E%3C/svg%3E'

  const compProps = defineProps<{
    dimensions: Dimensions
    trial: TrialPlus
    markedRows: boolean[]
    markedColumns: boolean[]
    geolocation?: Geolocation
    traitCutoff?: string
  }>()

  const emit = defineEmits(['origin-changed'])

  const store = coreStore()

  let gridProjection: any
  let ctx: CanvasRenderingContext2D | null = null
  let uctx: CanvasRenderingContext2D | null = null
  let trialData: { [index: string]: CellPlus } | undefined = {}
  let timer: number | undefined
  let flingInterval: number | undefined
  let lastMove: number | undefined

  const isDrawing = ref(false)
  const origin = ref<XY>({ x: 0, y: 0 })
  const followGps = ref(false)
  const showRestrictionToast = ref(false)
  const drag = ref<DragConfig>({
    active: false,
    start: undefined,
    startTime: undefined,
    position: undefined,
    originStart: {
      x: 0,
      y: 0,
    },
  })

  const offscreenCanvas = useTemplateRef('offscreenCanvas')
  const plotCanvas = useTemplateRef('plotCanvas')
  const userCanvas = useTemplateRef('userCanvas')

  const fillStyleWhite = computed(() => store.storeIsDarkMode ? '#000000' : '#ffffff')
  const fillStyleLightGray = computed(() => store.storeIsDarkMode ? '#0d0d0d' : '#f2f2f2')
  const fillStyleDarkGray = computed(() => store.storeIsDarkMode ? '#1f1f1f' : '#e0e0e0')
  const fillStyleHighlight = computed(() => store.storeIsDarkMode ? '#833471' : '#A3CB38')
  const fillStyleMarked = computed(() => store.storeIsDarkMode ? '#415971' : '#c6d2de')
  const fillStyleHiddenTrait = computed(() => store.storeIsDarkMode ? '#2c2c2c' : '#d3d3d3')
  const fillStyleText = computed(() => store.storeIsDarkMode ? '#ffffff' : '#000000')
  const fillStyleControl = computed(() => store.storeIsDarkMode ? '#0a3d62' : '#82ccdd')
  const highlightColors = computed(() => store.storeIsDarkMode ? categoricalColors.HighlightDark : categoricalColors.HighlightPastel)
  const visibleTraits = computed(() => mappedTraits.value.filter(t => t.visible))
  const mappedTraits = computed(() => {
    if (!compProps.trial) {
      return []
    } else {
      return compProps.trial.traits.map((t, i) => {
        return {
          original: t,
          originalIndex: i,
          visible: store.storeHiddenTraits ? !store.storeHiddenTraits.includes(t.id || '') : true,
        }
      })
    }
  })

  const userPosition = computed(() => {
    if (compProps.geolocation && gridProjection) {
      const euclideanPosition = gridProjection(compProps.geolocation.lng, compProps.geolocation.lat)

      const highlightRow = compProps.trial.layout.rows - Math.ceil(compProps.trial.layout.rows * (100 - euclideanPosition.y) / 100)
      const highlightColumn = Math.floor(compProps.trial.layout.columns * euclideanPosition.x / 100)

      if (highlightRow < 0 || highlightRow > compProps.trial.layout.rows - 1 || highlightColumn < 0 || highlightColumn > compProps.trial.layout.columns - 1) {
        return undefined
      } else {
        const dataWidth = compProps.dimensions.cellWidth * compProps.trial.layout.columns
        const dataHeight = compProps.dimensions.cellHeight * compProps.trial.layout.rows

        let rotate

        if (compProps.trial.layout.corners && compProps.geolocation.heading !== undefined && compProps.geolocation.heading !== null) {
          const topX = ((compProps.trial.layout.corners.topRight.lng || 0) + (compProps.trial.layout.corners.topLeft.lng || 0)) / 2
          const bottomX = topX
          const topY = ((compProps.trial.layout.corners.topRight.lat || 0) + (compProps.trial.layout.corners.topLeft.lat || 0)) / 2
          const bottomY = topY + 1

          const topProjected = gridProjection(topX, topY)
          const bottomProjected = gridProjection(bottomX, bottomY)

          const dAx = topProjected.x - bottomProjected.x
          const dAy = topProjected.y - bottomProjected.y
          const dBx = 0
          const dBy = 0 - 100
          let angle = Math.atan2(dAx * dBy - dAy * dBx, dAx * dBx + dAy * dBy)
          if (angle < 0) {
            angle = angle * -1
          }
          rotate = angle * (180 / Math.PI)
          rotate = (rotate + compProps.geolocation.heading) % 360
        } else {
          rotate = null
        }

        return {
          column: highlightColumn,
          row: highlightRow,
          x: origin.value.x + dataWidth * euclideanPosition.x / 100,
          y: origin.value.y + dataHeight * euclideanPosition.y / 100,
          euclideanX: euclideanPosition.x,
          euclideanY: euclideanPosition.y,
          rotate,
        }
      }
    } else {
      return undefined
    }
  })

  const markerPositions = computed(() => {
    if (!compProps.trial || !compProps.dimensions) {
      return []
    } else {
      if (compProps.trial.layout.markers && compProps.trial.layout.markers.anchor && compProps.trial.layout.markers.everyRow && compProps.trial.layout.markers.everyColumn) {
        const markV = compProps.dimensions.cellHeight * compProps.trial.layout.markers.everyRow
        const markH = compProps.dimensions.cellWidth * compProps.trial.layout.markers.everyColumn

        const coords = []

        const width = compProps.trial.layout.columns * compProps.dimensions.cellWidth
        const height = compProps.trial.layout.rows * compProps.dimensions.cellHeight
        let x = 0
        let y = 0
        while (x <= width) {
          while (y <= height) {
            let finalX = x
            let finalY = y

            switch (compProps.trial.layout.markers.anchor) {
              case 'topRight':
                finalX = width - x
                break
              case 'bottomLeft':
                finalY = height - y
                break
              case 'bottomRight':
                finalX = width - x
                finalY = height - y
                break
            }

            coords.push([finalX, finalY])
            y += markV
          }
          x += markH
          y = 0
        }

        return coords
      } else {
        return []
      }
    }
  })

  function update (scrollToRow?: number, scrollToColumn?: number) {
    if (!ctx) {
      return
    }
    if (isDrawing.value) {
      return
    }
    isDrawing.value = true

    ctx.clearRect(0, 0, compProps.dimensions.canvasWidth, compProps.dimensions.canvasHeight)

    if (!trialData || Object.keys(trialData).length === 0) {
      return
    }

    // Calculate row and column bounds that need to be redrawn
    const minRow = Math.max(0, Math.floor(Math.abs(origin.value.y) / compProps.dimensions.cellHeight))
    const maxRow = Math.min(minRow + Math.ceil(compProps.dimensions.canvasHeight / compProps.dimensions.cellHeight) + 1, compProps.trial.layout.rows)
    const minCol = Math.max(0, Math.floor(Math.abs(origin.value.x) / compProps.dimensions.cellWidth))
    const maxCol = Math.min(minCol + Math.ceil(compProps.dimensions.canvasWidth / compProps.dimensions.cellWidth) + 1, compProps.trial.layout.columns)

    // Draw all cells
    for (let row = minRow; row < maxRow; row++) {
      for (let col = minCol; col < maxCol; col++) {
        updateCell(row, col)
      }
    }

    updateMarkers()

    if (compProps.geolocation) {
      updateUserPosition()
    }

    isDrawing.value = false

    if (scrollToRow !== undefined && scrollToRow !== null && scrollToColumn !== undefined && scrollToColumn !== null) {
      const x = scrollToColumn / compProps.trial.layout.columns * 100
      const y = scrollToRow / compProps.trial.layout.rows * 100
      scrollTo(x, y)
    }
  }

  function updateUserPosition () {
    if (!uctx) {
      return
    }

    uctx.clearRect(0, 0, compProps.dimensions.canvasWidth, compProps.dimensions.canvasHeight)

    if (userPosition.value) {
      uctx.fillStyle = fillStyleHighlight.value
      // Calculate x and y of this grid cell
      const x = origin.value.x + compProps.dimensions.cellWidth * userPosition.value.column
      const y = origin.value.y + compProps.dimensions.cellHeight * userPosition.value.row

      // Fill the background
      uctx.globalAlpha = 0.3
      uctx.fillRect(x, y, compProps.dimensions.cellWidth, compProps.dimensions.cellHeight)
      uctx.globalAlpha = 1

      uctx.save()
      uctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, userPosition.value.x * window.devicePixelRatio, userPosition.value.y * window.devicePixelRatio)
      if (userPosition.value.rotate !== undefined && userPosition.value.rotate !== null) {
        uctx.rotate(userPosition.value.rotate * Math.PI / 180)
        uctx.drawImage(userPositionImg, -8, -8)
      } else {
        uctx.drawImage(userPositionNoHeadingImg, -8, -8)
      }
      uctx.restore()

      if (followGps.value) {
        scrollTo(userPosition.value.euclideanX, userPosition.value.euclideanY)
      }
    }
  }

  function updateCell (row: number, col: number) {
    const cell = trialData ? trialData[`${row}|${col}`] : undefined

    const ccctx = ctx

    if (!ccctx) {
      return
    }

    let count = 0

    let isHighlighted = false
    let highlightColorIndex = 0

    if (cell && store.storeHighlightConfig) {
      switch (store.storeHighlightConfig.type) {
        case 'controls':
          isHighlighted = cell.categories && cell.categories.includes(CellCategory.CONTROL)
          break
        case 'reps': {
          const index = (store.storeHighlightConfig.reps || []).indexOf(cell.rep || '')
          isHighlighted = index !== -1
          highlightColorIndex = index % highlightColors.value.length
          break
        }
        case 'treatments': {
          const index = (store.storeHighlightConfig.treatments || []).indexOf(cell.treatment || '')
          isHighlighted = index !== -1
          highlightColorIndex = index % highlightColors.value.length
          break
        }
        case 'germplasm':
          isHighlighted = (cell.displayName || cell.germplasm).toLowerCase().includes(store.storeHighlightConfig.germplasm || '')
          break
      }
    }

    if (isHighlighted) {
      count = 5 + highlightColorIndex
      ccctx.fillStyle = highlightColors.value[highlightColorIndex % highlightColors.value.length] || 'black'
    } else if ((compProps.markedRows && compProps.markedRows[row]) || (compProps.markedColumns && compProps.markedColumns[col])) {
      count = 3
      ccctx.fillStyle = fillStyleMarked.value
    } else {
      // Determine the background color
      if (row % 2 === 0) {
        count++
      }
      if (col % 2 === 0) {
        count++
      }
      switch (count) {
        case 0:
          ccctx.fillStyle = fillStyleWhite.value
          break
        case 1:
          ccctx.fillStyle = fillStyleLightGray.value
          break
        default:
          ccctx.fillStyle = fillStyleDarkGray.value
          break
      }
    }

    // Calculate x and y of this grid cell
    const x = origin.value.x + compProps.dimensions.cellWidth * col
    const y = origin.value.y + compProps.dimensions.cellHeight * row

    // Fill the background
    ccctx.fillRect(x, y, compProps.dimensions.cellWidth, compProps.dimensions.cellHeight)

    if (!cell || !cell.displayName) {
      return
    }

    let maxY
    // Add the name text
    if (store.storePlotDisplayField !== null) {
      // @ts-ignore
      const text = fittingString(cell[store.storePlotDisplayField] || 'N/A', compProps.dimensions.coreWidth)
      ccctx.fillStyle = fillStyleText.value
      ccctx.fillText(text, x + compProps.dimensions.cellWidth / 2, y + compProps.dimensions.padding + compProps.dimensions.fontSize / 2)
      maxY = y + compProps.dimensions.padding + compProps.dimensions.fontSize / 2
    } else {
      maxY = y + compProps.dimensions.padding
    }

    // How many circle rows do we need?
    let traitCounter = 0
    for (let r = 0; r < compProps.dimensions.circleRows; r++) {
      // How many circles are in this row?
      const circlesInThisRow = Math.min(compProps.dimensions.circlesPerRow, visibleTraits.value.length - r * compProps.dimensions.circlesPerRow)
      // Add extra padding depending on the number of circles
      const extraPadding = compProps.dimensions.coreWidth - circlesInThisRow * compProps.dimensions.circleRadius * 2 - (circlesInThisRow - 1) * compProps.dimensions.padding / 2

      for (let t = 0; t < circlesInThisRow; t++) {
        const trait = visibleTraits.value[traitCounter++]
        const targetX = Math.round(extraPadding / 2 + x + compProps.dimensions.padding + t * (compProps.dimensions.circleRadius * 2 + compProps.dimensions.padding / 2))
        const targetY = Math.round(y + compProps.dimensions.textPartHeight + r * (compProps.dimensions.circleRadius * 2 + compProps.dimensions.padding))

        if (trait) {
          const traitMeasurements = cell.measurements[trait.original.id || ''] || []

          let fill: 'filled' | 'semi' | 'empty'
          if (!trait.original.allowRepeats) {
            // Single measurement traits only need to have SOME value
            fill = traitMeasurements.some(m => m.values && m.values.length > 0) ? 'filled' : 'empty'
          } else {
            // For all others, check if the last set of recorded values has the full `setSize`.
            // Also check trait cutoff point.
            const matchingCount = traitMeasurements.filter(m => m.values && m.values.length === trait.original.setSize && (!compProps.traitCutoff || !cell.latestDates || !cell.latestDates[trait.original.id || ''] || (cell.latestDates[trait.original.id || ''] || '') > compProps.traitCutoff)).length
            if (matchingCount > 0) {
              fill = 'semi'
            } else {
              fill = 'empty'
            }
          }

          if (ctx) {
            offscreenCanvas.value?.copyToCanvas(trait.originalIndex, fill, count, ctx, targetX, targetY)
          }
        }
        maxY = targetY
      }
    }

    // IF only one is visible, show the last values for it
    if (visibleTraits.value.length === 1) {
      const tt = visibleTraits.value[0]

      if (tt) {
        const traitMeasurements = cell.measurements[tt.original?.id || ''] || []
        const dp = traitMeasurements.filter(m => m.values !== undefined && m.values !== null && m.values.length > 0)

        let str
        if (tt.original.dataType === 'categorical') {
          // @ts-ignore
          str = dp.map(m => m.values.map(v => tt.original.restrictions.categories[v])).join(', ')
        } else {
          str = dp.map(m => m.values).join(', ')
        }
        const traitValue = fittingString(str || '', compProps.dimensions.coreWidth, false)
        ccctx.fillStyle = fillStyleText.value
        ccctx.fillText(traitValue, x + compProps.dimensions.cellWidth / 2, maxY + compProps.dimensions.textPartHeight - compProps.dimensions.padding + compProps.dimensions.fontSize / 2)
      }
    }

    // Add a bookmark symbol if required
    if (cell.isMarked) {
      drawBookmark(x + compProps.dimensions.cellWidth - 20, y)
    }
    if (cell.comments && cell.comments.length > 0) {
      drawComment(x + 5, y + 5)
    }
    if (cell.categories && cell.categories.includes(CellCategory.CONTROL)) {
      drawControl(x + compProps.dimensions.cellWidth - 20, y + compProps.dimensions.cellHeight - 20)
    }
  }

  function fittingString (str: string, maxWidth: number, fromStart = true) {
    if (ctx) {
      let width = ctx.measureText(str).width
      const ellipsis = '…'
      const ellipsisWidth = ctx.measureText(ellipsis).width
      if (width <= maxWidth || width <= ellipsisWidth) {
        return str
      } else {
        while (width >= maxWidth - ellipsisWidth && str.length > 0) {
          if (fromStart) {
            str = str.slice(0, -1)
          } else {
            str = str.slice(1)
          }
          width = ctx.measureText(str).width
        }

        return fromStart ? (str + ellipsis) : (ellipsis + str)
      }
    } else {
      return str
    }
  }

  function drawComment (x: number, y: number) {
    ctx?.drawImage(commentImg, x, y)
  }
  function drawBookmark (x: number, y: number) {
    ctx?.drawImage(bookmarkImg, x, y)
  }
  function drawControl (x: number, y: number) {
    ctx?.drawImage(controlImg, x, y)
  }

  function scrollTo (x: number | undefined, y: number | undefined) {
    if (x !== undefined && x >= 0 && x <= 100) {
      origin.value.x = Math.round(-(compProps.trial.layout.columns * compProps.dimensions.cellWidth - compProps.dimensions.canvasWidth) * x / 100)
    }
    if (y !== undefined && y >= 0 && y <= 100) {
      origin.value.y = Math.round(-(compProps.trial.layout.rows * compProps.dimensions.cellHeight - compProps.dimensions.canvasHeight) * y / 100)
    }

    emit('origin-changed', { x: origin.value.x, y: origin.value.y })

    // @ts-ignore
    if (requestAnimationFrame in window) {
      if (timer) {
        window.cancelAnimationFrame(timer)
      }
      timer = window.requestAnimationFrame(() => update())
    } else {
      update()
    }
  }

  function onRowMarked (row: number) {
    const minCol = Math.max(0, Math.floor(Math.abs(origin.value.x) / compProps.dimensions.cellWidth))
    const maxCol = Math.min(minCol + Math.ceil(compProps.dimensions.canvasWidth / compProps.dimensions.cellWidth) + 1, compProps.trial.layout.columns)

    for (let col = minCol; col < maxCol; col++) {
      updateCell(row, col)
    }

    updateMarkers()
  }

  function onColumnMarked (col: number) {
    const minRow = Math.max(0, Math.floor(Math.abs(origin.value.y) / compProps.dimensions.cellHeight))
    const maxRow = Math.min(minRow + Math.ceil(compProps.dimensions.canvasHeight / compProps.dimensions.cellHeight) + 1, compProps.trial.layout.rows)

    for (let row = minRow; row < maxRow; row++) {
      updateCell(row, col)
    }

    updateMarkers()
  }

  function updateMarkers () {
    // Draw markers
    if (ctx && store.storeDisplayMarkerIndicators && markerPositions.value && markerPositions.value.length > 0) {
      ctx.fillStyle = '#8e8c84'

      markerPositions.value.forEach(m => {
        if (m) {
          const x = (m[0] || 0) - Math.abs(origin.value.x)
          const y = (m[1] || 0) - Math.abs(origin.value.y)
          const diameter = 6
          if (ctx && x >= 0 && x <= compProps.dimensions.canvasWidth && y >= 0 && y <= compProps.dimensions.canvasHeight) {
            ctx.beginPath()
            // Draw the arc (circle)
            ctx.arc(
              Math.min(compProps.dimensions.canvasWidth - diameter, Math.max(diameter, x)),
              Math.min(compProps.dimensions.canvasHeight - diameter, Math.max(diameter, y)),
              diameter, 0, 2 * Math.PI)
            ctx.fill()
          }
        }
      })
    }
  }

  async function reset () {
    trialData = getTrialDataCached()

    if (!trialData) {
      return
    } else {
      Object.values(trialData).forEach(c => {
        c.latestDates = {}
        compProps.trial.traits.forEach(t => {
          // @ts-ignore
          if (t.allowRepeats && c.measurements[t.id] && c.measurements[t.id].length > 0) {
            // @ts-ignore
            c.latestDates[t.id] = new Date(c.measurements[t.id][c.measurements[t.id].length - 1].timestamp).toISOString().split('T')[0]
          }
        })
      })
    }

    return new Promise<void>(resolve => {
      const scale = window.devicePixelRatio
      const c = plotCanvas.value
      const uc = userCanvas.value

      if (!c || !uc) {
        resolve()
        return
      }

      c.width = compProps.dimensions.scaledCanvasWidth
      c.height = compProps.dimensions.scaledCanvasHeight
      uc.width = compProps.dimensions.scaledCanvasWidth
      uc.height = compProps.dimensions.scaledCanvasHeight

      nextTick(() => {
        c.style.width = compProps.dimensions.canvasWidth + 'px'
        c.style.height = compProps.dimensions.canvasHeight + 'px'
        uc.style.width = compProps.dimensions.canvasWidth + 'px'
        uc.style.height = compProps.dimensions.canvasHeight + 'px'

        nextTick(() => {
          ctx = c.getContext('2d', { alpha: false })
          if (ctx) {
            ctx.scale(scale, scale)
            ctx.textBaseline = 'middle'
            ctx.textAlign = 'center'
            ctx.font = `${compProps.dimensions.fontSize}px sans-serif`

            uctx = uc.getContext('2d', { alpha: true })
            uctx?.scale(scale, scale)

            drag.value = {
              active: false,
              start: undefined,
              startTime: undefined,
              position: undefined,
              originStart: {
                x: 0,
                y: 0,
              },
            }

            if (store.storeNavigationMode === NavigationMode.DRAG) {
              c.onmousedown = onMouseDown
              c.ontouchstart = onMouseDown
              c.onmouseup = onMouseUp
              c.ontouchend = onMouseUp
              c.onmouseleave = onMouseLeave
              // @ts-ignore
              c.ontouchleave = onMouseLeave
              c.onmousemove = onMouseMove
              c.ontouchmove = onMouseMove
              c.onwheel = onMouseWheel
            } else {
              c.onmousedown = onMouseDown
              c.ontouchstart = onMouseDown
              c.onmouseup = onMouseUp
              c.ontouchend = onMouseUp
            }

            update()
          }

          resolve()
        })
      })
    })
  }

  function onMouseWheel (e: any) {
    let newX = origin.value.x
    let newY = origin.value.y

    if (e.deltaX) {
      newX = Math.round(Math.max(Math.min(0, origin.value.x - e.deltaX), -(compProps.trial.layout.columns * compProps.dimensions.cellWidth - compProps.dimensions.canvasWidth)))
    } else if (e.shiftKey) {
      newX = Math.round(Math.max(Math.min(0, origin.value.x - e.deltaY), -(compProps.trial.layout.columns * compProps.dimensions.cellWidth - compProps.dimensions.canvasWidth)))
    } else {
      newY = Math.round(Math.max(Math.min(0, origin.value.y - e.deltaY), -(compProps.trial.layout.rows * compProps.dimensions.cellHeight - compProps.dimensions.canvasHeight)))

      // Prevent scrolling up the page while the table hasn't reached the top yet
      if (e.deltaY < 0 && newY !== 0) {
        e.preventDefault()
        e.stopPropagation()
      }
      // Prevent scrolling the table if the page hasn't scrolled to the bottom yet
      if (e.deltaY > 0 && (window.innerHeight + window.scrollY) < document.body.offsetHeight) {
        return
      }
    }

    const cvdx = origin.value.x - newX
    const cvdy = origin.value.y - newY

    origin.value = {
      x: newX,
      y: newY,
    }

    emit('origin-changed', { x: newX, y: newY })

    updateFast(cvdx, cvdy)
  }

  function updateFast (cvdx: number, cvdy: number) {
    if (!ctx || !plotCanvas.value) {
      return
    }

    cvdx = Math.round(cvdx)
    cvdy = Math.round(cvdy)
    ctx.drawImage(plotCanvas.value, 0, 0, compProps.dimensions.scaledCanvasWidth, compProps.dimensions.scaledCanvasHeight, -cvdx, -cvdy, compProps.dimensions.canvasWidth, compProps.dimensions.canvasHeight)

    const minCol = Math.max(0, Math.floor(Math.abs(origin.value.x) / compProps.dimensions.cellWidth))
    const maxCol = Math.min(minCol + Math.ceil(compProps.dimensions.canvasWidth / compProps.dimensions.cellWidth) + 2, compProps.trial.layout.columns)
    const minRow = Math.max(0, Math.floor(Math.abs(origin.value.y) / compProps.dimensions.cellHeight))
    const maxRow = Math.min(minRow + Math.ceil(compProps.dimensions.canvasHeight / compProps.dimensions.cellHeight) + 2, compProps.trial.layout.rows)

    const rowCount = Math.ceil(Math.abs(cvdy) / compProps.dimensions.cellHeight) + 2
    const colCount = Math.ceil(Math.abs(cvdx) / compProps.dimensions.cellWidth) + 2

    // Prevent drawing cells twice
    const done = new Set()

    if (cvdy !== 0) {
      for (let y = 0; y <= rowCount; y++) {
        const row = cvdy > 0 ? (maxRow - y - 1) : (minRow + y - 1)
        for (let col = minCol; col < maxCol; col++) {
          done.add(`${row}-${col}`)
          updateCell(row, col)
        }
      }
    }

    if (cvdx !== 0) {
      for (let x = 0; x <= colCount; x++) {
        const col = cvdx > 0 ? (maxCol - x - 1) : (minCol + x - 1)
        for (let row = minRow; row < maxRow; row++) {
          if (!done.has(`${row}-${col}`)) {
            updateCell(row, col)
          }
        }
      }
    }

    updateMarkers()

    if (userPosition.value) {
      updateUserPosition()
    }
  }

  function onMouseMove (e: any) {
    if (drag.value.active) {
      const ev = getTouchPosition(e)
      if (ev) {
        const now = Date.now()

        const deltaYSinceLast = ev.y - (drag.value.position?.y || 0)
        // Prevent scrolling up the page while the table hasn't reached the top yet
        if (deltaYSinceLast >= 0 && origin.value.y !== 0 && e.cancelable) {
          e.preventDefault()
        }

        // Throttle to one draw per 20 milliseconds
        if (!lastMove || (now - lastMove) > 20) {
          const deltaX = Math.round(ev.x - (drag.value.start?.x || 0))
          const deltaY = Math.round(ev.y - (drag.value.start?.y || 0))
          const newX = Math.round(Math.max(Math.min(0, (drag.value.originStart?.x || 0) + deltaX), -(compProps.trial.layout.columns * compProps.dimensions.cellWidth - compProps.dimensions.canvasWidth)))
          const newY = Math.round(Math.max(Math.min(0, (drag.value.originStart?.y || 0) + deltaY), -(compProps.trial.layout.rows * compProps.dimensions.cellHeight - compProps.dimensions.canvasHeight)))

          origin.value = {
            x: newX,
            y: newY,
          }

          emit('origin-changed', { x: newX, y: newY })

          drag.value.position = ev

          // @ts-ignore
          if (requestAnimationFrame in window) {
            if (timer) {
              window.cancelAnimationFrame(timer)
            }
            timer = window.requestAnimationFrame(() => update())
          } else {
            update()
          }

          lastMove = now
        }
      }
    }
  }

  function onMouseLeave () {
    drag.value.active = false
  }

  function onMouseDown (e: any) {
    if (e.button !== null && e.button !== undefined && e.button !== 0) {
      return
    }

    // Stop any fling motion
    if (flingInterval !== undefined) {
      clearInterval(flingInterval)
      flingInterval = undefined
    }
    const ev = getTouchPosition(e)
    if (ev) {
      drag.value.active = true
      drag.value.start = {
        x: ev.x,
        y: ev.y,
      }
      drag.value.originStart = {
        x: origin.value.x,
        y: origin.value.y,
      }
      drag.value.position = ev
      drag.value.startTime = Date.now()
    }
  }

  function onMouseUp (e: any) {
    drag.value.active = false

    const ev = getTouchPosition(e)

    if (ev !== null && (Math.sqrt(Math.pow(ev.x - (drag.value.start?.x || 0), 2) + Math.pow(ev.y - (drag.value.start?.y || 0), 2)) < 10)) {
      // This is a click
      const row = Math.floor((-origin.value.y + ev.y) / compProps.dimensions.cellHeight)
      const column = Math.floor((-origin.value.x + ev.x) / compProps.dimensions.cellWidth)

      if (row >= 0 && row < compProps.trial.layout.rows && column >= 0 && column < compProps.trial.layout.columns) {
        if (store.storeRestrictInputToMarked) {
          const anyMarked = compProps.markedColumns.includes(true) || compProps.markedRows.includes(true)

          if (anyMarked && !compProps.markedColumns[column] && !compProps.markedRows[row]) {
            showRestrictionToast.value = true
            return
          }
        }

        const cell = trialData ? trialData[`${row}|${column}`] : undefined

        if (cell) {
          // Emit an event to handle user selections
          emitter.emit('plot-clicked', row, column, false)
        }
      }
    } else if (store.storeNavigationMode === NavigationMode.DRAG && (e.type === 'touchend' || e.type === 'touchcancel')) {
      const deltaT = Math.abs(Date.now() - (drag.value.startTime || 0))
      // We have to use dragPosition here, because the end/cancel events don't provide location information
      const deltaX = Math.round(((drag.value.position?.x || 0) - (drag.value.start?.x || 0)) / deltaT * 10)
      const deltaY = Math.round(((drag.value.position?.y || 0) - (drag.value.start?.y || 0)) / deltaT * 10)
      drag.value.position = undefined

      let counter = 0
      // Define an update interval
      // @ts-ignore
      flingInterval = setInterval(() => {
        // Run 25 iterations
        if (counter++ < 25) {
          const i = 1 - counter / 25
          // Calculate the velocity in both dimensions
          const velocityX = (1 - Math.pow(1 - i, 5)) * deltaX
          const velocityY = (1 - Math.pow(1 - i, 5)) * deltaY
          // Adjust the origin accordingly
          const newX = Math.round(Math.max(Math.min(0, origin.value.x + velocityX), -(compProps.trial.layout.columns * compProps.dimensions.cellWidth - compProps.dimensions.canvasWidth)))
          const newY = Math.round(Math.max(Math.min(0, origin.value.y + velocityY), -(compProps.trial.layout.rows * compProps.dimensions.cellHeight - compProps.dimensions.canvasHeight)))

          origin.value = {
            x: newX,
            y: newY,
          }

          emit('origin-changed', { x: newX, y: newY })

          // @ts-ignore
          if (requestAnimationFrame in window) {
            if (timer) {
              window.cancelAnimationFrame(timer)
            }
            timer = window.requestAnimationFrame(() => update())
          } else {
            update()
          }
        } else {
          if (flingInterval) {
            clearInterval(flingInterval)
            flingInterval = undefined
          }
        }
      }, 10)
    }
  }

  function getCenterPosition () {
    if (plotCanvas.value) {
      const centerX = plotCanvas.value.offsetWidth / 2
      const centerY = plotCanvas.value.offsetHeight / 2
      const row = Math.floor((-origin.value.y + centerY) / compProps.dimensions.cellHeight)
      const column = Math.floor((-origin.value.x + centerX) / compProps.dimensions.cellWidth)

      return {
        x: column,
        y: row,
      }
    } else {
      return {
        x: 0,
        y: 0,
      }
    }
  }

  function updateCellCache (row: number, column: number, trialId: string, cell: CellPlus) {
    if (trialData && compProps.trial.localId === trialId) {
      trialData[`${row}|${column}`] = cell

      updateCell(row, column)
      updateMarkers()
    }
  }

  function moveInDirection (direction: string) {
    switch (direction) {
      case 'topLeft':
        scrollBy(compProps.dimensions.cellWidth, compProps.dimensions.cellHeight)
        break
      case 'top':
        scrollBy(0, compProps.dimensions.cellHeight)
        break
      case 'topRight':
        scrollBy(-compProps.dimensions.cellWidth, compProps.dimensions.cellHeight)
        break
      case 'left':
        scrollBy(compProps.dimensions.cellWidth, 0)
        break
      case 'right':
        scrollBy(-compProps.dimensions.cellWidth, 0)
        break
      case 'bottomLeft':
        scrollBy(compProps.dimensions.cellWidth, -compProps.dimensions.cellHeight)
        break
      case 'bottom':
        scrollBy(0, -compProps.dimensions.cellHeight)
        break
      case 'bottomRight':
        scrollBy(-compProps.dimensions.cellWidth, -compProps.dimensions.cellHeight)
        break
    }
  }

  function jumpToCorner (corner: string) {
    switch (corner) {
      case 'topLeft':
        scrollTo(0, 0)
        break
      case 'top':
        scrollTo(undefined, 0)
        break
      case 'topRight':
        scrollTo(100, 0)
        break
      case 'left':
        scrollTo(0, undefined)
        break
      case 'right':
        scrollTo(100, undefined)
        break
      case 'bottomLeft':
        scrollTo(0, 100)
        break
      case 'bottom':
        scrollTo(undefined, 100)
        break
      case 'bottomRight':
        scrollTo(100, 100)
        break
      case 'center':
        scrollTo(50, 50)
        break
      case 'gps':
        if (userPosition.value) {
          scrollTo(userPosition.value.euclideanX, userPosition.value.euclideanY)
        }
        break
    }
  }

  function onPlotClicked (row: number, column: number, scrollToCell: boolean) {
    if (scrollToCell) {
      // Calculate the number of cells currently visible on screen
      const visibleCellsX = Math.floor(compProps.dimensions.canvasWidth / compProps.dimensions.cellWidth)
      const visibleCellsY = Math.floor(compProps.dimensions.canvasHeight / compProps.dimensions.cellHeight)

      // Calculate the distance from our cell to the top left corner of the window we want
      const deltaX = (visibleCellsX - 1) / 2 * compProps.dimensions.cellWidth
      const deltaY = (visibleCellsY - 1) / 2 * compProps.dimensions.cellHeight

      // Calculate the position of the top left corner of the window we want
      const x = column * compProps.dimensions.cellWidth - deltaX
      const y = row * compProps.dimensions.cellHeight - deltaY

      // Min-max normalize this into 0-100 (which is our scroll range)
      const scrollX = Math.max(0, Math.min(100, x / (compProps.trial.layout.columns * compProps.dimensions.cellWidth - compProps.dimensions.canvasWidth) * 100))
      const scrollY = Math.max(0, Math.min(100, y / (compProps.trial.layout.rows * compProps.dimensions.cellHeight - compProps.dimensions.canvasHeight) * 100))

      scrollTo(scrollX, scrollY)
    }
  }

  watch(() => compProps.trial, async newValue => {
    if (newValue && newValue.layout && newValue.layout.corners && isGeographyValid(newValue.layout.corners)) {
      const c = newValue.layout.corners
      gridProjection = projectToEuclidean([
        { x: c.topLeft.lng || 0, y: c.topLeft.lat || 0 },
        { x: c.topRight.lng || 0, y: c.topRight.lat || 0 },
        { x: c.bottomRight.lng || 0, y: c.bottomRight.lat || 0 },
        { x: c.bottomLeft.lng || 0, y: c.bottomLeft.lat || 0 },
      ])
    } else {
      gridProjection = undefined
    }
  }, { immediate: true })

  watch(userPosition, async () => updateUserPosition())
  watch(() => store.storeDarkMode, async () => reset())
  watch(() => compProps.traitCutoff, async () => update())

  watch(() => compProps.markedRows, async (newValue, oldValue) => {
    for (let row = 0; row < compProps.trial.layout.rows; row++) {
      if (newValue[row] !== oldValue[row]) {
        onRowMarked(row)
      }
    }
  })
  watch(() => compProps.markedColumns, async (newValue, oldValue) => {
    for (let column = 0; column < compProps.trial.layout.columns; column++) {
      if (newValue[column] !== oldValue[column]) {
        onColumnMarked(column)
      }
    }
  })

  watch(() => store.storeHighlightConfig, () => {
    update()
  }, { deep: true })

  onMounted(() => {
    emitter.on('jump-to-corner', jumpToCorner)
    emitter.on('move-to-corner', moveInDirection)
    emitter.on('trial-data-loaded', reset)
    emitter.on('plot-cache-changed', updateCellCache)
    emitter.on('plot-clicked', onPlotClicked)
  })

  onBeforeUnmount(() => {
    emitter.off('jump-to-corner', jumpToCorner)
    emitter.off('move-to-corner', moveInDirection)
    emitter.off('trial-data-loaded', reset)
    emitter.off('plot-cache-changed', updateCellCache)
    emitter.off('plot-clicked', onPlotClicked)
  })

  defineExpose({
    reset,
    update,
    getCenterPosition,
  })
</script>

<style scoped>
#user-position-canvas {
  pointer-events: none;
}
</style>
