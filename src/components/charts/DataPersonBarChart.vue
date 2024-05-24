<template>
  <div ref="wrapper">
    <div ref="chart" v-if="chartData" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import Plotly from 'plotly.js/lib/core'
import bar from 'plotly.js/lib/bar'

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  bar
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
        height: data[0].y.length * 50,
        margin: {
          t: 0
        },
        hovermode: 'y',
        barmode: 'stack',
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: {
          showgrid: false,
          title: { text: this.$t('widgetChartPersonBarCount'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
          tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
        },
        yaxis: {
          showgrid: false,
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
  beforeDestroy: function () {
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
