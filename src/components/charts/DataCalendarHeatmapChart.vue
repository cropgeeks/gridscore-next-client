<template>
  <div ref="wrapper">
    <div ref="chart" />
  </div>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'

import Plotly from 'plotly.js/lib/core'
import heatmap from 'plotly.js/lib/heatmap'

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  heatmap
])

export default {
  props: {
    chartData: {
      type: Map,
      default: () => new Map()
    }
  },
  data: function () {
    return {
      width: 1000
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeLocale',
      'storeDarkMode'
    ]),
    dateFormat: function () {
      return new Intl.DateTimeFormat(this.storeLocale || 'en', { month: 'short' })
    },
    months: function () {
      if (this.dateFormat) {
        return [...Array(12).keys()].map(m => this.dateFormat.format(new Date(Date.UTC(2000, m, 1, 0, 0, 0)))).reverse()
      } else {
        return []
      }
    },
    isHorizontal: function () {
      return this.width < 720
    }
  },
  watch: {
    storeLocale: function () {
      this.update()
    },
    isHorizontal: function () {
      this.update()
    },
    storeDarkMode: function () {
      this.update()
    },
    chartData: function () {
      this.update()
    }
  },
  methods: {
    update: function () {
      try {
        Plotly.purge(this.$refs.chart)
      } catch {
      }

      let z = [
        new Array(31).fill(0),
        new Array(30).fill(0),
        new Array(31).fill(0),
        new Array(30).fill(0),
        new Array(31).fill(0),
        new Array(31).fill(0),
        new Array(30).fill(0),
        new Array(31).fill(0),
        new Array(30).fill(0),
        new Array(31).fill(0),
        new Array(29).fill(0),
        new Array(31).fill(0)
      ]

      let max = 0

      this.chartData.forEach((value, key) => {
        const d = new Date(key)
        z[11 - d.getMonth()][d.getDate() - 1] = value

        max = Math.max(max, value)
      })

      const x = Array.from(Array(31).keys()).map(i => i + 1)
      const y = this.months.concat()

      if (this.isHorizontal) {
        z = z[0].map((col, i) => z.reverse().map(row => row[i]))
      }

      const data = [{
        z,
        x: this.isHorizontal ? y.reverse() : x,
        y: this.isHorizontal ? x : y,
        name: '',
        type: 'heatmap',
        hoverongaps: false,
        xgap: 1,
        ygap: 1,
        colorscale: [
          [0, this.storeDarkMode ? '#2f2f2f' : '#e4e4e4'],
          [1, '#00a0f1']
        ],
        colorbar: {
          title: {
            side: 'right',
            font: { color: this.storeDarkMode ? 'white' : 'black' }
          },
          tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
          orientation: this.isHorizontal ? 'h' : 'v'
        },
        hovertemplate: '%{x}. %{y}: %{z}'
      }]

      let xAxis = {
        showgrid: false,
        tickmode: 'array',
        // nticks: 31,
        tickvals: Array.from(Array(31).keys()).map(i => i + 1),
        title: { text: this.$t('widgetChartHeatmapAxisTitleDay'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
        tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
      }
      let yAxis = {
        showgrid: false,
        title: { text: this.$t('widgetChartHeatmapAxisTitleMonth'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
        tickfont: { color: this.storeDarkMode ? 'white' : 'black' }
      }

      if (this.isHorizontal) {
        [xAxis, yAxis] = [yAxis, xAxis]
      }

      const layout = {
        height: this.isHorizontal ? 800 : 500,
        margin: {
          t: 0
        },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        xaxis: xAxis,
        yaxis: yAxis
      }

      const config = {
        responsive: true,
        displaylogo: false
      }

      Plotly.newPlot(this.$refs.chart, data, layout, config)
    },
    onResize: function () {
      this.width = this.$refs.wrapper.clientWidth
    }
  },
  beforeUnmount: function () {
    try {
      Plotly.purge(this.$refs.chart)
    } catch {
    }

    window.removeEventListener('resize', this.onResize)
  },
  mounted: function () {
    this.onResize()
    window.addEventListener('resize', this.onResize)
    this.update()
  }
}
</script>

<style>

</style>
