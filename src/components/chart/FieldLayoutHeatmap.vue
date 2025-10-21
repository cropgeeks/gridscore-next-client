<template>
  <div>
    <BaseChart
      title="pageVisualizationFieldHeatmapTitle"
      header-icon="mdi-land-fields"
      :chart-id="id"
      v-model:interactive="interactive"
      :source-file="sourceFile"
      :can-download="canDownload"
      @force-redraw="redraw"
      :filename="filename"
    >
      <template #card-text>
        <v-card-text>
          <p>{{ $t('pageVisualizationFieldHeatmapText') }}</p>

          <div class="d-flex flex-wrap">
            <v-autocomplete
              v-model="selectedTrait"
              :items="trial.traits"
              class="flex-grow-0"
              return-object
              autocomplete="off"
              item-value="id"
              item-title="name"
              :label="$t('formLabelHeatmapTrait')"
              :hint="$t('formDescriptionHeatmapTrait')"
              persistent-hint
            />

            <v-slider
              v-model="currentTimepoint"
              :min="0"
              :max="timepoints.length - 1"
              class="flex-grow-0"
              :label="$t('formLabelHeatmapTimeline')"
              :messages="['f']"
              :step="1"
              v-if="timepoints && timepoints.length > 0"
            >
              <template #message>
                {{ $t('formDescriptionCurrentTimepoint', { date: new Date(timepoints[currentTimepoint] || '').toLocaleDateString() }) }}
              </template>
            </v-slider>
          </div>

          <div class="border border-error text-center my-3 p-2" v-if="message">{{ $t(message) }}</div>
        </v-card-text>
      </template>

      <template #chart-content>
        <div :id="id" ref="heatmapChart" />
      </template>
    </BaseChart>

    <v-bottom-sheet
      v-model="bottomSheetVisible"
      inset
      scrollable
      max-height="75vh"
      v-if="selectedCell && trial"
    >
      <v-card :title="selectedCell.displayName || selectedCell.germplasm">
        <PlotDataInformation :trial="trial" :trait="selectedTrait" :cell="selectedCell" />
      </v-card>
    </v-bottom-sheet>
  </div>
</template>

