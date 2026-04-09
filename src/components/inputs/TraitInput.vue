<template>
  <div class="mb-2" v-if="trait" :key="id">
    <v-text-field
      v-if="trait.dataType === TraitDataType.text"
      :label="label"
      :readonly="isEditable === false"
      :bg-color="bgColor"
      :messages="description ? [description] : undefined"
      @keyup.enter="emit('traverse')"
      :clearable="isEditable !== false"
      v-model="model"
      ref="input"
      @change="tts"
    >
      <template #message="{ message }">
        <span v-html="message" />
      </template>
    </v-text-field>
    <v-text-field
      v-if="trait.dataType === TraitDataType.image"
      :label="label"
      readonly
      :bg-color="bgColor"
      :messages="description ? [description] : undefined"
      @keyup.enter="emit('traverse')"
      :clearable="isEditable !== false"
      v-model="model"
      ref="input"
      @change="tts"
    >
      <template #message="{ message }">
        <span v-html="message" />
      </template>
      <template #append-inner>
        <v-btn class="ms-1" v-tooltip:top="$t('tooltipDataEntryTakeImage')" :disabled="isEditable === false" variant="tonal" size="small" @click="recordImage('image')" :icon="mdiCamera" />
      </template>
    </v-text-field>
    <v-text-field
      v-if="trait.dataType === TraitDataType.video"
      :label="label"
      readonly
      :bg-color="bgColor"
      :messages="description ? [description] : undefined"
      @keyup.enter="emit('traverse')"
      :clearable="isEditable !== false"
      v-model="model"
      ref="input"
      @change="tts"
    >
      <template #message="{ message }">
        <span v-html="message" />
      </template>
      <template #append-inner>
        <v-btn class="ms-1" v-tooltip:top="$t('tooltipDataEntryTakeVideo')" :disabled="isEditable === false" variant="tonal" size="small" @click="recordImage('video')" :icon="mdiVideo" />
      </template>
    </v-text-field>
    <v-text-field
      v-if="trait.dataType === TraitDataType.gps"
      :label="label"
      readonly
      :bg-color="bgColor"
      :messages="description ? [description] : undefined"
      @keyup.enter="emit('traverse')"
      :clearable="isEditable !== false"
      v-model="model"
      ref="input"
    >
      <template #message="{ message }">
        <span v-html="message" />
      </template>
      <template #append-inner>
        <UseGeolocation v-slot="{ coords: { latitude, longitude } }">
          <v-btn class="ms-1" v-tooltip:top="$t('tooltipDataEntryGetGps')" :disabled="isEditable === false" variant="tonal" size="small" @click="setGps(latitude, longitude)" :icon="mdiMapMarker" />
        </UseGeolocation>
      </template>
    </v-text-field>
    <div v-else-if="trait.dataType === TraitDataType.range">
      <div class="text-title-small">{{ label }}</div>
      <v-slider
        v-model="model"
        :readonly="isEditable === false"
        :thumb-color="bgColor"
        :messages="description ? [description] : undefined"
        :color="(model !== null && model !== undefined) ? (bgColor || 'primary') : undefined"
        @wheel="$event.target.blur()"
        thumb-label
        :min="trait.restrictions?.min"
        :max="trait.restrictions?.max"
        :step="trait.restrictions?.step || 1"
        ref="input"
        @end="tts"
      >
        <template #message="{ message }">
          <span v-html="message" />
        </template>
        <template #append>
          <!-- @vue-ignore -->
          <v-number-input
            v-model="model"
            density="compact"
            :readonly="isEditable === false"
            width="100"
            :bg-color="(model !== null && model !== undefined) ? 'warning' : undefined"
            :min="trait.restrictions?.min"
            :max="trait.restrictions?.max"
            :step="trait.restrictions?.step || 1"
            :precision="trait.restrictions.step !== undefined ? null : 0"
            control-variant="stacked"
            variant="outlined"
            hide-details
            @keydown="e => e.preventDefault()"
          />
          <v-btn class="ms-1" variant="flat" :disabled="isEditable === false || model === undefined || model === null" color="error" size="small" @click="model = undefined" :icon="mdiCancel" />
        </template>
      </v-slider>
    </div>
    <v-text-field
      v-else-if="trait.dataType === TraitDataType.date"
      type="date"
      v-model="model"
      :label="label"
      :readonly="isEditable === false"
      :bg-color="bgColor"
      :messages="description ? [description] : undefined"
      @keyup.enter="setDate"
      @keyup.exact="handleDateInputChar"
      @blur="validateDate"
      ref="input"
    >
      <template #append-inner>
        <v-btn class="ms-1" v-tooltip:top="$t('tooltipDataEntryDateMinusOne')" :disabled="isEditable === false" variant="tonal" size="small" @click="setDateDelta(-1)" :icon="mdiChevronLeft" />
        <v-btn class="ms-1" v-tooltip:top="$t('tooltipDataEntryDateToday')" :disabled="isEditable === false" variant="tonal" size="small" @click="setDateDelta(0)" :icon="mdiCalendarToday" />
        <v-btn class="ms-1" v-tooltip:top="$t('tooltipDataEntryDatePlusOne')" :disabled="isEditable === false" variant="tonal" size="small" @click="setDateDelta(1)" :icon="mdiChevronRight" />
        <v-btn class="ms-1" v-tooltip:top="$t('tooltipDataEntryDateReset')" color="error" :disabled="isEditable === false || !model" variant="tonal" size="small" @click="model = undefined" :icon="mdiCancel" />
      </template>

      <template #message="{ message }">
        <span v-html="message" />
      </template>
    </v-text-field>
    <v-number-input
      :error-messages="valid ? [] : [$t('formFeedbackInputOutwithValidRange')]"
      @wheel="$event.target.blur()"
      :messages="description ? [description] : undefined"
      :label="label"
      :readonly="isEditable === false"
      :bg-color="bgColor"
      @keyup.enter="emit('traverse')"
      control-variant="split"
      :model-value="model !== undefined ? +model : undefined"
      @update:model-value="v => model = (v === undefined || v === null) ? undefined : `${v}`"
      :clearable="isEditable !== false"
      :class="store.storeLargeButtonsForIntTraits ? 'large-buttons' : undefined"
      ref="input"
      v-else-if="trait.dataType === TraitDataType.int"
    >
      <template #message="{ message }">
        <span v-html="message" />
      </template>
    </v-number-input>
    <v-number-input
      @wheel="$event.target.blur()"
      :messages="description ? [description] : undefined"
      :error-messages="valid ? [] : [$t('formFeedbackInputOutwithValidRange')]"
      :label="label"
      :rules="rules"
      :precision="null"
      :readonly="isEditable === false"
      :bg-color="bgColor"
      @keyup.enter="emit('traverse')"
      control-variant="split"
      :model-value="model !== undefined ? +model : undefined"
      @update:model-value="v => model = (v === undefined || v === null) ? undefined : `${v}`"
      :clearable="isEditable !== false"
      ref="input"
      v-else-if="trait.dataType === TraitDataType.float"
    >
      <template #message="{ message }">
        <span v-html="message" />
      </template>
    </v-number-input>
    <template v-else-if="trait.dataType === TraitDataType.categorical">
      <v-autocomplete
        :label="label"
        :items="traitCategories"
        :messages="description ? [description] : undefined"
        :bg-color="bgColor"
        :readonly="isEditable === false"
        :model-value="model !== undefined ? +model : undefined"
        @update:model-value="v => model = (v === undefined || v === null) ? undefined : `${v}`"
        @keyup.enter="emit('traverse')"
        ref="input"
        v-if="(trait.restrictions?.categories || []).length > store.storeCategoryCountInline"
      >
        <template #message="{ message }">
          <span v-html="message" />
        </template>
      </v-autocomplete>
      <div class="v-text-field" v-else>
        <div class="text-title-small">{{ label }}</div>
        <v-btn-toggle
          :model-value="model !== undefined ? +model : undefined"
          @update:model-value="v => model = (v === undefined || v === null) ? undefined : `${v}`"
          :disabled="isEditable === false"
          color="primary"
          :base-color="bgColor"
          :variant="bgColor ? 'tonal' : 'outlined'"
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
            <v-icon :icon="mdiCancel" color="error" />
          </v-btn>
        </v-btn-toggle>

        <div class="v-input__details">
          <div class="v-messages" v-if="description">
            <span class="v-messages__message" v-html="description" />
          </div>
        </div>
      </div>
    </template>
    <template v-else-if="trait.dataType === TraitDataType.multicat">
      <v-autocomplete
        :label="label"
        :items="traitCategories"
        :messages="description ? [description] : undefined"
        :readonly="isEditable === false"
        :bg-color="bgColor"
        multiple
        @keyup.enter="emit('traverse')"
        :model-value="model !== undefined ? model.split(':').map(c => +c) : []"
        @update:model-value="v => model = (v === undefined || v === null || v.length === 0) ? undefined : v.sort().join(':')"
        ref="input"
        v-if="(trait.restrictions?.categories || []).length > store.storeCategoryCountInline"
      >
        <template #message="{ message }">
          <span v-html="message" />
        </template>
      </v-autocomplete>
      <div class="v-text-field" v-else>
        <div class="text-title-small">{{ label }}</div>
        <v-btn-toggle
          :model-value="model !== undefined ? model.split(':').map(c => +c) : []"
          @update:model-value="v => model = (v === undefined || v === null || v.length === 0) ? undefined : v.sort().join(':')"
          :disabled="isEditable === false"
          color="primary"
          :base-color="bgColor"
          :variant="bgColor ? 'tonal' : 'outlined'"
          multiple
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
            <v-icon :icon="mdiCancel" color="error" />
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
  import type { MiniCell, TraitPlus } from '@/plugins/types/client'
  import { type Measurement, type Person, TraitDataType } from '@/plugins/types/gridscore'
  import { getDate, getToday, isValidDateString, toLocalDateString } from '@/plugins/util'
  import { coreStore } from '@/stores/app'
  import { UseGeolocation } from '@vueuse/components'
  import { useI18n } from 'vue-i18n'

  import emitter from 'tiny-emitter/instance'
  import { mdiCalendarToday, mdiCamera, mdiCancel, mdiChevronLeft, mdiChevronRight, mdiMapMarker, mdiVideo } from '@mdi/js'
  import { getId } from '@/plugins/id'

  const nonTtsTraitTypes = new Set([TraitDataType.gps, TraitDataType.video, TraitDataType.image, TraitDataType.date, TraitDataType.text, TraitDataType.range])

  const { t } = useI18n()

  const compProps = defineProps<{
    cell: MiniCell
    people?: Person[]
    trait: TraitPlus
    label: string
    bgColor?: string
    measurements: Measurement[] | undefined
    hint?: string
    setIndex?: number
    editable?: boolean
  }>()

  const emit = defineEmits(['traverse', 'valid-changed'])

  const store = coreStore()
  // const date = useDate()

  const model = defineModel<string>()
  const dateInput = ref<string>('')
  const input = useTemplateRef('input')
  const id = ref(`data-input-${getId()}`)

  const valid = computed(() => {
    const mv = model.value
    if (mv !== undefined && mv !== null && rules.value && rules.value.length > 0) {
      return rules.value.every(r => r(mv) === true)
    } else {
      return true
    }
  })

  type ValidationRule = (value: string) => boolean

  const rules: ComputedRef<ValidationRule[] | undefined> = computed(() => {
    const restrictions = compProps.trait?.restrictions
    if (restrictions && (restrictions.min !== undefined || restrictions.max !== undefined)) {
      return [value => {
        if (restrictions.min !== undefined && +value < restrictions.min) {
          return false
        }
        if (restrictions.max !== undefined && +value > restrictions.max) {
          return false
        }
        return true
      }]
    } else {
      return undefined
    }
  })

  const traitCategories = computed(() => {
    if (compProps.trait && TraitDataType.isCategorical(compProps.trait.dataType) && compProps.trait.restrictions) {
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

  const isEditable = computed(() => {
    return (compProps.editable === undefined || compProps.editable === true) && compProps.trait.editable
  })

  const description = computed(() => {
    if (compProps.hint) {
      return compProps.hint
    } else if (compProps.trait && compProps.measurements && compProps.measurements && compProps.measurements.length > 0) {
      // Sort them by date
      const sorted = compProps.measurements.concat().sort((a, b) => a.timestamp.localeCompare(b.timestamp))

      // Get the newest one
      const last = sorted[sorted.length - 1]
      let values: (string | undefined)[] = []

      if (last) {
        // Determine the values for display purposes
        if (TraitDataType.isCategorical(compProps.trait.dataType) && compProps.trait.restrictions && compProps.trait.restrictions.categories) {
          if (compProps.trait.dataType === TraitDataType.categorical) {
            // @ts-ignore
            values = last.values.map(v => (v !== undefined && v !== null) ? compProps.trait.restrictions.categories[v] : undefined)
          } else {
            // @ts-ignore
            values = last.values.map(v => {
              if (v !== undefined && v !== null) {
                // @ts-ignore
                return v.split(':').map(vv => (vv !== undefined && vv !== null) ? compProps.trait.restrictions.categories[vv] : undefined).join(':')
              } else {
                return undefined
              }
            })
          }
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

            return t(person ? 'widgetTraitInputPreviousMeasuresTakenBy' : 'widgetTraitInputPreviousMeasures', { date: new Date(last.timestamp).toLocaleDateString(), values: v || 'N/A', color: compProps.trait.color, by: person?.name })
          })[compProps.setIndex || 0]
        } else {
          return values.map(v => {
            let person
            if (compProps.people && last.personId) {
              person = compProps.people.find(p => p.id === last.personId)
            }

            return t(person ? 'widgetTraitInputCurrentMeasuresTakenBy' : 'widgetTraitInputCurrentMeasures', { date: new Date(last.timestamp).toLocaleDateString(), values: v || 'N/A', color: compProps.trait.color, by: person?.name })
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
    if (isEditable.value && (event.key === '-' || event.key === '+' || !isNaN(event.key))) {
      dateInput.value += event.key
    }
  }

  function recordImage (type: string) {
    emitter.emit('tag-media', compProps.cell.row || 0, compProps.cell.column || 0, type, [], (filename: string) => {
      model.value = filename
    })
  }

  function setDateDelta (delta: number) {
    if (!isEditable.value) {
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

    if (delta === 0) {
      emit('traverse')
    }
  }

  function setDate () {
    if (!isEditable.value) {
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
    if (model.value !== undefined) {
      if (compProps.trait.dataType === TraitDataType.categorical) {
        // @ts-ignore
        emitter.emit('tts', compProps.trait.restrictions.categories[+model.value])
      } else if (compProps.trait.dataType === TraitDataType.multicat) {
        // @ts-ignore
        emitter.emit('tts', model.value.split(':').map(p => compProps.trait.restrictions.categories[+p]).join('; '))
      } else {
        emitter.emit('tts', model.value)
      }
    }
  }

  watch(model, async newValue => {
    if (newValue !== undefined && newValue !== null && !nonTtsTraitTypes.has(compProps.trait.dataType)) {
      tts()
    }

    if (newValue === undefined || newValue === null) {
      // We force a new key for the input element here, because Vuetify has a bug where an input in error state
      // does not remove the error state fully when the value is reset. Keep an eye on this and potentially remove
      // this to improve performance again (remove "unnecessary" re-render)
      id.value = `data-input-${getId()}`
    }
  })

  watch(valid, async newValue => emit('valid-changed', newValue))

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
