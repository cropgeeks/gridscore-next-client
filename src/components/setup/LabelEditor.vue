<template>
  <div>
    <v-switch
      :label="$t('buttonEditLabels')"
      persistent-hint
      color="primary"
      hide-details
      v-model="edit"
    />

    <div
      v-if="edit"
    >
      <div
        ref="parent"
        :class="{
          'd-flex': true,
          'ga-1': true,
          'flex-row': orientation === 'horizontal',
          'flex-column': orientation === 'vertical',
          'flex-wrap': orientation === 'horizontal',
        }"
      >
        <v-number-input
          v-for="(element, index) in model"
          :key="`element-${index}`"
          :model-value="element"
          @update:model-value="v => { model[index] = v }"
          hide-details
          :step="1"
          density="compact"
          control-variant="hidden"
          variant="outlined"
          :width="orientation === 'horizontal' ? `${('' + element).length + 4}em` : undefined"
        >
          <template #append-inner>
            <div class="drag-handle" @mousedown.stop @touchstart.stop>
              <v-icon :icon="mdiDragVertical" />
            </div>
          </template>
        </v-number-input>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { mdiDragVertical } from '@mdi/js'
  import { dragAndDrop } from '@formkit/drag-and-drop/vue'

  const compProps = defineProps<{
    orientation: 'horizontal' | 'vertical'
  }>()

  const edit = ref(false)
  const model = defineModel<number[]>({
    default: [],
  })

  const parent = ref()

  dragAndDrop<number>({
    parent: parent,
    values: model,
    // @ts-ignore
    config: {
      dragHandle: '.drag-handle',
    },
  })
</script>

<style scoped>
.drag-handle:hover {
  cursor: move;
}
</style>
