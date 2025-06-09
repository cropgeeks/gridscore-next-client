<template>
  <b-modal :title="$t('modalTitleTraitImportTrial')"
           :cancel-title="$t('buttonCancel')"
           :ok-title="$t('buttonImport')"
           @ok.prevent="emitTraits"
           :ok-disabled="!canContinue"
           @hidden="reset"
           @shown="reset"
           no-fade
           size="md"
           ref="trialImportModal">
    <p>{{ $t('modalTextTraitImportTrial') }}</p>

    <b-form-group :label="$t('formLabelTraitImportTrial')" label-for="trial">
      <b-form-select id="trial" v-model="selectedTrial" :options="trialOptions" />
    </b-form-group>

    <b-list-group>
      <b-list-group-item v-for="(group, index) in traitsByGroup" :key="`trait-group-${group.name}-${index}`">
        <b-form-checkbox v-model="group.allMarked" @update:model-value="updateSelectedTraits(group)">{{ group.name || $t('toolbarTraitGroupGeneric') }}</b-form-checkbox>

        <b-form-checkbox v-model="trait.selected"
                         v-for="trait in group.traits"
                         class="ms-3"
                         :key="`trait-visibility-${group.name}-${index}-${trait.id}`"
                         @update:model-value="toggleTraitSelection(trait)">
          <span :style="{ color: trait.selected ? trait.color : 'lightgray' }"><TraitIcon class="ms-2" :trait="trait" /> {{ trait.name }}</span>
        </b-form-checkbox>
      </b-list-group-item>
    </b-list-group>
  </b-modal>
</template>

<script>
import { getTrials } from '@/plugins/idb'
import TraitIcon from '@/components/icons/TraitIcon.vue'

export default {
  components: {
    TraitIcon
  },
  data: function () {
    return {
      trials: [],
      selectedTrial: null,
      selectedTraits: [],
      traitsByGroup: {}
    }
  },
  watch: {
    selectedTrial: function (newValue) {
      if (newValue && newValue.traits) {
        const result = {}

        newValue.traits.forEach(t => {
          const group = t.group ? t.group.name : this.$t('dropdownOptionTraitNoGroup')
          const traitDef = {
            id: t.id,
            name: t.name,
            color: t.color,
            allowRepeats: t.allowRepeats,
            progress: t.progress,
            selected: this.selectedTraits.includes(t.id)
          }

          let groupTraits = result[group]
          if (!groupTraits) {
            groupTraits = [traitDef]
          } else {
            groupTraits.push(traitDef)
          }
          result[group] = groupTraits
        })

        const mapped = Object.keys(result).map(k => {
          return {
            name: k,
            traits: result[k],
            allMarked: result[k].every(t => t.selected)
          }
        })

        this.traitsByGroup = mapped
      } else {
        this.traitsByGroup = []
      }
    }
  },
  computed: {
    canContinue: function () {
      return this.selectedTrial && this.selectedTraits && this.selectedTraits.length > 0
    },
    trialOptions: function () {
      if (this.trials) {
        return this.trials.map(t => {
          return {
            text: t.name,
            value: t
          }
        })
      } else {
        return []
      }
    }
  },
  methods: {
    emitTraits: function () {
      const result = JSON.parse(JSON.stringify(this.selectedTrial.traits.filter(t => this.selectedTraits.includes(t.id))))
        .map(t => {
          return {
            brapiId: t.brapiId,
            name: t.name,
            description: t.description,
            dataType: t.dataType,
            allowRepeats: t.allowRepeats,
            setSize: t.setSize,
            restrictions: t.restrictions,
            group: t.group ? t.group.name : null,
            timeframe: t.timeframe || null
          }
        })

      this.$emit('data-changed', result)
      this.hide()
    },
    toggleTraitSelection: function (trait) {
      const isHide = !this.selectedTraits.includes(trait.id)

      const distinct = new Set(this.selectedTraits)

      const group = this.traitsByGroup[Object.keys(this.traitsByGroup).find(k => this.traitsByGroup[k].traits.some(t => t.id === trait.id))]
      group.allMarked = group.traits.every(t => t.selected)

      if (isHide) {
        distinct.add(trait.id)
      } else {
        distinct.delete(trait.id)
      }

      this.selectedTraits = [...distinct]
    },
    updateSelectedTraits: function (group) {
      const isHide = group.allMarked === false

      const distinct = new Set(this.selectedTraits)

      group.traits.forEach(t => {
        if (isHide) {
          t.selected = false
          distinct.delete(t.id)
        } else {
          t.selected = true
          distinct.add(t.id)
        }
      })

      this.selectedTraits = [...distinct]
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.trialImportModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.trialImportModal.hide())
    },
    reset: function () {
      this.trials = []
      this.selectedTrial = null
      this.traits = []
      this.selectedTraits = []

      getTrials()
        .then(trials => {
          this.trials = (trials || []).sort((a, b) => a.name.localeCompare(b.name))
        })
    }
  }
}
</script>

<style>

</style>
