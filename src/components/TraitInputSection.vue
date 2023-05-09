<template>
  <section v-if="trait">
    <hr />

    <h3 class="d-flex justify-content-between align-items-center">
      <span class="d-flex align-items-center flex-wrap">
        <span :style="{ color: trait.color }">
          <BIconCircleFill />
          <span class="mx-1">{{ trait.name }}</span>
        </span>
        <b-badge class="mx-1" variant="light">{{ getTraitTypeText(trait, true) }}</b-badge>
        <b-badge class="mx-1" variant="light" v-b-tooltip="$t(trait.allowRepeats ? 'tooltipTraitAllowRepeatsTrue' : 'tooltipTraitAllowRepeatsFalse')">
          <BIconArrowRepeat v-if="trait.allowRepeats" />
          <BIconstack v-else>
            <BIconArrowRepeat />
            <BIconX :scale="0.7" />
          </BIconstack>
        </b-badge>

        <b-badge class="mx-1" variant="light" v-b-tooltip="$t('tooltipTraitSetSize')">
          <BIconSegmentedNav :rotate="90" /> {{ trait.setSize || 1 }}
        </b-badge>
      </span>
      <b-button @click="$emit('photo-clicked')"><BIconCameraFill /></b-button>
    </h3>
    <p class="text-muted" v-if="trait.description">{{ trait.description }}</p>

    <b-form-group :label="$t('formLabelMeasurementSet', { position: index })"
                  v-for="index in (trait.setSize || 1)"
                  :key="`${trait.id}-${index}`"
                  :label-for="`${trait.id}-${index}`">
      <template #description>
        <span v-html="description ? description[index - 1] : null" />
      </template>
      <TraitInput :editable="editable" :trait="trait" :id="`${trait.id}-${index}`" :ref="`${trait.id}-${index}`" @traverse="handleTraverse(index)" />
    </b-form-group>
  </section>
</template>

<script>
import TraitInput from '@/components/TraitInput'

import { getTraitTypeText } from '@/plugins/misc'
import { BIconCircleFill, BIconCameraFill, BIconArrowRepeat, BIconSegmentedNav, BIconX, BIconstack } from 'bootstrap-vue'

export default {
  components: {
    BIconstack,
    BIconCircleFill,
    BIconCameraFill,
    BIconArrowRepeat,
    BIconX,
    BIconSegmentedNav,
    TraitInput
  },
  props: {
    trait: {
      type: Object,
      default: () => null
    },
    cell: {
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
  computed: {
    description: function () {
      if (this.trait && this.cell && this.cell.measurements) {
        const traitMeasures = this.cell.measurements[this.trait.id]

        if (traitMeasures && traitMeasures.length > 0) {
          traitMeasures.concat().sort((a, b) => a.timestamp.localeCompare(b.timestamp))

          const last = traitMeasures[traitMeasures.length - 1]
          const values = this.trait.dataType === 'categorical' ? last.values.map(v => this.trait.restrictions.categories[v]) : last.values

          if (this.trait.allowRepeats) {
            return values.map(v => this.$t('widgetTraitInputPreviousMeasures', { date: new Date(last.timestamp).toLocaleDateString(), values: v, color: this.trait.color }))
          } else {
            return values.map(v => this.$t('widgetTraitInputCurrentMeasures', { date: new Date(last.timestamp).toLocaleDateString(), values: v, color: this.trait.color }))
          }
        } else {
          return null
        }
      } else {
        return null
      }
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
