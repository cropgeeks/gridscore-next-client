<template>
  <b-input-group class="trait-data-input">
    <template #prepend v-if="trait.dataType === 'int'">
      <b-button :class="`${storeLargeButtonsForIntTraits ? 'nudge flex-even' : ''}`" @pointerdown="nudge(-1)" :disabled="!editable">
        <span :class="`${storeLargeButtonsForIntTraits ? 'mx-3 mx-md-5' : ''}`">-</span>
      </b-button>
    </template>

    <b-form-input :id="id"
                  v-if="trait.dataType === 'date'"
                  v-model="value"
                  :state="formState"
                  @keyup.enter="handleDateInput"
                  @keyup.exact="handleDateInputChar"
                  type="date"
                  ref="input"
                  :readonly="!editable"
                  @change="tts" />
    <!-- For int types, show a number input, apply restrictions -->
    <b-form-input :id="id"
                  v-else-if="trait.dataType === 'int'"
                  ref="input"
                  :class="`number-input ${storeLargeButtonsForIntTraits ? 'text-center flex-even' : ''}`"
                  :state="formState"
                  @wheel="$event.target.blur()"
                  type="number"
                  v-model="value"
                  :readonly="!editable"
                  @change="tts"
                  @keyup.enter="$emit('traverse')"
                  :min="(trait.restrictions && trait.restrictions.min !== null && trait.restrictions.min !== undefined) ? trait.restrictions.min : null"
                  :max="(trait.restrictions && trait.restrictions.max !== null && trait.restrictions.max !== undefined) ? trait.restrictions.max : null" />
    <!-- For float types, show a number input, apply restrictions -->
    <b-form-input :id="id"
                  v-else-if="trait.dataType === 'float'"
                  ref="input"
                  class="number-input"
                  :state="formState"
                  @wheel="$event.target.blur()"
                  type="number"
                  v-model="value"
                  :readonly="!editable"
                  @change="tts"
                  @keyup.enter="$emit('traverse')"
                  :min="(trait.restrictions && trait.restrictions.min !== null && trait.restrictions.min !== undefined) ? trait.restrictions.min : null"
                  :max="(trait.restrictions && trait.restrictions.max !== null && trait.restrictions.max !== undefined) ? trait.restrictions.max : null"
                  :step="0.02" />
    <!-- For range types, show a range slider -->
    <b-form-input :id="id"
                  v-else-if="trait.dataType === 'range'"
                  ref="input"
                  class="form-control"
                  :state="formState"
                  @wheel="$event.target.blur()"
                  type="range"
                  v-model="value"
                  :readonly="!editable"
                  @change="ttsAndSet"
                  :min="(trait.restrictions && trait.restrictions.min !== null && trait.restrictions.min !== undefined) ? trait.restrictions.min : 0"
                  :max="(trait.restrictions && trait.restrictions.max !== null && trait.restrictions.max !== undefined) ? trait.restrictions.max : 100"
                  :step="1" />
    <!-- For categorical traits -->
    <!-- If there are more than 4 options, show a dropdown select -->
    <b-form-select :id="id" v-else-if="trait.dataType === 'categorical' && trait.restrictions && trait.restrictions.categories && trait.restrictions.categories.length > storeCategoryCountInline" ref="input" :state="formState"
                    v-model="value"
                    :disabled="!editable"
                    :readonly="!editable"
                    :options="traitOptionsSelect"
                    @change="tts(); $emit('traverse')" />
    <!-- Else show a button group for easier selection -->
    <b-button-group :id="id" v-else-if="trait.dataType === 'categorical' && trait.restrictions && trait.restrictions.categories && trait.restrictions.categories.length <= storeCategoryCountInline" ref="input" :state="formState">
      <b-button variant="outline-secondary" v-for="option in traitOptionsButtons" :key="`trait-option-trait-${trait.id}-option-${option.value}`" :pressed="option.value === value" @click="ttsAndSetCategory(option.value)">
        {{ option.text }}
      </b-button>
    </b-button-group>
    <!-- <b-form-radio-group :id="id" v-else-if="trait.dataType === 'categorical' && trait.restrictions && trait.restrictions.categories && trait.restrictions.categories.length <= storeCategoryCountInline" ref="input" :state="formState"
                        buttons
                        button-variant="outline-secondary"
                        @change="ttsAndSetCategory"
                        :checked="value"
                        :disabled="!editable"
                        :options="traitOptionsButtons" /> -->
    <b-form-input :id="id" v-else-if="trait.dataType === 'gps'" v-model="value" :state="formState" ref="input" @change="tts" :readonly="true"/>
    <b-form-input :id="id" v-else-if="trait.dataType === 'image'" v-model="value" :state="formState" ref="input" @change="tts" :readonly="true"/>
    <b-form-input :id="id" v-else v-model="value" :state="formState" ref="input" @change="tts" :readonly="!editable"/>

    <template #append v-if="trait.dataType === 'image'">
      <b-button v-b-tooltip="$t('tooltipDataEntryTakeImage')" variant="primary" @click="$refs.imageModal.show()" :disabled="!editable"><IBiCameraFill /></b-button>
      <b-button v-b-tooltip="$t('tooltipDataEntryReset')" variant="danger" @click="resetValue" :disabled="!editable"><IBiSlashCircle /></b-button>
    </template>
    <template #append v-else-if="trait.dataType === 'gps'">
      <UseGeolocation v-slot="{ coords: { latitude, longitude } }">
        <b-button v-b-tooltip="$t('tooltipDataEntryGetGps')" variant="primary" @click="setGps(latitude, longitude)" :disabled="!editable"><IBiGeoAlt /></b-button>
      </UseGeolocation>
      <b-button v-b-tooltip="$t('tooltipDataEntryReset')" variant="danger" @click="resetValue" :disabled="!editable"><IBiSlashCircle /></b-button>
    </template>
    <template #append v-else-if="trait.dataType === 'date' || trait.dataType === 'int'">
      <template v-if="trait.dataType === 'date'">
        <b-button v-b-tooltip="$t('tooltipDataEntryDateMinusOne')" @click="setDateMinusOne" :disabled="!editable"><IBiCaretLeftFill /></b-button>
        <b-button v-b-tooltip="$t('tooltipDataEntryDateToday')" @click="setDateToday" :disabled="!editable"><IBiCalendar3 /></b-button>
        <b-button v-b-tooltip="$t('tooltipDataEntryDatePlusOne')" @click="setDatePlusOne" :disabled="!editable"><IBiCaretRightFill /></b-button>
        <b-button v-b-tooltip="$t('tooltipDataEntryReset')" variant="danger" @click="resetValue" :disabled="!editable"><IBiSlashCircle /></b-button>
      </template>
      <b-button :class="`${storeLargeButtonsForIntTraits ? 'nudge flex-even' : ''}`" v-if="trait.dataType === 'int'" @pointerdown="nudge(1)" :disabled="!editable">
        <span :class="`${storeLargeButtonsForIntTraits ? 'mx-3 mx-md-5' : ''}`">+</span>
      </b-button>
    </template>
    <template #append v-else-if="trait.dataType === 'range'">
      <span :class="`range-wrapper px-3 ${(value !== undefined && value !== null) ? 'bg-warning' : 'bg-secondary'}`"><span class="range-value">{{ (value !== undefined && value !== null) ? value : 'N/A' }}</span></span>
      <b-button v-b-tooltip="$t('tooltipDataEntryReset')" variant="danger" @click="resetValue" :disabled="!editable"><IBiSlashCircle /></b-button>
    </template>

    <ImageModal v-if="trait.dataType === 'image'" :row="cell.row" :column="cell.column" :trial="trial" :displayName="cell.displayName" :preferredTraitId="trait.id" ref="imageModal" @image-saved="setImageFilename" />
  </b-input-group>
