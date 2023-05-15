<template>
  <div v-if="trait">
    <b-button-group class="mb-3">
      <b-button v-for="mode in plotModes" :key="`plot-mode-${mode.value}`" :pressed="plotMode === mode.value" @click="plotMode = mode.value">
        <component :is="mode.icon" /> {{ mode.name }}
      </b-button>
    </b-button-group>
    <div v-if="plotMode === 'selection'" class="select-search-wrapper">
      <b-form-input v-model="searchTerm" type="search" :placeholder="$t('formPlaceholderTimelinePlotSearch')" />
      <b-input-group>
        <b-select multiple :options="filteredGermplasm" v-model="selectedGermplasmTemp" />
        <b-input-group-append>
          <b-button @click="addGermplasm"><BIconPlusSquareFill /></b-button>
        </b-input-group-append>
      </b-input-group>

      <div class="my-3">
        <b-badge class="mr-2" v-for="(germplasm, index) in selectedGermplasm" :key="`germplasm-badge-${germplasm}`">
          {{ germplasm }} <button type="button" class="close badge-close" @click="removeGermplasm(index)">×</button>
        </b-badge>
      </div>
    </div>
    <div ref="tlTrait" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { BIconCardChecklist, BIconCircleFill, BIconCardList, BIconHr, BIconPlusSquareFill } from 'bootstrap-vue'
import { getTrialDataCached } from '@/plugins/datastore'

const emitter = require('tiny-emitter/instance')

const Plotly = require('plotly.js/lib/core')

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  require('plotly.js/lib/scatter')
])

export default {
  components: {
    BIconCircleFill,
    BIconPlusSquareFill
  },
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
      searchTerm: null
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
        value: 'average',
        icon: BIconHr
      }, {
        name: this.$t('widgetTimelinePlotTypeAll'),
        value: 'all',
        icon: BIconCardChecklist
      }, {
        name: this.$t('widgetTimelinePlotTypeSelection'),
        value: 'selection',
        icon: BIconCardList
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
    plotData: function () {
      this.plot()
    },
    storeDarkMode: function () {
      this.plot()
    },
    plotMode: function () {
      this.plot()
    },
    selectedGermplasm: function () {
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
      const traces = []
      // For each field cell
      Object.keys(this.trialData).forEach(k => {
        const c = this.trialData[k]

        const traitMeasurements = c.measurements[this.trait.id] || []

        const dataPoints = traitMeasurements.map(m => {
          const date = new Date(m.timestamp)
          date.setHours(0, 0, 0, 0)
          const time = date.getTime()

          const existingValues = m.values.filter(v => v !== undefined && v !== null)
          const avg = existingValues.length > 0 ? existingValues.reduce((acc, val) => acc + (+val), 0) / existingValues.length : 0
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
            y: dataPoints.map(dp => dp.value)
          })
        }
      })

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
        legend: { orientation: 'h', x: 1, y: 1.2, xanchor: 'right', font: { color: this.storeDarkMode ? 'white' : 'black' } }
      }

      const config = {
        responsive: true,
        toImageButtonOptions: {
          format: 'png',
          filename: `timeline-${this.safeTrialName}-${this.trait.name}-${new Date().toISOString().split('T')[0]}`,
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
  beforeDestroy: function () {
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
