<template>
  <template v-if="breakpoint">
    <ResponsiveButton
      v-for="(item, index) in visibleItems"
      :key="`menu-item-${index}`"
      v-bind="item"
      @click="item.click()"
    />
  </template>
  <v-menu eager v-else>
    <template #activator="{ props }">
      <v-btn v-bind="props" size="small" variant="tonal" :prepend-icon="mdiDotsVertical" />
    </template>

    <v-list slim color="primary">
      <v-list-item
        v-for="(item, index) in visibleItems"
        :key="`menu-item-${index}`"
        v-bind="item"
        :active="item.color !== undefined"
        :variant="undefined"
        :title="item.text"
        @click="item.click()"
      />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
  import { mdiDotsVertical } from '@mdi/js'

  export interface MenuItem {
    id?: string
    text: string
    prependIcon: string
    click: () => void
    size: 'small' | 'default' | 'x-small' | 'large' | 'x-large' | undefined
    variant?: 'text' | 'flat' | 'elevated' | 'outlined' | 'plain' | 'tonal' | undefined
    color?: string | undefined
    visible?: boolean
    disabled?: boolean
  }

  const compProps = defineProps<{
    items: MenuItem[]
    breakpoint: boolean
  }>()

  const visibleItems = computed(() => compProps.items.filter(i => i.visible !== false))
</script>
