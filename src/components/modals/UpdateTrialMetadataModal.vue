<template>
  <v-dialog v-model="dialog" persistent fullscreen scrollable>
    <v-card :title="$t('modalTitlePlotMetadataUpdate')">
      <template #text>
        <v-container>
          <p v-html="$t('modalTextPlotMetadataUpdate')" />

          <LineNumberTextarea
            v-model="input"
            :label="$t('formLabelPlotMetadataUpdateContent')"
            :hint="$t('formDescriptionPlotMetadataUpdateContent')"
            :placeholder="$t('formPlaceholderPlotMetadataUpdateContent')"
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
  import { getTrialData, updatePlotMetadata, type PlotModification } from '@/plugins/idb'
  import { getColumnIndex, getRowIndex } from '@/plugins/util'

  import emitter from 'tiny-emitter/instance'
  import { mdiAlert } from '@mdi/js'

  const requiredColumns = new Set(['Germplasm', 'Rep', 'Row', 'Column', 'Treatment', 'Friendly name', 'Barcode', 'Pedigree'])

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

    const newData: PlotModification = {}

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

      const friendlyName = (row['Friendly name'] || '').trim()
      const pedigree = (row.Pedigree || '').trim()
      const treatment = (row.Treatment || '').trim()
      const barcode = (row.Barcode || '').trim()

      newData[`${cell.row}|${cell.column}`] = {
        friendlyName,
        pedigree,
        treatment,
        barcode,
        row: cell.row,
        column: cell.column,
      }
    }

    emitter.emit('show-loading', true)

    updatePlotMetadata(compProps.trial.localId || '', newData)
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
