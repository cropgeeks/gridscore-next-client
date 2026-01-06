<template>
  <v-select
    v-model="selectedTraits"
    :items="traits"
    class="flex-grow-0"
    return-object
    autocomplete="off"
    item-value="id"
    item-title="name"
    :multiple="multiple"
    :chips="multiple"
    clearable
    :label="$t(label)"
    :hint="$t(hint)"
    persistent-hint
  >
    <template #item="{ props, item }">
      <v-list-item v-bind="props" slim :title="item.raw.name">
        <template #prepend><v-icon :color="item.raw.color" :icon="store.storeCanvasShape === CanvasShape.SQUARE ? mdiSquare : mdiCircle" /></template>
      </v-list-item>
    </template>
    <template #selection="{ item }">
      <v-list-item slim :title="item.raw.name">
        <template #prepend><v-icon :color="item.raw.color" :icon="store.storeCanvasShape === CanvasShape.SQUARE ? mdiSquare : mdiCircle" /></template>
      </v-list-item>
    </template>
  </v-select>
</template>

<script setup lang="ts">
  import { CanvasShape, type TraitPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'
  import { mdiCircle, mdiSquare } from '@mdi/js'

  const store = coreStore()

  const selectedTraits = defineModel<TraitPlus[] | TraitPlus>()

  interface TraitSelectProps {
    traits: TraitPlus[]
    multiple?: boolean
    label?: string
    hint?: string
  }

  withDefaults(defineProps<TraitSelectProps>(), {
    multiple: false,
    label: 'formLabelHeatmapTrait',
    hint: 'formDescriptionHeatmapTrait',
  })
</script>
