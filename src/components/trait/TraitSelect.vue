<template>
  <v-select
    v-model="selectedTrait"
    :items="traits"
    class="flex-grow-0"
    return-object
    autocomplete="off"
    item-value="id"
    item-title="name"
    :label="$t('formLabelHeatmapTrait')"
    :hint="$t('formDescriptionHeatmapTrait')"
    persistent-hint
  >
    <template #item="{ props, item }">
      <v-list-item v-bind="props" slim :title="item.raw.name">
        <template #prepend><v-icon :color="item.raw.color" icon="mdi-circle" /></template>
      </v-list-item>
    </template>
    <template #selection="{ item }">
      <v-list-item slim :title="item.raw.name">
        <template #prepend><v-icon :color="item.raw.color" icon="mdi-circle" /></template>
      </v-list-item>
    </template>
  </v-select>
</template>

<script setup lang="ts">
  import type { TraitPlus } from '@/plugins/types/client'

  const selectedTrait = defineModel<TraitPlus>('selectedTrait')

  defineProps<{
    traits: TraitPlus[]
  }>()
</script>
