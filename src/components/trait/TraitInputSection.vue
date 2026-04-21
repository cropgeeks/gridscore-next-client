<template>
  <div v-if="model" ref="parent">
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
      :cell="cell"
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
  import type { MiniCell, TraitPlus } from '@/plugins/types/client'
  import type { Measurement, Person } from '@/plugins/types/gridscore'
  import type { TraitData } from '@/components/inputs/DataEntrySection.vue'

  import emitter from 'tiny-emitter/instance'

  const emit = defineEmits(['traverse', 'valid-changed'])

  const parent = useTemplateRef('parent')

  const refs = ref<{ [index: number]: any }>({})
  const inputsValid = ref<boolean[]>([])

  const compProps = withDefaults(defineProps<{
    cell: MiniCell
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
      emitter.emit('tts', compProps.trait.name, false)
    }

    refs.value[index]?.focus()

    const i = parent.value
    if (i && i.scrollIntoView) {
      setTimeout(() => i.scrollIntoView({ behavior: 'smooth' }), 500)
    }
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
