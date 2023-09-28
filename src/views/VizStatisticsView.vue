<template>
  <div>
    <b-container fluid class="my-4">
      <h1 class="display-4">{{ $t('pageVisualizationStatisticsTitle') }}</h1>
      <p>{{ $t('pageVisualizationStatisticsText') }}</p>

      <div v-if="trial">
        <b-row class="mb-3">
          <b-col cols=12 md=6 lg=4 xl=3>
            <b-form-group :label="$t('formLabelStatisticsTrait')" :description="$t('formDescriptionStatisticsTrait')" label-for="trait">
              <b-form-select multiple v-model="selectedTraitIndices" :options="traitOptions" id="trait" />
            </b-form-group>
            <b-button variant="primary" @click="updateTraits"><BIconArrowClockwise /> {{ $t('buttonUpdate') }}</b-button>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols=12 lg=6 v-for="t in selectedTraits" :key="`trait-heading-${t.trait.id}`">
            <h2><TraitHeading :short="true" :trait="t.trait" :traitIndex="t.index" /></h2>
            <p v-if="t.trait.description">{{ t.trait.description }}</p>

            <div :ref="`trait-stats-chart-${t.trait.id}`" />
          </b-col>
        </b-row>
      </div>
    </b-container>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import TraitHeading from '@/components/TraitHeading'
import { getTrialDataCached } from '@/plugins/datastore'
import { BIconArrowClockwise } from 'bootstrap-vue'
import { getTrialById } from '@/plugins/idb'
import { toLocalDateString } from '@/plugins/misc'

const emitter = require('tiny-emitter/instance')

const Plotly = require('plotly.js/lib/core')

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  require('plotly.js/lib/bar'),
  require('plotly.js/lib/box')
])

export default {
  components: {
    TraitHeading,
    BIconArrowClockwise
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial',
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
      trial: null,
      selectedTraitIndices: [],
      selectedTraits: []
    }
  },
  watch: {
    storeDarkMode: function () {
      this.update()
    },
    storeLocale: function () {
      this.update()
    },
    selectedTraits: function () {
      this.$nextTick(() => this.update())
    }
  },
  methods: {
    updateTraits: function () {
      this.selectedTraits = this.selectedTraitIndices.map(i => {
        return {
          index: i,
          trait: this.trial.traits[i]
        }
      })
    },
    update: function () {
      this.selectedTraits.forEach(t => {
        const trait = t.trait
        const ref = this.$refs[`trait-stats-chart-${trait.id}`]

        if (ref) {
          try {
            Plotly.purge(ref[0])
          } catch {
          }

          const data = []
          let chartType

          switch (trait.dataType) {
            case 'float':
            case 'int':
            case 'date': {
              chartType = 'box'
              const datapoints = []

              Object.keys(this.trialData).forEach(k => {
                const cell = this.trialData[k]

                if (cell.measurements && cell.measurements[trait.id]) {
                  cell.measurements[trait.id].forEach(m => {
                    m.values.forEach(v => {
                      datapoints.push({ value: v, name: cell.displayName, date: new Date(m.timestamp).toLocaleString() })
                    })
                  })
                }
              })

              data.push({
                x: datapoints.map(d => d.value),
                text: datapoints.map(d => d.name),
                customdata: datapoints.map(d => d.date),
                marker: {
                  color: trait.color
                },
                name: '',
                type: chartType,
                jitter: 0.5,
                pointpos: 2,
                boxpoints: 'all',
                hovertemplate: '%{xaxis.title.text}: %{x}<br>%{customdata}<extra></extra>'
              })
              break
            }
            case 'text':
            case 'categorical': {
              chartType = 'bar'
              const map = {}
              const datapoints = []

              Object.keys(this.trialData).forEach(k => {
                const cell = this.trialData[k]

                if (cell.measurements && cell.measurements[trait.id]) {
                  cell.measurements[trait.id].forEach(m => {
                    m.values.forEach(v => {
                      if (trait.dataType === 'categorical') {
                        datapoints.push(trait.restrictions.categories[v])
                      } else {
                        datapoints.push(v)
                      }
                    })
                  })
                }
              })

              datapoints.forEach(c => {
                if (map[c]) {
                  map[c] += 1
                } else {
                  map[c] = 1
                }
              })

              let keys
              if (trait.dataType === 'categorical' && trait.restrictions && trait.restrictions.categories) {
                keys = trait.restrictions.categories
              } else {
                keys = Object.keys(map).sort()
              }

              data.push({
                x: keys,
                y: keys.map(k => map[k]),
                type: chartType,
                marker: {
                  color: trait.color
                }
              })
              break
            }
          }

          const layout = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            margin: {
              l: 30,
              r: 30
            },
            autosize: true,
            yaxis: {
              automargin: true,
              title: { text: '', font: { color: this.storeDarkMode ? 'white' : 'black' } },
              tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
              gridcolor: this.storeDarkMode ? '#111111' : '#eeeeee',
              showgrid: chartType === 'bar'
            },
            xaxis: {
              zeroline: false,
              title: { text: '', font: { color: this.storeDarkMode ? 'white' : 'black' } },
              tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
              gridcolor: this.storeDarkMode ? '#111111' : '#eeeeee',
              showgrid: chartType === 'box'
            },
            hovermode: 'closest',
            shapes: []
          }

          if (trait.restrictions) {
            if (trait.restrictions.min !== undefined && trait.restrictions.min !== null) {
              layout.shapes.push({
                type: 'line',
                yref: 'paper',
                x0: trait.restrictions.min,
                y0: 0,
                x1: trait.restrictions.min,
                y1: 1,
                line: {
                  color: trait.color,
                  width: 1.5,
                  dash: 'dot'
                }
              })
            }
            if (trait.restrictions.max !== undefined && trait.restrictions.max !== null) {
              layout.shapes.push({
                type: 'line',
                yref: 'paper',
                x0: trait.restrictions.max,
                y0: 0,
                x1: trait.restrictions.max,
                y1: 1,
                line: {
                  color: trait.color,
                  width: 1.5,
                  dash: 'dot'
                }
              })
            }
          }

          if (trait.dataType === 'categorical' || trait.dataType === 'text') {
            layout.xaxis.type = 'category'
            layout.xaxis.title.text = trait.name
            layout.yaxis.title.text = this.$t('widgetChartAxisCount')
          } else {
            layout.xaxis.title.text = trait.name
          }

          const filename = trait.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
          const config = {
            responsive: true,
            toImageButtonOptions: {
              format: 'png',
              filename: `stats-${this.safeTrialName}-${filename}-${toLocalDateString(new Date())}`,
              width: 1280,
              height: 720
            },
            displaylogo: false
          }

          Plotly.newPlot(ref[0], data, layout, config)
        }
      })
    },
    updateTrialDataCache: function () {
      getTrialById(this.storeSelectedTrial)
        .then(trial => {
          this.trial = trial

          this.trialData = getTrialDataCached()
          this.selectedTraits = []
          this.selectedTraitIndices = []

          if (this.trial) {
            this.$nextTick(() => this.update())
          }
        })
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
