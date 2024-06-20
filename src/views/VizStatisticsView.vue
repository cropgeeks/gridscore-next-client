<template>
  <div>
    <b-container fluid class="my-4">
      <h1 class="display-4">{{ $t('pageVisualizationStatisticsTitle') }}</h1>
      <p>{{ $t('pageVisualizationStatisticsText') }}</p>

      <div v-if="trial">
        <b-row class="mb-3">
          <b-col cols=12 md=6 lg=4 xl=3>
            <b-form-group :label="$t('formLabelStatisticsTrait')" :description="$t('formDescriptionStatisticsTrait')" label-for="trait">
              <b-form-select multiple v-model="selectedTraitIndices" :select-size="selectSize" :options="traitOptions" id="trait" />
            </b-form-group>
          </b-col>
          <b-col cols=12 md=6 lg=4 xl=3>
            <b-form-group :label="$t('formLabelStatisticsGermplasm')" :description="$t('formDescriptionStatisticsGermplasm')" label-for="germplasmSearch">
              <b-form-input v-model="searchTerm" type="search" :placeholder="$t('formPlaceholderTimelinePlotSearch')" id="germplasmSearch" />
              <b-input-group>
                <b-form-select multiple :options="filteredGermplasm" v-model="selectedGermplasmTemp" />
                <b-input-group-append>
                  <b-button @click="addGermplasm"><IBiPlusSquareFill /></b-button>
                </b-input-group-append>
              </b-input-group>
            </b-form-group>

            <div v-if="selectedGermplasm && selectedGermplasm.length > 0" class="germplasm-selection-badges">
              <b-badge class="me-2" v-for="(germplasm, index) in selectedGermplasm" :key="`germplasm-badge-${germplasm}`" >
                {{ germplasm }} <button type="button" class="btn-close badge-close" @click="removeGermplasm(index)">×</button>
              </b-badge>

              <b-badge class="me-2" variant="danger" href="#" @click.prevent="clearSelectedGermplasm" >
                <IBiTrash /> {{ $t('buttonClear') }}
              </b-badge>
            </div>
          </b-col>
          <b-col cols=12>
            <b-button variant="primary" @click="updateTraits"><IBiArrowClockwise /> {{ $t('buttonUpdate') }}</b-button>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols=12 lg=6 v-for="(t, tIndex) in selectedTraits" :key="`trait-heading-${t.trait.id}`">
            <div class="d-flex flex-row justify-content-between align-items-center flex-wrap">
              <h2><TraitHeading :short="true" :trait="t.trait" :traitIndex="t.index" /></h2>
              <b-form-checkbox switch v-model="chartInteractionEnabled[tIndex]" @input="toggleChartInteraction(tIndex)"> {{ $t(chartInteractionEnabled[tIndex] ? 'formCheckboxChartInteractEnabled' : 'formCheckboxChartInteractDisabled') }}</b-form-checkbox>
            </div>
            <p v-if="t.trait.description">{{ t.trait.description }}</p>

            <div :ref="`trait-stats-chart-${t.trait.id}`" />
          </b-col>
        </b-row>
      </div>
    </b-container>

    <b-modal ref="plotModal" :title="$t('modalTitleVizPlotDataDetails')" ok-only :ok-title="$t('buttonClose')" v-if="selectedCell && selectedTrait">
      <PlotDataSection :trial="trial" :cell="selectedCell" :traits="[selectedTrait]" />
    </b-modal>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import TraitHeading from '@/components/TraitHeading.vue'
import { getTrialDataCached } from '@/plugins/datastore'
import { getTrialById } from '@/plugins/idb'
import { hexToRgba, invertHex, toLocalDateString } from '@/plugins/misc'
import PlotDataSection from '@/components/PlotDataSection.vue'
import { CELL_CATEGORIES, CELL_CATEGORY_CONTROL, DISPLAY_ORDER_BOTTOM_TO_TOP, DISPLAY_ORDER_RIGHT_TO_LEFT } from '@/plugins/constants'

import emitter from 'tiny-emitter/instance'

import Plotly from 'plotly.js/lib/core'
import bar from 'plotly.js/lib/bar'
import box from 'plotly.js/lib/box'

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  bar,
  box
])

const GENERIC_TRACE = 'GENERIC_TRACE'

