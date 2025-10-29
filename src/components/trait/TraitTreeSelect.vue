<template>
  <v-treeview
    v-model:selected="selectedTraits"
    :items="groupedTraits"
    :key="`trait-selection-${id}`"
    item-value="id"
    item-title="name"
    :open-on-click="false"
    select-strategy="classic"
    return-object
    open-all
    selectable
    v-if="groupedTraits"
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
      <v-icon :icon="mdiCircle" :color="item.color" v-if="!item.children" />
    </template>
    <template #append="{ item }">
      <v-chip label v-if="!item.children" :text="$t(dataTypes.find(dt => dt.value === item.dataType)?.shortTitle || '')" :prepend-icon="dataTypes.find(dt => dt.value === item.dataType)?.icon" />
    </template>
  </v-treeview>
</template>

<script setup lang="ts">
  import { dataTypes } from '@/plugins/constants'
  import { getId } from '@/plugins/id'
  import type { TraitGroup, TraitPlus } from '@/plugins/types/client'
  import { TraitDataType, type Trait } from '@/plugins/types/gridscore'
  import { mdiCircle } from '@mdi/js'
  import { useI18n } from 'vue-i18n'

  const compProps = defineProps<{
    traits: Trait[]
  }>()

  const id = ref(getId())
  const selectedTraits = defineModel<Trait[]>()

  const { t } = useI18n()

  const groupedTraits = computed(() => {
    const result: { [key: string]: TraitPlus[] } = {}

    if (compProps.traits) {
      compProps.traits.forEach(trait => {
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
        children: (result[k] || []).sort((a, b) => a.name.localeCompare(b.name)),
      })
    })

    return groupedTraits
  })
</script>
