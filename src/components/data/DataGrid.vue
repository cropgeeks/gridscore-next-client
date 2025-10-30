<template>
  <div :class="`page-grid ${store.storeIsDarkMode ? 'dark-mode' : ''}`" ref="overallWrapper" v-if="trial && trialData">
    <div @click="clearMarkedRowsCols" />
    <div class="column-headers force-ltr" ref="columnHeader" id="data-canvas-header" :style="{ gridTemplateColumns: `repeat(${columns.length}, ${cellWidth}px)` }">
      <div
        v-for="column in columns"
        :class="{
          cell: true,
          'pa-2': true,
          'text-center': true,
          'cell-column': column.index % 2 === 0,
          'header-marked': column.marked
        }"
        :key="`column-${column.index}`"
        @click="column.marked = !column.marked"
      >{{ column.text }}</div>
    </div>
    <div class="row-headers force-ltr" ref="rowHeader" :style="{ gridTemplateRows: `repeat(${rows.length}, ${cellHeight}px)` }">
      <div
        v-for="row in rows"
        :class="{
          cell: true,
          'pa-2': true,
          'text-center': true,
          'cell-row': row.index % 2 === 0,
          'header-marked': row.marked
        }"
        :key="`row-${row.index}`"
        @click="row.marked = !row.marked"
      >{{ row.text }}</div>
    </div>
    <div :class="`data-grid-wrapper force-ltr ${(store.storeNavigationMode === NavigationMode.JUMP) ? 'no-scroll' : ''}`" ref="wrapper">
      <template v-if="userPosition">
        <v-icon
          :icon="userPosition.rotate !== undefined ? mdiNavigation : mdiRecordCircleOutline"
          class="grid-icon gps-position"
          :style="{
            left: `${userPosition.x}px`,
            top: `${userPosition.y}px`,
            transform: `rotate(${userPosition.rotate}deg)`
          }"
        />
      </template>
      <v-icon :icon="mdiCircle" class="grid-icon position-absolute marker" v-for="(marker, mIndex) in markers" :key="`marker-${mIndex}`" :style="{ left: `${marker.x}px`, top: `${marker.y}px` }" />

      <div ref="dataGrid" class="data-grid" :style="{ gridTemplateColumns: `repeat(${trial.layout.columns}, ${cellWidth}px)`, gridTemplateRows: `repeat(${trial.layout.rows}, ${cellHeight}px)` }">
        <template v-for="row in rows">
          <!-- @vue-skip -->
          <template v-for="column in columns" :key="`cell-${row.index}-${column.index}`">
            <!-- Temporary variable -->
            {{ (cell = trialData[`${row.index}|${column.index}`], null) }}
            <div
              :ref="(el) => (refs[`${row.index}-${column.index}`] = el)"
              @click="plotClicked(row.index, column.index)"
              :class="[{
                'cell-empty': cell === undefined,
                'cell-marked': column.marked || row.marked,
                'cell-column': column.index % 2 === 0,
                'cell-highlight': userPosition && userPosition.column === column.index && userPosition.row === row.index,
                'cell-row': row.index % 2 === 0,
              }, cellClass]"
              :style="getStyle(cell)"
            >
              <template v-if="cell">
                <v-icon :icon="mdiBookmark" class="grid-icon bookmark" v-if="cell.isMarked" />
                <v-icon :icon="mdiMessageText" class="mdi-flip-h grid-icon comment" v-if="cell.comments && cell.comments.length > 0" />
                <v-icon :icon="mdiCheckboxMarked" class="grid-icon check" v-if="store.storeHighlightControls && cell && cell.categories && cell.categories.includes(CellCategory.CONTROL)" />
                <div class="cell-text my-1">{{ cell[store.storePlotDisplayField] }}</div>
                <template v-for="trait in visibleTraits">
                  <template v-if="cell.measurements[trait.id] && cell.measurements[trait.id].length > 0 && (!traitCutoff || !cell.latestDates || !cell.latestDates[trait.id] || (cell.latestDates[trait.id] > traitCutoff))">
                    <template v-if="trait.allowRepeats">
                      <svg xmlns="http://www.w3.org/2000/svg" :key="`cell-${row.index}-${column.index}-square-trait-full-${trait.id}`" :width="circleDiameter" :height="circleDiameter" fill="currentColor" :style="[{ color: trait.color }, circleStyle]" class="circle circle-full" viewBox="0 0 16 16" v-if="store.storeCanvasShape === CanvasShape.SQUARE">
                        <path d="M 1,15 15,1 v 14 z m 15,1 V 0 H 0 v 16 z" />
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" :key="`cell-${row.index}-${column.index}-circle-trait-full-${trait.id}`" :width="circleDiameter" :height="circleDiameter" fill="currentColor" :style="[{ color: trait.color }, circleStyle]" class="circle circle-full" viewBox="0 0 16 16" v-else>
                        <path d="M8 15A7 7 0 1 0 8 1zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16" />
                      </svg>
                    </template>
                    <span class="circle circle-full" :key="`cell-${row.index}-${column.index}-trait-full-${trait.id}`" :style="[{ background: trait.color }, circleStyle]" v-else />
                  </template>
                  <template v-else>
                    <span class="circle circle-empty" :key="`cell-${row.index}-${column.index}-trait-empty-${trait.id}`" :style="[{ borderColor: trait.color }, circleStyle]" />
                  </template>
                </template>
                <div class="cell-text" v-if="visibleTraits.length === 1">
                  {{ singleTraitValues[`${row.index}|${column.index}`] }}
                </div>
              </template>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { getTrialDataCached } from '@/plugins/datastore'
  import { isGeographyValid, projectToEuclidean, type XY } from '@/plugins/location'
  import { CanvasDensity, CanvasShape, CanvasSize, NavigationMode, type CellPlus, type Geolocation, type TrialPlus } from '@/plugins/types/client'
  import { CellCategory, type Cell } from '@/plugins/types/gridscore'
  import { getColumnLabel, getRowLabel } from '@/plugins/util'
  import { coreStore } from '@/stores/app'
  import { useI18n } from 'vue-i18n'
  import emitter from 'tiny-emitter/instance'
  import { categoricalColors } from '@/plugins/color'
  import { mdiCircle, mdiNavigation, mdiRecordCircleOutline, mdiBookmark, mdiMessageText, mdiCheckboxMarked } from '@mdi/js'

  const { n } = useI18n()
  const store = coreStore()

  const compProps = defineProps<{
    trial: TrialPlus
    geolocation?: Geolocation
    traitCutoff?: string
  }>()

  interface Marker {
    x: number
    y: number
  }
  interface RowColumn {
    marked: boolean
    text: string
    index: number
  }

  const emit = defineEmits(['click:plot'])

  const wrapper = useTemplateRef('wrapper')
  const rowHeader = useTemplateRef('rowHeader')
  const columnHeader = useTemplateRef('columnHeader')

  const refs = ref<{ [index: string]: Element | ComponentPublicInstance | null }>({})

  const { t } = useI18n()

  const cellWidth = ref(100)
  const cellHeight = ref(40)
  const scrollSynced = ref(false)

  const trialData = ref<{ [index: string]: Cell }>()
  const columns = ref<RowColumn[]>([])
  const rows = ref<RowColumn[]>([])
  const markers = ref<Marker[]>([])

  let timeout: number | undefined
  let scrollToElementOnTraitToggle: HTMLElement | undefined
  let gridProjection: ((x: number, y: number) => XY) | undefined

  const highlightColors = computed(() => store.storeIsDarkMode ? categoricalColors.HighlightDark : categoricalColors.HighlightPastel)

  const userPosition = computed(() => {
    if (compProps.trial && compProps.geolocation && compProps.trial.layout.corners && gridProjection) {
      // @ts-ignore
      const euclideanPosition = gridProjection(compProps.geolocation.lng, compProps.geolocation.lat)

      const highlightRow = compProps.trial.layout.rows - Math.ceil(compProps.trial.layout.rows * (100 - euclideanPosition.y) / 100)
      const highlightColumn = Math.floor(compProps.trial.layout.columns * euclideanPosition.x / 100)

      if (highlightRow < 0 || highlightRow > compProps.trial.layout.rows - 1 || highlightColumn < 0 || highlightColumn > compProps.trial.layout.columns - 1) {
        return null
      } else {
        const dataWidth = cellWidth.value * compProps.trial.layout.columns
        const dataHeight = cellHeight.value * compProps.trial.layout.rows

        let rotate

        if (compProps.geolocation.heading !== undefined && compProps.geolocation.heading !== null) {
          // @ts-ignore
          const topX = (compProps.trial.layout.corners.topRight.lng + compProps.trial.layout.corners.topLeft.lng) / 2
          const bottomX = topX
          // @ts-ignore
          const topY = (compProps.trial.layout.corners.topRight.lat + compProps.trial.layout.corners.topLeft.lat) / 2
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
          rotate = 0
        }

        return {
          column: highlightColumn,
          row: highlightRow,
          x: dataWidth * euclideanPosition.x / 100 - 16,
          y: dataHeight * euclideanPosition.y / 100 - 16,
          euclideanX: euclideanPosition.x,
          euclideanY: euclideanPosition.y,
          rotate,
        }
      }
    } else {
      return undefined
    }
  })

  const singleTraitValues = computed(() => {
    const td = trialData.value
    const vt = visibleTraits.value
    if (compProps.trial && td && vt && vt.length === 1) {
      const result: { [index: string]: string } = {}

      Object.keys(td).forEach(k => {
        const cell = td[k]

        if (cell) {
          const traitMeasurements = cell.measurements[vt[0]?.id || ''] || []
          const dp = traitMeasurements.filter(m => m.values !== undefined && m.values !== null && m.values.length > 0)

          let str
          if (vt[0]?.dataType === 'categorical' && vt[0]?.restrictions) {
            // @ts-ignore
            str = dp.map(m => m.values.map(v => vt[0]?.restrictions.categories[v])).join(', ')
          } else {
            str = dp.map(m => m.values).join(', ')
          }
          result[k] = str
        }
      })

      return result
    } else {
      return {}
    }
  })

  const circleStyle = computed(() => {
    return {
      margin: `${circlePadding.value / 2}px`,
    }
  })

  const cellClass = computed(() => {
    return {
      cell: true,
      small: store.storeCanvasSize === CanvasSize.SMALL,
      medium: store.storeCanvasSize === CanvasSize.MEDIUM,
      large: store.storeCanvasSize === CanvasSize.LARGE,
      'rounded-dp': store.storeCanvasShape !== CanvasShape.SQUARE,
      'text-center': true,
    }
  })

  const circleDiameter = computed(() => {
    switch (store.storeCanvasSize) {
      case CanvasSize.SMALL:
        return 16
      case CanvasSize.MEDIUM:
        return 20
      case CanvasSize.LARGE:
        return 24
      default:
        return 20
    }
  })

  const circlePadding = computed(() => {
    switch (store.storeCanvasDensity) {
      case CanvasDensity.LOW:
        return circleDiameter.value / 4 * 2
      case CanvasDensity.MEDIUM:
        return circleDiameter.value / 4 * 1.25
      case CanvasDensity.HIGH:
        return circleDiameter.value / 4 * 0.5
      default:
        return circleDiameter.value / 4 * 1.25
    }
  })

  const visibleTraits = computed(() => {
    if (compProps.trial) {
      return store.storeHideTraitCircles ? [] : compProps.trial.traits.filter(t => !store.storeHiddenTraits.includes(t.id || ''))
    } else {
      return []
    }
  })

  function getStyle (cell: CellPlus) {
    if (cell && store.storeHighlightConfig) {
      let isHighlighted = false
      let highlightColorIndex = 0
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

      if (isHighlighted) {
        return {
          backgroundColor: `${highlightColors.value[highlightColorIndex % highlightColors.value.length] || 'black'} !important`,
        }
      }
    } else {
      return undefined
    }
  }

  function clearMarkedRowsCols () {
    columns.value.forEach(c => {
      c.marked = false
    })
    rows.value.forEach(r => {
      r.marked = false
    })
  }

  function plotClicked (row: number, column: number) {
    if (store.storeRestrictInputToMarked) {
      const anyMarked = rows.value.some(r => r.marked) || columns.value.some(c => c.marked)

      if (anyMarked && !columns.value[column]?.marked && !rows.value[row]?.marked) {
        // Show toast
        emitter.emit('show-snackbar', {
          text: t('toastDataInputRestrictedTitle'),
          color: 'warning',
        })
        return
      }
    }

    if (trialData.value) {
      const cell = trialData.value[`${row}|${column}`]

      if (cell) {
        // Emit an event to handle user selections
        emit('click:plot', row, column)
      }
    }
  }

  function reset () {
    if (!trialData.value) {
      // TODO
    } else {
      Object.values(trialData.value).forEach(c => {
        c.latestDates = {}
        compProps.trial?.traits.forEach(t => {
          const tId = t.id || ''
          if (t.allowRepeats && c.measurements[tId] && c.measurements[tId].length > 0) {
            // @ts-ignore
            const str = new Date(c.measurements[tId][c.measurements[tId].length - 1].timestamp).toISOString().split('T')[0]
            if (str) {
              // @ts-ignore
              c.latestDates[tId] = str
            }
          }
        })
      })
    }

    nextTick(() => updateDimensions())
  }

  function updateDimensions () {
    if (wrapper.value) {
      const padding = circlePadding.value

      cellWidth.value = Math.ceil(Math.max(wrapper.value.clientWidth / compProps.trial.layout.columns, store.storeDisplayMinCellWidth * (circleDiameter.value + circlePadding.value)))
      const coreWidth = cellWidth.value

      let circlesPerRow = 1
      for (let t = visibleTraits.value.length; t > 0; t--) {
        const x = (circleDiameter.value + circlePadding.value) * t

        if (x <= coreWidth) {
          circlesPerRow = t
          break
        }
      }

      const circleRows = Math.ceil(visibleTraits.value.length / circlesPerRow)

      const heightProportion = wrapper.value.clientHeight / compProps.trial.layout.rows
      const textHeight = store.storePlotDisplayField === null ? 0 : 30
      let tempHeight = Math.max(textHeight + circleRows * (circleDiameter.value + padding) + padding, heightProportion)

      // Check if we need to increase the minimum height to allow space for the display of the trait value below the circles
      if (visibleTraits.value.length === 1 && tempHeight >= heightProportion) {
        tempHeight += textHeight
      }

      cellHeight.value = Math.floor(tempHeight)

      if (store.storeDisplayMarkerIndicators && compProps.trial.layout.markers && compProps.trial.layout.markers.anchor && compProps.trial.layout.markers.everyRow && compProps.trial.layout.markers.everyColumn) {
        const markV = cellHeight.value * compProps.trial.layout.markers.everyRow
        const markH = cellWidth.value * compProps.trial.layout.markers.everyColumn

        const coords: Marker[] = []

        const width = compProps.trial.layout.columns * cellWidth.value
        const height = compProps.trial.layout.rows * cellHeight.value
        let x = 0
        let y = 0
        const iconWidth = 24
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

            coords.push({ x: finalX - iconWidth / 2, y: finalY - iconWidth / 2 })
            y += markV
          }
          x += markH
          y = 0
        }

        markers.value = coords
      }

      if (!scrollSynced.value) {
        wrapper.value.addEventListener('scroll', syncScroll)
      }
    }
  }

  function syncScroll () {
    if (timeout) {
      window.cancelAnimationFrame(timeout)
    }

    timeout = window.requestAnimationFrame(() => {
      if (rowHeader.value) {
        rowHeader.value.scrollTop = wrapper.value?.scrollTop || 0
      }
      if (columnHeader.value) {
        columnHeader.value.scrollLeft = wrapper.value?.scrollLeft || 0
      }
    })
  }

  function updateCellCache (row: number, column: number, trialId: string, cell: CellPlus) {
    if (trialData.value && compProps.trial.localId === trialId) {
      trialData.value[`${row}|${column}`] = cell
    }
  }

  function moveInDirection (direction: string) {
    const w = wrapper.value

    if (!w) {
      return
    }

    switch (direction) {
      case 'topLeft':
        w.scroll({ left: w.scrollLeft - cellWidth.value, top: w.scrollTop - cellHeight.value })
        break
      case 'top':
        w.scroll({ top: w.scrollTop - cellHeight.value })
        break
      case 'topRight':
        w.scroll({ left: w.scrollLeft + cellWidth.value, top: w.scrollTop - cellHeight.value })
        break
      case 'left':
        w.scroll({ left: w.scrollLeft - cellWidth.value })
        break
      case 'right':
        w.scroll({ left: w.scrollLeft + cellWidth.value })
        break
      case 'bottomLeft':
        w.scroll({ left: w.scrollLeft - cellWidth.value, top: w.scrollTop + cellHeight.value })
        break
      case 'bottom':
        w.scroll({ top: w.scrollTop + cellHeight.value })
        break
      case 'bottomRight':
        w.scroll({ left: w.scrollLeft + cellWidth.value, top: w.scrollTop + cellHeight.value })
        break
    }
  }

  function jumpToCorner (corner: string) {
    const w = wrapper.value

    if (!w) {
      return
    }

    switch (corner) {
      case 'topLeft':
        w.scroll({ left: 0, top: 0 })
        break
      case 'top':
        w.scroll({ left: w.scrollWidth / 2 - w.clientWidth / 2, top: 0 })
        break
      case 'topRight':
        w.scroll({ left: w.scrollWidth, top: 0 })
        break
      case 'left':
        w.scroll({ left: 0, top: w.scrollHeight / 2 - w.clientHeight / 2 })
        break
      case 'right':
        w.scroll({ left: w.scrollWidth, top: w.scrollHeight / 2 - w.clientHeight / 2 })
        break
      case 'bottomLeft':
        w.scroll({ left: 0, top: w.scrollHeight })
        break
      case 'bottom':
        w.scroll({ left: w.scrollWidth / 2 - w.clientWidth / 2, top: w.scrollHeight })
        break
      case 'bottomRight':
        w.scroll({ left: w.scrollWidth, top: w.scrollHeight })
        break
      case 'center':
        w.scroll({ left: w.scrollWidth / 2 - w.clientWidth / 2, top: w.scrollHeight / 2 - w.clientHeight / 2 })
        break
      case 'gps':
        if (userPosition.value) {
          w.scroll({ left: w.scrollWidth * userPosition.value.euclideanX / 100, top: w.scrollHeight * userPosition.value.euclideanY / 100 })
        }
        break
    }
  }

  function onPlotClicked (row: number, column: number, scrollTo: boolean) {
    if (scrollTo) {
      const element = refs.value[`${row}-${column}`]
      // @ts-ignore
      if (element && element.scrollIntoView) {
        // @ts-ignore
        element.scrollIntoView({ block: 'center' })
      }
    }
  }

  watch(() => compProps.trial, newValue => {
    if (newValue) {
      columns.value = Array.from(new Array(newValue.layout.columns).keys()).map(col => {
        return {
          marked: false,
          text: n(getColumnLabel(newValue.layout, col)),
          index: col,
        }
      })
      rows.value = Array.from(new Array(newValue.layout.rows).keys()).map(row => {
        return {
          marked: false,
          text: n(getRowLabel(newValue.layout, row)),
          index: row,
        }
      })

      if (compProps.trial && compProps.trial.layout && compProps.trial.layout.corners && isGeographyValid(compProps.trial.layout.corners)) {
        const c = compProps.trial.layout.corners
        gridProjection = projectToEuclidean([
          { x: c.topLeft?.lng || 0, y: c.topLeft?.lat || 0 },
          { x: c.topRight?.lng || 0, y: c.topRight?.lat || 0 },
          { x: c.bottomRight?.lng || 0, y: c.bottomRight?.lat || 0 },
          { x: c.bottomLeft?.lng || 0, y: c.bottomLeft?.lat || 0 },
        ])
      } else {
        gridProjection = undefined
      }

      trialData.value = JSON.parse(JSON.stringify(getTrialDataCached()))

      reset()
    }
  }, { immediate: true })

  watch(visibleTraits, () => {
    updateDimensions()
    nextTick(() => {
      if (scrollToElementOnTraitToggle) {
        scrollToElementOnTraitToggle.scrollIntoView({ block: 'center' })
      }
    })
  })

  onMounted(() => {
    window.addEventListener('resize', updateDimensions)

    emitter.on('trial-data-loaded', reset)
    emitter.on('plot-cache-changed', updateCellCache)
    emitter.on('jump-to-corner', jumpToCorner)
    emitter.on('move-to-corner', moveInDirection)
    emitter.on('plot-clicked', onPlotClicked)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateDimensions)

    if (scrollSynced.value && wrapper.value) {
      wrapper.value.removeEventListener('scroll', syncScroll)
    }

    emitter.off('trial-data-loaded', reset)
    emitter.off('plot-cache-changed', updateCellCache)
    emitter.off('jump-to-corner', jumpToCorner)
    emitter.off('move-to-corner', moveInDirection)
    emitter.off('plot-clicked', onPlotClicked)
  })
