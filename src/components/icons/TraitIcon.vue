<template>
  <span v-if="trait">
    <template v-if="trait.allowRepeats">
      <IconSquareHalf v-if="storeCanvasShape === CANVAS_SHAPE_SQUARE" />
      <BIconCircleHalf v-else />
    </template>
    <template v-else>
      <BIconSquareFill v-if="storeCanvasShape === CANVAS_SHAPE_SQUARE" />
      <BIconCircleFill v-else />
    </template>
  </span>
</template>

<script>
import { mapGetters } from 'vuex'
import { CANVAS_SHAPE_SQUARE } from '@/plugins/constants'
import { BIconSquareFill, BIconCircleFill, BIconCircleHalf } from 'bootstrap-vue'
import IconSquareHalf from '@/components/icons/IconSquareHalf'

export default {
  components: {
    BIconSquareFill,
    BIconCircleFill,
    BIconCircleHalf,
    IconSquareHalf
  },
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
    ...mapGetters([
      'storeCanvasShape'
    ])
  }
}
</script>

<style>
</style>
