<template>
  <v-btn :variant="variant" :text="text" :prepend-icon="prependIcon" @click="emit('click')" v-if="mdAndUp" />
  <v-btn :variant="variant" @click="emit('click')" v-tooltip:top="text" v-else>
    <v-icon :icon="prependIcon" />
  </v-btn>
</template>

<script setup lang="ts">
  import { useDisplay } from 'vuetify'

  const { mdAndUp } = useDisplay()

  defineProps<{
    text: string
    prependIcon: string
    variant?: 'flat' | 'text' | 'elevated' | 'outlined' | 'plain' | 'tonal' | undefined
  }>()

  const emit = defineEmits(['click'])
</script>
