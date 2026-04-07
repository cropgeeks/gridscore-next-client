<template>
  <BaseChart
    :header-icon="mdiChartTimeline"
    :chart-id="id"
    v-model:interactive="interactive"
    :source-file="sourceFile"
    :can-download="canDownload"
    @force-redraw="redraw"
    :filename="filename"
  >
    <template #toolbar-title>
      <TraitSection
        :trait="trait"
        short-title
        show-subtitle
      />
    </template>

    <template #chart-content>
      <div :id="id" ref="timelineChart" />
    </template>
  </BaseChart>
</template>

<script setup lang="ts">
  import { getTrialDataCached } from '@/plugins/datastore'
  import type { DownloadBlob } from '@/plugins/file'
  import { getId } from '@/plugins/id'
  import type { CellPlus, TraitPlus, TrialPlus } from '@/plugins/types/client'
  import { toLocalDateString } from '@/plugins/util'
  import { mdiChartTimeline } from '@mdi/js'
  import emitter from 'tiny-emitter/instance'
  import Plotly from 'plotly.js/lib/core'
  import scatter from 'plotly.js/lib/scatter'
  import { coreStore } from '@/stores/app'
  import { useI18n } from 'vue-i18n'
  import type { UserSelection } from '@/components/util/HighlightSelect.vue'
  import { CellCategory, TraitDataType } from '@/plugins/types/gridscore'

  // Only register the chart types we're actually using to reduce the final bundle size
  Plotly.register([
    scatter,
  ])

  const compProps = defineProps<{
    trial: TrialPlus
    trait: TraitPlus
    userSelection?: UserSelection
  }>()

  let trialData: { [index: string]: CellPlus } | undefined = {}

  const store = coreStore()
  const { t } = useI18n()

  const id = ref('trait-timeline' + getId())
  const sourceFile = ref<DownloadBlob>()
  const interactive = ref(false)
  const canDownload = ref(false)
  const timelineChart = useTemplateRef('timelineChart')

  const safeTrialName = computed(() => compProps.trial ? compProps.trial.name.replace(/[^a-z0-9]/gi, '-').toLowerCase() : '')
  const filename = computed(() => {
    if (safeTrialName.value && compProps.trait) {
      const traitName = compProps.trait.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      return `trait-timeline-${safeTrialName.value}-${traitName}-${toLocalDateString(new Date())}`
    } else {
      return ''
    }
  })

  function updateTrialDataCache () {
    trialData = getTrialDataCached()

    nextTick(() => redraw())
  }

  function redraw () {
    canDownload.value = false

    const td = trialData
    if (timelineChart.value && compProps.trait && td) {
      try {
        Plotly.purge(timelineChart.value)
      } catch {
        // Do nothing here, this might fail on first run
      }

      const allDates = new Set<number>()
      Object.keys(td).forEach(k => {
        const c = td[k]
        const traitMeasurements = c?.measurements[compProps.trait.id || ''] || []
        traitMeasurements.forEach(m => {
          const d = new Date(m.timestamp)
          d.setHours(0, 0, 0, 0)
          allDates.add(d.getTime())
        })
      })

      const sortedDates = [...allDates].sort((a, b) => a - b)
      const isCategorical = compProps.trait.dataType === TraitDataType.categorical

      let selectedItems: string[] = []
      const datapoints: { [index: string]: (number | null)[] } = {}

      if (compProps.userSelection && compProps.userSelection.selectedItems && compProps.userSelection.selectedItems.length > 0) {
        selectedItems = compProps.userSelection.selectedItems
        selectedItems.forEach(i => {
          datapoints[i] = sortedDates.map(() => null)
        })
      }

      // Keep track of statistics
      const mins: number[] = sortedDates.map(() => Number.MAX_SAFE_INTEGER)
      const maxs: number[] = mins.map(d => -d)
      const totals: number[] = mins.map(() => 0)
      const counts: number[] = mins.map(() => 0)
      const traces = []

      // For each field cell
      Object.keys(td).forEach(k => {
        const c = td[k]

        if (!c) {
          return
        }

        let selectionField: string
        let isSelected = false

        if (compProps.userSelection && compProps.userSelection.type) {
          switch (compProps.userSelection.type) {
            case 'germplasm':
              selectionField = c.germplasm
              break
            case 'cell':
              selectionField = `${c.displayRow}|${c.displayColumn} - ${c.displayName || c.germplasm}`
              break
            case 'reps':
              selectionField = c.rep || ''
              break
            case 'treatments':
              selectionField = c.treatment || ''
              break
            case 'controls':
              selectionField = (c.categories || []).includes(CellCategory.CONTROL) ? CellCategory.CONTROL : ''
              break
          }

          isSelected = compProps.userSelection.selectedItems.includes(selectionField)
        }

        const traitMeasurements = c.measurements[compProps.trait.id || ''] || []

        traitMeasurements.forEach(m => {
          const date = new Date(m.timestamp)
          date.setHours(0, 0, 0, 0)
          const time = date.getTime()
          const timeIndex = sortedDates.indexOf(time)

          const existingValues = m.values.filter(v => v !== undefined && v !== null)
          const avg = existingValues.length > 0 ? existingValues.reduce((acc: number, val) => acc + (+val), 0) / existingValues.length : 0

          // Update statistics
          if (avg !== undefined) {
            mins[timeIndex] = mins[timeIndex] !== undefined ? Math.min(mins[timeIndex], +avg) : +avg
            maxs[timeIndex] = maxs[timeIndex] !== undefined ? Math.max(maxs[timeIndex], +avg) : +avg
            // @ts-ignore
            totals[timeIndex] += (+avg)
            // @ts-ignore
            counts[timeIndex]++

            if (isSelected && selectionField) {
              // @ts-ignore
              datapoints[selectionField][timeIndex] = +avg
            }
          }
        })
      })

      const background = {
        x: [] as Date[],
        y: [] as number[],
        fill: 'tozerox',
        fillcolor: 'rgba(200, 200, 200, .3)',
        line: { color: 'transparent' },
        name: t('widgetChartTraceValueRange'),
        hoverinfo: 'skip',
        type: 'scatter',
      }
      const avg = {
        x: sortedDates.map(d => new Date(d)),
        y: totals.map((t, i) => t / (counts[i] || 1)),
        type: 'scatter',
        mode: 'lines',
        name: t('widgetChartTraceAverage'),
        line: { color: '#7f8c8d' },
      }

      for (let i = 0; i < sortedDates.length; i++) {
        background.x.push(new Date(sortedDates[i] || 0))
        background.y.push(maxs[i] || 0)
      }
      for (let i = sortedDates.length - 1; i >= 0; i--) {
        background.x.push(new Date(sortedDates[i] || 0))
        background.y.push(mins[i] || 0)
      }

      traces.unshift(avg)
      traces.unshift(background)

      selectedItems.forEach(k => {
        const dps = datapoints[k]

        if (dps) {
          traces.unshift({
            x: sortedDates.map(d => new Date(d)),
            y: dps,
            name: `&nbsp;${k}`,
            type: 'scatter',
            mode: 'lines+markers',
          })
        }
      })

      const layout = {
        hovermode: 'x',
        margin: { autoexpand: true },
        dragmode: false as const,
        autosize: true,
        height: 500 + traces.length * 5,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: {
          automargin: true,
          showgrid: false,
          zeroline: true,
          showline: true,
          title: { text: t('widgetChartTimeseriesAxisTitleTime'), font: { color: store.storeIsDarkMode ? 'white' : 'black' } },
          tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
          fixedrange: !interactive.value,
          range: [sortedDates[0], sortedDates[sortedDates.length - 1]],
        },
        yaxis: {
          automargin: true,
          showgrid: false,
          zeroline: true,
          showline: true,
          rangemode: 'tozero',
          title: { text: compProps.trait.name, font: { color: store.storeIsDarkMode ? 'white' : 'black' } },
          tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
          fixedrange: !interactive.value,
          tickmode: isCategorical ? 'array' : undefined,
          tickvals: isCategorical ? compProps.trait.restrictions?.categories?.map((c, i) => i) : undefined,
          ticktext: isCategorical ? compProps.trait.restrictions?.categories : undefined,
        },
        shapes: [] as any[],
        annotations: [] as any[],
        legend: { orientation: 'h', x: 1, y: 1.2, xanchor: 'right', font: { color: store.storeIsDarkMode ? 'white' : 'black' } },
      }

      if (compProps.trial.events && compProps.trial.events.length > 0) {
        compProps.trial.events.forEach((e, i) => {
          const ay = 20 + (i / Math.max(1, (compProps.trial.events || []).length - 1)) * 20
          layout.annotations.push({
            yref: 'paper',
            x: new Date(e.timestamp || 0),
            y: 1,
            text: e.content,
            font: {
              color: store.storeIsDarkMode ? '#ecf0f1' : '#2c3e50',
            },
            arrowcolor: store.storeIsDarkMode ? '#ecf0f1' : '#2c3e50',
            showarrow: true,
            arrowhead: 7,
            ax: 0,
            ay: -ay,
          })
          layout.shapes.push({
            type: 'line',
            yref: 'paper',
            x0: new Date(e.timestamp || 0),
            y0: 0,
            x1: new Date(e.timestamp || 0),
            y1: 1,
            line: {
              width: 1,
              dash: 'dot',
            },
          })
        })
      }

      // Reformat the data for download
      const actualData = traces.slice(0, -2)
      // @ts-ignore
      let sourceData = `${actualData.map(t => `\t${t.name.replace('&nbsp;', '')}`).join('')}\tMin\tAvg\tMax`

      sortedDates.forEach((d, i) => {
        // @ts-ignore
        sourceData += `\n${new Date(d).toISOString().split('T')[0]}${actualData.map(t => `\t${t.y[i] || ''}`).join('')}\t${mins[i]}\t${totals[i] / counts[i]}\t${maxs[i]}`
      })

      sourceFile.value = {
        blob: new Blob([sourceData], { type: 'text/plain' }),
        filename: filename.value,
        extension: 'tsv',
      }

      // @ts-ignore
      Plotly.react(timelineChart.value, traces, layout, {
        responsive: true,
        modeBarButtonsToRemove: ['toImage'],
        displaylogo: false,
      }).then(() => {
        canDownload.value = true
      })
    }
  }

  watch(() => compProps.userSelection, async () => redraw(), { deep: true })

  onMounted(() => {
    emitter.on('trial-data-loaded', updateTrialDataCache)

    updateTrialDataCache()
  })

  onBeforeUnmount(() => {
    emitter.off('trial-data-loaded', updateTrialDataCache)
  })
</script>
