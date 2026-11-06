<template>
  <div v-if="groupedTraits.length > 0">
    <v-text-field
      v-model="search"
      :label="$t('formLabelBrapiTraitSearch')"
      clearable
      hide-details
    />
    <v-treeview
      v-model:selected="selectedTraitIds"
      :items="groupedTraits"
      :key="`trait-selection-${id}`"
      item-value="id"
      item-title="name"
      :open-on-click="false"
      select-strategy="classic"
      open-all
      selectable
    >
      <template #subtitle="{ item }">
        <div class="d-flex flex-wrap ga-1">
          <v-chip label size="x-small" v-if="item.dataType" :text="$t(dataTypes.find(dt => dt.value === item.dataType)?.shortTitle || '')" :prepend-icon="dataTypes.find(dt => dt.value === item.dataType)?.icon" />
          <v-chip label size="x-small" v-if="item.brapiVariable?.methodName" :text="item.brapiVariable.methodName" />
          <v-chip label size="x-small" v-if="item.brapiVariable?.scaleName" :text="item.brapiVariable.scaleName" />
          <v-chip label size="x-small" v-if="item.brapiVariable?.variableOntologyId" :prepend-icon="mdiGraph" :text="$t('tooltipBrapiHasOntology')" />
        </div>
      </template>
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
    </v-treeview>
  </div>
</template>

<script setup lang="ts">
  import { dataTypes } from '@/plugins/constants'
  import { getId } from '@/plugins/id'
  import type { TraitGroup, TraitPlus } from '@/plugins/types/client'
  import type { Trait } from '@/plugins/types/gridscore'
  import { mdiCircle, mdiGraph } from '@mdi/js'
  import { useI18n } from 'vue-i18n'

  const compProps = defineProps<{
    traits: Trait[]
    sortTraits: boolean
  }>()

  const id = ref(getId())
  const selectedTraits = defineModel<Trait[]>()
  const search = ref<string>()

  // Map selected objects to IDs for v-model:selected
  const selectedTraitIds = computed({
    get: () => selectedTraits.value?.map(trait => trait.id) || [],
    set: (ids: string[]) => {
      // Map selected IDs back to the original full trait objects
      const allTraitsMap = new Map(compProps.traits.map(trait => [trait.id, trait]))
      selectedTraits.value = ids.map(id => allTraitsMap.get(id)).filter(Boolean) as Trait[]
    },
  })

  const { t } = useI18n()

  const filteredTraits = computed(() => {
    const searchTerm = search.value ? search.value.trim().toLowerCase() : undefined
    return compProps.traits.filter(t => searchTerm ? t.name.toLowerCase().includes(searchTerm) : true)
  })

  const groupedTraits = computed(() => {
    const result: Record<string, TraitPlus[]> = {}

    filteredTraits.value.forEach(trait => {
      const groupName = trait.group?.name || t('dropdownOptionTraitNoGroup')

      if (!result[groupName]) {
        result[groupName] = []
      }

      result[groupName].push(trait)
    })

    const groups: TraitGroup[] = []

    Object.entries(result).forEach(([groupName, traits]) => {
      const sortedTraits = compProps.sortTraits
        ? [...traits].sort((a, b) => a.name.localeCompare(b.name))
        : traits

      groups.push({
        id: `group-${groupName}`,
        name: groupName,
        children: sortedTraits,
      } as unknown as TraitGroup)
    })

    return groups
  })
</script>
