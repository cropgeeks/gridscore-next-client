<template>
  <b-input-group>
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
                  number
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
                  number
                  trim
                  :readonly="!editable"
                  @change="tts"
                  @keyup.enter="$emit('traverse')"
                  :min="(trait.restrictions && trait.restrictions.min !== null && trait.restrictions.min !== undefined) ? trait.restrictions.min : null"
                  :max="(trait.restrictions && trait.restrictions.max !== null && trait.restrictions.max !== undefined) ? trait.restrictions.max : null"
                  :step="0.02" />
    <!-- For categorical traits -->
    <!-- If there are more than 3 options, show a dropdown select -->
    <b-form-select :id="id" v-else-if="trait.dataType === 'categorical' && trait.restrictions && trait.restrictions.categories && trait.restrictions.categories.length > 3" ref="input" :state="formState"
                    v-model="value"
                    :readonly="!editable"
                    :options="[{ value: null, text: $t('formSelectCategory') }, ...trait.restrictions.categories]" @change="tts" />
    <!-- Else show a button group for easier selection -->
    <b-form-radio-group :id="id" v-else-if="trait.dataType === 'categorical' && trait.restrictions && trait.restrictions.categories && trait.restrictions.categories.length <= 3" ref="input" :state="formState"
                        buttons
                        button-variant="outline-secondary"
                        @change="event => { value = event; tts() }"
                        :checked="value"
                        :disabled="!editable"
                        :options="[...trait.restrictions.categories, { value: null, text: '⦸' }]" />
    <b-form-input :id="id" v-else v-model="value" :state="formState" ref="input" trim @change="tts" :readonly="!editable"/>

    <b-input-group-append v-if="trait.dataType === 'date' || trait.dataType === 'int'">
      <template v-if="trait.dataType === 'date'">
        <b-button v-b-tooltip="$t('tooltipDataEntryDateMinusOne')" @click="setDateMinusOne" :disabled="!editable"><BIconCaretLeftFill /></b-button>
        <b-button v-b-tooltip="$t('tooltipDataEntryDateToday')" @click="setDateToday" :disabled="!editable"><BIconCalendar3 /></b-button>
        <b-button v-b-tooltip="$t('tooltipDataEntryDatePlusOne')" @click="setDatePlusOne" :disabled="!editable"><BIconCaretRightFill /></b-button>
        <b-button v-b-tooltip="$t('tooltipDataEntryDateReset')" variant="danger" @click="resetDate" :disabled="!editable"><BIconSlashCircle /></b-button>
      </template>
      <b-button v-if="trait.dataType === 'int'" @click="nudge(1)">+</b-button>
    </b-input-group-append>
  </b-input-group>
</template>

<script>
import { BIconCaretLeftFill, BIconCalendar3, BIconCaretRightFill, BIconSlashCircle } from 'bootstrap-vue'

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
    }
  },
  data: function () {
    return {
      value: null,
      formState: null,
      dateInput: ''
    }
  },
  methods: {
    getValue: function () {
      if (this.value === undefined || this.value === null || this.value === '') {
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

        this.value = current.toISOString().split('T')[0]

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
    checkIfInRange: function (value, min, max) {
      if (min !== undefined && min !== null) {
        if (value < min) {
          return false
        }
      }
      if (max !== undefined && max !== null) {
        if (value > max) {
          return false
        }
      }

      return true
    },
    validate: function () {
      if (this.value === null || this.value === '') {
        this.value = null
        this.formState = true
        return true
      } else {
        const trimmed = (typeof this.value === 'string') ? this.value.trim() : this.value

        if (this.trait.dataType === 'int' || this.trait.dataType === 'float') {
          try {
            const int = Number(trimmed)
            if (isNaN(trimmed) || isNaN(int) || (this.trait.dataType === 'int' && !Number.isInteger(int))) {
              this.formState = false
              return false
            }

            const r = this.trait.restrictions

            if (r) {
              const valid = this.checkIfInRange(int, r.min, r.max)

              if (!valid) {
                this.formState = false
                return false
              }
            }
          } catch (err) {
            this.formState = false
            return false
          }
        }
      }

      this.formState = true
      return true
    },
    getToday: function () {
      const today = new Date()
      const offset = today.getTimezoneOffset()
      return new Date(today.getTime() + (offset * 60 * 1000))
    },
    getTodayString: function () {
      const date = new Date()

      let month = `${date.getMonth() + 1}`
      let day = `${date.getDate()}`
      const year = date.getFullYear()

      if (month.length < 2) {
        month = '0' + month
      }
      if (day.length < 2) {
        day = '0' + day
      }

      return [year, month, day].join('-')
    },
    nudge: function (delta) {
      if (!this.editable) {
        return
      }

      let newValue
      if (this.value !== null && this.value !== '') {
        newValue = this.value + delta
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

      this.value = newValue

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
        current = new Date(current)
      }

      current.setDate(current.getDate() - 1)

      this.value = current.toISOString().split('T')[0]

      const diffDays = Math.floor((new Date() - current) / (1000 * 60 * 60 * 24))
      if (diffDays > -14 && diffDays < 0) {
        emitter.emit('tts', this.$tc('ttsDaysIn', Math.abs(diffDays)))
      } else if (diffDays < 14) {
        emitter.emit('tts', this.$tc('ttsDaysAgo', Math.abs(diffDays)))
      } else {
        emitter.emit('tts', current.toISOString().split('T')[0])
      }
    },
    setDateToday: function () {
      if (!this.editable) {
        return
      }

      this.value = this.getTodayString()

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
        current = new Date(current)
      }

      current.setDate(current.getDate() + 1)

      this.value = current.toISOString().split('T')[0]

      const diffDays = Math.floor((new Date() - current) / (1000 * 60 * 60 * 24))
      if (diffDays > -14 && diffDays < 0) {
        emitter.emit('tts', this.$tc('ttsDaysIn', Math.abs(diffDays)))
      } else if (diffDays < 14) {
        emitter.emit('tts', this.$tc('ttsDaysAgo', Math.abs(diffDays)))
      } else {
        emitter.emit('tts', current.toISOString().split('T')[0])
      }
    },
    tts: function () {
      emitter.emit('tts', this.value)
    },
    resetDate: function () {
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
</style>
