<template>
  <b-container class="mt-4">
    <h1 class="display-4">{{ $t('pageGermplasmPerformanceTitle') }}</h1>

    <p>{{ $t('pageGermplasmPerformanceText') }}</p>

    <h2 v-if="germplasmIdentifier">{{ germplasmIdentifier }}</h2>

    <b-row v-if="numericTraits.length > 0">
      <b-col cols=12 sm=6 md=4 lg=3 v-for="trait in numericTraits" :key="`trial-scale-${trait.id}`" class="mb-3">
        <Scale :trait="trait" :traitStats="numericTraitStats[trait.id]" :germplasmStats="germplasmNumericStats[trait.id]" v-if="numericTraitStats[trait.id].count > 0" />
      </b-col>
    </b-row>

    <b-row v-if="nonNumericTraits.length > 0">
      <b-col cols=12 md=6 lg=4 xl=3 v-for="trait in nonNumericTraits" :key="`trial-scale-${trait.id}`" class="mb-3">
        <GermplasmPerformanceBarChart :germplasmName="germplasmIdentifier" :trait="trait" :traitStats="nonNumericTraitStats[trait.id]" v-if="nonNumericTraitStats[trait.id].count > 0" />
      </b-col>
    </b-row>
    
    <MapComponent :highlightCheck="toHighlight" :showControls="false" v-if="hasGps" />

    <p v-if="error" class="text-danger">{{ $t(error) }}</p>
  </b-container>
</template>

<script>
import { getTrialById } from '@/plugins/idb'
import { mapGetters } from 'vuex'
import { getTrialDataCached } from '@/plugins/datastore'
import Scale from '@/components/charts/Scale.vue'
import GermplasmPerformanceBarChart from '@/components/charts/GermplasmPerformanceBarChart.vue'
import MapComponent from '@/components/MapComponent.vue'

export default {
  components: {
    MapComponent,
    Scale,
    GermplasmPerformanceBarChart
  },
  data: function () {
    return {
      trial: null,
      trialId: null,
      germplasmIdentifier: null,
      error: null,
      numericTraitStats: null,
      nonNumericTraitStats: null,
      germplasmNumericStats: null,
      hasGps: false
    }
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial'
    ]),
    numericTraits: function () {
      if (this.trial && this.trial.traits) {
        return this.trial.traits.filter(t => t.dataType === 'int' || t.dataType === 'float' || t.dataType === 'date' || t.dataType === 'range')
      } else {
        return []
      }
    },
    nonNumericTraits: function () {
      if (this.trial && this.trial.traits) {
        return this.trial.traits.filter(t => t.dataType === 'text' || t.dataType === 'categorical')
      } else {
        return []
      }
    }
  },
  watch: {
    numericTraits: function () {
      this.updateNumericStats()
    },
    nonNumericTraits: function () {
      this.updateNonNumericStats()
    }
  },
  methods: {
    toHighlight: function (cell) {
      return cell.germplasm === this.germplasmIdentifier
    },
    updateNonNumericStats: function () {
      const nonNumericTraitStats = {}
      this.nonNumericTraits.forEach(t => {
        nonNumericTraitStats[t.id] = {
          count: 0,
          values: new Set(),
          valueCounts: {},
          germplasmValueCounts: {}
        }
      })

      Object.values(this.trialData).forEach(cell => {
        const isSelected = cell.germplasm === this.germplasmIdentifier

        this.hasGps ||= cell.geography && (cell.geography.center || cell.geography.corners)

        this.nonNumericTraits.forEach(t => {
          const traitData = cell.measurements[t.id]

          if (traitData) {
            traitData.forEach(td => {
              td.values.forEach(v => {
                const textValue = t.dataType === 'categorical' ? t.restrictions.categories[v] : v

                nonNumericTraitStats[t.id].count++
                nonNumericTraitStats[t.id].values.add(textValue)
                nonNumericTraitStats[t.id].valueCounts[textValue] = (nonNumericTraitStats[t.id].valueCounts[textValue] || 0) + 1

                if (isSelected) {
                  nonNumericTraitStats[t.id].germplasmValueCounts[textValue] = (nonNumericTraitStats[t.id].germplasmValueCounts[textValue] || 0) + 1
                }
              })
            })
          }
        })
      })

      Object.values(nonNumericTraitStats).forEach(v => {
        v.values = [...v.values].sort((a, b) => a.localeCompare(b))
      })

      this.nonNumericTraitStats = nonNumericTraitStats
    },
    updateNumericStats: function () {
      const numericTraitStats = {}
      this.numericTraits.forEach(t => {
        numericTraitStats[t.id] = {
          min: Number.MAX_SAFE_INTEGER,
          max: -Number.MAX_SAFE_INTEGER,
          total: 0,
          avg: 0,
          count: 0
        }
      })

      const germplasmNumericStats = {}
      this.numericTraits.forEach(t => {
        germplasmNumericStats[t.id] = {
          total: 0,
          avg: 0,
          count: 0
        }
      })

      Object.values(this.trialData).forEach(cell => {
        const isSelected = cell.germplasm === this.germplasmIdentifier

        this.hasGps ||= cell.geography && (cell.geography.center || cell.geography.corners)

        this.numericTraits.forEach(t => {
          const traitData = cell.measurements[t.id]

          if (traitData) {
            traitData.forEach(td => {
              td.values.forEach(v => {
                const numeric = t.dataType === 'date' ? (new Date(v).getTime() / (1000 * 60 * 60 * 24)) : +v

                if (isSelected) {
                  germplasmNumericStats[t.id].count++
                  germplasmNumericStats[t.id].total += numeric
                }

                numericTraitStats[t.id].count++
                numericTraitStats[t.id].min = Math.min(numericTraitStats[t.id].min, numeric)
                numericTraitStats[t.id].max = Math.max(numericTraitStats[t.id].max, numeric)
                numericTraitStats[t.id].total += numeric
              })
            })
          }
        })
      })

      Object.values(germplasmNumericStats).forEach(gs => {
        gs.avg = gs.total / gs.count
      })

      Object.values(numericTraitStats).forEach(ts => {
        ts.avg = ts.total / ts.count
      })

      this.numericTraitStats = numericTraitStats
      this.germplasmNumericStats = germplasmNumericStats
    },
    updateTrialDataCache: function () {
      getTrialById(this.storeSelectedTrial)
        .then(trial => {
          this.trial = trial

          this.trialData = getTrialDataCached()
        })
    }
  },
  mounted: function () {
    if (this.$route.query) {
      if (this.storeSelectedTrial === this.$route.query.trialId) {
        if (this.$route.query.germplasmIdentifier) {
          this.germplasmIdentifier = this.$route.query.germplasmIdentifier

          this.updateTrialDataCache()
        } else {
          this.error = 'pageGermplasmPerformanceMissingGermplasm'
        }
      } else {
        this.error = 'pageGermplasmPerformanceIncompatibleTrial'
      }
    } else {
      this.error = 'pageGermplasmPerformanceIncompatibleParameters'
    }
  }
}
</script>

<style>

</style>
