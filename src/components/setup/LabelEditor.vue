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
      <draggable
        :class="{
          'd-flex': true,
          'ga-1': true,
          'flex-row': orientation === 'horizontal',
          'flex-column': orientation === 'vertical',
          'flex-wrap': orientation === 'horizontal',
        }"
        v-model="localCopy"
        item-key="id"
        handle=".v-icon"
      >
        <template #item="{ element }">
          <v-number-input
            v-model="element.value"
            hide-details
            :step="1"
            density="compact"
            control-variant="hidden"
            variant="outlined"
            :append-inner-icon="mdiDragVertical"
            @focus="$event.target.select()"
            :width="orientation === 'horizontal' ? `${('' + element.value).length + 4}em` : undefined"
          />
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { getId } from '@/plugins/id'
  import { mdiDragVertical } from '@mdi/js'
  import draggable from 'vuedraggable'
  import { watchIgnorable } from '@vueuse/core'

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

  function setCopies () {
    localCopy.value = model.value?.map(v => {
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
