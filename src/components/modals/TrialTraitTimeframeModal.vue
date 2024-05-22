<template>
  <b-modal :title="$t('modalTitleTraitTimeframe')"
           :ok-title="$t('buttonClose')"
           ok-only
           no-fade
           @shown="addChart"
           @hidden="removeChart"
           size="lg"
           ref="trialTraitTimeframeModal">
    <div v-if="trial">
      <p>{{ $t('modalTextTraitTimeframe') }}</p>

      <div ref="timeframeChart" />
    </div>
  </b-modal>
</template>

<script>
import { toLocalDateString, toLocalDateTimeString } from '@/plugins/misc'
import { mapGetters } from 'vuex'
import Plotly from 'plotly.js/lib/core'
import bar from 'plotly.js/lib/bar'

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  bar
])

export default {
  components: {
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
    }
  },
  computed: {
    ...mapGetters([
      'storeDarkMode'
    ]),
    safeTrialName: function () {
      if (this.trial) {
        return this.trial.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      } else {
        return ''
      }
    }
  },
  methods: {
    addChart: function () {
      this.removeChart()

      if (!this.trial || !this.trial.traits) {
        return
      }

      const timeframeTraits = this.trial.traits.filter(t => t.timeframe).reverse()

      const xStart = timeframeTraits.map(t => {
        if (t.timeframe.start) {
          return t.timeframe.start
        } else if (t.timeframe.end) {
          return t.timeframe.end - 1
        } else {
          return null
        }
      })
      const xEnd = timeframeTraits.map(t => {
        if (t.timeframe.start && t.timeframe.end) {
          return new Date(t.timeframe.end) - new Date(t.timeframe.start)
        } else {
          return 1
        }
      })

      const paddingBars = {
        y: timeframeTraits.map(t => t.name),
        x: xStart,
        name: '',
        type: 'bar',
        orientation: 'h',
        hoverinfo: 'skip',
        showlegend: false,
        marker: {
          color: timeframeTraits.map(t => 'rgba(0, 0, 0, 0)')
        }
      }

      const visibleBars = {
        y: timeframeTraits.map(t => t.name),
        x: xEnd,
        customdata: timeframeTraits.map(t => {
          const start = t.timeframe.start
          const end = t.timeframe.end

          if (start && end) {
            return `${start} - ${end}<extra></extra>`
          } else if (start) {
            return `${start} - <extra></extra>`
          } else if (end) {
            return ` - ${end}<extra></extra>`
          } else {
            return '<extra></extra>'
          }
        }),
        name: '',
        type: 'bar',
        orientation: 'h',
        showlegend: false,
        hovertemplate: '%{customdata}',
        marker: {
          color: timeframeTraits.map(t => t.color)
        }
      }

      const data = [paddingBars, visibleBars]

      const layout = {
        barmode: 'stack',
        margin: { autoexpand: true },
        autosize: true,
        height: (25 * this.trial.traits.length) + 200,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: {
          title: { text: this.$t('widgetChartTraitTimeframeAxisTitleTime'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
          tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
        },
        yaxis: {
          title: { text: this.$t('widgetChartTraitTimeframeAxisTitleTrait'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
          tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
        },
        shapes: [{
          type: 'line',
          yref: 'paper',
          x0: toLocalDateString(new Date()),
          y0: 0,
          x1: toLocalDateString(new Date()),
          y1: 1,
          line: {
            color: this.storeDarkMode ? '#ecf0f1' : '#2c3e50',
            width: 1.5,
            dash: 'dot'
          }
        }],
        annotations: [{
          type: 'line',
          yref: 'paper',
          x: toLocalDateString(new Date()),
          y: 1.2,
          showarrow: false,
          text: this.$t('widgetChartTraitTimeframeToday'),
          font: {
            color: this.storeDarkMode ? '#ecf0f1' : '#2c3e50'
          }
        }]
      }

      Plotly.newPlot(this.$refs.timeframeChart, data, layout, {
        responsive: true,
        toImageButtonOptions: {
          format: 'png',
          filename: `trait-timeline-${this.safeTrialName}-${toLocalDateTimeString(new Date())}`
        },
        displaylogo: false
      })
    },
    removeChart: function () {
      try {
        Plotly.purge(this.$refs.timeframeChart)
      } catch {
        // Do nothing here
      }
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.trialTraitTimeframeModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.trialTraitTimeframeModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
