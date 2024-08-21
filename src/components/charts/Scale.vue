<template>
  <div :id="`scale-${id}`" v-if="trait && traitStats && germplasmStats">
    <TraitHeading short :trait="trait" />
    <div class="d-flex my-2">
      <div :class="`d-flex scale-container align-items-center w-100 ${storeDarkMode ? 'bg-dark' : 'bg-light'}`">
        <div class="scale-marker" :style="{ backgroundColor: trait.color, marginLeft: `calc(${germplasmPercentage}% - 1px)` }" />
        <div :class="`scale-marker scale-marker-avg ${storeDarkMode ? 'bg-light' : 'bg-dark'}`" :style="{ marginLeft: `calc(${traitAveragePercentage}% - 1px)` }" />
      </div>
    </div>
    <b-tooltip :target="`scale-${id}`" placement="bottom">
      <h6>{{ trait.name }}</h6>
      <div class="d-flex justify-content-between">
        <span class="d-block"><IBiArrowUp /> {{ $t('widgetScaleMax') }} </span>
        <span class="ms-2">{{ formattedMax }}</span>
      </div>
      <div class="d-flex justify-content-between">
        <span class="d-block"><IBiSlashCircle /> {{ $t('widgetScaleAvg') }} </span>
        <span class="ms-2">{{ formattedAvg }}</span>
      </div>
      <div class="d-flex justify-content-between">
        <span class="d-block"><IBiArrowDown /> {{ $t('widgetScaleMin') }} </span>
        <span class="ms-2">{{ formattedMin}}</span>
      </div>
      <div class="d-flex justify-content-between">
        <span class="d-block"><IBi123 /> {{ $t('widgetScaleCount') }} </span>
        <span class="ms-2">{{ traitStats.count.toLocaleString() }}</span>
      </div>
      <hr />
      <div class="d-flex justify-content-between">
        <span class="d-block text-primary"><IBiFlower1 /> {{ $t('widgetScaleGermplasm') }} </span>
        <span class="ms-2">{{ formattedGermplasmAvg }}</span>
      </div>
    </b-tooltip>
  </div>
</template>

<script>
import TraitHeading from '@/components/TraitHeading.vue'
import { getId } from '@/plugins/id'
import { mapGetters } from 'vuex'

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
    germplasmStats: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    const id = getId()
    return {
      id
    }
  },
  computed: {
    ...mapGetters([
      'storeDarkMode'
    ]),
    germplasmPercentage: function () {
      if (this.germplasmStats && this.traitStats) {
        return (this.germplasmStats.avg - this.traitStats.min) * (100 - 0) / (this.traitStats.max - this.traitStats.min)
      } else {
        return 33
      }
    },
    traitAveragePercentage: function () {
      if (this.germplasmStats && this.traitStats) {
        return (this.traitStats.avg - this.traitStats.min) * (100 - 0) / (this.traitStats.max - this.traitStats.min)
      } else {
        return 33
      }
    },
    formattedMin: function () {
      if (this.trait.dataType === 'date') {
        return new Date(this.traitStats.min * (1000 * 60 * 60 * 24)).toLocaleDateString()
      } else {
        return this.traitStats.min.toFixed(4)
      }
    },
    formattedMax: function () {
      if (this.trait.dataType === 'date') {
        return new Date(this.traitStats.max * (1000 * 60 * 60 * 24)).toLocaleDateString()
      } else {
        return this.traitStats.max.toFixed(4)
      }
    },
    formattedAvg: function () {
      if (this.trait.dataType === 'date') {
        return new Date(this.traitStats.avg * (1000 * 60 * 60 * 24)).toLocaleDateString()
      } else {
        return this.traitStats.avg.toFixed(4)
      }
    },
    formattedGermplasmAvg: function () {
      if (this.trait.dataType === 'date') {
        return new Date(this.germplasmStats.avg * (1000 * 60 * 60 * 24)).toLocaleDateString()
      } else {
        return this.germplasmStats.avg.toFixed(4)
      }
    }
  }
}
</script>

<style scoped>
.scale-container {
  height: 1rem;
  margin: .25rem 0;
  position: relative;
  border-radius: 1em;
}
.scale-marker {
  width: 2px;
  height: 1.5rem;
  position: absolute;
}
.scale-marker-avg {
  width: 1px;
}
</style>
