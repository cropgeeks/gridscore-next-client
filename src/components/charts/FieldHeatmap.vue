<template>
  <div>
    <h2>{{ $t('pageVisualizationFieldHeatmapTitle') }}</h2>
    <p>{{ $t('pageVisualizationFieldHeatmapText') }}</p>

    <div v-if="trial">
      <b-form @submit.prevent="update">
        <b-row>
          <b-col cols=12 md=6 xl=4>
            <b-form-group :label="$t('formLabelHeatmapTrait')" :description="$t('formDescriptionHeatmapTrait')" label-for="trait">
              <b-form-select v-model="selectedTraitIndex" :options="traitOptions" id="trait" />
            </b-form-group>
          </b-col>
          <b-col cols=12 md=6 xl=4>
            <b-form-group :label="$t('formLabelHeatmapTimeline')" label-for="timepoint" v-if="timepoints && timepoints.length > 0" :description="$t('formDescriptionCurrentTimepoint', { date: new Date(timepoints[currentTimepoint]).toLocaleDateString() })">
              <b-form-input id="timepoint" type="range" class="form-control" v-model.number="currentTimepoint" :min="0" :max="timepoints.length - 1" />
            </b-form-group>
          </b-col>
          <b-col cols=12 md=6 xl=4>
            <b-form-group :label="$t('formCheckboxChartInteractEnabled')" label-for="interactivity">
              <b-form-checkbox id="interactivity" switch v-model="chartInteractionEnabled"> {{ $t(chartInteractionEnabled ? 'genericYes' : 'genericNo') }}</b-form-checkbox>
            </b-form-group>
          </b-col>
        </b-row>
      </b-form>

      <!-- Heatmap element -->
      <template v-if="selectedTrait">
        <DownloadableChart elementId="heatmap-chart-plot" :filename="filename" />
        <div ref="heatmapChart" id="heatmap-chart-plot" />
      </template>
      <div class="border border-warning text-center my-3 p-2" v-if="message">{{ $t(message) }}</div>
    </div>

    <b-modal ref="plotModal" :title="$t('modalTitleVizPlotDataDetails')" ok-only :ok-title="$t('buttonClose')" v-if="selectedCell && selectedTrait">
      <PlotDataSection :trial="trial" :cell="selectedCell" :traits="[selectedTrait]" />
    </b-modal>
  </div>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import { getTrialDataCached } from '@/plugins/datastore'
import { CELL_CATEGORY_CONTROL } from '@/plugins/constants'
import { getColumnLabel, getRowLabel, invertHex, toLocalDateString } from '@/plugins/misc'
import { categoricalColors, toCssNamedColors, validateColorName } from '@/plugins/color'
import PlotDataSection from '@/components/PlotDataSection.vue'

import emitter from 'tiny-emitter/instance'

import Plotly from 'plotly.js/lib/core'
import heatmap from 'plotly.js/lib/heatmap'
import DownloadableChart from '@/components/charts/DownloadableChart.vue'

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  heatmap
])

