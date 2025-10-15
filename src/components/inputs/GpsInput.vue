<template>
  <div class="d-flex ga-3 align-center" v-if="model">
    <v-number-input
      v-model="model.lat"
      class="flex-grow-1"
      hide-details
      clearable
      :precision="5"
      :label="$t('formPlaceholderLatitude')"
    />

    <v-btn icon="mdi-map-marker" @click="setGps" v-if="supportsGps" />

    <v-number-input
      v-model="model.lng"
      class="flex-grow-1"
      hide-details
      clearable
      :precision="5"
      :label="$t('formPlaceholderLongitude')"
    />
  </div>
</template>

<script setup lang="ts">
  import type { LatLng } from '@/plugins/types/gridscore'

  const model = defineModel<LatLng>()

  const supportsGps = computed(() => navigator.geolocation !== undefined && navigator.geolocation !== null)

  function setGps () {
    navigator.geolocation.getCurrentPosition(geolocation => {
      if (model.value && geolocation && geolocation.coords) {
        model.value.lat = geolocation.coords.latitude
        model.value.lat = geolocation.coords.longitude
      }
    }, null, { timeout: 5000 })
  }
</script>