export default {
  components: {
    TraitHeading,
    PlotDataSection
  },
  computed: {
    ...mapGetters([
      'storeHighlightControls',
      'storeSelectedTrial',
      'storeDarkMode',
      'storeLocale'
    ]),
    selectSize: function () {
      if (this.traitOptions) {
        return Math.min(5, this.traitOptions.length)
      } else {
        return 3
      }
    },
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
    },
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
    }
  },
  data: function () {
    return {
      trial: null,
      selectedTraitIndices: [],
      selectedTraits: [],
      selectedTrait: null,
      selectedCell: null,
      allGermplasm: [],
      selectedGermplasm: [],
      selectedGermplasmTemp: [],
      searchTerm: null,
      chartInteractionEnabled: null
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
    },
    selectedGermplasm: function () {
      this.update()
    }
  },
  methods: {
    clearSelectedGermplasm: function () {
      this.selectedGermplasm = []
      this.selectedGermplasmTemp = []
    },
    removeGermplasm: function (index) {
      this.selectedGermplasm.splice(index, 1)
    },
    addGermplasm: function () {
      const set = new Set()
      this.selectedGermplasm.forEach(g => set.add(g))
      this.selectedGermplasmTemp.forEach(g => set.add(g))
      this.selectedGermplasm = [...set].sort((a, b) => a.localeCompare(b))
      this.selectedGermplasmTemp = []
    },
    updateTraits: function () {
      this.selectedTraits = this.selectedTraitIndices.map(i => {
        return {
          index: i,
          trait: this.trial.traits[i]
        }
      })
    },
    toggleChartInteraction: function (traitIndex) {
      const ref = this.$refs[`trait-stats-chart-${this.trial.traits[traitIndex].id}`]

      if (ref) {
        const layoutDelta = {
          'xaxis.fixedrange': this.chartInteractionEnabled[traitIndex],
          'yaxis.fixedrange': this.chartInteractionEnabled[traitIndex]
        }

        Plotly.relayout(ref[0], layoutDelta)
      }
    },
    update: function () {
      this.chartInteractionEnabled = this.selectedTraits.map(_ => false)

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

          let supportsClicking = true

          switch (trait.dataType) {
            case 'float':
            case 'int':
            case 'range':
            case 'date': {
              chartType = 'box'
              const datapoints = {}
              datapoints[GENERIC_TRACE] = []
              this.selectedGermplasm.forEach(g => {
                datapoints[g] = []
              })

              Object.keys(this.trialData).forEach(k => {
                const cell = this.trialData[k]

                if (cell.measurements && cell.measurements[trait.id]) {
                  const isSelected = this.selectedGermplasm.includes(cell.displayName)
                  cell.measurements[trait.id].forEach(m => {
                    const dateString = new Date(m.timestamp).toLocaleString()
                    m.values.forEach((v, setIndex) => {
                      const dp = {
                        displayColumn: cell.displayColumn,
                        displayRow: cell.displayRow,
                        row: cell.row,
                        column: cell.column,
                        setIndex: setIndex,
                        value: v,
                        name: cell.displayName,
                        rep: cell.rep,
                        date: dateString,
                        timestamp: m.timestamp,
                        categories: cell.categories
                      }

                      if (isSelected) {
                        if (!datapoints[cell.displayName]) {
                          datapoints[cell.displayName] = []
                        }

                        datapoints[cell.displayName].push(dp)
                      }

                      datapoints[GENERIC_TRACE].push(dp)
                    })
                  })
                }
              })

              this.selectedGermplasm.forEach(k => {
                const dps = datapoints[k]

                if (dps) {
                  data.unshift({
                    x: dps.map(d => d.value),
                    text: dps.map(d => d.name),
                    customdata: dps.map(d => this.$t('tooltipChartBoxplotInfo', { date: d.date, germplasm: d.name, rep: d.rep, row: d.displayRow, column: d.displayColumn })),
                    ids: dps.map(d => `${d.row}|${d.column}|${d.setIndex}|${d.timestamp}|${d.value}`),
                    name: k,
                    type: chartType,
                    jitter: 0.5,
                    pointpos: 2,
                    boxpoints: 'all',
                    hovertemplate: '%{xaxis.title.text}: %{x}<br>%{customdata}<extra></extra>'
                  })
                }
              })

              const dps = datapoints[GENERIC_TRACE]
              if (dps) {
                data.push({
                  x: dps.map(d => d.value),
                  text: dps.map(d => d.name),
                  customdata: dps.map(d => this.$t('tooltipChartBoxplotInfo', { date: d.date, germplasm: d.name, rep: d.rep, row: d.displayRow, column: d.displayColumn, categories: (d.categories || []).map(c => this.$t(CELL_CATEGORIES[c].title)).join(', ') })),
                  ids: dps.map(d => `${d.row}|${d.column}|${d.setIndex}|${d.timestamp}|${d.value}`),
                  marker: {
                    color: this.storeHighlightControls ? dps.map(d => (d.categories && d.categories.includes(CELL_CATEGORY_CONTROL)) ? invertHex(trait.color) : trait.color) : trait.color
                  },
                  name: this.$t('widgetChartStatisticsBoxplotAllTrace'),
                  type: chartType,
                  jitter: 0.5,
                  pointpos: 2,
                  boxpoints: 'all',
                  hovertemplate: '%{xaxis.title.text}: %{x}<br>%{customdata}<extra></extra>',
                  fillcolor: hexToRgba(trait.color, 0.5),
                  hoverlabel: {
                    bgcolor: trait.color
                  }
                })
              }

              break
            }
            case 'text':
            case 'categorical': {
              supportsClicking = false
              chartType = 'bar'
              const datapoints = {}
              datapoints[GENERIC_TRACE] = []
              this.selectedGermplasm.forEach(g => {
                datapoints[g] = []
              })

              let keys = new Set()

              Object.keys(this.trialData).forEach(k => {
                const cell = this.trialData[k]

                if (cell.measurements && cell.measurements[trait.id]) {
                  const isSelected = this.selectedGermplasm.includes(cell.displayName)
                  cell.measurements[trait.id].forEach(m => {
                    m.values.forEach(v => {
                      let value
                      if (trait.dataType === 'categorical') {
                        value = trait.restrictions.categories[v]
                        keys.add(trait.restrictions.categories[v])
                      } else {
                        value = v
                        keys.add(v)
                      }

                      if (isSelected) {
                        if (!datapoints[cell.displayName]) {
                          datapoints[cell.displayName] = []
                        }

                        datapoints[cell.displayName].push(value)
                      }

                      datapoints[GENERIC_TRACE].push(value)
                    })
                  })
                }
              })

              if (trait.dataType === 'categorical' && trait.restrictions && trait.restrictions.categories) {
                keys = trait.restrictions.categories
              } else {
                keys = [...keys].sort()
              }

              this.selectedGermplasm.forEach(k => {
                const dps = datapoints[k]

                if (dps) {
                  data.unshift({
                    x: keys,
                    y: keys.map(k => dps.filter(dp => dp === k).length),
                    name: k,
                    type: chartType
                  })
                }
              })

              const dps = datapoints[GENERIC_TRACE]
              if (dps) {
                data.push({
                  x: keys,
                  y: keys.map(k => dps.filter(dp => dp === k).length),
                  marker: {
                    color: trait.color
                  },
                  name: this.$t('widgetChartStatisticsBoxplotAllTrace'),
                  type: chartType
                })
              }

              break
            }
          }

          const layout = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            height: chartType === 'box' ? (this.selectedGermplasm.length * 50 + 400) : null,
            barmode: 'group',
            margin: {
              l: 30,
              r: 30
            },
            legend: {
              traceorder: 'reversed'
            },
            autosize: true,
            yaxis: {
              automargin: true,
              title: { text: '', font: { color: this.storeDarkMode ? 'white' : 'black' } },
              tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
              gridcolor: this.storeDarkMode ? '#111111' : '#eeeeee',
              showgrid: chartType === 'bar',
              fixedrange: true
            },
            xaxis: {
              zeroline: false,
              title: { text: '', font: { color: this.storeDarkMode ? 'white' : 'black' } },
              tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
              gridcolor: this.storeDarkMode ? '#111111' : '#eeeeee',
              showgrid: chartType === 'box',
              fixedrange: true
            },
            hovermode: chartType === 'box' ? 'closest' : 'x',
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
            modeBarButtonsToRemove: ['select2d', 'lasso2d'],
            toImageButtonOptions: {
              format: 'png',
              filename: `stats-${this.safeTrialName}-${filename}-${toLocalDateString(new Date())}`,
              width: 1280,
              height: 720
            },
            displaylogo: false
          }

          Plotly.newPlot(ref[0], data, layout, config)

          if (supportsClicking) {
            ref[0].on('plotly_click', eventData => {
              if (!eventData || (eventData.points.length < 1)) {
                Plotly.restyle(ref[0], { selectedpoints: [null] })
              } else {
                const mapped = eventData.points.map(p => {
                  const [row, column, setIndex, timestamp, value] = p.id.split('|')

                  return {
                    row: +row,
                    column: +column,
                    setIndex: +setIndex,
                    timestamp,
                    value
                  }
                }).filter((value, index, self) => self.indexOf(value) === index)

                // TODO: Do something with the selection here now.

                if (mapped.length === 1) {
                  this.selectedCell = this.trialData[`${mapped[0].row}|${mapped[0].column}`]
                  this.selectedTrait = trait

                  this.$nextTick(() => this.$refs.plotModal.show())
                }
              }
            })
          }
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

          if (this.trialData) {
            const result = Object.keys(this.trialData).map(k => this.trialData[k].displayName)
            result.sort()
            this.allGermplasm = result
          } else {
            this.allGermplasm = []
          }

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
  beforeUnmount: function () {
    emitter.off('trial-data-loaded', this.updateTrialDataCache)
  }
}
</script>

<style scoped>
.germplasm-selection-badges {
  max-height: 50vh;
  overflow-y: auto;
}
</style>
