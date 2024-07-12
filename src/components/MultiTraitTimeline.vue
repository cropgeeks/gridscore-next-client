<template>
  <div v-if="trait">
    <b-button-group class="mb-3">
      <b-button v-for="mode in plotModes" :key="`plot-mode-${mode.value}`" :pressed="plotMode === mode.value" @click="plotMode = mode.value">
        <IBiHr v-if="mode.value === 'average'" />
        <IBiCardChecklist v-else-if="mode.value === 'all'" />
        <IBiCardList v-else-if="mode.value === 'selection'" />
        &nbsp;<span>{{ mode.name }}</span>
      </b-button>

      <b-button :pressed="individualTimepoints" @click="individualTimepoints = true" class="ms-3">
        <IBiBarChartSteps :style="{ transform: 'rotate(-90deg)' }" /> {{ $t('buttonIndividualTimepoints') }}
      </b-button>
      <b-button :pressed="!individualTimepoints" @click="individualTimepoints = false">
        <IBiGraphUp /> {{ $t('buttonEvolvingTimepoints') }}
      </b-button>
    </b-button-group>
    <div v-if="plotMode === 'selection'" class="select-search-wrapper">
      <b-form-input v-model="searchTerm" type="search" :placeholder="$t('formPlaceholderTimelinePlotSearch')" />
      <b-input-group>
        <b-form-select multiple :options="filteredGermplasm" v-model="selectedGermplasmTemp" />
        <template #append>
          <b-button @click="addGermplasm"><IBiPlusSquareFill /></b-button>
        </template>
      </b-input-group>

      <div class="my-3">
        <b-badge class="me-2" v-for="(germplasm, index) in selectedGermplasm" :key="`germplasm-badge-${germplasm}`">
          {{ germplasm }} <button type="button" class="btn-close badge-close" @click="removeGermplasm(index)">×</button>
        </b-badge>
      </div>
    </div>
    <div ref="tlTrait" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { getTrialDataCached } from '@/plugins/datastore'
import { toLocalDateString } from '@/plugins/misc'

import emitter from 'tiny-emitter/instance'

import Plotly from 'plotly.js/lib/core'
import scatter from 'plotly.js/lib/scatter'

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  scatter
])

