<template>
  <b-modal :title="$t('modalTitleAddTrait')"
           :ok-title="$t('buttonAddTraits', traits ? traits.length : 0)"
           @ok.prevent="addTraits"
           :ok-disabled="!traits || traits.length < 1"
           no-fade
           no-close-on-backdrop
           no-close-on-esc
           size="xl"
           ref="addTraitsModal">
    <div v-if="trials && trials.length > 0">
      <p>{{ $t('modalTextAddTrait') }}</p>

      <TraitDefinitionComponent :trials="trials" @data-changed="updateTraits" />
    </div>
  </b-modal>
</template>

<script>
import TraitDefinitionComponent from '@/components/TraitDefinitionComponent.vue'

import { addTrialTraits } from '@/plugins/idb'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    TraitDefinitionComponent
  },
  props: {
    trials: {
      type: Array,
      default: () => []
    }
  },
  data: function () {
    return {
      traits: []
    }
  },
  computed: {
  },
  methods: {
    updateTraits: function (newTraits) {
      this.traits = JSON.parse(JSON.stringify(newTraits))
    },
    addTraits: function () {
      this.traits.forEach(t => {
        if (t.group && t.group !== '') {
          t.group = {
            name: t.group
          }
        } else {
          delete t.group
        }
      })

      Promise.all(this.trials.map(t => addTrialTraits(t.localId, this.traits)))
        .then(() => {
          emitter.emit('trials-updated')
          emitter.emit('plausible-event', { key: 'traits-added', props: { count: this.traits.length } })
          this.hide()
        })
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.addTraitsModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.addTraitsModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
