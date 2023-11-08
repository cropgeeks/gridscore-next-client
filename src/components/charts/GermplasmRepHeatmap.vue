<template>
  <div v-if="trial && reps && reps.length > 1">
    <h2>{{ $t('pageVisualizationGermplasmRepHeatmapTitle') }}</h2>
    <p>{{ $t('pageVisualizationGermplasmRepHeatmapText') }}</p>

    <b-form @submit.prevent="update">
      <b-row>
        <b-col cols=12 md=6 xl=4>
          <b-form-group :label="$t('formLabelHeatmapTrait')" :description="$t('formDescriptionHeatmapTrait')" label-for="trait">
            <b-form-select v-model="selectedTraitIndex" :options="traitOptions" id="trait" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=6 xl=4>
          <b-form-group :label="$t('formLabelHeatmapTimeline')" label-for="timepoint" v-if="timepoints && timepoints.length > 0" :description="$t('formDescriptionCurrentTimepoint', { date: new Date(timepoints[currentTimepoint]).toLocaleDateString() })">
            <b-form-input type="range" v-model.number="currentTimepoint" :min="0" :max="timepoints.length - 1" />
          </b-form-group>
        </b-col>
      </b-row>
    </b-form>

    <!-- Heatmap element -->
    <div ref="heatmapRepCompareChart" />

    <b-modal ref="plotModal" :title="$t('modalTitleVizPlotDataDetails')" ok-only :ok-title="$t('buttonClose')" v-if="selectedCell && selectedTrait">
      <PlotDataSection :cell="selectedCell" :traits="[selectedTrait]" />
    </b-modal>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getTrialDataCached } from '@/plugins/datastore'
import { categoryColors, toLocalDateString } from '@/plugins/misc'
import PlotDataSection from '@/components/PlotDataSection'

const emitter = require('tiny-emitter/instance')

const Plotly = require('plotly.js/lib/core')

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  require('plotly.js/lib/heatmap')
])

