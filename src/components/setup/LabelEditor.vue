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
          v-for="element in values"
          :key="`element-${element.id}`"
          v-model="element.value"
          hide-details
          :step="1"
          density="compact"
          control-variant="hidden"
          variant="outlined"
          :width="orientation === 'horizontal' ? `${('' + element.value).length + 4}em` : undefined"
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
  import { getId } from '@/plugins/id'
  import { mdiDragVertical } from '@mdi/js'
  import { watchIgnorable } from '@vueuse/core'
  import { useDragAndDrop } from '@formkit/drag-and-drop/vue'

  const compProps = defineProps<{
    orientation: 'horizontal' | 'vertical'
  }>()

  interface CopyObject {
    id: string
    value: number
  }

  const edit = ref(false)
  const model = defineModel<number[]>()
  const localCopy = ref<CopyObject[]>([])

  const [parent, values] = useDragAndDrop<CopyObject>(
    [],
    { dragHandle: '.drag-handle' },
  )

  function setCopies () {
    values.value = model.value?.map(v => {
      return {
        value: v,
        id: getId(),
      }
    }) || []
  }

  // Listen for changes, but don't trigger the other one to prevent infinite loops
  const { ignoreUpdates: ignoreModel } = watchIgnorable(model, () => ignoreLocal(() => setCopies()))
  const { ignoreUpdates: ignoreLocal } = watchIgnorable(localCopy, async newValue => {
    ignoreModel(() => {
      // Don't trigger model watcher
      model.value = newValue.map(v => v.value)
    })
  }, { deep: true })

  onMounted(() => setCopies())
</script>

<style scoped>
.drag-handle:hover {
  cursor: move;
}
</style>