<script setup lang="ts">
  import { getId } from '@/plugins/id'
  import type { CellPlus, TraitPlus, TrialPlus } from '@/plugins/types/client'
  import { getColumnLabel, getRowLabel, toLocalDateString } from '@/plugins/util'

  import emitter from 'tiny-emitter/instance'

  import Plotly from 'plotly.js/lib/core'
  import heatmap from 'plotly.js/lib/heatmap'
  import { getTrialDataCached } from '@/plugins/datastore'
  import { coreStore } from '@/stores/app'
  import { CellCategory, TraitDataType, type Measurement } from '@/plugins/types/gridscore'
  import { categoricalColors, invertHex, toCssNamedColors } from '@/plugins/color'
  import { useI18n } from 'vue-i18n'
  import type { DownloadBlob } from '@/plugins/file'

  // Only register the chart types we're actually using to reduce the final bundle size
  Plotly.register([
    heatmap,
  ])

  const compProps = defineProps<{
    trial: TrialPlus
  }>()

  const store = coreStore()
  const { n, t } = useI18n()

  const id = ref('field-layout-heatmap' + getId())
  const sourceFile = ref<DownloadBlob>()
  const selectedTrait = ref<TraitPlus>()
  const selectedCell = ref<CellPlus>()
  const timepoints = ref<string[]>([])
  const currentTimepoint = ref(0)
  const message = ref<string>()
  const interactive = ref(false)
  const canDownload = ref(false)
  const bottomSheetVisible = ref(false)

  const heatmapChart = useTemplateRef('heatmapChart')

  let trialData: { [index: string]: CellPlus } | undefined = {}

  const safeTrialName = computed(() => compProps.trial ? compProps.trial.name.replace(/[^a-z0-9]/gi, '-').toLowerCase() : '')

  const filename = computed(() => {
    if (safeTrialName.value && selectedTrait.value) {
      const traitName = selectedTrait.value.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      return `field-heatmap-${safeTrialName.value}-${traitName}-${toLocalDateString(new Date())}`
    } else {
      return ''
    }
  })

  function redraw () {
    canDownload.value = false
    const trait = selectedTrait.value

    if (heatmapChart.value && trait && trialData) {
      try {
        Plotly.purge(heatmapChart.value)
      } catch {
        // Do nothing here, this might fail on first run
      }

      message.value = undefined

      let minDate = new Date('9999-12-31')
      let maxDate = new Date('1900-01-01')
      let minValue = Number.MAX_SAFE_INTEGER
      let maxValue = -Number.MAX_SAFE_INTEGER

      const restrictions = trait.restrictions

      const z: any[][] = []
      const text: (string | null)[][] = []
      const customdata: (string | null)[][] = []
      const shapes = []
      let dataPointCount = 0
      for (let row = compProps.trial.layout.rows - 1; row >= 0; row--) {
        const rowData: any[] = []
        const rowText: (string | null)[] = []
        const rowCustomdata: (string | null)[] = []
        for (let column = 0; column < compProps.trial.layout.columns; column++) {
          const cell = trialData[`${row}|${column}`]

          if (!cell) {
            rowData.push(NaN)
            rowText.push('')
            rowCustomdata.push(null)
            continue
          }

          if (store.storeHighlightControls && cell.categories && cell.categories.includes(CellCategory.CONTROL)) {
            shapes.push({
              type: 'rect' as const,
              // x-reference is assigned to the x-values
              xref: 'x' as const,
              // y-reference is assigned to the plot paper [0,1]
              yref: 'y' as const,
              x0: (cell.column || 0) + 0.5,
              y0: compProps.trial.layout.rows - 1 - (cell.row || 0) + 0.5,
              x1: (cell.column || 0) + 1.5,
              y1: compProps.trial.layout.rows - 1 - (cell.row || 0) + 1.5,
              line: {
                width: 2,
                color: invertHex(trait.color || '#00acef'),
              },
            })
          }

          rowText.push(cell.displayName || '')

          // Get all sorted measurements for this trait and plot
          const traitMeasurements = cell.measurements[trait.id || ''] || []

          const measurements = traitMeasurements.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

          if (measurements && measurements.length > 0) {
            let finalValue = undefined as Measurement | undefined
            measurements.forEach(m => {
              const date = new Date(m.timestamp)
              date.setHours(0, 0, 0, 0)
              if (date < minDate) {
                minDate = date
              }
              if (date > maxDate) {
                maxDate = date
              }

              if (timepoints.value && timepoints.value.length > 0) {
                if (date <= new Date(timepoints.value[currentTimepoint.value || 0] || '')) {
                  finalValue = m
                }
              } else {
                finalValue = m
              }

              if (trait.dataType === TraitDataType.int || trait.dataType === TraitDataType.float || trait.dataType === TraitDataType.range) {
                m.values.forEach(v => {
                  if (v !== undefined && v !== null) {
                    minValue = Math.min(minValue, +v)
                    maxValue = Math.max(maxValue, +v)
                  }
                })
              }
            })

            if (finalValue !== undefined) {
              dataPointCount++
              if (trait.dataType === TraitDataType.date || trait.dataType === TraitDataType.text || trait.dataType === TraitDataType.gps || trait.dataType === TraitDataType.image || trait.dataType === TraitDataType.video) {
                rowData.push(new Date(finalValue.timestamp))
                rowCustomdata.push(null)
              } else if (trait.dataType === TraitDataType.categorical) {
                rowData.push(finalValue.values[finalValue.values.length - 1])
                // @ts-ignore
                rowCustomdata.push(restrictions.categories[finalValue.values[finalValue.values.length - 1]])
              } else {
                // Take the average
                const validValues = finalValue.values.filter(v => v !== undefined && v !== null)
                const value = validValues.length > 0 ? validValues.map(v => +v).reduce((acc, val) => acc + val) / validValues.length : null

                // if (value) {
                //   minValue = Math.min(minValue, value)
                //   maxValue = Math.max(maxValue, value)
                // }
                rowData.push(value)
                rowCustomdata.push(null)
              }
            } else {
              rowData.push(NaN)
              rowCustomdata.push(null)
            }
          } else {
            rowData.push(NaN)
            rowCustomdata.push(null)
          }
        }

        z.push(rowData)
        text.push(rowText)
        customdata.push(rowCustomdata)
      }

      if (dataPointCount < 1) {
        message.value = 'widgetChartNoData'
        return
      }

      // Adjust date-based data to be "days since first recording" using the min date
      if (trait.dataType === TraitDataType.date || trait.dataType === TraitDataType.text || trait.dataType === TraitDataType.gps || trait.dataType === TraitDataType.image || trait.dataType === TraitDataType.video) {
        for (let row = compProps.trial.layout.rows - 1; row >= 0; row--) {
          for (let column = 0; column < compProps.trial.layout.columns; column++) {
            // @ts-ignore
            z[row][column] = (z[row][column] - minDate.getTime()) / (1000 * 60 * 60 * 24)
          }
        }
      }

      const catColors = ((trait.dataType === TraitDataType.categorical && restrictions) ? restrictions.categories : []) || []
      const colorMap = toCssNamedColors(catColors)
      const allValidNamedColors = Object.keys(colorMap).length === catColors.length

      const traces: any[] = [{
        // X values are the column indices
        x: Array.from({ length: compProps.trial.layout.columns }, (v, k) => n(k + 1)),
        // Y Values are the row indices
        y: Array.from({ length: compProps.trial.layout.rows }, (v, k) => n(k + 1)),
        z,
        text,
        customdata,
        type: 'heatmap',
        colorscale: (trait.dataType === TraitDataType.categorical && restrictions && restrictions.categories)
          ? restrictions.categories.flatMap((cat, i) => {
            const l = restrictions.categories?.length || 0
            let c

            if (allValidNamedColors) {
              if (cat === 'white') {
                c = '#dddddd'
              } else if (cat === 'black') {
                c = '#222222'
              } else {
                c = colorMap[cat]
              }
            } else {
              c = categoricalColors.D3schemeCategory10[i % categoricalColors.D3schemeCategory10.length]
            }

            return [[i / l, c], [(i + 1) / l, c]]
          })
          : [[0, store.storeIsDarkMode ? '#444444' : '#dddddd'], [1, trait.color]],
        hoverongaps: false,
        hovertemplate: trait.dataType === TraitDataType.categorical
          ? `${t('tooltipChartHeatmapRow')}: %{y}<br>${t('tooltipChartHeatmapColumn')}: %{x}<br>${t('tooltipChartHeatmapValue')}: %{customdata}<extra>%{text}</extra>`
          : `${t('tooltipChartHeatmapRow')}: %{y}<br>${t('tooltipChartHeatmapColumn')}: %{x}<br>${t('tooltipChartHeatmapValue')}: %{z}<extra>%{text}</extra>`,
      }]

      if (traces.length > 0 && traces[0]) {
        switch (trait.dataType) {
          case TraitDataType.int:
          case TraitDataType.float:
          case TraitDataType.range:
            traces[0].zauto = false
            traces[0].zmin = minValue
            traces[0].zmax = maxValue
            traces[0].colorbar = {
              title: {
                side: 'right',
                font: { color: store.storeIsDarkMode ? 'white' : 'black' },
              },
              tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
              orientation: window.innerWidth < 768 ? 'h' : 'v',
            }
            break

          case TraitDataType.date:
            traces[0].colorbar = {
              title: {
                text: t('widgetChartLegendDaysSinceFirstRecording'),
                side: 'right',
                font: { color: store.storeIsDarkMode ? 'white' : 'black' },
              },
              tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
              orientation: window.innerWidth < 768 ? 'h' : 'v',
            }
            break
          case TraitDataType.categorical:
            if (restrictions && restrictions.categories) {
              traces[0].zauto = false
              traces[0].zmin = -0.5
              traces[0].zmax = restrictions.categories.length - 0.5
              traces[0].colorbar = {
                tickmode: 'array',
                tickvals: restrictions.categories.map((c, i) => i),
                ticktext: restrictions.categories,
                title: {
                  side: 'right',
                  font: { color: store.storeIsDarkMode ? 'white' : 'black' },
                },
                tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
                autotick: false,
                tick0: 0,
                dtick: 1,
                nticks: restrictions.categories.length,
              }
            }
            break
        }
      }

      // Get the axis ticks based on inversion state
      const xTicks = Array.from(new Array(compProps.trial.layout.columns).keys()).map(i => `${getColumnLabel(compProps.trial.layout, i)}`)
      const yTicks = Array.from(new Array(compProps.trial.layout.rows).keys()).map(i => `${getRowLabel(compProps.trial.layout, i)}`).reverse()

      const layout = {
        margin: { autoexpand: true },
        autosize: true,
        height: (25 * compProps.trial.layout.rows) + 200,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: {
          showgrid: false,
          zeroline: false,
          tickmode: 'array' as const,
          tickvals: Array.from(new Array(compProps.trial.layout.columns).keys()).map(i => i + 1),
          ticktext: xTicks,
          title: { text: t('widgetChartHeatmapAxisTitleCol'), font: { color: store.storeIsDarkMode ? 'white' : 'black' } },
          tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
          fixedrange: !interactive.value,
        },
        yaxis: {
          automargin: true,
          showgrid: false,
          zeroline: false,
          tickmode: 'array' as const,
          tickvals: Array.from(new Array(compProps.trial.layout.rows).keys()).map(i => i + 1),
          ticktext: yTicks,
          title: { text: t('widgetChartHeatmapAxisTitleRow'), font: { color: store.storeIsDarkMode ? 'white' : 'black' } },
          tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
          fixedrange: !interactive.value,
        },
        shapes,
      }

      // Reformat the data for download
      const dataCopy: any[][] = JSON.parse(JSON.stringify(traces[0].z)).reverse()
      dataCopy.unshift(layout.xaxis.ticktext.concat())
      dataCopy[0]?.unshift('')
      layout.yaxis.ticktext.concat().reverse().forEach((v: string, i: number) => {
        dataCopy[i + 1]?.unshift(v)
      })
      sourceFile.value = {
        blob: new Blob([dataCopy.map(row => row.join('\t')).join('\n')], { type: 'text/plain' }),
        filename: filename.value,
        extension: 'tsv',
      }

      // @ts-ignore
      Plotly.react(heatmapChart.value, traces, layout, {
        responsive: true,
        modeBarButtonsToRemove: ['toImage'],
        displaylogo: false,
      }).then(element => {
        canDownload.value = true
        element.on('plotly_click', (data: any) => {
          if (data && data.points && data.points.length === 1 && trialData) {
            const clicked = data.points[0]

            const row = compProps.trial.layout.rows - clicked.y
            const column = clicked.x - 1

            selectedCell.value = trialData[`${row}|${column}`]

            nextTick(() => {
              bottomSheetVisible.value = true
            })
          }
        })
      })
    }
  }

  watch(currentTimepoint, async () => redraw())

  watch(selectedTrait, async newValue => {
    currentTimepoint.value = 0

    const td = trialData

    if (newValue) {
      if (!newValue.allowRepeats || !td) {
        timepoints.value = []
      } else {
        const tp: number[] = []
        Object.keys(td).forEach(k => {
          const traitData = td[k]?.measurements[newValue.id || '']
          if (traitData) {
            traitData.forEach(dp => {
              if (dp.timestamp) {
                const date = new Date(dp.timestamp)
                date.setHours(0, 0, 0, 0)
                tp.push(date.getTime())
              }
            })
          }
        })

        tp.sort((a, b) => a - b)

        const set = new Set<string>()
        tp.forEach(dp => set.add(toLocalDateString(new Date(dp))))

        timepoints.value = [...set]
        currentTimepoint.value = timepoints.value.length - 1
      }

      nextTick(() => redraw())
    }
  })

  function updateTrialDataCache () {
    trialData = getTrialDataCached()
  }

  onMounted(() => {
    emitter.on('trial-data-loaded', updateTrialDataCache)

    updateTrialDataCache()
  })

  onBeforeUnmount(() => {
    emitter.off('trial-data-loaded', updateTrialDataCache)
  })
</script>
