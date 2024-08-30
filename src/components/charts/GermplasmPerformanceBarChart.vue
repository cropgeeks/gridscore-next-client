<template>
  <div>
    <TraitHeading short :trait="trait" />
    <div ref="chart" v-if="trait && traitStats" />
  </div>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import TraitHeading from '@/components/TraitHeading.vue'

import Plotly from 'plotly.js/lib/core'
import bar from 'plotly.js/lib/bar'
import { shadeColor } from '@/plugins/color'
import { toLocalDateString } from '@/plugins/misc'

// Only register the chart types we're actually using to reduce the final bundle size
Plotly.register([
  bar
])

export default {
  components: {
    TraitHeading
  },
  props: {
    trait: {
      type: Object,
      default: () => null
    },
    traitStats: {
      type: Object,
      default: () => null
    },
    germplasmName: {
      type: String,
      default: ''
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeDarkMode',
      'storeLocale'
    ])
  },
  watch: {
    storeDarkMode: function () {
      this.update()
    },
    storeLocale: function () {
      this.update()
    },
    traitStats: function () {
      this.$nextTick(() => this.update())
    }
  },
  methods: {
    update: function () {
      try {
        Plotly.purge(this.$refs.chart)
      } catch {
      }

      if (!this.traitStats) {
        return
      }

      const vertical = this.traitStats.values.length > 5

      const oy = this.traitStats.values.map(v => this.traitStats.valueCounts[v])
      const gy = this.traitStats.values.map(v => this.traitStats.germplasmValueCounts[v] || 0)

      const data = [{
        x: vertical ? oy.concat().reverse() : this.traitStats.values,
        y: vertical ? this.traitStats.values.concat().reverse() : oy,
        type: 'bar',
        marker: { color: this.trait.color },
        offsetgroup: 0,
        orientation: vertical ? 'h' : 'v',
        name: this.$t('widgetChartGermplasmPerformanceOverall')
      }, {
        x: vertical ? gy.concat().reverse() : this.traitStats.values,
        y: vertical ? this.traitStats.values.concat().reverse() : gy,
        type: 'bar',
        marker: { color: shadeColor(this.trait.color, -35) },
        offsetgroup: 0,
        orientation: vertical ? 'h' : 'v',
        name: this.$t('widgetChartGermplasmPerformanceSelected')
      }]

      let xAxis = {
        showgrid: false,
        title: { text: this.$t('widgetChartGermplasmPerformanceTraitValue'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
        tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
        fixedrange: true
      }
      let yAxis = {
        showgrid: false,
        title: { text: this.$t('widgetChartGermplasmPerformanceCount'), font: { color: this.storeDarkMode ? 'white' : 'black' } },
        tickfont: { color: this.storeDarkMode ? 'white' : 'black' },
        fixedrange: true
      }

      if (vertical) {
        [xAxis, yAxis] = [yAxis, xAxis]
      }

      const layout = {
        height: vertical ? Math.max(400, this.traitStats.values.length * 50) : 400,
        margin: { t: 0 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        dragmode: false,
        xaxis: xAxis,
        yaxis: yAxis,
        hovermode: vertical ? 'y' : 'x',
        legend: {
          bgcolor: 'rgba(0,0,0,0)',
          orientation: 'h',
          x: 1,
          y: 1.2,
          xanchor: 'right',
          font: { color: this.storeDarkMode ? 'white' : 'black' },
          traceorder: 'normal'
        }
      }

      const traitName = this.trait.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      const germplasm = this.germplasmName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      Plotly.newPlot(this.$refs.chart, data, layout, {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['select2d', 'lasso2d'],
        toImageButtonOptions: {
          format: 'png',
          filename: `germplasm-perf-${germplasm}-${traitName}-${toLocalDateString(new Date())}`
        }
      })
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

<style scoped>
.scale-heading {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
