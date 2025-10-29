<template>
  <v-dialog v-model="dialog" scrollable max-width="min(90vw, 1024px)">
    <v-card :title="$t('modalTitleBrapiTraitImport')">
      <template #text>
        <v-form @submit.prevent>
          <BrapiConfig @brapi-config-updated="getTraits" />
        </v-form>

        <TraitTreeSelect v-model="selectedTraits" :traits="traits" />
      </template>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('buttonCancel')" @click="hide" />
        <v-btn :text="$t('buttonImport')" @click="save" :disabled="!canContinue" color="primary" variant="tonal" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { TraitDataType, type Restrictions, type Trait } from '@/plugins/types/gridscore'
  import BrapiConfig from '@/components/util/BrapiConfig.vue'
  import { brapiGetVariables } from '@/plugins/brapi'
  import { isNumber } from '@/plugins/util'
  import { getId } from '@/plugins/id'
  import TraitTreeSelect from '@/components/trait/TraitTreeSelect.vue'

  const dialog = ref(false)
  const traits = ref<Trait[]>([])
  const selectedTraits = ref<Trait[]>([])
  const canContinue = computed(() => (selectedTraits.value || []).length > 0)

  const emit = defineEmits(['traits-selected'])

  function getTraits () {
    brapiGetVariables()
      .then(variables => {
        traits.value = variables.map(v => {
          let type = TraitDataType.text

          if (v.scale && v.scale.dataType) {
            switch (v.scale.dataType) {
              case 'Date':
                type = TraitDataType.date
                break
              case 'Text':
                type = TraitDataType.text
                break
              case 'Numeric':
              case 'Numerical':
                type = TraitDataType.float
                break
              case 'Duration':
                type = TraitDataType.int
                break
              case 'Nominal':
              case 'Ordinal':
                type = TraitDataType.categorical
                break
              default:
                type = TraitDataType.text
                break
            }
          }

          const restrictions: Restrictions = {}
          // Check if there are any value restrictions on the trait
          if (v.scale && v.scale.validValues) {
            if (v.scale.validValues.minimumValue !== undefined && v.scale.validValues.minimumValue !== null) {
              restrictions.min = +v.scale.validValues.minimumValue
            }
            if (v.scale.validValues.maximumValue !== undefined && v.scale.validValues.maximumValue !== null) {
              restrictions.max = +v.scale.validValues.maximumValue
            }
            if (v.scale.validValues.categories && v.scale.validValues.categories.length > 0) {
              restrictions.categories = v.scale.validValues.categories.map(c => c.label)
            }
          }

          let setSize = 1
          if (v.additionalInfo && v.additionalInfo.setSize && isNumber(v.additionalInfo.setSize, true)) {
            setSize = +v.additionalInfo.setSize
          }

          let allowRepeats = false
          if (v.additionalInfo && v.additionalInfo.isTimeseries === 'true') {
            allowRepeats = true
          }

          let description = undefined
          if (v.trait && v.trait.traitDescription) {
            description = v.trait.traitDescription
          }

          let imageUrl = undefined

          if (v.trait && v.trait.externalReferences) {
            const possible = v.trait.externalReferences.filter(e => {
              if (e.referenceId) {
                try {
                  new URL(e.referenceId)
                  return true
                } catch {
                  return false
                }
              } else {
                return false
              }
            }).map(e => e.referenceId)

            if (possible.length > 0) {
              imageUrl = possible[0]
            }
          }

          return {
            id: getId(),
            brapiId: v.observationVariableDbId,
            name: v.observationVariableName,
            dataType: type,
            restrictions: Object.keys(restrictions).length === 0 ? undefined : restrictions,
            setSize,
            allowRepeats,
            description,
            group: (v.trait && v.trait.traitClass) ? { name: v.trait.traitClass } : undefined,
            timeframe: undefined,
            imageUrl,
            hasImage: imageUrl !== undefined,
          }
        })
      })
  }
  function show () {
    dialog.value = true
  }
  function hide () {
    dialog.value = false
    traits.value = []
    selectedTraits.value = []
  }
  function save () {
    emit('traits-selected', selectedTraits.value)

    hide()
  }

  defineExpose({
    show,
    hide,
  })
</script>
