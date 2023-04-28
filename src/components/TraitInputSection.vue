<template>
  <section v-if="trait">
    <h3>
      <span :style="{ color: trait.color }">
        <BIconCircleFill />
        <span class="mx-1">{{ trait.name }}</span>
        <b-badge variant="light">{{ getTraitTypeText(trait, true) }}</b-badge>
      </span>
    </h3>
    <p v-if="trait.description">{{ trait.description }}</p>
  </section>
</template>

<script>
import { getTraitTypeText } from '@/plugins/misc'
import { BIconCircleFill } from 'bootstrap-vue'

export default {
  components: {
    BIconCircleFill
  },
  props: {
    trait: {
      type: Object,
      default: () => null
    }
  },
  methods: {
    getTraitTypeText
  }
}
</script>

<style>

</style>
