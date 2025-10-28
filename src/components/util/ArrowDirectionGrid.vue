<template>
  <div class="direction-grid">
    <div><v-btn @click="emit('direction', 'topLeft')" :icon="mdiArrowTopLeft" /></div>
    <div><v-btn @click="emit('direction', 'top')" :icon="mdiArrowUp" /></div>
    <div><v-btn @click="emit('direction', 'topRight')" :icon="mdiArrowTopRight" /></div>
    <div><v-btn @click="emit('direction', 'left')" :icon="mdiArrowLeft" /></div>
    <div><v-btn @click="emit('center')" :icon="centerIcon" /></div>
    <div><v-btn @click="emit('direction', 'right')" :icon="mdiArrowRight" /></div>
    <div><v-btn @click="emit('direction', 'bottomLeft')" :icon="mdiArrowBottomLeft" /></div>
    <div><v-btn @click="emit('direction', 'bottom')" :icon="mdiArrowDown" /></div>
    <div><v-btn @click="emit('direction', 'bottomRight')" :icon="mdiArrowBottomRight" /></div>
  </div>
</template>

<script setup lang="ts">
  import { mdiArrowBottomLeft, mdiArrowBottomRight, mdiArrowDown, mdiArrowLeft, mdiArrowRight, mdiArrowTopLeft, mdiArrowTopRight, mdiArrowUp } from '@mdi/js'

  const emit = defineEmits(['direction', 'center'])

  defineProps<{
    centerIcon: string
  }>()
</script>

<style scoped>
.direction-grid {
  display: grid;
  grid-gap: 1px;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 10px;
  row-gap: 10px;
}
.direction-grid > div {
  justify-self: center;
  align-self: center;
}
.direction-grid .gps-button {
  grid-column: 1 / span 3;
}
</style>
