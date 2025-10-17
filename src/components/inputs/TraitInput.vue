<template>
  <div class="mb-2" v-if="trait">
    <v-text-field
      v-if="trait.dataType === TraitDataType.text"
      :label="label"
      :readonly="trait.editable === false"
      :messages="description ? ['f'] : undefined"
      @keyup.enter="emit('traverse')"
      clearable
      v-model="model"
      ref="input"
      @change="tts"
    >
      <template #message v-if="description">
        <span v-html="description" />
      </template>
    </v-text-field>
    <v-text-field
      v-if="trait.dataType === TraitDataType.gps"
      :label="label"
      readonly
      :messages="description ? ['f'] : undefined"
      @keyup.enter="emit('traverse')"
      clearable
      v-model="model"
      ref="input"
    >
      <template #message v-if="description">
        <span v-html="description" />
      </template>
      <template #append-inner>
        <UseGeolocation v-slot="{ coords: { latitude, longitude } }">
          <v-btn class="ms-1" v-tooltip:top="$t('tooltipDataEntryGetGps')" :disabled="trait.editable === false" variant="tonal" size="small" @click="setGps(latitude, longitude)" icon="mdi-map-marker" />
        </UseGeolocation>
      </template>
    </v-text-field>
    <div v-else-if="trait.dataType === TraitDataType.range">
      <div class="text-subtitle-2">{{ label }}</div>
      <v-slider
        v-model="model"
        :readonly="trait.editable === false"
        :messages="description ? ['f'] : undefined"
        :color="(model !== null && model !== undefined) ? 'primary' : undefined"
        @wheel="$event.target.blur()"
        thumb-label
        :min="trait.restrictions?.min"
        :max="trait.restrictions?.max"
        :step="1"
        ref="input"
        @end="tts"
      >
        <template #message v-if="description">
          <span v-html="description" />
        </template>
        <template #append>
          <!-- @vue-ignore -->
          <v-number-input
            v-model="model"
            density="compact"
            :readonly="trait.editable"
            width="100"
            :bg-color="(model !== null && model !== undefined) ? 'warning' : undefined"
            :min="trait.restrictions?.min"
            :max="trait.restrictions?.max"
            :step="1"
            control-variant="stacked"
            variant="outlined"
            hide-details
          />
          <v-btn class="ms-1" variant="flat" :disabled="trait.editable === false || model === undefined || model === null" color="error" size="small" @click="model = undefined" icon="mdi-cancel" />
        </template>
      </v-slider>
    </div>
    <v-text-field
      v-else-if="trait.dataType === TraitDataType.date"
      type="date"
      v-model="model"
      :label="label"
      :readonly="trait.editable === false"
      :messages="description ? ['f'] : undefined"
      @keyup.enter="setDate"
      @keyup.exact="handleDateInputChar"
      @blur="validateDate"
      ref="input"
    >
      <template #append-inner>
        <v-btn class="ms-1" v-tooltip:top="$t('tooltipDataEntryDateMinusOne')" :disabled="trait.editable === false" variant="tonal" size="small" @click="setDateDelta(-1)" icon="mdi-chevron-left" />
        <v-btn class="ms-1" v-tooltip:top="$t('tooltipDataEntryDateToday')" :disabled="trait.editable === false" variant="tonal" size="small" @click="setDateDelta(0)" icon="mdi-calendar-today" />
        <v-btn class="ms-1" v-tooltip:top="$t('tooltipDataEntryDatePlusOne')" :disabled="trait.editable === false" variant="tonal" size="small" @click="setDateDelta(1)" icon="mdi-chevron-right" />
        <v-btn class="ms-1" v-tooltip:top="$t('tooltipDataEntryDateReset')" color="error" :disabled="trait.editable === false || !model" variant="tonal" size="small" @click="model = undefined" icon="mdi-cancel" />
      </template>

      <template #message v-if="description">
        <span v-html="description" />
      </template>
    </v-text-field>
    <v-number-input
      :min="trait.restrictions?.min"
      :max="trait.restrictions?.max"
      @wheel="$event.target.blur()"
      :messages="description ? ['f'] : undefined"
      :label="label"
      :readonly="trait.editable === false"
      @keyup.enter="emit('traverse')"
      control-variant="split"
      :model-value="model !== undefined ? +model : undefined"
      @update:model-value="v => model = v === undefined ? undefined : `${v}`"
      clearable
      :class="store.storeLargeButtonsForIntTraits ? 'large-buttons' : undefined"
      ref="input"
      v-else-if="trait.dataType === TraitDataType.int"
    >
      <template #message v-if="description">
        <span v-html="description" />
      </template>
    </v-number-input>
    <v-number-input
      :min="trait.restrictions?.min"
      :max="trait.restrictions?.max"
      @wheel="$event.target.blur()"
      :messages="description ? ['f'] : undefined"
      :label="label"
      :precision="null"
      :readonly="trait.editable === false"
      @keyup.enter="emit('traverse')"
      control-variant="split"
      :model-value="model !== undefined ? +model : undefined"
      @update:model-value="v => model = v === undefined ? undefined : `${v}`"
      clearable
      ref="input"
      v-else-if="trait.dataType === TraitDataType.float"
    >
      <template #message v-if="description">
        <span v-html="description" />
      </template>
    </v-number-input>
    <template v-else-if="trait.dataType === TraitDataType.categorical">
      <v-autocomplete
        v-model="model"
        :label="label"
        :items="traitCategories"
        :messages="description ? ['f'] : undefined"
        :readonly="trait.editable === false"
        @keyup.enter="emit('traverse')"
        ref="input"
        v-if="(trait.restrictions?.categories || []).length > store.storeCategoryCountInline"
      >
        <template #message v-if="description">
          <span v-html="description" />
        </template>
      </v-autocomplete>
      <div class="v-text-field" v-else>
        <div class="text-subtitle-2">{{ label }}</div>
        <v-btn-toggle
          v-model="model"
          :disabled="trait.editable === false"
          color="primary"
          variant="outlined"
          divided
          ref="input"
        >
          <v-btn
            :value="catIndex"
            v-for="(cat, catIndex) in (trait.restrictions?.categories || [])"
            :key="`trait-${trait.id}-${cat}`"
            :text="cat"
          />
          <v-btn
            v-if="model !== undefined && model !== null"
            @click="model = undefined"
          >
            <v-icon icon="mdi-cancel" color="error" />
          </v-btn>
        </v-btn-toggle>

        <div class="v-input__details">
          <div class="v-messages" v-if="description">
            <span class="v-messages__message" v-html="description" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import type { TraitPlus } from '@/plugins/types/client'
  import { type Measurement, type Person, TraitDataType } from '@/plugins/types/gridscore'
  import { getDate, getToday, isValidDateString, toLocalDateString } from '@/plugins/util'
  import { coreStore } from '@/stores/app'
  import { UseGeolocation } from '@vueuse/components'
  import { useI18n } from 'vue-i18n'

  import emitter from 'tiny-emitter/instance'

  const nonTtsTraitTypes = new Set([TraitDataType.gps, TraitDataType.video, TraitDataType.image, TraitDataType.date, TraitDataType.text, TraitDataType.range])

  const { t } = useI18n()

  const compProps = defineProps<{
    people?: Person[]
    trait: TraitPlus
    label: string
    measurements: Measurement[] | undefined
    setIndex?: number
  }>()

  const emit = defineEmits(['traverse'])

  const store = coreStore()
  // const date = useDate()

  const model = defineModel<string>()
  const dateInput = ref<string>('')
  const input = useTemplateRef('input')

  const traitCategories = computed(() => {
    if (compProps.trait && compProps.trait.dataType === TraitDataType.categorical && compProps.trait.restrictions) {
      return (compProps.trait.restrictions?.categories || []).map((value, index) => {
        return {
          value: index,
          title: value,
        }
      })
    } else {
      return []
    }
  })

  const description = computed(() => {
    if (compProps.trait && compProps.measurements && compProps.measurements && compProps.measurements.length > 0) {
      // Sort them by date
      const sorted = compProps.measurements.concat().sort((a, b) => a.timestamp.localeCompare(b.timestamp))

      // Get the newest one
      const last = sorted[sorted.length - 1]
      let values: (string | undefined)[] = []

      if (last) {
        // Determine the values for display purposes
        if (compProps.trait.dataType === TraitDataType.categorical && compProps.trait.restrictions && compProps.trait.restrictions.categories) {
          // @ts-ignore
          values = last.values.map(v => (v !== undefined && v !== null) ? compProps.trait.restrictions.categories[v] : undefined)
        } else if (compProps.trait.dataType === TraitDataType.date) {
          values = last.values.map(v => (v !== undefined && v !== null) ? new Date(v).toLocaleDateString() : undefined)
        } else {
          values = last.values
        }

        // Create the description
        if (compProps.trait.allowRepeats) {
          return values.map(v => {
            let person
            if (compProps.people && last.personId) {
              person = compProps.people.find(p => p.id === last.personId)
            }

            return t(person ? 'widgetTraitInputPreviousMeasuresTakenBy' : 'widgetTraitInputPreviousMeasures', { date: new Date(last.timestamp).toLocaleDateString(), values: v, color: compProps.trait.color, by: person?.name })
          })[compProps.setIndex || 0]
        } else {
          return values.map(v => {
            let person
            if (compProps.people && last.personId) {
              person = compProps.people.find(p => p.id === last.personId)
            }

            return t(person ? 'widgetTraitInputCurrentMeasuresTakenBy' : 'widgetTraitInputCurrentMeasures', { date: new Date(last.timestamp).toLocaleDateString(), values: v, color: compProps.trait.color, by: person?.name })
          })[compProps.setIndex || 0]
        }
      }
    }

    return undefined
  })

  function validateDate () {
    if (model.value && compProps.trait.dataType === TraitDataType.date && !isValidDateString(model.value)) {
      model.value = undefined
    }
  }

  function handleDateInputChar (event: KeyboardEvent) {
    // If this could be part of a number, append to existing string
    // @ts-ignore
    if (compProps.trait.editable && (event.key === '-' || event.key === '+' || !isNaN(event.key))) {
      dateInput.value += event.key
    }
  }

  function setDateDelta (delta: number) {
    if (!compProps.trait.editable) {
      return
    }

    const current = model.value
    let date: Date
    if (current === undefined || current === null || current === '' || delta === 0) {
      date = getToday()
    } else {
      date = getDate(current)
    }

    date.setDate(date.getDate() + delta)

    model.value = toLocalDateString(date)

    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > -14 && diffDays < 0) {
      emitter.emit('tts', t('ttsDaysIn', Math.abs(diffDays)))
    } else if (diffDays < 14) {
      emitter.emit('tts', t('ttsDaysAgo', Math.abs(diffDays)))
    } else {
      emitter.emit('tts', toLocalDateString(current))
    }
  }

  function setDate () {
    if (!compProps.trait.editable) {
      return
    }

    if (dateInput.value.trim().length > 0) {
      const delta = +dateInput.value

      const current = getToday()
      current.setDate(current.getDate() + delta)

      model.value = toLocalDateString(current)

      dateInput.value = ''
    }
    emit('traverse')
  }

  function focus () {
    const i = input.value
    if (i) {
      // @ts-ignore
      if (i.focus) {
        // @ts-ignore
        i.focus()
      }
      setTimeout(() => {
        // @ts-ignore
        if (i.scrollIntoView) {
          // @ts-ignore
          i.scrollIntoView({ behavior: 'smooth' })
        } else if (i.$el) {
          i.$el.scrollIntoView({ behavior: 'smooth' })
        }
      }, 500)
    }
  }

  function setGps (latitude: number, longitude: number) {
    if (isFinite(latitude) && isFinite(longitude)) {
      model.value = `${latitude};${longitude}`

      emitter.emit('tts', t('ttsCurrentLocation'))

      emit('traverse')
    } else {
      console.log(latitude, longitude)
    }
  }

  function tts () {
    // @ts-ignore
    emitter.emit('tts', compProps.trait.dataType === TraitDataType.categorical ? compProps.trait.restrictions.categories[model.value] : model.value)
  }

  watch(model, async newValue => {
    if (newValue !== undefined && newValue !== null && !nonTtsTraitTypes.has(compProps.trait.dataType)) {
      tts ()
    }
  })

  defineExpose({
    focus,
  })
</script>

<style>
.large-buttons .v-field__append-inner button,
.large-buttons .v-field__prepend-inner button {
  width: auto;
}

.large-buttons .v-field__append-inner button .v-btn__content i,
.large-buttons .v-field__prepend-inner button .v-btn__content i {
  --v-icon-size-multiplier: 3;
}
</style>
