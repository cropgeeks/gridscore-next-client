<template>
  <v-btn v-bind="compProps" :disabled="disabled" :variant="variant" :text="text" :prepend-icon="prependIcon" :append-icon="appendIcon" v-if="mdAndUp" />
  <v-btn v-bind="compProps" :prepend-icon="undefined" :append-icon="undefined" :disabled="disabled" :variant="variant" v-tooltip:top="text" v-else>
    <v-icon :icon="prependIcon" v-if="prependIcon" />
    <v-icon :icon="appendIcon" v-else-if="appendIcon" />
  </v-btn>
</template>

<script setup lang="ts">
  import { useDisplay } from 'vuetify'

  const { mdAndUp } = useDisplay()

  const compProps = defineProps<{
    text: string
    prependIcon?: string | undefined
    appendIcon?: string | undefined
    disabled?: boolean
    variant?: 'flat' | 'text' | 'elevated' | 'outlined' | 'plain' | 'tonal' | undefined
  }>()
</script>