</template>

<script>
import { checkDataMatchesTraitType, toLocalDateString } from '@/plugins/misc'
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import { UseGeolocation } from '@vueuse/components'

import emitter from 'tiny-emitter/instance'
import { getTrialCached } from '@/plugins/datastore'
import { useVibrate } from '@vueuse/core'

export default {
  components: {
    UseGeolocation
  },
  props: {
    cell: {
      type: Object,
      default: () => null
    },
    editable: {
      type: Boolean,
      default: true
    },
    trait: {
      type: Object,
      default: () => null
    },
    id: {
      type: String,
      default: null
    },
    currentValue: {
      default: null
    }
  },
  data: function () {
    const trial = getTrialCached()
    trial.traits = [this.trait]

    return {
      vibrate: useVibrate({ pattern: [50] }),
      value: null,
      formState: null,
      dateInput: '',
      rangeChanged: false,
      trial
    }
  },
  watch: {
    currentValue: {
      immediate: true,
      handler: function (newValue) {
        this.value = newValue
      }
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeCategoryCountInline',
      'storeLargeButtonsForIntTraits'
    ]),
    traitOptionsSelect: function () {
      if (this.trait && this.trait.dataType === 'categorical') {
        return [{ value: null, text: this.$t('formSelectCategory') }, ...this.trait.restrictions.categories.map((c, i) => {
          return {
            value: i,
            text: c
          }
        })]
      } else {
        return []
      }
    },
    traitOptionsButtons: function () {
      if (this.trait && this.trait.dataType === 'categorical') {
        return [...this.trait.restrictions.categories.map((c, i) => {
          return {
            value: i,
            text: c
          }
        }), { value: null, text: '⦸' }]
      } else {
        return []
      }
    }
  },
  methods: {
    setGps: function (latitude, longitude) {
      if (isFinite(latitude) && isFinite(longitude)) {
        this.value = `${latitude};${longitude}`

        emitter.emit('tts', this.$t('ttsCurrentLocation'))

        this.$emit('traverse')
      }
    },
    getValue: function () {
      if (this.value === undefined || this.value === null || this.value === '' || (this.trait.dataType === 'range' && !this.rangeChanged)) {
        return null
      } else {
        if ((typeof this.value) === 'string') {
          return this.value.trim()
        } else {
          return this.value
        }
      }
    },
    focus: function () {
      if (this.$refs.input && this.$refs.input.focus) {
        this.$refs.input.focus()
      }
    },
    handleDateInput: function () {
      if (this.editable && this.dateInput.length > 0 && !isNaN(this.dateInput)) {
        const number = +this.dateInput

        const current = this.getToday()
        current.setDate(current.getDate() + number)

        this.value = toLocalDateString(current)

        this.dateInput = ''

        emitter.emit('tts', this.value)

        this.$emit('traverse')
      }
    },
    handleDateInputChar: function (event) {
      // If this could be part of a number, append to existing string
      if (this.editable && (event.key === '-' || event.key === '+' || !isNaN(event.key))) {
        this.dateInput += event.key
      }
    },
    reset: function () {
      this.value = null
      this.formState = null
    },
    validate: function () {
      if (this.value === null || this.value === '') {
        this.value = null
        this.formState = true
        return true
      } else if (!checkDataMatchesTraitType(this.trait, this.value, false)) {
        this.formState = false
        return false
      }

      this.formState = true
      return true
    },
    getToday: function () {
      const today = new Date()
      const offset = today.getTimezoneOffset()
      return new Date(today.getTime() + (offset * 60 * 1000))
    },
    getDate: function (d) {
      const [yyyy, mm, dd] = d.split(/[^\d]+/)
      const date = new Date()
      date.setUTCFullYear(+yyyy)
      date.setUTCMonth(mm - 1)
      date.setUTCDate(+dd)
      return date
    },
    nudge: function (delta) {
      if (!this.editable) {
        return
      }

      let newValue
      if (this.value !== null && this.value !== '') {
        newValue = (+this.value) + delta
      } else {
        newValue = delta
      }

      if (this.trait.restrictions) {
        const min = this.trait.restrictions.min
        const max = this.trait.restrictions.max
        if (min !== undefined && min !== null) {
          newValue = Math.max(min, newValue)
        }
        if (max !== undefined && max !== null) {
          newValue = Math.min(max, newValue)
        }
      }

      // Convert back to string
      this.value = '' + newValue

      if (this.vibrate.isSupported && this.storeLargeButtonsForIntTraits) {
        this.vibrate.vibrate(200)
      }

      emitter.emit('tts', newValue)
    },
    setDateMinusOne: function () {
      if (!this.editable) {
        return
      }

      let current = this.value
      if (current === undefined || current === null || current === '') {
        current = this.getToday()
      } else {
        current = this.getDate(current)
      }

      current.setDate(current.getDate() - 1)

      this.value = toLocalDateString(current)

      const diffDays = Math.floor((new Date() - current) / (1000 * 60 * 60 * 24))
      if (diffDays > -14 && diffDays < 0) {
        emitter.emit('tts', this.$t('ttsDaysIn', Math.abs(diffDays)))
      } else if (diffDays < 14) {
        emitter.emit('tts', this.$t('ttsDaysAgo', Math.abs(diffDays)))
      } else {
        emitter.emit('tts', toLocalDateString(current))
      }
    },
    setDateToday: function () {
      if (!this.editable) {
        return
      }

      this.value = toLocalDateString(null)

      emitter.emit('tts', this.$t('ttsDaysAgo', 0))

      this.$emit('traverse')
    },
    setImageFilename: function (filename) {
      this.value = filename

      this.tts()

      this.$emit('traverse')
    },
    setDatePlusOne: function () {
      if (!this.editable) {
        return
      }

      let current = this.value
      if (current === undefined || current === null || current === '') {
        current = this.getToday()
      } else {
        current = this.getDate(current)
      }

      current.setDate(current.getDate() + 1)

      this.value = toLocalDateString(current)

      const diffDays = Math.floor((new Date() - current) / (1000 * 60 * 60 * 24))
      if (diffDays > -14 && diffDays < 0) {
        emitter.emit('tts', this.$t('ttsDaysIn', Math.abs(diffDays)))
      } else if (diffDays < 14) {
        emitter.emit('tts', this.$t('ttsDaysAgo', Math.abs(diffDays)))
      } else {
        emitter.emit('tts', toLocalDateString(current))
      }
    },
    ttsAndSetCategory: function (value) {
      this.value = value
      // this.value = +event.target.value
      this.tts()

      this.$emit('traverse')
    },
    ttsAndSet: function () {
      this.rangeChanged = true
      this.tts()
    },
    tts: function () {
      emitter.emit('tts', this.trait.dataType === 'categorical' ? this.trait.restrictions.categories[this.value] : this.value)
    },
    resetValue: function () {
      emitter.emit('show-confirm', {
        title: 'modalTitleResetTraitValue',
        message: 'modalTextResetTraitValue',
        okTitle: 'buttonYes',
        cancelTitle: 'buttonNo',
        okVariant: 'danger',
        callback: (result) => {
          if (result) {
            this.rangeChanged = false
            this.value = null
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.btn.nudge {
  font-size: 30pt;
}
.flex-even {
  flex: 1;
}
</style>

<style>
/* Chrome, Safari, Edge, Opera */
input.number-input::-webkit-outer-spin-button,
input.number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.range-wrapper {
  display: grid;
  min-width: 3ch;
}

.range-value {
  min-width: 3ch;
  text-align: center;
  align-self: center;
}
</style>
