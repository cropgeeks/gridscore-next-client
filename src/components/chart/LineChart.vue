<template>
  <div>
    <BaseChart
      :title="$t(title)"
      :header-icon="mdiChartLine"
      :chart-id="id"
      v-model:interactive="interactive"
      :source-file="sourceFile"
      :can-download="canDownload"
      @force-redraw="redraw"
      :filename="filename"
    >
      <template #chart-content>
        <div :id="id" ref="lineChart" />
      </template>
    </BaseChart>
  </div>
</template>

<script setup lang="ts">
  import type { DownloadBlob } from '@/plugins/file'
  import type { TrialPlus } from '@/plugins/types/client'
  import { toLocalDateString } from '@/plugins/util'
  import { mdiChartLine } from '@mdi/js'

  import Plotly from 'plotly.js/lib/core'
  import scatter from 'plotly.js/lib/scatter'
  import { useI18n } from 'vue-i18n'
  import { coreStore } from '@/stores/app'
  import BaseChart from '@/components/chart/BaseChart.vue'

  // Only register the chart types we're actually using to reduce the final bundle size
  Plotly.register([
    scatter,
  ])

  export type LineChartData = { [index: string]: {
    name: string
    x: string[]
    y: number[]
    type?: 'scatter'
    mode?: 'lines+markers'
  } }

  const compProps = defineProps<{
    id: string
    title: string
    trial: TrialPlus
    chartData: LineChartData
    xTitle: string
    yTitle: string
  }>()

  const { t } = useI18n()
  const store = coreStore()

  const sourceFile = ref<DownloadBlob>()
  const interactive = ref(false)
  const canDownload = ref(false)
  const lineChart = useTemplateRef('lineChart')

  const safeTrialName = computed(() => compProps.trial ? compProps.trial.name.replace(/[^a-z0-9]/gi, '-').toLowerCase() : '')

  const filename = computed(() => {
    if (safeTrialName.value) {
      return `person-line-chart-${safeTrialName.value}-${toLocalDateString(new Date())}`
    } else {
      return ''
    }
  })

  function redraw () {
    canDownload.value = false
    const cData = compProps.chartData
    if (lineChart.value && cData) {
      try {
        Plotly.purge(lineChart.value)
      } catch {
        // Do nothing here
      }

      const data = Object.values(cData)
      data.forEach(d => {
        d.type = 'scatter'
        d.mode = 'lines+markers'
      })

      const layout = {
        height: 400,
        margin: {
          t: 0,
        },
        hovermode: 'x' as const,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: {
          showgrid: false,
          title: { text: t(compProps.xTitle), font: { color: store.storeIsDarkMode ? 'white' : 'black' } },
          tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
          fixedrange: !interactive.value,
        },
        yaxis: {
          showgrid: false,
          title: { text: t(compProps.yTitle), font: { color: store.storeIsDarkMode ? 'white' : 'black' } },
          tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
          fixedrange: !interactive.value,
        },
        legend: {
          bgcolor: 'rgba(0,0,0,0)',
          orientation: 'h' as const,
          font: { color: store.storeIsDarkMode ? 'white' : 'black' },
        },
      }

      const config = {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['toImage' as const, 'lasso2d' as const, 'select2d' as const],
      }

      sourceFile.value = {
        blob: new Blob([`x\t${data[0]?.x.join('\t')}\ny\t${data[0]?.y.join('\t')}`], { type: 'text/plain' }),
        filename: filename.value,
        extension: 'tsv',
      }

      Plotly.newPlot(lineChart.value, data, layout, config)
        .then(() => {
          canDownload.value = true
        })
    }
  }

  onMounted(() => {
    redraw()
  })
</script>
