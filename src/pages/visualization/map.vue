<template>
  <v-container fluid>
    <h1 class="text-h4 mb-3">{{ $t('pageVisualizationMapTitle') }}</h1>
    <v-divider class="mb-3" />
    <p>{{ $t('pageVisualizationMapText') }}</p>

    <MapComponent show-controls />
  </v-container>
</template>

<script setup lang="ts">
  import MapComponent from '@/components/util/MapComponent.vue'
</script>
