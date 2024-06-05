<template>
  <div>
    <b-container fluid class="my-4">
      <h1 class="display-4">{{ $t('pageVisualizationHeatmapTitle') }}</h1>
      <p>{{ $t('pageVisualizationHeatmapText') }}</p>

      <b-row v-if="trial">
        <b-col :cols=12 :xl="cols">
          <FieldHeatmap :trial="trial" />
        </b-col>
        <b-col :cols=12 :xl="cols">
          <GermplasmRepHeatmap :trial="trial" @rep-count-changed="setRepCount" />
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import FieldHeatmap from '@/components/charts/FieldHeatmap.vue'
import GermplasmRepHeatmap from '@/components/charts/GermplasmRepHeatmap.vue'
import { getTrialById } from '@/plugins/idb'

export default {
  components: {
    FieldHeatmap,
    GermplasmRepHeatmap
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial'
    ]),
    cols: function () {
      if (this.trial) {
        if (this.repCount > 0 && this.repCount < 16 && this.trial.layout.columns < 16) {
          return 6
        } else {
          return 12
        }
      } else {
        return 12
      }
    }
  },
  data: function () {
    return {
      trial: null,
      repCount: 1
    }
  },
  methods: {
    setRepCount: function (repCount) {
      this.repCount = repCount
    }
  },
  mounted: function () {
    getTrialById(this.storeSelectedTrial)
      .then(trial => {
        this.trial = trial
      })
  }
}
</script>

<style scoped>

</style>
