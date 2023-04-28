<template>
  <span :style="{ color: trait.color }">
    <BIconCircleHalf v-if="trait.allowRepeats" />
    <BIconCircleFill v-else />
    <span class="mx-1">{{ trait.name }}</span>
    <b-badge variant="light">{{ traitTypeText }}</b-badge>
    <BIconCardText class="text-muted ml-1" v-b-tooltip="trait.description" v-if="trait.description" />
  </span>
</template>

<script>
import { BIconCircleFill, BIconCircleHalf, BIconCardText } from 'bootstrap-vue'
import { getTraitTypeText } from '@/plugins/misc'

export default {
  components: {
    BIconCircleFill,
    BIconCircleHalf,
    BIconCardText
  },
  props: {
    trait: {
      type: Object,
      default: () => { return { name: null, dataType: 'date' } }
    },
    traitIndex: {
      type: Number,
      default: 0
    },
    short: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    traitTypeText: function () {
      if (this.trait) {
        return getTraitTypeText(this.trait, this.short)
      } else {
        return null
      }
    }
  }
}
</script>

<style>

</style>
