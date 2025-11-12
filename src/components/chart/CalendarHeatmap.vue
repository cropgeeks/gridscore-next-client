<template>
  <div>
    <BaseChart
      :title="`${year}`"
      :header-icon="mdiBlurLinear"
      :chart-id="id"
      v-model:interactive="interactive"
      :source-file="sourceFile"
      :can-download="canDownload"
      @force-redraw="redraw"
      :filename="filename"
    >
      <template #chart-content>
        <div ref="wrapper">
          <div :id="id" ref="heatmapChart" />
        </div>
      </template>
    </BaseChart>
  </div>
</template>

<script setup lang="ts">
  import { getPrimaryColor } from '@/plugins/color'
import type { DownloadBlob } from '@/plugins/file'
  import { getId } from '@/plugins/id'
  import type { TrialPlus } from '@/plugins/types/client'
  import { toLocalDateString } from '@/plugins/util'
  import { coreStore } from '@/stores/app'
  import { mdiBlurLinear } from '@mdi/js'

  import Plotly, { type ColorScale } from 'plotly.js/lib/core'
  import heatmap from 'plotly.js/lib/heatmap'
  import { useI18n } from 'vue-i18n'

  // Only register the chart types we're actually using to reduce the final bundle size
  Plotly.register([
    heatmap,
  ])

  const compProps = defineProps<{
    year: number
    trial: TrialPlus
    chartData: { [index: string]: number } | undefined
  }>()

  const store = coreStore()
  const { t } = useI18n()

  const id = ref(`time-heatmap-${getId()}`)
  const sourceFile = ref<DownloadBlob>()
  const interactive = ref(false)
  const canDownload = ref(false)
  const width = ref(1000)
  const heatmapChart = useTemplateRef('heatmapChart')
  const wrapper = useTemplateRef('wrapper')

  const dateFormat = computed(() => new Intl.DateTimeFormat(store.storeLocale || 'en', { month: 'short' }))
  const months = computed(() => {
    if (dateFormat.value) {
      return [...new Array(12).keys()].map(m => dateFormat.value.format(new Date(Date.UTC(2000, m, 1, 0, 0, 0)))).reverse()
    } else {
      return []
    }
  })

  const isHorizontal = computed(() => width.value < 720)
  const safeTrialName = computed(() => compProps.trial ? compProps.trial.name.replace(/[^a-z0-9]/gi, '-').toLowerCase() : '')

  const filename = computed(() => {
    if (safeTrialName.value) {
      return `year-heatmap-${safeTrialName.value}-${compProps.year}-${toLocalDateString(new Date())}`
    } else {
      return ''
    }
  })

  function redraw () {
    canDownload.value = false
    const cData = compProps.chartData
    if (heatmapChart.value && cData) {
      try {
        Plotly.purge(heatmapChart.value)
      } catch {
        // Do nothing here
      }

      let z = [
        new Array(31).fill(0),
        new Array(30).fill(0),
        new Array(31).fill(0),
        new Array(30).fill(0),
        new Array(31).fill(0),
        new Array(31).fill(0),
        new Array(30).fill(0),
        new Array(31).fill(0),
        new Array(30).fill(0),
        new Array(31).fill(0),
        new Array(29).fill(0),
        new Array(31).fill(0),
      ]

      let max = 0

      Object.keys(cData).forEach(key => {
        const value = cData[key] || 0
        const d = new Date(key)
        // @ts-ignore
        z[11 - d.getMonth()][d.getDate() - 1] = value

        max = Math.max(max, value)
      })

      const x = Array.from(new Array(31).keys()).map(i => i + 1)
      const y = months.value.concat()

      if (isHorizontal.value) {
        // @ts-ignore
        z = z[0].map((col, i) => z.reverse().map(row => row[i]))
      }

      const data = [{
        z,
        x: isHorizontal.value ? y.reverse() : x,
        y: isHorizontal.value ? x : y,
        name: '',
        type: 'heatmap' as const,
        hoverongaps: false,
        xgap: 1,
        ygap: 1,
        colorscale: [
          [0, store.storeIsDarkMode ? '#2f2f2f' : '#e4e4e4'],
          [1, getPrimaryColor()],
        ] as ColorScale,
        colorbar: {
          title: {
            side: 'right' as const,
            font: { color: store.storeIsDarkMode ? 'white' : 'black' },
          },
          tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
          orientation: (isHorizontal.value ? 'h' : 'v') as 'h' | 'v',
        },
        hovertemplate: '%{x}. %{y}: %{z}',
      }]

      let xAxis = {
        showgrid: false,
        tickmode: 'array' as const,
        // nticks: 31,
        tickvals: Array.from(new Array(31).keys()).map(i => i + 1),
        title: { text: t('widgetChartHeatmapAxisTitleDay'), font: { color: store.storeIsDarkMode ? 'white' : 'black' } },
        tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
        fixedrange: !interactive.value,
      }
      let yAxis = {
        showgrid: false,
        title: { text: t('widgetChartHeatmapAxisTitleMonth'), font: { color: store.storeIsDarkMode ? 'white' : 'black' } },
        tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
        fixedrange: !interactive.value,
      }

      // Reformat the data for download
      if (data && data[0]) {
        const dataCopy: any[][] = JSON.parse(JSON.stringify(data[0].z)).reverse()
        dataCopy.unshift(xAxis.tickvals.concat())
        dataCopy[0]?.unshift('')
        months.value.concat().concat().reverse().forEach((v: string, i: number) => {
          dataCopy[i + 1]?.unshift(v)
        })
        sourceFile.value = {
          blob: new Blob([dataCopy.map(row => row.join('\t')).join('\n')], { type: 'text/plain' }),
          filename: filename.value,
          extension: 'tsv',
        }
      }

      if (isHorizontal.value) {
        // @ts-ignore
        [xAxis, yAxis] = [yAxis, xAxis]
      }

      const layout = {
        height: isHorizontal.value ? 800 : 500,
        margin: {
          t: 0,
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: xAxis,
        yaxis: yAxis,
      }

      const config = {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['toImage' as const],
      }

      Plotly.newPlot(heatmapChart.value, data, layout, config)
        .then(() => {
          canDownload.value = true
        })
    }
  }

  function onResize () {
    width.value = wrapper.value?.clientWidth || 1000

    redraw()
  }

  onMounted(() => {
    onResize()

    window.addEventListener('resize', onResize)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize)
  })
</script>
