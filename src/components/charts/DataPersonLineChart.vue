<template>
  <div>
    <h3>{{ $t('widgetDataPersonChartLineTitle') }}</h3>
    <div ref="chart" v-if="chartData" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import Plotly from 'plotly.js/lib/core'
import scatter from 'plotly.js/lib/scatter'

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  scatter
])

export default {
  props: {
    chartData: {
      type: Object,
      default: () => null
    }
  },
  computed: {
    ...mapGetters([
      'storeLocale',
      'storeDarkMode'
    ])
  },
  watch: {
    storeLocale: function () {
      this.update()
    },
    storeDarkMode: function () {
      this.update()
    },
    chartData: function () {
      this.$nextTick(() => this.update())
    }
  },
  methods: {
    update: function () {
      try {
        Plotly.purge(this.$refs.chart)
      } catch {
      }

      if (!this.chartData) {
        return
      }

      const data = Object.values(this.chartData)

      const layout = {
        height: 400,
        margin: {
          t: 0
        },
        hovermode: 'x',
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: {
          showgrid: false,
          title: { text: this.$t('widgetChartPersonLineTime'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
          tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
        },
        yaxis: {
          showgrid: false,
          title: { text: this.$t('widgetChartPersonLineCumulative'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
          tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
        },
        legend: {
          bgcolor: 'rgba(0,0,0,0)',
          orientation: 'h',
          font: { color: this.storeDarkMode ? 'white' : 'black' }
        }
      }

      const config = {
        responsive: true,
        displaylogo: false
      }

      Plotly.newPlot(this.$refs.chart, data, layout, config)
    }
  },
  beforeUnmount: function () {
    try {
      Plotly.purge(this.$refs.chart)
    } catch {
    }
  },
  mounted: function () {
    this.update()
  }
}
</script>

<style>

</style>
