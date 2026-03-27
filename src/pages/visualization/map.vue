<template>
  <v-container fluid>
    <h1 class="text-headline-large mt-0 mb-3">{{ $t('pageVisualizationMapTitle') }}</h1>
    <v-divider class="mb-3" />
    <p>{{ $t('pageVisualizationMapText') }}</p>

    <MapComponent />
  </v-container>
</template>

<script setup lang="ts">
  import MapComponent from '@/components/util/MapComponent.vue'
</script>
