<template>
  <template v-if="breakpoint">
    <ResponsiveButton
      v-for="(item, index) in items"
      :key="`menu-item-${index}`"
      v-bind="item"
      :color="item.active === true ? 'primary' : undefined"
      @click="item.click()"
    />
  </template>
  <v-menu eager v-else>
    <template #activator="{ props }">
      <v-btn v-bind="props" size="small" variant="tonal" prepend-icon="mdi-dots-vertical" />
    </template>

    <v-list slim color="primary">
      <v-list-item
        v-for="(item, index) in items"
        :key="`menu-item-${index}`"
        v-bind="item"
        :variant="undefined"
        :title="item.text"
        @click="item.click()"
      />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
  export interface MenuItem {
    id?: string
    text: string
    prependIcon: string
    click: () => void
    size: 'small' | 'default' | 'x-small' | 'large' | 'x-large' | undefined
    variant?: 'text' | 'flat' | 'elevated' | 'outlined' | 'plain' | 'tonal' | undefined
    active?: boolean
    visible?: boolean
    disabled?: boolean
    activeClass?: string
  }

  defineProps<{
    items: MenuItem[]
    breakpoint: boolean
  }>()
</script>
