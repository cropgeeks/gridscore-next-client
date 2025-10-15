<template>
  <div class="direction-grid">
    <div><v-btn @click="emit('direction', 'topLeft')" icon="mdi-arrow-top-left" /></div>
    <div><v-btn @click="emit('direction', 'top')" icon="mdi-arrow-up" /></div>
    <div><v-btn @click="emit('direction', 'topRight')" icon="mdi-arrow-top-right" /></div>
    <div><v-btn @click="emit('direction', 'left')" icon="mdi-arrow-left" /></div>
    <div><v-btn @click="emit('center')" :icon="centerIcon" /></div>
    <div><v-btn @click="emit('direction', 'right')" icon="mdi-arrow-right" /></div>
    <div><v-btn @click="emit('direction', 'bottomLeft')" icon="mdi-arrow-bottom-left" /></div>
    <div><v-btn @click="emit('direction', 'bottom')" icon="mdi-arrow-down" /></div>
    <div><v-btn @click="emit('direction', 'bottomRight')" icon="mdi-arrow-bottom-right" /></div>
  </div>
</template>

<script setup lang="ts">
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
