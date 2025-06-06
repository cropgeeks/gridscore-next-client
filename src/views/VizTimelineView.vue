<template>
  <div>
    <b-container fluid class="my-4" v-if="trial">
      <h1 class="display-4">{{ $t('pageVisualizationTimelineTitle') }}</h1>
      <p>{{ $t('pageVisualizationTimelineText') }}</p>

      <section v-if="noRepeatTraits && noRepeatTraits.length > 0">
        <h2>{{ $t('pageVisualizationNoRepeatTraitsTitle') }}</h2>
        <p>{{ $t('pageVisualizationNoRepeatTraitsText') }}</p>

        <div ref="noRepeatTraits" class="time-chart" />
      </section>
      <section v-if="repeatTraits && repeatTraits.length > 0">
        <h2>{{ $t('pageVisualizationRepeatTraitsTitle') }}</h2>
        <p>{{ $t('pageVisualizationRepeatTraitsText') }}</p>

        <div v-for="trait in repeatTraits" :key="`timeline-repeat-${trait.trait.id}`">
          <h3><TraitHeading hasData :trait="trait.trait" :traitIndex="trait.index" :short="true" /></h3>
          <MultiTraitTimeline :trial="trial" :trait="trait.trait" :traitIndex="trait.index" />
        </div>
      </section>
    </b-container>
  </div>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import TraitHeading from '@/components/TraitHeading.vue'
import MultiTraitTimeline from '@/components/MultiTraitTimeline.vue'
import { getTrialDataCached } from '@/plugins/datastore'
import { getTrialById } from '@/plugins/idb'
import { toLocalDateString } from '@/plugins/misc'

import emitter from 'tiny-emitter/instance'

import Plotly from 'plotly.js/lib/core'
import scatter from 'plotly.js/lib/scatter'

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  scatter
])

export default {
  components: {
    TraitHeading,
    MultiTraitTimeline
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeDarkMode',
      'storeLocale',
      'storeSelectedTrial'
    ]),
    safeTrialName: function () {
      if (this.trial) {
        return this.trial.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      } else {
        return ''
      }
    },
    repeatTraits: function () {
      if (this.trial) {
        return this.trial.traits.map((t, i) => {
          return {
            index: i,
            trait: t
          }
        }).filter(t => t.trait.allowRepeats && (t.trait.dataType === 'int' || t.trait.dataType === 'float' || t.trait.dataType === 'range'))
      } else {
        return []
      }
    },
    noRepeatTraits: function () {
      if (this.trial) {
        return this.trial.traits.map((t, i) => {
          return {
            index: i,
            trait: t
          }
        }).filter(t => !t.trait.allowRepeats || !(t.trait.dataType === 'int' || t.trait.dataType === 'float' || t.trait.dataType === 'range'))
      } else {
        return []
      }
    }
  },
  data: function () {
    return {
      trial: null
    }
  },
  watch: {
    storeDarkMode: function () {
      this.update()
    },
    storeLocale: function () {
      this.update()
    }
  },
  methods: {
    updateNoRepeatChart: function () {
      if (this.trialData && this.$refs.noRepeatTraits) {
        try {
          Plotly.purge(this.$refs.noRepeatTraits)
        } catch {
        }

        const plotCount = Object.keys(this.trialData).length

        const traces = this.noRepeatTraits.map(t => {
          const trait = t.trait

          const dateCounts = {}

          Object.keys(this.trialData).forEach(k => {
            const cell = this.trialData[k]

            if (cell.measurements[trait.id]) {
              cell.measurements[trait.id].forEach(m => {
                const date = new Date(m.timestamp)
                date.setHours(0, 0, 0, 0)
                const time = date.getTime()

                if (!dateCounts[time]) {
                  dateCounts[time] = 1
                } else {
                  dateCounts[time]++
                }
              })
            }
          })

          const sorted = Object.keys(dateCounts).map(t => +t).sort((a, b) => a - b)

          let counter = 0
          const y = []
          sorted.forEach(t => {
            counter += dateCounts[t]
            y.push(counter * 100 / plotCount)
          })

          return {
            x: sorted.map(t => new Date(t)),
            y,
            type: 'scatter',
            mode: 'lines+markers',
            showlegend: true,
            name: trait.name,
            line: {
              color: trait.color
            }
          }
        })

        const layout = {
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          hovermode: 'x',
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
            title: { text: this.$t('widgetChartTimeseriesAxisTitlePlotsScored'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
            tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
          },
          legend: { orientation: 'h', font: { color: this.storeDarkMode ? 'white' : 'black' } },
          annotations: [],
          shapes: []
        }

        if (this.trial.events && this.trial.events.length > 0) {
          this.trial.events.forEach((e, i) => {
            const ay = 20 + (i / Math.max(1, this.trial.events.length - 1)) * 60
            layout.annotations.push({
              yref: 'paper',
              x: new Date(e.timestamp),
              y: 1,
              text: e.content,
              showarrow: true,
              arrowhead: 7,
              ax: 0,
              ay: -ay,
              arrowcolor: this.storeDarkMode ? 'white' : 'black',
              font: {
                color: this.storeDarkMode ? 'white' : 'black'
              }
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
                dash: 'dot',
                color: this.storeDarkMode ? 'white' : 'black'
              }
            })
          })
        }

        Plotly.newPlot(this.$refs.noRepeatTraits, traces, layout, {
          responsive: true,
          toImageButtonOptions: {
            format: 'png',
            filename: `timeline-${this.safeTrialName}-${toLocalDateString(new Date())}`,
            width: 1280,
            height: 720
          },
          displaylogo: false
        })
      }
    },
    update: function () {
      getTrialById(this.storeSelectedTrial)
        .then(trial => {
          this.trial = trial

          this.trialData = getTrialDataCached()

          if (this.trial) {
            this.$nextTick(() => this.updateNoRepeatChart())
          }
        })
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
.time-chart {
  height: 66vh;
}
</style>
