<template>
  <BaseChart
    :header-icon="mdiChartBellCurveCumulative"
    :chart-id="id"
    title="pageVisualizationDataPointsPerTraitTitle"
    v-model:interactive="interactive"
    :source-file="sourceFile"
    :can-download="canDownload"
    @force-redraw="redraw"
    :filename="filename"
  >
    <template #card-text>
      <v-card-text>{{ $t('pageVisualizationDataPointsPerTraitText') }}</v-card-text>
    </template>
    <template #chart-content>
      <div :id="id" ref="completionChart" />
    </template>
  </BaseChart>
</template>

<script setup lang="ts">
  import { getTrialDataCached } from '@/plugins/datastore'
  import type { DownloadBlob } from '@/plugins/file'
  import { getId } from '@/plugins/id'
  import type { CellPlus, TrialPlus } from '@/plugins/types/client'
  import { toLocalDateString } from '@/plugins/util'
  import { mdiChartBellCurveCumulative } from '@mdi/js'
  import emitter from 'tiny-emitter/instance'
  import Plotly from 'plotly.js/lib/core'
  import scatter from 'plotly.js/lib/scatter'
  import { coreStore } from '@/stores/app'
  import { useI18n } from 'vue-i18n'

  // Only register the chart types we're actually using to reduce the final bundle size
  Plotly.register([
    scatter,
  ])

  const compProps = defineProps<{
    trial: TrialPlus
  }>()

  let trialData: { [index: string]: CellPlus } | undefined = {}

  const store = coreStore()
  const { t } = useI18n()

  const id = ref('plot-trait-completion' + getId())
  const sourceFile = ref<DownloadBlob>()
  const interactive = ref(false)
  const canDownload = ref(false)
  const completionChart = useTemplateRef('completionChart')

  const safeTrialName = computed(() => compProps.trial ? compProps.trial.name.replace(/[^a-z0-9]/gi, '-').toLowerCase() : '')
  const filename = computed(() => {
    if (safeTrialName.value) {
      return `plot-trait-completion-${safeTrialName.value}-${toLocalDateString(new Date())}`
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
    if (completionChart.value && td) {
      try {
        Plotly.purge(completionChart.value)
      } catch {
        // Do nothing here, this might fail on first run
      }

      const plotCount = Object.keys(td).length

      const traces = compProps.trial.traits.map(t => {
        const dataPointsPerDate: { [index: string]: number } = {}

        Object.keys(td).forEach(k => {
          const cell = td[k]

          const ms = cell?.measurements[t.id || '']

          if (ms) {
            ms.forEach(m => {
              const date = new Date(m.timestamp)
              date.setHours(0, 0, 0, 0)
              const time = date.getTime()

              const dps = m.values.filter(v => v !== undefined && v !== null && v !== '').length

              if (!dataPointsPerDate[time]) {
                dataPointsPerDate[time] = dps
              } else {
                dataPointsPerDate[time] += dps
              }
            })
          }
        })

        const sorted = Object.keys(dataPointsPerDate).map(t => +t).sort((a, b) => a - b)

        let counter = 0
        const y: number[] = []
        sorted.forEach(t => {
          counter += dataPointsPerDate[t] || 0
          y.push(counter * 100 / plotCount)
        })

        return {
          x: sorted.map(t => new Date(t)),
          y,
          type: 'scatter',
          mode: 'lines+markers',
          showlegend: true,
          name: t.name,
          line: {
            color: t.color,
          },
        }
      })

      const layout = {
        hovermode: 'x',
        margin: { autoexpand: true },
        dragmode: false as const,
        autosize: true,
        height: 500,
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
        },
        yaxis: {
          automargin: true,
          showgrid: false,
          zeroline: true,
          showline: true,
          rangemode: 'tozero',
          title: { text: t('widgetChartTimeseriesAxisTitleDataPointsScored'), font: { color: store.storeIsDarkMode ? 'white' : 'black' } },
          tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
          fixedrange: !interactive.value,
        },
        shapes: [] as any[],
        annotations: [] as any[],
        legend: { orientation: 'h', font: { color: store.storeIsDarkMode ? 'white' : 'black' } },
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
              color: store.storeIsDarkMode ? '#ecf0f1' : '#2c3e50',
            },
          })
        })
      }

      // @ts-ignore
      Plotly.react(completionChart.value, traces, layout, {
        responsive: true,
        modeBarButtonsToRemove: ['toImage'],
        displaylogo: false,
      }).then(() => {
        canDownload.value = true
      })
    }
  }

  onMounted(() => {
    emitter.on('trial-data-loaded', updateTrialDataCache)

    updateTrialDataCache()
  })

  onBeforeUnmount(() => {
    emitter.off('trial-data-loaded', updateTrialDataCache)
  })
</script>
