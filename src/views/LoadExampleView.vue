<template>
  <b-container class="my-4">
    <h1 class="display-4">{{ $t('pageLoadExampleTitle') }}</h1>
    <p>{{ $t('pageLoadExampleText') }}</p>

     <b-row>
      <b-col cols=12 sm=6 md=4 xl=3 class="mb-4" v-for="example in exampleTrials" :key="`example-trial-${example.id}`">
        <b-card class="home-card h-100 d-flex flex-column justify-content-between" no-body>
          <div>
            <b-card-img class="p-2 p-md-4 p-lg-5" placement="top" :src="`img/example/${example.image}`" />
            <b-card-body>
              <b-card-title>{{ example.name }}</b-card-title>
              <b-card-subtitle><span v-html="example.description" /></b-card-subtitle>
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
            <b-button class="w-100" variant="primary" @click="loadExample(example)"><IBiCloudDownload /> {{ $t('buttonLoad') }}</b-button>
          </div>
        </b-card>
      </b-col>
     </b-row>
  </b-container>
</template>

<script>
import { addTrial } from '@/plugins/idb'
import { mapStores } from 'pinia'
import { coreStore } from '@/store'

export default {
  data: function () {
    return {
    }
  },
  computed: {
    ...mapStores(coreStore),
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
      }, {
        id: 'cow',
        name: this.$t('pageLoadExampleCowName'),
        description: this.$t('pageLoadExampleCowDescription'),
        source: 'cows.json',
        stats: {
          traits: 4,
          rows: 20,
          columns: 1
        },
        image: 'cow-trial.svg'
      }, {
        id: 'training',
        name: this.$t('pageLoadExampleTrainingName'),
        description: this.$t('pageLoadExampleTrainingDescription'),
        source: 'training.json',
        stats: {
          traits: 5,
          rows: 2,
          columns: 2
        },
        image: 'training-trial.svg'
      }]
    }
  },
  methods: {
    loadExample: async function (example) {
      const response = await fetch(`./data/${example.source}`)
      const json = await response.json()

      if (json.name) {
        json.createdOn = new Date().toISOString()
        json.updatedOn = new Date().toISOString()

        addTrial(json).then(trialId => {
          this.coreStore.setSelectedTrial(trialId)
          this.$router.push({ name: 'home' })
        })
      }
    }
  }
}
</script>

<style>

</style>
