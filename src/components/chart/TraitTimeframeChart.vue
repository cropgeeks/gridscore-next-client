<template>
  <BaseChart
    title="modalTitleTraitTimeframe"
    :header-icon="mdiCalendarExpandHorizontal"
    :chart-id="id"
    v-model:interactive="interactive"
    :can-download="canDownload"
    @force-redraw="redraw"
    :filename="filename"
  >
    <template #chart-content>
      <div :id="id" ref="timeframeChart" />
    </template>
  </BaseChart>
</template>

<script setup lang="ts">
  import { getId } from '@/plugins/id'
  import { coreStore } from '@/stores/app'
  import { mdiCalendarExpandHorizontal } from '@mdi/js'
  import { useI18n } from 'vue-i18n'

  import Plotly from 'plotly.js/lib/core'
  import scatter from 'plotly.js/lib/scatter'
  import type { TrialPlus } from '@/plugins/types/client'
  import { toLocalDateString } from '@/plugins/util'

  // Only register the chart types we're actually using to reduce the final bundle size
  Plotly.register([
    scatter,
  ])

  const compProps = defineProps<{
    trial: TrialPlus
  }>()

  const store = coreStore()
  const { t } = useI18n()

  const id = ref('trait-timeline' + getId())
  const interactive = ref(false)
  const canDownload = ref(false)
  const timeframeChart = useTemplateRef('timeframeChart')

  const safeTrialName = computed(() => compProps.trial ? compProps.trial.name.replace(/[^a-z0-9]/gi, '-').toLowerCase() : '')
  const filename = computed(() => {
    if (safeTrialName.value) {
      return `trial-trait-timeframes-${safeTrialName.value}-${toLocalDateString(new Date())}`
    } else {
      return ''
    }
  })

  function redraw () {
    canDownload.value = false

    if (timeframeChart.value) {
      try {
        Plotly.purge(timeframeChart.value)
      } catch {
        // Do nothing here, this might fail on first run
      }

      const timeframeTraits = compProps.trial.traits.filter(t => t.timeframe)
      const startValues = timeframeTraits.map(t => t.timeframe?.start)
      const endValues = timeframeTraits.map(t => t.timeframe?.end)

      const start = {
        x: startValues,
        y: timeframeTraits.map((t, i) => i),
        mode: 'markers',
        type: 'scatter',
        name: '',
        marker: {
          color: '#079992',
          symbol: 'circle',
          size: 16,
        },
      }

      const end = {
        x: endValues,
        y: timeframeTraits.map((t, i) => i),
        mode: 'markers',
        type: 'scatter',
        name: '',
        marker: {
          color: '#eb2f06',
          symbol: 'circle',
          size: 16,
        },
      }

      const data = [start, end]

      console.log(data)

      const layout = {
        hovermode: 'y unified',
        showlegend: false,
        margin: { autoexpand: true },
        autosize: true,
        height: (25 * compProps.trial.traits.length) + 200,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        hoverlabel: {
          bgcolor: store.storeIsDarkMode ? '#ecf0f1' : '#2c3e50',
          font: {
            color: store.storeIsDarkMode ? '#2c3e50' : '#ecf0f1',
          },
        },
        xaxis: {
          title: { text: t('widgetChartTraitTimeframeAxisTitleTime'), font: { color: store.storeIsDarkMode ? 'white' : 'black' } },
          tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
          fixedrange: !interactive.value,
        },
        yaxis: {
          title: { text: t('widgetChartTraitTimeframeAxisTitleTrait'), font: { color: store.storeIsDarkMode ? 'white' : 'black' } },
          tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
          zeroline: false,
          tickmode: 'array',
          ticktext: timeframeTraits.map(t => t.name),
          tickvals: timeframeTraits.map((t, i) => i),
          fixedrange: !interactive.value,
        },
        shapes: [{
          type: 'line' as const,
          yref: 'paper' as const,
          x0: toLocalDateString(new Date()),
          y0: 0,
          x1: toLocalDateString(new Date()),
          y1: 1,
          line: {
            color: store.storeIsDarkMode ? '#ecf0f1' : '#2c3e50',
            width: 1.5,
            dash: 'dot' as const,
          },
        }, ...timeframeTraits.map((t, i) => {
          if (startValues[i] && endValues[i]) {
            return {
              layer: 'between',
              type: 'line',
              x0: startValues[i],
              x1: endValues[i],
              y0: i,
              y1: i,
              line: {
                color: t.color,
                width: 6,
              },
            }
          } else {
            return undefined
          }
        })],
        annotations: [{
          type: 'line' as const,
          yref: 'paper' as const,
          x: toLocalDateString(new Date()),
          y: 1.2,
          showarrow: false,
          text: t('widgetChartTraitTimeframeToday'),
          font: {
            color: store.storeIsDarkMode ? '#ecf0f1' : '#2c3e50',
          },
          arrowcolor: store.storeIsDarkMode ? '#ecf0f1' : '#2c3e50',
        }],
      }

      // @ts-ignore
      Plotly.react(timeframeChart.value, data, layout, {
        responsive: true,
        modeBarButtonsToRemove: ['toImage'],
        displaylogo: false,
      }).then(() => {
        canDownload.value = true
      })
    }
  }

  onMounted(() => redraw())
</script>
