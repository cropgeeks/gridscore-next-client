<template>
  <div>
    <b-container fluid class="my-4">
      <h1 class="display-4">{{ $t('pageVisualizationMapTitle') }}</h1>
      <p>{{ $t('pageVisualizationMapText') }}</p>
    </b-container>

    <MapComponent />
  </div>
</template>

<script>
import MapComponent from '@/components/MapComponent.vue'

export default {
  components: {
    MapComponent
  }
}
</script>

<style scoped>
</style>