export default {
  components: {
    DownloadableChart,
    PlotDataSection
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeDarkMode',
      'storeLocale',
      'storeHighlightControls'
    ]),
    traitOptions: function () {
      if (this.trial) {
        return this.trial.traits.map((t, i) => {
          return {
            text: t.name,
            value: i
          }
        })
      } else {
        return []
      }
    },
    selectedTrait: function () {
      if (this.trial) {
        return this.trial.traits[this.selectedTraitIndex]
      } else {
        return null
      }
    },
    safeTrialName: function () {
      if (this.trial) {
        return this.trial.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      } else {
        return ''
      }
    },
    filename: function () {
      if (this.safeTrialName && this.selectedTrait) {
        const traitName = this.selectedTrait.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
        return `field-heatmap-${this.safeTrialName}-${traitName}-${toLocalDateString(new Date())}`
      } else {
        return ''
      }
    }
  },
  data: function () {
    return {
      selectedTraitIndex: null,
      timepoints: [],
      currentTimepoint: 0,
      selectedCell: null,
      chartInteractionEnabled: false,
      message: null
    }
  },
  watch: {
    chartInteractionEnabled: function () {
      if (this.$refs.heatmapChart && this.selectedTrait) {
        const layoutDelta = {
          'xaxis.fixedrange': !this.chartInteractionEnabled,
          'yaxis.fixedrange': !this.chartInteractionEnabled
        }

        Plotly.relayout(this.$refs.heatmapChart, layoutDelta)
      }
    },
    storeDarkMode: function () {
      this.update()
    },
    storeLocale: function () {
      this.update()
    },
    currentTimepoint: function () {
      this.update()
    },
    selectedTrait: function (newValue) {
      this.currentTimepoint = 0

      if (newValue) {
        if (!newValue.allowRepeats) {
          this.timepoints = []
        } else {
          const tp = []
          Object.keys(this.trialData).forEach(k => {
            const traitData = this.trialData[k].measurements[newValue.id]
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

          const set = new Set()
          tp.forEach(dp => set.add(toLocalDateString(new Date(dp))))

          this.timepoints = [...set]
          this.currentTimepoint = this.timepoints.length - 1
        }

        this.$nextTick(() => this.update())
      }
    }
  },
  methods: {
    update: function () {
      if (this.$refs.heatmapChart && this.selectedTrait) {
        try {
          Plotly.purge(this.$refs.heatmapChart)
        } catch {
        }

        this.message = null

        let minDate = new Date('9999-12-31')
        let maxDate = new Date('1900-01-01')
        let minValue = Number.MAX_SAFE_INTEGER
        let maxValue = -Number.MAX_SAFE_INTEGER

        const restrictions = this.selectedTrait.restrictions

        const z = []
        const text = []
        const customdata = []
        const shapes = []
        let dataPointCount = 0
        for (let row = this.trial.layout.rows - 1; row >= 0; row--) {
          const rowData = []
          const rowText = []
          const rowCustomdata = []
          for (let column = 0; column < this.trial.layout.columns; column++) {
            const cell = this.trialData[`${row}|${column}`]

            if (!cell) {
              rowData.push(NaN)
              rowText.push('')
              rowCustomdata.push(null)
              continue
            }

            if (this.storeHighlightControls && cell.categories && cell.categories.includes(CELL_CATEGORY_CONTROL)) {
              shapes.push({
                type: 'rect',
                // x-reference is assigned to the x-values
                xref: 'x',
                // y-reference is assigned to the plot paper [0,1]
                yref: 'y',
                x0: cell.column + 0.5,
                y0: this.trial.layout.rows - 1 - cell.row + 0.5,
                x1: cell.column + 1.5,
                y1: this.trial.layout.rows - 1 - cell.row + 1.5,
                line: {
                  width: 2,
                  color: invertHex(this.selectedTrait.color)
                }
              })
            }

            rowText.push(cell.displayName)

            // Get all sorted measurements for this trait and plot
            const traitMeasurements = cell.measurements[this.selectedTrait.id] || []

            const measurements = traitMeasurements.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

            if (measurements && measurements.length > 0) {
              let finalValue = null
              measurements.forEach(m => {
                const date = new Date(m.timestamp)
                date.setHours(0, 0, 0, 0)
                if (date < minDate) {
                  minDate = date
                }
                if (date > maxDate) {
                  maxDate = date
                }

                if (this.timepoints.length > 0) {
                  if (date <= new Date(this.timepoints[this.currentTimepoint])) {
                    finalValue = m
                  }
                } else {
                  finalValue = m
                }

                if (this.selectedTrait.dataType === 'int' || this.selectedTrait.dataType === 'float' || this.selectedTrait.dataType === 'range') {
                  m.values.forEach(v => {
                    if (v !== undefined && v !== null) {
                      minValue = Math.min(minValue, +v)
                      maxValue = Math.max(maxValue, +v)
                    }
                  })
                }
              })

              if (finalValue) {
                dataPointCount++
                if (this.selectedTrait.dataType === 'date' || this.selectedTrait.dataType === 'text' || this.selectedTrait.dataType === 'gps' || this.selectedTrait.dataType === 'image') {
                  rowData.push(new Date(finalValue.timestamp))
                  rowCustomdata.push(null)
                } else if (this.selectedTrait.dataType === 'categorical') {
                  rowData.push(finalValue.values[finalValue.values.length - 1])
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
          this.message = 'widgetChartNoData'
          return
        }

        // Adjust date-based data to be "days since first recording" using the min date
        if (this.selectedTrait.dataType === 'date' || this.selectedTrait.dataType === 'text' || this.selectedTrait.dataType === 'gps' || this.selectedTrait.dataType === 'image') {
          for (let row = this.trial.layout.rows - 1; row >= 0; row--) {
            for (let column = 0; column < this.trial.layout.columns; column++) {
              z[row][column] = (z[row][column] - minDate) / (1000 * 60 * 60 * 24)
            }
          }
        }

        const catColors = this.selectedTrait.dataType === 'categorical' ? restrictions.categories : []
        const colorMap = toCssNamedColors(catColors)
        const allValidNamedColors = Object.keys(colorMap).length === catColors.length

        const traces = [{
          // X values are the column indices
          x: Array.from({ length: this.trial.layout.columns }, (v, k) => this.$n(k + 1)),
          // Y Values are the row indices
          y: Array.from({ length: this.trial.layout.rows }, (v, k) => this.$n(k + 1)),
          z,
          text,
          customdata,
          type: 'heatmap',
          colorscale: this.selectedTrait.dataType === 'categorical'
            ? restrictions.categories.map((cat, i) => {
              const l = restrictions.categories.length
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
            }).flat()
            : [[0, this.storeDarkMode ? '#444444' : '#dddddd'], [1, this.selectedTrait.color]],
          hoverongaps: false,
          hovertemplate: this.selectedTrait.dataType === 'categorical'
            ? `${this.$t('tooltipChartHeatmapRow')}: %{y}<br>${this.$t('tooltipChartHeatmapColumn')}: %{x}<br>${this.$t('tooltipChartHeatmapValue')}: %{customdata}<extra>%{text}</extra>`
            : `${this.$t('tooltipChartHeatmapRow')}: %{y}<br>${this.$t('tooltipChartHeatmapColumn')}: %{x}<br>${this.$t('tooltipChartHeatmapValue')}: %{z}<extra>%{text}</extra>`
        }]

        if (this.selectedTrait.dataType === 'int' || this.selectedTrait.dataType === 'float' || this.selectedTrait.dataType === 'range') {
          traces[0].zauto = false
          traces[0].zmin = minValue
          traces[0].zmax = maxValue
          traces[0].colorbar = {
            title: {
              side: 'right',
              font: { color: this.storeDarkMode ? 'white' : 'black' }
            },
            tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
            orientation: window.innerWidth < 768 ? 'h' : 'v'
          }
        } else if (this.selectedTrait.dataType === 'date') {
          traces[0].colorbar = {
            title: {
              text: this.$t('widgetChartLegendDaysSinceFirstRecording'),
              side: 'right',
              font: { color: this.storeDarkMode ? 'white' : 'black' }
            },
            tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
            orientation: window.innerWidth < 768 ? 'h' : 'v'
          }
        } else if (this.selectedTrait.dataType === 'categorical') {
          traces[0].zauto = false
          traces[0].zmin = -0.5
          traces[0].zmax = restrictions.categories.length - 0.5
          traces[0].colorbar = {
            tickmode: 'array',
            tickvals: restrictions.categories.map((c, i) => i),
            ticktext: restrictions.categories,
            title: {
              side: 'right',
              font: { color: this.storeDarkMode ? 'white' : 'black' }
            },
            tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
            autotick: false,
            tick0: 0,
            dtick: 1,
            nticks: restrictions.categories.length
          }
        }

        // Get the axis ticks based on inversion state
        const xTicks = Array.from(Array(this.trial.layout.columns).keys()).map(i => getColumnLabel(this.trial.layout, i))
        const yTicks = Array.from(Array(this.trial.layout.rows).keys()).map(i => getRowLabel(this.trial.layout, i)).reverse()

        const layout = {
          margin: { autoexpand: true },
          autosize: true,
          height: (25 * this.trial.layout.rows) + 200,
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          xaxis: {
            showgrid: false,
            tickmode: 'array',
            tickvals: Array.from(Array(this.trial.layout.columns).keys()).map(i => i + 1),
            ticktext: xTicks,
            title: { text: this.$t('widgetChartHeatmapAxisTitleCol'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
            tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
            fixedrange: !this.chartInteractionEnabled
          },
          yaxis: {
            automargin: true,
            showgrid: false,
            tickmode: 'array',
            tickvals: Array.from(Array(this.trial.layout.rows).keys()).map(i => i + 1),
            ticktext: yTicks,
            title: { text: this.$t('widgetChartHeatmapAxisTitleRow'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
            tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
            fixedrange: !this.chartInteractionEnabled
          },
          shapes
        }

        Plotly.newPlot(this.$refs.heatmapChart, traces, layout, {
          responsive: true,
          modeBarButtonsToRemove: ['toImage'],
          displaylogo: false
        })
        this.$refs.heatmapChart.on('plotly_click', eventData => {
          if (eventData && eventData.points && eventData.points.length === 1) {
            const clicked = eventData.points[0]

            const row = this.trial.layout.rows - clicked.y
            const column = clicked.x - 1

            this.selectedCell = this.trialData[`${row}|${column}`]

            this.$nextTick(() => this.$refs.plotModal.show())
          }
        })
      }
    },
    updateTrialDataCache: function () {
      this.trialData = getTrialDataCached()
    }
  },
  mounted: function () {
    emitter.on('trial-data-loaded', this.updateTrialDataCache)

    this.updateTrialDataCache()
  },
  beforeUnmount: function () {
    emitter.off('trial-data-loaded', this.updateTrialDataCache)
  }
}
</script>

<style scoped>

</style>
