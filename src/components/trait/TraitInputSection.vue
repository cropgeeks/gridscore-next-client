<template>
  <div v-if="model">
    <TraitSection
      :trait="trait"
      short-title
      show-subtitle
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
      @valid-changed="v => inputsValid[setIndex - 1] = v"
    />
  </div>
</template>

<script setup lang="ts">
  import type { TraitPlus } from '@/plugins/types/client'
  import type { Measurement, Person } from '@/plugins/types/gridscore'
  import type { TraitData } from '@/components/modals/DataEntryModal.vue'

  import emitter from 'tiny-emitter/instance'

  const emit = defineEmits(['traverse', 'valid-changed'])

  const refs = ref<{ [index: number]: any }>({})
  const inputsValid = ref<boolean[]>([])

  const compProps = withDefaults(defineProps<{
    people?: Person[]
    trait: TraitPlus
    measurements: Measurement[] | undefined
    editable?: boolean
  }>(), {
    editable: true,
  })

  const model = defineModel<TraitData>({})

  const valid = computed(() => {
    return inputsValid.value.every(v => v === true)
  })

  function focus (index: number) {
    if (index === 1) {
      emitter.emit('tts', compProps.trait.name)
    }

    // @ts-ignore
    refs.value[index]?.focus()
  }

  function updateValid () {
    inputsValid.value = Array.from(new Array(compProps.trait.setSize)).map(() => true)
  }

  onMounted(() => updateValid())

  watch(model, async () => updateValid())

  watch(valid, async newValue => emit('valid-changed', newValue))

  defineExpose({
    focus,
  })
</script>
