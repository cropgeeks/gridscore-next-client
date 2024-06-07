<template>
  <b-container class="mt-4">
    <h1 class="display-4">{{ $t('pageGermplasmPerformanceTitle') }}</h1>

    <p>{{ $t('pageGermplasmPerformanceText') }}</p>

    <h2 v-if="germplasmIdentifier">{{ germplasmIdentifier }}</h2>

    <b-row v-if="numericTraits.length > 0">
      <b-col cols=12 sm=6 md=4 lg=3 v-for="trait in numericTraits" :key="`trial-scale-${trait.id}`">
        <Scale :trait="trait" :traitStats="traitStats[trait.id]" :germplasmStats="germplasmStats[trait.id]" />
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
import MapComponent from '@/components/MapComponent.vue'

export default {
  components: {
    MapComponent,
    Scale
  },
  data: function () {
    return {
      trial: null,
      trialId: null,
      germplasmIdentifier: null,
      error: null,
      traitStats: null,
      germplasmStats: null,
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
    }
  },
  watch: {
    numericTraits: function () {
      this.updateStats()
    }
  },
  methods: {
    toHighlight: function (cell) {
      return cell.germplasm === this.germplasmIdentifier
    },
    updateStats: function () {
      const traitStats = {}
      this.numericTraits.forEach(t => {
        traitStats[t.id] = {
          min: Number.MAX_SAFE_INTEGER,
          max: -Number.MAX_SAFE_INTEGER,
          total: 0,
          avg: 0,
          count: 0
        }
      })

      const germplasmStats = {}
      this.numericTraits.forEach(t => {
        germplasmStats[t.id] = {
          total: 0,
          avg: 0,
          count: 0
        }
      })

      console.log(this.trialData)

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
                  germplasmStats[t.id].count++
                  germplasmStats[t.id].total += numeric
                }

                traitStats[t.id].count++
                traitStats[t.id].min = Math.min(traitStats[t.id].min, numeric)
                traitStats[t.id].max = Math.max(traitStats[t.id].max, numeric)
                traitStats[t.id].total += numeric
              })
            })
          }
        })
      })

      Object.values(germplasmStats).forEach(gs => {
        gs.avg = gs.total / gs.count
      })

      Object.values(traitStats).forEach(ts => {
        ts.avg = ts.total / ts.count
      })

      this.traitStats = traitStats
      this.germplasmStats = germplasmStats
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
