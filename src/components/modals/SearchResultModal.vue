<template>
  <v-dialog v-model="dialog" max-width="min(90vw, 1024px)">
    <v-card :title="$t('modalTitleSearchMatches')">
      <v-list>
        <v-list-item
          v-for="item in list"
          :key="`search-result-${item.row}-${item.column}`"
          :title="item.displayName || item.germplasm"
          @click="onClick(item)"
        >
          <PlotInformation :cell="item" />
        </v-list-item>
      </v-list>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('buttonClose')" @click="hide" color="primary" variant="tonal" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { CellPlus } from '@/plugins/types/client'

  import emitter from 'tiny-emitter/instance'

  const dialog = ref(false)

  defineProps<{
    list: CellPlus[]
  }>()

  function onClick (match: CellPlus) {
    emitter.emit('plot-clicked', match.row, match.column, true)
    hide()
  }

  function show () {
    dialog.value = true
  }
  function hide () {
    dialog.value = false
  }

  defineExpose({
    show,
    hide,
  })
</script>
