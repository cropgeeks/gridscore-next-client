<template>
  <span v-if="trait">
    <template v-if="trait.allowRepeats">
      <template v-if="storeCanvasShape === CANVAS_SHAPE_SQUARE">
        <IBiDiamondHalf :style="{ transform: 'rotate(45deg)' }" width="1.3em" height="1.3em" v-if="hasData" />
        <IBiSquare v-else />
      </template>
      <template v-else>
        <IBiCircleHalf v-if="hasData" />
        <IBiCircle v-else />
      </template>
    </template>
    <template v-else>
      <template v-if="storeCanvasShape === CANVAS_SHAPE_SQUARE">
        <IBiSquareFill v-if="hasData" />
        <IBiSquare v-else />
      </template>
      <template v-else>
        <IBiCircleFill v-if="hasData" />
        <IBiCircle v-else />
      </template>
    </template>
  </span>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import { CANVAS_SHAPE_SQUARE } from '@/plugins/constants'

export default {
  data: function () {
    return {
      CANVAS_SHAPE_SQUARE
    }
  },
  props: {
    trait: {
      type: Object,
      default: () => null
    },
    hasData: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeCanvasShape'
    ])
  }
}
</script>

<style>
</style>
