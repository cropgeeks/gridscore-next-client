<template>
  <v-dialog v-model="dialog" persistent fullscreen scrollable>
    <v-card :title="$t('modalTitleTrialDataUpload')">
      <template #text>
        <v-container>
          <p v-html="$t('modalTextTrialDataUpload')" />

          <LineNumberTextarea
            v-model="input"
            :label="$t('formLabelTrialDataUploadContent')"
            :hint="$t('formDescriptionTrialDataUploadContent')"
            :placeholder="$t('formPlaceholderTrialDataUploadContent')"
          />

          <v-alert class="mt-3" color="error" variant="tonal" :icon="mdiAlert" :text="errorMessage" v-if="errorMessage" />
        </v-container>
      </template>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('buttonCancel')" @click="hide" />
        <v-btn :text="$t('buttonImport')" @click="importData" :disabled="!canContinue" color="primary" variant="tonal" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { TrialPlus } from '@/plugins/types/client'
  import LineNumberTextarea from '@/components/inputs/LineNumberTextarea.vue'
  import { csvParse, tsvParse } from 'd3-dsv'
  import { useI18n } from 'vue-i18n'
  import { changeTrialsData, getTrialData, type DataModification } from '@/plugins/idb'
  import { checkDataMatchesTraitType, getColumnIndex, getRowIndex, isValidDateString } from '@/plugins/util'

  import emitter from 'tiny-emitter/instance'
  import { mdiAlert } from '@mdi/js'

  const requiredColumns = new Set(['Germplasm', 'Rep', 'Row', 'Column', 'Trait name', 'Date', 'Value'])

  const { t } = useI18n()

  const compProps = defineProps<{
    trial: TrialPlus
  }>()

  const dialog = ref(false)
  const input = ref<string>('')
  const errorMessage = ref<string>()

  const canContinue = computed(() => input.value && input.value.trim().length > 0)

  function show () {
    dialog.value = true
  }
  function hide () {
    dialog.value = false
  }
  async function importData () {
    errorMessage.value = undefined

    const csv = csvParse(input.value)
    const tsv = tsvParse(input.value)

    let parsedData = null
    if (csv.columns.length > 1 && csv.columns[0] && !csv.columns[0].includes('\t')) {
      parsedData = csv
    } else {
      parsedData = tsv
    }

    // Check input data columns
    const allColumns = parsedData.columns.every(c => requiredColumns.has(c))
    if (!allColumns) {
      errorMessage.value = t('errorMessageDataImportInvalidColumns')
      return
    }

    // Get the trial data and extract the germplasm names
    const data = await getTrialData(compProps.trial.localId || '')
    const uniqueGermplasmNames = new Map()
    Object.values(data).forEach(c => uniqueGermplasmNames.set(c.displayName, c))

    const trialTraits = new Set(compProps.trial.traits.map(t => t.name))

    const newData: DataModification = {}

    const baseDate = new Date()
    baseDate.setHours(0, 0, 0, 0)

    for (let r = 0; r < parsedData.length; r++) {
      const row = parsedData[r]

      if (!row) {
        continue
      }

      let displayName = row.Germplasm

      if (row.Rep) {
        displayName += `-${row.Rep}`
      }

      let cell

      if (row.Row !== undefined && row.Row !== null && row.Row !== '' && row.Column !== undefined && row.Column !== null && row.Column) {
        const rowIndex = getRowIndex(compProps.trial.layout, +row.Row)
        const columnIndex = getColumnIndex(compProps.trial.layout, +row.Column)

        cell = data[`${rowIndex}|${columnIndex}`]
      } else {
        cell = uniqueGermplasmNames.get(displayName)
      }
      // Check the germplasm exists in the trial
      if (!cell) {
        errorMessage.value = t('errorMessageDataImportInvalidGermplasmRep', { missing: displayName, row: r + 1 })
        return
      }

      // Check the trait exists in the trial
      if (!trialTraits.has(row['Trait name'] || '')) {
        errorMessage.value = t('errorMessageDataImportInvalidTrait', { missing: row['Trait name'], row: r + 1 })
        return
      }

      // Check the date
      if (row.Date !== undefined && row.Date !== null && row.Date !== '' && !isValidDateString(row.Date)) {
        errorMessage.value = t('errorMessageDataImportInvalidDate', { date: row.Date, row: r + 1 })
        return
      }

      const trait = compProps.trial.traits.find(t => t.name === row['Trait name'])

      if (!trait) {
        continue
      }

      // Check the specified value is correct
      if (row.Value !== undefined && row.Value !== null && row.Value !== '') {
        if (trait.setSize === 1) {
          if (!checkDataMatchesTraitType(trait, row.Value)) {
            errorMessage.value = t('errorMessageDataImportInvalidValue', { value: row.Value, row: r + 1 })
            return
          }
        } else {
          const parts = row.Value.split(',').map(v => v.trim())

          if (parts.length > trait.setSize) {
            errorMessage.value = t('errorMessageDataImportInvalidSetSize', { value: row.Value, setSize: trait.setSize, provided: parts.length, row: r + 1 })
            return
          }

          for (const part of parts) {
            if (!checkDataMatchesTraitType(trait, part)) {
              errorMessage.value = t('errorMessageDataImportInvalidValue', { value: part, row: r + 1 })
              return
            }
          }
        }
      }

      // Everything is fine, remember to add this new data
      if (!newData[`${cell.row}|${cell.column}`]) {
        newData[`${cell.row}|${cell.column}`] = []
      }

      let timestamp
      if (row.Date !== undefined && row.Date !== null && row.Date !== '') {
        timestamp = new Date(row.Date)
      } else {
        // Use this trick to avoid adding multiple data points with the same timestamp. They would overwrite each other
        baseDate.setSeconds(baseDate.getSeconds() + 1)
        timestamp = baseDate
      }
      timestamp = timestamp.toISOString()

      const values: (string | undefined)[] = []
      const parts = trait.setSize === 1 ? [row.Value] : (row.Value || '').split(',').map(v => v.trim())

      for (const part of parts) {
        if (part !== undefined && part !== null && part !== '') {
          if (trait.dataType === 'categorical' && trait.restrictions && trait.restrictions.categories) {
            const index = trait.restrictions.categories.indexOf(part)
            values.push(`${index}`)
          } else {
            values.push(part)
          }
        }
      }

      while (values.length < trait.setSize) {
        values.push(undefined)
      }

      // @ts-ignore
      newData[`${cell.row}|${cell.column}`].push({
        traitId: trait.id || '',
        timestamp,
        values,
      })
    }

    emitter.emit('show-loading', true)

    changeTrialsData(compProps.trial.localId || '', newData)
      .then(() => {
        emitter.emit('trials-updated')
        hide()
      })
      .finally(() => emitter.emit('show-loading', false))
  }

  defineExpose({
    show,
    hide,
  })
</script>