</script>

<style>
.data-grid-wrapper {
  overflow: auto;
  scrollbar-width: thin;
  position: relative;
}

.data-grid-wrapper.no-scroll {
  overflow: hidden;
}

.page-grid:hover {
  cursor: pointer;
}

.page-grid {
  height: 100vh;
  height: 100svh;
  max-height: 100vh;
  max-height: 100svh;
  display: grid;
  grid-template-columns: min-content 1fr;
  grid-template-rows: min-content 1fr;
  grid-template-areas:
    "tl colHeaders"
    "rowHeaders dataView"
}

.data-grid {
  display: grid;
}

.column-headers,
.row-headers {
  display: grid;
  overflow: hidden;
}

.row-headers > .cell {
  align-content: center;
}

.data-grid .circle {
  display: inline-block;
}
.data-grid .cell.rounded-dp .circle {
  border-radius: 100px;
}
.data-grid .circle-empty {
  background: transparent;
  border-width: 1px;
  border-style: solid;
  box-sizing: content-box;
}
.data-grid .cell svg.circle {
  vertical-align: unset;
}

.data-grid .cell.small .circle-full {
  width: 16px;
  height: 16px;
}
.data-grid .cell.medium .circle-full {
  width: 20px;
  height: 20px;
}
.data-grid .cell.large .circle-full {
  width: 24px;
  height: 24px;
}
.data-grid .cell.small .circle-empty {
  width: 14px;
  height: 14px;
}
.data-grid .cell.medium .circle-empty {
  width: 18px;
  height: 18px;
}
.data-grid .cell.large .circle-empty {
  width: 22px;
  height: 22px;
}

