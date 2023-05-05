<template>
  <b-modal :title="$t('modalTitleAddTrait')"
           :ok-title="$tc('buttonAddTraits', traits ? traits.length : 0)"
           @ok.prevent="addTraits"
           :ok-disabled="!traits || traits.length < 1"
           no-fade
           size="xl"
           ref="addTraitsModal">
    <div v-if="trial">
      <p>{{ $t('modalTextAddTrait') }}</p>

      <TraitDefinitionComponent @change="updateTraits" />
    </div>
  </b-modal>
</template>

<script>
import TraitDefinitionComponent from '@/components/TraitDefinitionComponent'

import { addTrialTraits } from '@/plugins/idb'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    TraitDefinitionComponent
  },
  props: {
    trial: {
      type: Object,
      default: () => null
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

      addTrialTraits(this.trial.localId, this.traits)
        .then(() => {
          emitter.emit('trials-updated')
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
