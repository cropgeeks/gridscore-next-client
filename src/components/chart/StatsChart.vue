<template>
  <div>
    <BaseChart
      :title="trait.name"
      :header-icon="mdiCircle"
      :header-icon-color="trait.color || 'primary'"
      :chart-id="id"
      v-model:interactive="interactive"
      :source-file="sourceFile"
      :can-download="canDownload"
      @force-redraw="redraw"
      :filename="filename"
    >
      <template #toolbar-title>
        <TraitSection :trait="trait" :show-subtitle="false" />
      </template>
      <template #card-text>
        <v-card-text>
          <v-alert color="warning" :text="$t(message)" variant="tonal" :icon="mdiAlert" class="my-5" v-if="message" />
        </v-card-text>
      </template>

      <template #chart-content>
        <div :id="id" ref="traitChart" />
      </template>
    </BaseChart>
  </div>
</template>

<script setup lang="ts">
  import type { CellPlus, TraitPlus, TrialPlus } from '@/plugins/types/client'
  import TraitSection from '@/components/trait/TraitSection.vue'
  import { getId } from '@/plugins/id'
  import { mdiAlert, mdiCircle } from '@mdi/js'
  import type { DownloadBlob } from '@/plugins/file'
  import { toLocalDateString } from '@/plugins/util'

  import Plotly from 'plotly.js/lib/core'
  import bar from 'plotly.js/lib/bar'
  import box from 'plotly.js/lib/box'
  import { CellCategory, TraitDataType } from '@/plugins/types/gridscore'
  import { getTrialDataCached } from '@/plugins/datastore'
  import { useI18n } from 'vue-i18n'
  import { hexToRgba, invertHex } from '@/plugins/color'
  import { coreStore } from '@/stores/app'
  import { CELL_CATEGORIES } from '@/plugins/constants'
  // Only register the chart types we're actually using to reduce the final bundle size
  Plotly.register([
    bar,
    box,
  ])

  const GENERIC_TRACE = '~~GENERIC_TRACE~~'

  interface Datapoint {
    displayColumn: number
    displayRow: number
    row: number
    column: number
    name: string
    barcode?: string
    friendlyName?: string
    pedigree?: string
    rep?: string
    treatment?: string
    setIndex: number
    value: string
    date: string
    timestamp: string
    categories: string[]
  }

  const compProps = defineProps<{
    trial: TrialPlus
    trait: TraitPlus
    selectedGermplasm: string[]
  }>()

  const { t } = useI18n()
  const store = coreStore()

  const id = ref('trait-stats' + getId())
  const interactive = ref(false)
  const canDownload = ref(false)
  const sourceFile = ref<DownloadBlob>()
  const traitChart = useTemplateRef('traitChart')
  const message = ref<string>()

  const safeTrialName = computed(() => compProps.trial ? compProps.trial.name.replace(/[^a-z0-9]/gi, '-').toLowerCase() : '')
  const filename = computed(() => {
    if (safeTrialName.value && compProps.trait) {
      const traitName = compProps.trait.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      return `trait-stats-${safeTrialName.value}-${traitName}-${toLocalDateString(new Date())}`
    } else {
      return ''
    }
  })

  let trialData: { [index: string]: CellPlus } | undefined = undefined

  function redraw () {
    if (!trialData) {
      trialData = getTrialDataCached()
    }

    message.value = undefined
    canDownload.value = false

    const trialDataConst = trialData
    if (traitChart.value && trialDataConst) {
      try {
        Plotly.purge(traitChart.value)
      } catch {
        // Do nothing here, this might fail on first run
      }

      const data = []
      let chartType = 'box'

      let supportsClicking = true

      let dataPointCount = 0

      switch (compProps.trait.dataType) {
        case TraitDataType.float:
        case TraitDataType.int:
        case TraitDataType.range:
        case TraitDataType.date: {
          chartType = 'box'
          const datapoints: { [index: string]: Datapoint[] } = {}
          datapoints[GENERIC_TRACE] = []

          if (compProps.selectedGermplasm) {
            compProps.selectedGermplasm.forEach(g => {
              datapoints[g] = []
            })
          }

          Object.keys(trialDataConst).forEach(k => {
            const cell = trialDataConst[k]

            if (cell && cell.measurements && cell.measurements[compProps.trait.id || '']) {
              const displayName = cell.displayName || cell.germplasm
              const isSelected = compProps.selectedGermplasm.includes(displayName)

              cell.measurements[compProps.trait.id || '']?.forEach(m => {
                const dateString = new Date(m.timestamp).toLocaleString()

                m.values.filter(v => v !== undefined && v !== null && v !== '').forEach((v, setIndex) => {
                  dataPointCount++
                  const dp: Datapoint = {
                    displayColumn: cell.displayColumn || 1,
                    displayRow: cell.displayRow || 1,
                    row: cell.row || 0,
                    column: cell.column || 0,
                    pedigree: cell.pedigree,
                    treatment: cell.treatment,
                    barcode: cell.barcode,
                    friendlyName: cell.friendlyName,
                    setIndex,
                    value: v || '',
                    name: cell.germplasm,
                    rep: cell.rep,
                    date: dateString,
                    timestamp: m.timestamp,
                    categories: cell.categories,
                  }

                  if (isSelected) {
                    if (!datapoints[displayName]) {
                      datapoints[displayName] = []
                    }

                    datapoints[displayName].push(dp)
                  }

                  datapoints[GENERIC_TRACE]?.push(dp)
                })
              })
            }
          })

          compProps.selectedGermplasm.forEach(k => {
            const dps = datapoints[k]

            if (dps) {
              data.unshift({
                x: dps.map(d => d.value),
                text: dps.map(d => d.name),
                customdata: dps.map(d => t('tooltipChartBoxplotInfo', { date: d.date, germplasm: d.name, rep: d.rep, friendlyName: d.friendlyName, treatment: d.treatment, pedigree: d.pedigree, barcode: d.barcode, row: d.displayRow, column: d.displayColumn })),
                ids: dps.map(d => `${d.row}|${d.column}|${d.setIndex}|${d.timestamp}|${d.value}`),
                name: k,
                type: chartType,
                jitter: 0.5,
                pointpos: 2,
                boxpoints: 'all',
                hovertemplate: '%{xaxis.title.text}: %{x}<br>%{customdata}<extra></extra>',
              })
            }
          })

          const dps = datapoints[GENERIC_TRACE]
          if (dps) {
            data.push({
              x: dps.map(d => d.value),
              text: dps.map(d => d.name),
              customdata: dps.map(d => t('tooltipChartBoxplotInfo', { date: d.date, germplasm: d.name, rep: d.rep, friendlyName: d.friendlyName, treatment: d.treatment, pedigree: d.pedigree, barcode: d.barcode, row: d.displayRow, column: d.displayColumn, categories: (d.categories || []).map(c => t(CELL_CATEGORIES[c]?.title || '')).join(', ') })),
              ids: dps.map(d => `${d.row}|${d.column}|${d.setIndex}|${d.timestamp}|${d.value}`),
              marker: {
                color: store.storeHighlightControls ? dps.map(d => (d.categories && d.categories.includes(CellCategory.CONTROL)) ? invertHex(compProps.trait.color || '#00acef') : compProps.trait.color) : compProps.trait.color,
              },
              name: t('widgetChartStatisticsBoxplotAllTrace'),
              type: chartType,
              jitter: 0.5,
              pointpos: 2,
              boxpoints: 'all',
              hovertemplate: '%{xaxis.title.text}: %{x}<br>%{customdata}<extra></extra>',
              fillcolor: hexToRgba(compProps.trait.color || '#00acef', 0.5),
              hoverlabel: {
                bgcolor: compProps.trait.color || '#00acef',
              },
            })
          }

          break
        }
        case TraitDataType.gps:
        case TraitDataType.image:
        case TraitDataType.video:
        case TraitDataType.text:
        case TraitDataType.categorical: {
          supportsClicking = false
          chartType = 'bar'
          const datapoints: { [index: string]: string[] } = {}
          datapoints[GENERIC_TRACE] = []
          compProps.selectedGermplasm.forEach(g => {
            datapoints[g] = []
          })

          const keys = new Set<string>()

          Object.keys(trialDataConst).forEach(k => {
            const cell = trialDataConst[k]

            if (cell && cell.measurements && cell.measurements[compProps.trait.id || '']) {
              const displayName = cell.displayName || cell.germplasm
              const isSelected = compProps.selectedGermplasm.includes(displayName)

              cell.measurements[compProps.trait.id || '']?.forEach(m => {
                m.values.forEach(v => {
                  const vConst = v
                  if (vConst !== undefined && vConst !== null && vConst !== '') {
                    dataPointCount++
                    let value
                    if (compProps.trait.dataType === TraitDataType.categorical && compProps.trait.restrictions && compProps.trait.restrictions.categories) {
                      value = compProps.trait.restrictions.categories[+vConst]
                      keys.add(compProps.trait.restrictions.categories[+vConst] || '')
                    } else {
                      value = v
                      keys.add(v || '')
                    }

                    if (isSelected) {
                      if (!datapoints[displayName]) {
                        datapoints[displayName] = []
                      }

                      if (value !== undefined) {
                        datapoints[displayName].push(value)
                      }
                    }

                    if (value !== undefined) {
                      datapoints[GENERIC_TRACE]?.push(value)
                    }
                  }
                })
              })
            }
          })

          let keyArray = []
          if (compProps.trait.dataType === 'categorical' && compProps.trait.restrictions && compProps.trait.restrictions.categories) {
            keyArray = compProps.trait.restrictions.categories
          } else {
            keyArray = [...keys].sort()
          }

          compProps.selectedGermplasm.forEach(k => {
            const dps = datapoints[k]

            if (dps) {
              data.unshift({
                x: keyArray,
                y: keyArray.map(k => dps.filter(dp => dp === k).length),
                name: k,
                type: chartType,
              })
            }
          })

          const dps = datapoints[GENERIC_TRACE]
          if (dps) {
            data.push({
              x: keyArray,
              y: keyArray.map(k => dps.filter(dp => dp === k).length),
              marker: {
                color: compProps.trait.color,
              },
              name: t('widgetChartStatisticsBoxplotAllTrace'),
              type: chartType,
            })
          }

          break
        }
      }

      if (dataPointCount < 1) {
        message.value = 'widgetChartNoData'
        return
      }

      const layout = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        height: chartType === 'box' ? (compProps.selectedGermplasm.length * 100 + 400) : 450,
        barmode: 'group',
        margin: {
          l: 30,
          r: 30,
        },
        legend: {
          traceorder: 'reversed',
        },
        autosize: true,
        yaxis: {
          automargin: true,
          title: { text: '', font: { color: store.storeIsDarkMode ? 'white' : 'black' } },
          tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
          gridcolor: store.storeIsDarkMode ? '#111111' : '#eeeeee',
          showgrid: chartType === 'bar',
          fixedrange: !interactive.value,
        },
        xaxis: {
          zeroline: false,
          title: { text: '', font: { color: store.storeIsDarkMode ? 'white' : 'black' } },
          tickfont: { color: store.storeIsDarkMode ? 'white' : 'black' },
          gridcolor: store.storeIsDarkMode ? '#111111' : '#eeeeee',
          showgrid: chartType === 'box',
          fixedrange: !interactive.value,
        },
        hovermode: chartType === 'box' ? 'closest' : 'x',
        shapes: [],
      }

      if (compProps.trait.restrictions) {
        if (compProps.trait.restrictions.min !== undefined && compProps.trait.restrictions.min !== null) {
          // @ts-ignore
          layout.shapes.push({
            type: 'line',
            yref: 'paper',
            x0: compProps.trait.restrictions.min,
            y0: 0,
            x1: compProps.trait.restrictions.min,
            y1: 1,
            line: {
              color: compProps.trait.color,
              width: 1.5,
              dash: 'dot',
            },
          })
        }
        if (compProps.trait.restrictions.max !== undefined && compProps.trait.restrictions.max !== null) {
          // @ts-ignore
          layout.shapes.push({
            type: 'line',
            yref: 'paper',
            x0: compProps.trait.restrictions.max,
            y0: 0,
            x1: compProps.trait.restrictions.max,
            y1: 1,
            line: {
              color: compProps.trait.color,
              width: 1.5,
              dash: 'dot',
            },
          })
        }
      }

      if (compProps.trait.dataType === 'categorical' || compProps.trait.dataType === 'text') {
        // @ts-ignore
        layout.xaxis.type = 'category'
        if (layout.xaxis.title) {
          layout.xaxis.title.text = compProps.trait.name
        }
        if (layout.yaxis.title) {
          layout.yaxis.title.text = t('widgetChartAxisCount')
        }
      } else {
        if (layout.xaxis.title) {
          layout.xaxis.title.text = compProps.trait.name
        }
      }

      // @ts-ignore
      Plotly.react(traitChart.value, data, layout, {
        responsive: true,
        modeBarButtonsToRemove: ['toImage', 'lasso2d', 'select2d'],
        displaylogo: false,
      }).then(element => {
        canDownload.value = true
        if (supportsClicking) {
          element.on('plotly_click', (eventData: any) => {
            if (!eventData || (eventData.points.length === 0)) {
              if (traitChart.value) {
                Plotly.restyle(traitChart.value, { selectedpoints: [null] })
              }
            } else {
              const mapped = eventData.points.map((p: any) => {
                const [row, column, setIndex, timestamp, value] = p.id.split('|')

                return {
                  row: +row,
                  column: +column,
                  setIndex: +setIndex,
                  timestamp,
                  value,
                }
              }).filter((value: any, index: number, self: any) => self.indexOf(value) === index)

              // TODO: Do something with the selection here now.

              if (mapped.length === 1) {
                emit('cell-clicked', mapped[0].row, mapped[0].column)
              }
            }
          })
        }
      })
    }
  }

  watch(() => compProps.selectedGermplasm, async () => redraw())

  onMounted(() => redraw())

  const emit = defineEmits(['cell-clicked'])
</script>
