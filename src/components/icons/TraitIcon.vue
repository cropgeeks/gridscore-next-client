<template>
  <span v-if="trait">
    <template v-if="trait.allowRepeats">
      <IBiDiamondHalf :style="{ transform: 'rotate(45deg)' }" width="1.3em" height="1.3em" v-if="storeCanvasShape === CANVAS_SHAPE_SQUARE" />
      <IBiCircleHalf v-else />
    </template>
    <template v-else>
      <IBiSquareFill v-if="storeCanvasShape === CANVAS_SHAPE_SQUARE" />
      <IBiCircleFill v-else />
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
