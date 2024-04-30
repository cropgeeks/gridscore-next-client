<template>
  <b-input-group class="trait-data-input">
    <b-input-group-prepend v-if="trait.dataType === 'int'">
      <b-button v-if="trait.dataType === 'int'" @click="nudge(-1)" :disabled="!editable">-</b-button>
    </b-input-group-prepend>

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
                  class="number-input"
                  :state="formState"
                  @wheel="$event.target.blur()"
                  type="number"
                  v-model="value"
                  trim
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
                  trim
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
                  :state="formState"
                  @wheel="$event.target.blur()"
                  type="range"
                  :value="value"
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
                    @change="tts" />
    <!-- Else show a button group for easier selection -->
    <b-form-radio-group :id="id" v-else-if="trait.dataType === 'categorical' && trait.restrictions && trait.restrictions.categories && trait.restrictions.categories.length <= storeCategoryCountInline" ref="input" :state="formState"
                        buttons
                        button-variant="outline-secondary"
                        @change="event => { value = event; tts() }"
                        :checked="value"
                        :disabled="!editable"
                        :options="traitOptionsButtons" />
    <b-form-input :id="id" v-else v-model="value" :state="formState" ref="input" trim @change="tts" :readonly="!editable"/>

    <b-input-group-append v-if="trait.dataType === 'date' || trait.dataType === 'int'">
      <template v-if="trait.dataType === 'date'">
        <b-button v-b-tooltip="$t('tooltipDataEntryDateMinusOne')" @click="setDateMinusOne" :disabled="!editable"><BIconCaretLeftFill /></b-button>
        <b-button v-b-tooltip="$t('tooltipDataEntryDateToday')" @click="setDateToday" :disabled="!editable"><BIconCalendar3 /></b-button>
        <b-button v-b-tooltip="$t('tooltipDataEntryDatePlusOne')" @click="setDatePlusOne" :disabled="!editable"><BIconCaretRightFill /></b-button>
        <b-button v-b-tooltip="$t('tooltipDataEntryDateReset')" variant="danger" @click="resetValue" :disabled="!editable"><BIconSlashCircle /></b-button>
      </template>
      <b-button v-if="trait.dataType === 'int'" @click="nudge(1)" :disabled="!editable">+</b-button>
    </b-input-group-append>
    <b-input-group-append v-else-if="trait.dataType === 'range'">
      <b-input-group-text :class="(value !== undefined && value !== null) ? 'bg-warning' : 'bg-secondary'"><span class="range-value">{{ (value !== undefined && value !== null) ? value : 'N/A' }}</span></b-input-group-text>
      <b-button v-b-tooltip="$t('tooltipDataEntryRangeReset')" variant="danger" @click="resetValue" :disabled="!editable"><BIconSlashCircle /></b-button>
    </b-input-group-append>
  </b-input-group>
</template>

<script>
import { BIconCaretLeftFill, BIconCalendar3, BIconCaretRightFill, BIconSlashCircle } from 'bootstrap-vue'
import { checkDataMatchesTraitType, toLocalDateString } from '@/plugins/misc'
import { mapGetters } from 'vuex'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconCaretLeftFill,
    BIconCalendar3,
    BIconCaretRightFill,
    BIconSlashCircle
  },
  props: {
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
    return {
      value: null,
      formState: null,
      dateInput: '',
      rangeChanged: false
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
    ...mapGetters([
      'storeCategoryCountInline'
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
    getValue: function () {
      if (this.value === undefined || this.value === null || this.value === '' || (this.trait.dataType === 'range' && !this.rangeChanged)) {
        return null
      } else {
        return this.value
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
        emitter.emit('tts', this.$tc('ttsDaysIn', Math.abs(diffDays)))
      } else if (diffDays < 14) {
        emitter.emit('tts', this.$tc('ttsDaysAgo', Math.abs(diffDays)))
      } else {
        emitter.emit('tts', toLocalDateString(current))
      }
    },
    setDateToday: function () {
      if (!this.editable) {
        return
      }

      this.value = toLocalDateString(null)

      emitter.emit('tts', this.$tc('ttsDaysAgo', 0))
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
        emitter.emit('tts', this.$tc('ttsDaysIn', Math.abs(diffDays)))
      } else if (diffDays < 14) {
        emitter.emit('tts', this.$tc('ttsDaysAgo', Math.abs(diffDays)))
      } else {
        emitter.emit('tts', toLocalDateString(current))
      }
    },
    ttsAndSet: function (value) {
      this.value = value
      this.rangeChanged = true
      this.tts()
    },
    tts: function () {
      emitter.emit('tts', this.trait.dataType === 'categorical' ? this.trait.restrictions.categories[this.value] : this.value)
    },
    resetValue: function () {
      this.rangeChanged = false
      this.value = null
    }
  }
}
</script>

<style>
/* Chrome, Safari, Edge, Opera */
input.number-input::-webkit-outer-spin-button,
input.number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.range-value {
  min-width: 3ch;
  text-align: center;
}
</style>
