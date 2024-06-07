<template>
  <div :id="`scale-${id}`" v-if="trait && traitStats && germplasmStats">
    <h6 class="scale-heading" :title="trait.name">{{ trait.name }}</h6>
    <div class="d-flex my-2">
      <div :class="`d-flex scale-container align-items-center w-100 ${storeDarkMode ? 'bg-dark' : 'bg-light'}`">
        <div class="scale-marker bg-primary" :style="{ marginLeft: `calc(${germplasmPercentage}% - 1px)` }" />
        <div :class="`scale-marker scale-marker-avg ${storeDarkMode ? 'bg-light' : 'bg-dark'}`" :style="{ marginLeft: `calc(${traitAveragePercentage}% - 1px)` }" />
      </div>
    </div>
    <b-tooltip :target="`scale-${id}`" placement="bottom">
      <h6>{{ trait.name }}</h6>
      <div class="d-flex justify-content-between">
        <span class="d-block"><IBiArrowDown /> {{ $t('widgetScaleMin') }} </span>
        <span class="ms-2">{{ formattedMin}}</span>
      </div>
      <div class="d-flex justify-content-between">
        <span class="d-block text-primary"><IBiSlashCircle /> {{ $t('widgetScaleAvg') }} </span>
        <span class="ms-2">{{ formattedAvg }}</span>
      </div>
      <div class="d-flex justify-content-between">
        <span class="d-block"><IBiArrowUp /> {{ $t('widgetScaleMax') }} </span>
        <span class="ms-2">{{ formattedMax }}</span>
      </div>
      <div class="d-flex justify-content-between">
        <span class="d-block"><IBi123 /> {{ $t('widgetScaleCount') }} </span>
        <span class="ms-2">{{ traitStats.count.toLocaleString() }}</span>
      </div>
    </b-tooltip>
  </div>
</template>

<script>
import { getId } from '@/plugins/id'
import { mapGetters } from 'vuex'

export default {
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
      id: id
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
    }
  }
}
</script>

<style scoped>
.scale-heading {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.scale-container {
  border-radius: 0.25rem;
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
