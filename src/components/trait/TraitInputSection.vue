<template>
  <div v-if="model">
    <TraitSection
      :trait="trait"
      short-title
    >
      <template #default>
        <slot name="default" />
      </template>
    </TraitSection>

    <TraitInput
      v-model="model[`${setIndex}`]"
      :people="people"
      :trait="trait"
      :measurements="measurements"
      :editable="editable"
      :set-index="setIndex - 1"
      :label="trait.setSize > 1 ? $t('formLabelMeasurementSet', { position: $n(setIndex) }) : $t('formLabelMeasurementEntry')"
      v-for="setIndex in (trait.setSize || 1)"
      :key="`${trait.id}-${setIndex}`"
      @traverse="emit('traverse', setIndex)"
      :ref="(el) => (refs[setIndex] = el)"
    />
  </div>
</template>

<script setup lang="ts">
  import type { TraitPlus } from '@/plugins/types/client'
  import type { Measurement, Person } from '@/plugins/types/gridscore'
  import type { TraitData } from '@/components/modals/DataEntryModal.vue'

  const emit = defineEmits(['traverse'])

  const refs = ref<{ [index: number]: Element | ComponentPublicInstance | null }>({})

  const compProps = withDefaults(defineProps<{
    people?: Person[]
    trait: TraitPlus
    measurements: Measurement[] | undefined
    editable?: boolean
  }>(), {
    editable: true,
  })

  const model = defineModel<TraitData>({})

  function focus (index: number) {
    // @ts-ignore
    refs.value[index]?.focus()
  }

  defineExpose({
    focus,
  })
</script>
