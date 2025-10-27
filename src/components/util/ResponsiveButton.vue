<template>
  <v-btn v-bind="compProps" :text="text" :prepend-icon="prependIcon" :append-icon="appendIcon" v-if="mdAndUp" />
  <v-btn v-bind="compProps" class="small-btn" :prepend-icon="undefined" :append-icon="undefined" v-tooltip:top="text" v-else>
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
    active?: boolean
    variant?: 'flat' | 'text' | 'elevated' | 'outlined' | 'plain' | 'tonal' | undefined
    size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
  }>()
</script>

<style scoped>
.small-btn {
  min-width: unset;
  padding: 0 12px;
}
</style>
