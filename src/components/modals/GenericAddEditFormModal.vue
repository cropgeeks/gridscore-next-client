<template>
  <v-dialog v-model="dialog" max-width="min(90vw, 1024px)">
    <v-card
      :title="$t(compProps.title)"
    >
      <template #text>
        <p v-if="compProps.text">{{ $t(compProps.text) }}</p>

        <v-row>
          <v-col
            v-for="config in visibleFields"
            :key="`form-field-${config.key}`"
            cols="12"
            :md="6 * config.width"
          >
            <v-text-field
              v-model="formModel[config.key]"
              :list="(config.inputDatalist && config.inputDatalist.length > 0) ? config.key : undefined"
              :label="$t(config.title)"
              :hint="config.hint ? $t(config.hint) : undefined"
              :persistent-hint="config.hint !== undefined"
              :type="config.inputType || 'text'"
              :required="config.required"
              :autofocus="config.autofocus"
              v-if="config.type === 'text'"
            />
            <datalist :id="config.key" v-if="config.type === 'text' && config.inputDatalist && config.inputDatalist.length > 0">
              <option v-for="option in config.inputDatalist" :key="`item-${option}`">{{ option }}</option>
            </datalist>
            <v-select
              v-model="formModel[config.key]"
              :label="$t(config.title)"
              :hint="config.hint ? $t(config.hint) : undefined"
              :persistent-hint="config.hint !== undefined"
              :items="config.selectOptions"
              :disabled="config.disabled === true"
              :required="config.required"
              :autofocus="config.autofocus"
              v-else-if="config.type === 'select'"
            />
            <v-textarea
              v-model="formModel[config.key]"
              :label="$t(config.title)"
              :hint="config.hint ? $t(config.hint) : undefined"
              :persistent-hint="config.hint !== undefined"
              :required="config.required"
              wrap="off"
              :autofocus="config.autofocus"
              @focus="config.inputAutoSelectAll ? $event.target.select() : undefined"
              v-else-if="config.type === 'textarea'"
            />
            <v-date-input
              v-else-if="config.type === 'date'"
              :hide-details="config.hint === undefined"
              :label="$t(config.title)"
              :display-format="(d: any) => d ? d.toLocaleDateString() : ''"
              :hint="config.hint ? $t(config.hint) : undefined"
              :persistent-hint="config.hint !== undefined"
              :clearable="!config.required"
              prepend-icon=""
              :autofocus="config.autofocus"
              prepend-inner-icon="$calendar"
              :model-value="formModel[config.key] ? date.toJsDate(formModel[config.key]) : undefined"
              @update:model-value="v => { formModel[config.key] = date.toISO(v) }"
            />
            <v-date-input
              v-else-if="config.type === 'dateobject'"
              :hide-details="config.hint === undefined"
              :label="$t(config.title)"
              :display-format="(d: any) => d ? d.toLocaleDateString() : ''"
              :hint="config.hint ? $t(config.hint) : undefined"
              :persistent-hint="config.hint !== undefined"
              :clearable="!config.required"
              prepend-icon=""
              :autofocus="config.autofocus"
              prepend-inner-icon="$calendar"
              v-model="formModel[config.key]"
            />
            <v-file-input
              v-else-if="config.type === 'file'"
              :label="$t(config.title)"
              v-model="formModel[config.key]"
              :hint="config.hint ? $t(config.hint) : undefined"
              :persistent-hint="config.hint !== undefined"
              prepend-icon=""
              :autofocus="config.autofocus"
              :prepend-inner-icon="mdiPaperclip"
              :accept="config.accepts"
            />
            <v-checkbox
              v-else-if="config.type === 'boolean'"
              v-model="formModel[config.key]"
              :label="$t(config.title)"
              :autofocus="config.autofocus"
              :disabled="config.disabled === true"
              :hint="config.hint ? $t(config.hint) : undefined"
              :persistent-hint="config.hint !== undefined"
            />
          </v-col>
        </v-row>

        <slot name="additional-fields" v-bind="{ item: formModel }" />

        <p v-if="error" class="mt-5 text-error">{{ error }}</p>
      </template>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('buttonCancel')" variant="plain" @click="dialog = false" />
        <v-btn :text="$t(compProps.okTitle)" color="primary" variant="tonal" :disabled="!valid" @click="save" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts" generic="T">
  import { mdiPaperclip } from '@mdi/js'
  import { useDate } from 'vuetify'

  export interface SelectOption {
    title: string
    value: number | string
  }

  export interface FieldConfig<T> {
    key: string
    title: string
    hint?: string
    type: 'text' | 'textarea' | 'number' | 'date' | 'dateobject' | 'boolean' | 'file' | 'select'
    valid?: (args: any) => boolean
    selectOptions?: SelectOption[]
    disabled?: boolean
    width: number
    required: boolean
    inputType?: string
    inputDatalist?: string[]
    inputAutoSelectAll?: boolean
    accepts?: string
    visible?: (item: T) => boolean
    autofocus?: boolean
  }

  export interface ModalProps<T> {
    title: string
    text?: string
    item: T
    fields: FieldConfig<T>[]
    notify: (args: T) => Promise<boolean>
    okTitle?: string
  }

  const compProps = withDefaults(defineProps<ModalProps<T>>(), {
    okTitle: 'buttonSave',
  })

  const date = useDate()
  const dialog = ref(false)
  const error = ref<string>()
  // @ts-ignore
  const formModel = ref<T>({})
  const emit = defineEmits(['items-changed'])

  const visibleFields = computed(() => {
    if (compProps.fields) {
      return compProps.fields.filter(f => !f.visible || (f.visible(formModel.value) === true))
    } else {
      return []
    }
  })

  const valid = computed(() => {
    return !compProps.fields.some(f => f.valid && !f.valid(formModel.value[f.key]))
  })

  function show () {
    if (compProps.item) {
      formModel.value = JSON.parse(JSON.stringify(compProps.item))
    } else {
      formModel.value = {}
    }

    dialog.value = true
  }
  function hide () {
    error.value = undefined
    dialog.value = false
  }
  function save () {
    if (!valid.value) {
      return
    }

    error.value = undefined

    compProps.notify(formModel.value)
      .then((result: boolean) => {
        if (result === true) {
          emit('items-changed')
          hide()
        }
      })
      .catch(e => {
        error.value = e
      })
  }

  defineExpose({
    show,
    hide,
  })
</script>

<style scoped>
</style>