export default {
  props: {
    trial: {
      type: Object,
      default: () => null
    },
    trait: {
      type: Object,
      default: () => null
    },
    traitIndex: {
      type: Number,
      default: 0
    }
  },
  data: function () {
    return {
      plotMode: 'average',
      allGermplasm: [],
      selectedGermplasmTemp: [],
      selectedGermplasm: [],
      searchTerm: null,
      individualTimepoints: false
    }
  },
  computed: {
    ...mapGetters([
      'storeDarkMode'
    ]),
    searchTermLowerCase: function () {
      if (this.searchTerm) {
        return this.searchTerm.toLowerCase()
      } else {
        return null
      }
    },
    filteredGermplasm: function () {
      if (this.searchTerm && this.allGermplasm) {
        return this.allGermplasm.filter(g => g.toLowerCase().includes(this.searchTermLowerCase))
      } else {
        return this.allGermplasm
      }
    },
    plotModes: function () {
      return [{
        name: this.$t('widgetTimelinePlotTypeAverage'),
        value: 'average'
      }, {
        name: this.$t('widgetTimelinePlotTypeAll'),
        value: 'all'
      }, {
        name: this.$t('widgetTimelinePlotTypeSelection'),
        value: 'selection'
      }]
    },
    safeTrialName: function () {
      if (this.trial) {
        return this.trial.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      } else {
        return ''
      }
    }
  },
  watch: {
    storeDarkMode: function () {
      this.plot()
    },
    plotMode: function () {
      this.plot()
    },
    selectedGermplasm: function () {
      this.plot()
    },
    individualTimepoints: function () {
      this.plot()
    }
  },
  methods: {
    removeGermplasm: function (index) {
      this.selectedGermplasm.splice(index, 1)
    },
    addGermplasm: function () {
      const set = new Set()
      this.selectedGermplasm.forEach(g => set.add(g))
      this.selectedGermplasmTemp.forEach(g => set.add(g))
      this.selectedGermplasm = [...set]
      this.selectedGermplasmTemp = []
    },
    plot: function () {
      Plotly.purge(this.$refs.tlTrait)

      if (!this.trial || !this.trialData || !this.trait) {
        return []
      }

      const allDates = new Set()
      Object.keys(this.trialData).forEach(k => {
        const c = this.trialData[k]
        const traitMeasurements = c.measurements[this.trait.id] || []
        traitMeasurements.forEach(m => {
          const d = new Date(m.timestamp)
          d.setHours(0, 0, 0, 0)
          allDates.add(d.getTime())
        })
      })

      const sortedDates = [...allDates].sort((a, b) => a - b)
      // Keep track of statistics
      const mins = sortedDates.map(d => Number.MAX_SAFE_INTEGER)
      const maxs = mins.map(d => -d)
      const totals = mins.map(d => 0)
      const counts = mins.map(d => 0)
      let traces = []

      if (this.individualTimepoints) {
        // For each field cell
        Object.keys(this.trialData).forEach(k => {
          const c = this.trialData[k]

          const traitMeasurements = c.measurements[this.trait.id] || []

          const dataPoints = traitMeasurements.map(m => {
            const date = new Date(m.timestamp)
            date.setHours(0, 0, 0, 0)
            const time = date.getTime()

            const existingValues = m.values.filter(v => v !== undefined && v !== null)
            let avg

            if (this.trait.dataType === 'categorical') {
              avg = existingValues.length > 0 ? existingValues[existingValues.length - 1] : 0
            } else {
              avg = existingValues.length > 0 ? existingValues.reduce((acc, val) => acc + (+val), 0) / existingValues.length : 0
            }

            // Update statistics
            mins.forEach((m, i) => {
              if (sortedDates[i] === time) {
                mins[i] = Math.min(mins[i], avg)
                maxs[i] = Math.max(maxs[i], avg)
                totals[i] += avg
                counts[i]++
              }
            })

            return {
              date: time,
              value: avg
            }
          })

          dataPoints.sort((a, b) => a.date - b.date)

          if (this.plotMode === 'all' || (this.plotMode === 'selection' && this.selectedGermplasm.indexOf(c.displayName) !== -1)) {
            traces.push({
              type: 'scatter',
              mode: 'lines+markers',
              name: c.displayName,
              x: dataPoints.map(dp => new Date(dp.date)),
              y: this.trait.dataType === 'categorical' ? dataPoints.map(dp => this.trait.restrictions.categories[dp.value]) : dataPoints.map(dp => dp.value)
            })
          }
        })
      } else {
        traces = Object.keys(this.trialData).map(k => {
          const c = this.trialData[k]

          const traitMeasurements = c.measurements[this.trait.id] || []

          const y = sortedDates.map(_ => NaN)

          // let lastIndex = sortedDates.length - 1
          // for (let i = sortedDates.length - 1; i >= 0; i--) {
          //   const values = traitMeasurements.filter(m => {
          //     const existingValues = m.values.filter(v => v !== undefined && v !== null)
          //     const date = new Date(m.timestamp)
          //     date.setHours(0, 0, 0, 0)
          //     const time = date.getTime()

          //     return time === sortedDates[i] && existingValues.length > 0
          //   })

          //   if (values.length > 0) {
          //     lastIndex = i
          //     break
          //   }
          // }

          for (let i = 0; i < sortedDates.length; i++) {
            const values = traitMeasurements.filter(m => {
              const existingValues = m.values.filter(v => v !== undefined && v !== null)
              const date = new Date(m.timestamp)
              date.setHours(0, 0, 0, 0)
              const time = date.getTime()

              return time === sortedDates[i] && existingValues.length > 0
            })

            const flattened = values.map(m => m.values).flat()

            if (flattened.length > 0) {
              const avg = flattened.reduce((acc, val) => acc + (+val), 0) / flattened.length
              mins[i] = Math.min(mins[i], avg)
              maxs[i] = Math.max(maxs[i], avg)
              totals[i] += avg
              counts[i]++
              y[i] = avg
            } else if (i > 0 && !isNaN(y[i - 1])) {
              y[i] = y[i - 1]
              mins[i] = Math.min(mins[i], y[i])
              maxs[i] = Math.max(maxs[i], y[i])
              totals[i] += y[i]
              counts[i]++
            } else {
              y[i] = NaN
            }
          }

          // y = y.map((v, i) => i <= lastIndex ? v : NaN)

          if (this.plotMode === 'all' || (this.plotMode === 'selection' && this.selectedGermplasm.indexOf(c.displayName) !== -1)) {
            return {
              x: sortedDates.map(d => new Date(d)),
              y: y,
              type: 'scatter',
              mode: 'lines+markers',
              name: c.displayName
            }
          } else {
            return null
          }
        }).filter(t => t !== null)
      }

      const background = {
        x: [],
        y: [],
        fill: 'tozerox',
        fillcolor: 'rgba(200, 200, 200, .3)',
        line: { color: 'transparent' },
        name: this.$t('widgetChartTraceValueRange'),
        hoverinfo: 'skip',
        type: 'scatter'
      }
      const avg = {
        x: sortedDates.map(d => new Date(d)),
        y: totals.map((t, i) => t / counts[i]),
        type: 'scatter',
        mode: 'lines',
        name: this.$t('widgetChartTraceAverage'),
        line: { color: '#7f8c8d' }
      }

      for (let i = 0; i < sortedDates.length; i++) {
        background.x.push(new Date(sortedDates[i]))
        background.y.push(maxs[i])
      }
      for (let i = sortedDates.length - 1; i >= 0; i--) {
        background.x.push(new Date(sortedDates[i]))
        background.y.push(mins[i])
      }

      traces.unshift(avg)
      traces.unshift(background)

      const layout = {
        hovermode: 'x',
        height: 500 + traces.length * 5,
        autosize: true,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: {
          automargin: true,
          showgrid: false,
          zeroline: true,
          showline: true,
          title: { text: this.$t('widgetChartTimeseriesAxisTitleTime'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
          tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
        },
        yaxis: {
          automargin: true,
          showgrid: false,
          zeroline: true,
          showline: true,
          rangemode: 'tozero',
          title: { text: this.trait.name, font: { color: this.storeDarkMode ? 'white' : 'black' } },
          tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
        },
        legend: { orientation: 'h', x: 1, y: 1.2, xanchor: 'right', font: { color: this.storeDarkMode ? 'white' : 'black' } },
        shapes: [],
        annotations: []
      }

      if (this.trial.events && this.trial.events.length > 0) {
        this.trial.events.forEach(e => {
          layout.annotations.push({
            yref: 'paper',
            x: new Date(e.timestamp),
            y: 1,
            text: e.content,
            showarrow: true,
            arrowhead: 7,
            ax: 0,
            ay: -40
          })
          layout.shapes.push({
            type: 'line',
            yref: 'paper',
            x0: new Date(e.timestamp),
            y0: 0,
            x1: new Date(e.timestamp),
            y1: 1,
            line: {
              width: 1.5,
              dash: 'dot'
            }
          })
        })
      }

      const config = {
        responsive: true,
        toImageButtonOptions: {
          format: 'png',
          filename: `timeline-${this.safeTrialName}-${this.trait.name}-${toLocalDateString(new Date())}`,
          width: 1280,
          height: 720
        },
        displaylogo: false
      }

      Plotly.newPlot(this.$refs.tlTrait, traces, layout, config)
    },
    update: function () {
      this.trialData = getTrialDataCached()

      if (this.trialData) {
        const result = Object.keys(this.trialData).map(k => this.trialData[k].displayName)
        result.sort()
        this.allGermplasm = result
      } else {
        this.allGermplasm = []
      }

      if (this.trial) {
        this.$nextTick(() => this.plot())
      }
    }
  },
  mounted: function () {
    emitter.on('trial-data-loaded', this.update)

    this.update()
  },
  beforeUnmount: function () {
    emitter.off('trial-data-loaded', this.update)
  }
}
</script>

<style scoped>
.badge-close {
  color: inherit;
  font-size: 125%;
  line-height: 1;
  float: none;
  margin-left: 0.25rem;
}
.select-search-wrapper input {
  border-bottom-right-radius: 0;
  border-bottom-left-radius: 0;
}
.select-search-wrapper select {
  border-top-right-radius: 0;
  border-top-left-radius: 0;
  border-top: 0;
}
</style>
