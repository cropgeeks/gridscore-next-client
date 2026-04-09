<template>
  <v-number-input
    v-model="model"
    v-bind="compProps"
    @update:model-value="resetIfRequired"
  />
</template>

<script setup lang="ts">
  const compProps = defineProps<{
    defaultValue: number
  }>()

  const model = defineModel<number>()

  function resetIfRequired (value: number) {
    if (value === null) {
      model.value = compProps.defaultValue
    }
  }
</script>
