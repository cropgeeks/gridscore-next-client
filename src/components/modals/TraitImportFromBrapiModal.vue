<template>
  <v-dialog v-model="dialog" scrollable width="min(90vw, 1024px)">
    <v-card :title="$t('modalTitleBrapiTraitImport')">
      <template #text>
        <v-form @submit.prevent>
          <BrapiConfig @brapi-config-updated="getTraits" />
        </v-form>

        <v-alert
          color="error"
          class="mt-5"
          variant="tonal"
          border="start"
          :icon="mdiAlert"
          :text="error"
          v-if="error"
        />

        <TraitTreeSelect class="mt-5" v-model="selectedTraits" :traits="traits" sort-traits />
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
  import { TraitDataType, type MinimalVariableInfo, type Restrictions, type Trait } from '@/plugins/types/gridscore'
  import BrapiConfig from '@/components/util/BrapiConfig.vue'
  import { brapiGetVariables } from '@/plugins/brapi'
  import { isNumber } from '@/plugins/util'
  import { getId } from '@/plugins/id'
  import TraitTreeSelect from '@/components/trait/TraitTreeSelect.vue'
  import { mdiAlert } from '@mdi/js'

  const dialog = ref(false)
  const traits = ref<Trait[]>([])
  const selectedTraits = ref<Trait[]>([])
  const canContinue = computed(() => (selectedTraits.value || []).length > 0)
  const error = ref<string>()

  const emit = defineEmits(['traits-selected'])

  function getTraits () {
    error.value = undefined

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
              restrictions.categories = v.scale.validValues.categories.map(c => c.label || '')
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

          const mv: MinimalVariableInfo = {
            variableId: v.observationVariableDbId ?? '',
            variableName: v.observationVariableName ?? '',
            variableOntologyId: v.ontologyReference?.ontologyDbId,
            variableOntologyName: v.ontologyReference?.ontologyName,

            traitId: v.trait?.traitDbId ?? '',
            traitName: v.trait?.traitName ?? '',
            traitOntologyId: v.trait?.ontologyReference?.ontologyDbId,
            traitOntologyName: v.trait?.ontologyReference?.ontologyName,
            traitClass: v.trait?.traitClass,

            methodId: v.method?.methodDbId ?? '',
            methodName: v.method?.methodName ?? '',
            methodOntologyId: v.method?.ontologyReference?.ontologyDbId,
            methodOntologyName: v.method?.ontologyReference?.ontologyName,
            methodSetSize: setSize,
            methodIsTimeseries: allowRepeats,

            scaleId: v.scale?.scaleDbId ?? '',
            scaleName: v.scale?.scaleName ?? '',
            scaleDataType: v.scale?.dataType ?? 'text',
            scaleOntologyId: v.scale?.ontologyReference?.ontologyDbId,
            scaleOntologyName: v.scale?.ontologyReference?.ontologyName,
            scaleMinValue: v.scale?.validValues?.minimumValue ? +v.scale?.validValues?.minimumValue : undefined,
            scaleMaxValue: v.scale?.validValues?.maximumValue ? +v.scale?.validValues?.maximumValue : undefined,
            scaleValidValues: v.scale?.validValues?.categories ? [v.scale?.validValues.categories.map(c => c.value ?? c.label ?? '')] : undefined,
          }

          const result: Trait = {
            id: getId(),
            brapiId: v.observationVariableDbId,
            brapiVariable: mv,
            name: v.observationVariableName || '',
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

          return result
        })
      })
      .catch(e => {
        error.value = e
      })
  }
  function show () {
    dialog.value = true
  }
  function hide () {
    dialog.value = false
    traits.value = []
    selectedTraits.value = []
    error.value = undefined
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
