<template>
  <section v-if="trait">
    <hr />

    <h3 class="d-flex justify-content-between">
      <span :style="{ color: trait.color }">
        <BIconCircleFill />
        <span class="mx-1">{{ trait.name }}</span>
        <b-badge variant="light">{{ getTraitTypeText(trait, true) }}</b-badge>
      </span>
      <b-button @click="$emit('photo-clicked')"><BIconCameraFill /></b-button>
    </h3>
    <p class="text-muted" v-if="trait.description">{{ trait.description }}</p>

    <b-form-group :label="$t('formLabelMeasurementSet', { position: index })" v-for="index in (trait.setSize || 1)" :key="`${trait.id}-${index}`" :label-for="`${trait.id}-${index}`">
      <TraitInput :editable="editable" :trait="trait" :id="`${trait.id}-${index}`" :ref="`${trait.id}-${index}`" @traverse="handleTraverse(index)" />
    </b-form-group>
  </section>
</template>

<script>
import TraitInput from '@/components/TraitInput'

import { getTraitTypeText } from '@/plugins/misc'
import { BIconCircleFill, BIconCameraFill } from 'bootstrap-vue'

export default {
  components: {
    BIconCircleFill,
    BIconCameraFill,
    TraitInput
  },
  props: {
    trait: {
      type: Object,
      default: () => null
    },
    editable: {
      type: Boolean,
      default: true
    }
  },
  data: function () {
    return {
      values: []
    }
  },
  methods: {
    getTraitTypeText,
    handleTraverse: function (index) {
      if (index === this.trait.setSize) {
        this.$emit('traverse')
      } else {
        this.$refs[`${this.trait.id}-${index + 1}`][0].focus()
      }
    },
    validate: function () {
      let valid = true
      for (let i = 0; i < (this.trait.setSize || 1); i++) {
        valid &&= this.$refs[`${this.trait.id}-${i + 1}`][0].validate()
      }

      return valid
    }
  }
}
</script>

<style>

</style>
