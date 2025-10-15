<template>
  <v-dialog v-model="dialog" max-width="min(90vw, 1024px)">
    <v-card :title="$t('modalTitleTraitImportTrial')">
      <template #text>
        <p>{{ $t('modalTextTraitImportTrial') }}</p>

        <v-form @submit.prevent>
          <v-autocomplete
            :items="trials"
            item-value="localId"
            item-title="name"
            return-object
            autocomplete="off"
            :label="$t('formLabelTraitImportTrial')"
            v-model="selectedTrial"
          />

          <v-treeview
            v-model:selected="selectedTraits"
            :items="groupedTraits"
            :key="`trait-selection-${selectedTrial.localId}`"
            item-value="id"
            item-title="name"
            :open-on-click="false"
            select-strategy="classic"
            return-object
            open-all
            selectable
            v-if="selectedTrial"
          >
            <template #toggle="{ props: toggleProps, isOpen, isSelected, isIndeterminate }">
              <v-badge
                :color="isSelected ? 'success' : 'warning'"
                :model-value="isSelected || isIndeterminate"
              >
                <template #badge>
                  <v-icon
                    v-if="isSelected"
                    icon="$complete"
                  />
                </template>
                <v-btn
                  v-bind="toggleProps"
                  :color="isIndeterminate ? 'warning' : isSelected ? 'success' : 'medium-emphasis'"
                  :variant="isOpen ? 'outlined' : 'tonal'"
                />
              </v-badge>
            </template>

            <template #prepend="{ item }">
              <v-icon icon="mdi-circle" :color="item.color" v-if="!item.children" />
            </template>
            <template #append="{ item }">
              <v-chip label v-if="!item.children" :text="$t(dataTypes.find(dt => dt.value === item.dataType)?.shortTitle || '')" :prepend-icon="dataTypes.find(dt => dt.value === item.dataType)?.icon" />
            </template>
          </v-treeview>
        </v-form>
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
  import { dataTypes } from '@/plugins/constants'
  import { getId } from '@/plugins/id'
  import { getTrials } from '@/plugins/idb'
  import type { TraitPlus, TrialPlus } from '@/plugins/types/client'
  import { TraitDataType, type Trait } from '@/plugins/types/gridscore'
  import { useI18n } from 'vue-i18n'

  interface TraitGroup extends TraitPlus {
    children: Trait[]
  }

  const { t } = useI18n()

  const dialog = ref(false)
  const trials = ref<TrialPlus[]>([])
  const selectedTrial = ref<TrialPlus>()
  const selectedTraits = ref<Trait[]>([])
  const canContinue = computed(() => (selectedTraits.value || []).length > 0)

  const emit = defineEmits(['traits-selected'])

  watch(selectedTrial, async () => {
    selectedTraits.value = []
  })

  const groupedTraits = computed(() => {
    const result: { [key: string]: TraitPlus[] } = {}

    if (selectedTrial.value) {
      selectedTrial.value.traits.forEach(trait => {
        const groupName = trait.group?.name || t('dropdownOptionTraitNoGroup')

        if (!result[groupName]) {
          result[groupName] = []
        }

        result[groupName].push(trait)
      })
    }

    const groupedTraits: TraitGroup[] = []

    Object.keys(result).forEach(k => {
      groupedTraits.push({
        id: getId(),
        name: k,
        dataType: TraitDataType.boolean,
        setSize: 1,
        allowRepeats: true,
        children: result[k] || [],
      })
    })

    return groupedTraits
  })

  function show () {
    dialog.value = true
    selectedTrial.value = undefined

    if (trials.value.length === 0) {
      getTrials(false)
        .then(result => {
          trials.value = result || []
          trials.value.sort((a, b) => a.name.localeCompare(b.name))
        })
    }
  }
  function hide () {
    dialog.value = false
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