export default {
  components: {
    PlotDataSection
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  computed: {
    ...mapGetters([
      'storeDarkMode',
      'storeLocale'
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
        return 0
      }
    },
    safeTrialName: function () {
      if (this.trial) {
        return this.trial.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
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
      reps: [],
      allGermplasm: [],
      germplasmMap: {},
      selectedCell: null
    }
  },
  watch: {
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
            const traitMeasurements = this.trialData[k].measurements[newValue.id] || []

            traitMeasurements.forEach(dp => {
              if (dp.timestamp) {
                const date = new Date(dp.timestamp)
                date.setHours(0, 0, 0, 0)
                tp.push(date.getTime())
              }
            })
          })

          tp.sort((a, b) => a - b)

          const set = new Set()
          tp.forEach(dp => set.add(toLocalDateString(new Date(dp))))

          this.timepoints = [...set]
        }

        this.$nextTick(() => this.update())
      }
    }
  },
  methods: {
    update: function () {
      if (this.$refs.heatmapRepCompareChart && this.selectedTrait) {
        let minDate = new Date('9999-12-31')
        let maxDate = new Date('1900-01-01')
        let minValue = Number.MAX_SAFE_INTEGER
        let maxValue = -Number.MAX_SAFE_INTEGER

        const restrictions = this.selectedTrait.restrictions

        const z = []
        const text = []
        const customdata = []
        const ids = []
        for (let row = this.allGermplasm.length - 1; row >= 0; row--) {
          const rowData = []
          const rowText = []
          const rowCustomdata = []
          const rowIds = []
          const g = this.allGermplasm[row]
          for (let column = 0; column < this.reps.length; column++) {
            const match = this.germplasmMap[g].find(m => m.rep === this.reps[column])

            if (!match) {
              rowData.push(NaN)
              rowText.push('')
              rowCustomdata.push(null)
              rowIds.push(null)
              continue
            }

            const cell = this.trialData[`${match.row}|${match.column}`]

            if (!cell) {
              rowData.push(NaN)
              rowText.push('')
              rowCustomdata.push(null)
              rowIds.push(null)
              continue
            }

            rowText.push(this.$t('widgetChartHeatmapRowColumn', { row: cell.row + 1, column: cell.column + 1 }))
            // rowText.push(cell.displayName)

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

                if (this.selectedTrait.dataType === 'int' || this.selectedTrait.dataType === 'float') {
                  m.values.forEach(v => {
                    if (v !== undefined && v !== null) {
                      minValue = Math.min(minValue, +v)
                      maxValue = Math.max(maxValue, +v)
                    }
                  })
                }
              })

              if (finalValue) {
                rowIds.push(`${cell.row}|${cell.column}`)

                if (this.selectedTrait.dataType === 'date' || this.selectedTrait.dataType === 'text') {
                  rowData.push(new Date(finalValue.timestamp))
                  rowCustomdata.push(null)
                } else if (this.selectedTrait.dataType === 'categorical') {
                  rowData.push(finalValue.values[finalValue.values.length - 1])
                  rowCustomdata.push(restrictions.categories[finalValue.values[finalValue.values.length - 1]])
                } else {
                  // Take the average
                  const validValues = finalValue.values.filter(v => v !== undefined && v !== null)
                  const value = validValues.length > 0 ? finalValue.values.map(v => +v).reduce((a, b) => a + b) / finalValue.values.length : null

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
                rowIds.push(null)
              }
            } else {
              rowData.push(NaN)
              rowCustomdata.push(null)
              rowIds.push(null)
            }
          }

          z.push(rowData)
          text.push(rowText)
          customdata.push(rowCustomdata)
          ids.push(rowIds)
        }

        // Adjust date-based data to be "days since first recording" using the min date
        if (this.selectedTrait.dataType === 'date' || this.selectedTrait.dataType === 'text') {
          for (let row = this.allGermplasm.length - 1; row >= 0; row--) {
            for (let column = 0; column < this.reps.length; column++) {
              z[row][column] = (z[row][column] - minDate) / (1000 * 60 * 60 * 24)
            }
          }
        }

        const traces = [{
          x: this.reps.map((r, i) => this.$n(i)),
          // Y Values are the row indices
          y: Array.from(Array(this.allGermplasm.length).keys()).map(i => this.$n(i + 1)),
          z: z,
          text: text,
          customdata: customdata,
          ids: ids,
          type: 'heatmap',
          colorscale: this.selectedTrait.dataType === 'categorical'
            ? restrictions.categories.map((_, i) => {
              const l = restrictions.categories.length
              const c = categoryColors[i % categoryColors.length]
              return [[i / l, c], [(i + 1) / l, c]]
            }).flat()
            : [[0, this.storeDarkMode ? '#444444' : '#dddddd'], [1, this.selectedTrait.color]],
          hoverongaps: false,
          hovertemplate: this.selectedTrait.dataType === 'categorical'
            ? `${this.$t('tooltipChartHeatmapGermplasm')}: %{y}<br>${this.$t('tooltipChartHeatmapRep')}: %{x}<br>${this.$t('tooltipChartHeatmapValue')}: %{customdata}<extra>%{text}</extra>`
            : `${this.$t('tooltipChartHeatmapGermplasm')}: %{y}<br>${this.$t('tooltipChartHeatmapRep')}: %{x}<br>${this.$t('tooltipChartHeatmapValue')}: %{z}<extra>%{text}</extra>`
        }]

        if (this.selectedTrait.dataType === 'int' || this.selectedTrait.dataType === 'float') {
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
          traces[0].colorbar = traces[0].colorbar = {
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

        const layout = {
          margin: { autoexpand: true },
          autosize: true,
          height: (20 * this.allGermplasm.length) + 200,
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          xaxis: {
            showgrid: false,
            tickmode: 'array',
            zeroline: false,
            tickvals: this.reps.map((r, i) => i),
            ticktext: this.reps.map(r => r || this.$t('widgetChartNoRep')),
            title: { text: this.$t('widgetChartHeatmapAxisTitleRep'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
            tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
          },
          yaxis: {
            automargin: true,
            showgrid: false,
            tickmode: 'array',
            tickvals: Array.from(Array(this.allGermplasm.length).keys()).map(i => this.allGermplasm.length - i),
            ticktext: this.allGermplasm,
            title: { text: this.$t('widgetChartHeatmapAxisTitleGermplasm'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
            tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
          }
        }

        const filename = this.selectedTrait.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
        Plotly.newPlot(this.$refs.heatmapRepCompareChart, traces, layout, {
          responsive: true,
          toImageButtonOptions: {
            format: 'png',
            filename: `germplasm-heatmap-${this.safeTrialName}-${filename}-${toLocalDateString(new Date())}`
          },
          displaylogo: false
        })

        this.$refs.heatmapRepCompareChart.on('plotly_click', eventData => {
          if (eventData && eventData.points && eventData.points.length === 1) {
            const clicked = eventData.points[0]

            if (clicked && clicked.id) {
              const [row, column] = clicked.id.split('|').map(c => +c)

              this.selectedCell = this.trialData[`${row}|${column}`]

              this.$nextTick(() => this.$refs.plotModal.show())
            }
          }
        })
      }
    },
    updateTrialDataCache: function () {
      this.trialData = getTrialDataCached()

      if (this.trialData) {
        const germplasmMap = {}
        const reps = new Set()
        Object.values(this.trialData).forEach(cell => {
          reps.add(cell.rep)

          if (!germplasmMap[cell.germplasm]) {
            germplasmMap[cell.germplasm] = []
          }

          germplasmMap[cell.germplasm].push({
            row: cell.row,
            column: cell.column,
            rep: cell.rep
          })
        })

        this.reps = [...reps].sort((a, b) => a ? a.localeCompare(b) : -1)
        this.allGermplasm = [...Object.keys(germplasmMap)].sort((a, b) => a.localeCompare(b))
        this.germplasmMap = germplasmMap

        this.$emit('rep-count-changed', this.reps.filter(r => r !== undefined && r !== null).length)
      }
    }
  },
  mounted: function () {
    emitter.on('trial-data-loaded', this.updateTrialDataCache)

    this.updateTrialDataCache()
  },
  beforeDestroy: function () {
    emitter.off('trial-data-loaded', this.updateTrialDataCache)
  }
}
</script>

<style scoped>

</style>
