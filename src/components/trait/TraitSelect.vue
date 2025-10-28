<template>
  <v-select
    v-model="selectedTrait"
    :items="traits"
    class="flex-grow-0"
    return-object
    autocomplete="off"
    item-value="id"
    item-title="name"
    :multiple="multiple"
    :chips="multiple"
    clearable
    :label="$t('formLabelHeatmapTrait')"
    :hint="$t('formDescriptionHeatmapTrait')"
    persistent-hint
  >
    <template #item="{ props, item }">
      <v-list-item v-bind="props" slim :title="item.raw.name">
        <template #prepend><v-icon :color="item.raw.color" :icon="mdiCircle" /></template>
      </v-list-item>
    </template>
    <template #selection="{ item }">
      <v-list-item slim :title="item.raw.name">
        <template #prepend><v-icon :color="item.raw.color" :icon="mdiCircle" /></template>
      </v-list-item>
    </template>
  </v-select>
</template>

<script setup lang="ts">
  import type { TraitPlus } from '@/plugins/types/client'
  import { mdiCircle } from '@mdi/js'

  const selectedTrait = defineModel<TraitPlus>('selectedTrait')

  interface TraitSelectProps {
    traits: TraitPlus[]
    multiple?: boolean
  }

  withDefaults(defineProps<TraitSelectProps>(), {
    multiple: false,
  })
</script>
