<template>
  <div class="data-grid-wrapper" ref="wrapper">
    <div v-if="trial && trialData" class="data-grid" :style="{ gridTemplateColumns: `repeat(${trial.layout.columns}, minmax(${$refs.wrapper.offsetWidth / trial.layout.columns}px, auto))`, gridTemplateRows: `repeat(${trial.layout.rows}, minmax(${$refs.wrapper.offsetHeight / trial.layout.rows}px, auto))` }">
      <template v-for="row of trial.layout.rows">
        <template v-for="column of trial.layout.columns">
          <div :class="`cell text-center p-1 cell-${(((row - 1) % 2 === 0) ? 1 : 0) + (((column - 1) % 2 === 0) ? 1 : 0)}`" :key="`cell-${row}-${column}`">
            <template v-if="trialData[`${row - 1}|${column - 1}`]">
              <div>{{ `${row}-${column}` }}</div>
              <template v-for="trait in trial.traits">
                <template v-if="trialData[`${row - 1}|${column - 1}`].measurements[trait.id] && trialData[`${row - 1}|${column - 1}`].measurements[trait.id].length > 0">
                  <span class="circle-full mx-1" :key="`cell-${row}-${column}-trait-full-${trait.id}`" :style="{ background: trait.color }" />
                </template>
                <template v-else>
                  <span class="circle-empty mx-1" :key="`cell-${row}-${column}-trait-empty-${trait.id}`" :style="{ borderColor: trait.color }" />
                </template>
              </template>
            </template>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getTrialById } from '@/plugins/idb'
import { getTrialDataCached } from '@/plugins/datastore'

const emitter = require('tiny-emitter/instance')

export default {
  data: function () {
    return {
      trial: null,
      trialData: null
    }
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial'
    ])
  },
  methods: {
    loadTrial: function () {
      getTrialById(this.storeSelectedTrial).then(trial => {
        this.trial = trial

        this.reset()
      })
    },
    reset: function () {
      this.trialData = getTrialDataCached()
      console.log(this.trialData)

      if (!this.trialData) {
        // TODO
      }
    }
  },
  mounted: function () {
    if (this.storeSelectedTrial) {
      this.loadTrial()
    }

    emitter.on('trial-data-loaded', this.reset)
  },
  beforeDestroy: function () {
    emitter.off('trial-data-loaded', this.reset)
  }
}
</script>

<style>
:root {
  --circle-diameter: 20px;
}

.data-grid-wrapper {
  overflow-x: auto;
}

.data-grid {
  display: grid;
}

.data-grid .circle-full {
  display: inline-block;
  width: var(--circle-diameter);
  height: var(--circle-diameter);
  border-radius: calc(var(--circle-diameter) / 2);
}

.data-grid .circle-empty {
  display: inline-block;
  width: calc(var(--circle-diameter) - 2px);
  height: calc(var(--circle-diameter) - 2px);
  border-radius: calc(calc(var(--circle-diameter) - 1px) / 2);
  background: transparent;
  border-width: 1px;
  border-style: solid;
  box-sizing: content-box;
}

.data-grid .cell-2 {
  background: #e0e0e0;
}
.data-grid .cell-1 {
  background: #f2f2f2;
}
.data-grid .cell-0 {
  background: #ffffff;
}
</style>