.gps-position {
  width: 32px;
  height: 32px;
  position: absolute;
  z-index: 1;
}

.cell {
  background: #ffffff;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
  position: relative;
}
.data-grid .cell {
  line-height: 0px;
}
.grid-icon {
  color: #8e8c84;
  pointer-events: none;
}
.marker {
  z-index: 1;
}
.cell .bookmark {
  position: absolute;
  top: 0;
  right: 5px;
}
.cell .comment {
  position: absolute;
  top: 5px;
  left: 5px;
}
.cell .check {
  position: absolute;
  bottom: 5px;
  right: 5px;
}
.cell-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5em;
}

.cell-row, .cell-column {
  background: #f2f2f2;
}
.cell-row.cell-column {
  background: #e0e0e0;
}
.cell-marked {
  background: #c6d2de !important;
}
.cell-empty:hover {
  cursor: not-allowed;
}
.header-marked {
  background: #aebfd0;
}
.cell-user-highlight {
  background: #82ccdd !important;
}
.cell-highlight {
  background: #A3CB38 !important;
}
.force-ltr {
  direction: ltr;
}

.dark-mode .cell {
  background: #000000;
}
.dark-mode .cell-row,
.dark-mode .cell-column {
  background: #0d0d0d;
}
.dark-mode .cell-row.cell-column {
  background: #1f1f1f;
}
.dark-mode .cell-marked {
  background: #415971 !important;
}
.dark-mode .header-marked {
  background: #364a5e;
}
.dark-mode .cell-user-highlight {
  background: #0a3d62 !important;
}
.dark-mode .cell-highlight {
  background: #833471 !important;
}
</style>
