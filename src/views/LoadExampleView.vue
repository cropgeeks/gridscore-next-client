<template>
  <b-container class="my-4">
    <h1 class="display-4">{{ $t('pageLoadExampleTitle') }}</h1>
    <p>{{ $t('pageLoadExampleText') }}</p>

     <b-row>
      <b-col cols=12 sm=6 md=4 class="mb-4" v-for="example in exampleTrials" :key="`example-trial-${example.id}`">
        <b-card class="home-card h-100 d-flex flex-column justify-content-between" no-body>
          <div>
            <b-card-img class="p-2 p-md-4 p-lg-5" :top="true" :src="require(`@/assets/img/example/${example.image}`)" />
            <b-card-body>
              <b-card-title>{{ example.name }}</b-card-title>
              <b-card-sub-title>{{ example.description }}</b-card-sub-title>
            </b-card-body>
          </div>

          <div>
            <b-card-body class="text-center bg-dark text-light">
              <b-row>
                <b-col cols=4>
                  <h1>{{ example.stats.traits }}</h1>
                  <span>{{ $t('pageLoadExampleStatsTraits') }}</span>
                </b-col>
                <b-col cols=4>
                  <h1>{{ example.stats.rows }}</h1>
                  <span>{{ $t('pageLoadExampleStatsRows') }}</span>
                </b-col>
                <b-col cols=4>
                  <h1>{{ example.stats.columns }}</h1>
                  <span>{{ $t('pageLoadExampleStatsColumns') }}</span>
                </b-col>
              </b-row>
            </b-card-body>
            <b-button class="w-100" variant="primary" @click="loadExample(example)"><BIconCloudDownload /> {{ $t('buttonLoad') }}</b-button>
          </div>
        </b-card>
      </b-col>
     </b-row>
  </b-container>
</template>

<script>
import { BIconCloudDownload } from 'bootstrap-vue'

import { addTrial } from '@/plugins/idb'

export default {
  components: {
    BIconCloudDownload
  },
  data: function () {
    return {
    }
  },
  computed: {
    exampleTrials: function () {
      return [{
        id: 'barley',
        name: this.$t('pageLoadExampleBarleyTrialName'),
        description: this.$t('pageLoadExampleBarleyTrialDescription'),
        source: 'barley.json',
        stats: {
          traits: 5,
          rows: 28,
          columns: 8
        },
        image: 'barley-trial.svg'
      }, {
        id: 'multi',
        name: this.$t('pageLoadExampleTimelineName'),
        description: this.$t('pageLoadExampleTimelineDescription'),
        source: 'timeline.json',
        stats: {
          traits: 2,
          rows: 5,
          columns: 8
        },
        image: 'timeline-trial.svg'
      }, {
        id: 'measurementset',
        name: this.$t('pageLoadExampleMeasurementSetName'),
        description: this.$t('pageLoadExampleMeasurementSetDescription'),
        source: 'measurementset.json',
        stats: {
          traits: 3,
          rows: 3,
          columns: 3
        },
        image: 'measurementset-trial.svg'
      }]
    }
  },
  methods: {
    loadExample: function (example) {
      const json = require(`@/assets/data/${example.source}`)

      json.createdOn = new Date().toISOString()
      json.updatedOn = new Date().toISOString()

      addTrial(json).then(trialId => {
        this.$store.dispatch('setSelectedTrial', trialId)
        this.$router.push({ name: 'home' })
      })
    }
  }
}
</script>

<style>

</style>
