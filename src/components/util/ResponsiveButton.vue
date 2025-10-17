<template>
  <v-btn :disabled="disabled" :variant="variant" :text="text" :prepend-icon="prependIcon" :append-icon="appendIcon" @click="emit('click')" v-if="mdAndUp" />
  <v-btn :disabled="disabled" :variant="variant" @click="emit('click')" v-tooltip:top="text" v-else>
    <v-icon :icon="prependIcon" v-if="prependIcon" />
    <v-icon :icon="appendIcon" v-else-if="appendIcon" />
  </v-btn>
</template>

<script setup lang="ts">
  import { useDisplay } from 'vuetify'

  const { mdAndUp } = useDisplay()

  defineProps<{
    text: string
    prependIcon?: string | undefined
    appendIcon?: string | undefined
    disabled?: boolean
    variant?: 'flat' | 'text' | 'elevated' | 'outlined' | 'plain' | 'tonal' | undefined
  }>()

  const emit = defineEmits(['click'])
</script>
