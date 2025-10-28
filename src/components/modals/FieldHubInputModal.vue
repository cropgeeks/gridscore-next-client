<template>
  <v-dialog v-model="dialog" max-width="min(90vw, 1024px)">
    <v-card :title="$t('modalTitleFielDBookInput')">
      <template #text>
        <p>{{ $t('modalTextFielDBookInput') }}</p>

        <v-form @submit.prevent>
          <v-textarea
            v-model="content"
            :label="$t('formLabelFielDBookInput')"
            @keydown.tab.prevent="tabber($event)"
            wrap="off"
            required
            :error-messages="errorMessages"
            :placeholder="$t('formPlaceholderFielDBookInput')"
          />

          <v-file-input v-model="file" accept="text/plain" :placeholder="$t('buttonOpenFile')" />
        </v-form>

        <v-btn :text="$t('buttonReadColumns')" @click="readColumns">
          <template #prepend>
            <v-icon class="mdi-rotate-270" :icon="mdiViewSplitVertical" />
          </template>
        </v-btn>

        <div class="mt-3" v-if="fileColumns && fileColumns.length > 0">
          <p>{{ $t('modalTextFielDBookColumnMapping') }}</p>
          <v-row>
            <v-col cols="12" md="6">
              <v-select :items="fileColumns" v-model="columnMapping.row" :label="$t('formLabelFielDBookRow')" :hint="$t('formDescriptionFielDBookRow')" persistent-hint />
            </v-col>
            <v-col cols="12" md="6">
              <v-select :label="$t('formLabelFielDBookColumn')" :hint="$t('formDescriptionFielDBookColumn')" persistent-hint :items="fileColumns" v-model="columnMapping.column" :options="fileColumns" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select :label="$t('formLabelFielDBookGermplasm')" :hint="$t('formDescriptionFielDBookGermplasm')" persistent-hint :items="fileColumns" v-model="columnMapping.germplasm" :options="fileColumns" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select :label="$t('formLabelFielDBookRep')" :hint="$t('formDescriptionFielDBookRep')" persistent-hint :items="fileColumns" v-model="columnMapping.rep" :options="fileColumns" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select :label="$t('formLabelFielDBookTreatment')" :hint="$t('formDescriptionFielDBookTreatment')" persistent-hint :items="fileColumns" v-model="columnMapping.treatment" :options="fileColumns" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select :label="$t('formLabelFielDBookFriendlyName')" :hint="$t('formDescriptionFielDBookFriendlyName')" persistent-hint :items="fileColumns" v-model="columnMapping.friendlyName" :options="fileColumns" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select :label="$t('formLabelFielDBookBarcode')" :hint="$t('formDescriptionFielDBookBarcode')" persistent-hint :items="fileColumns" v-model="columnMapping.barcode" :options="fileColumns" />
            </v-col>
            <v-col cols="12" md="6">
              <v-select :label="$t('formLabelFielDBookPedigree')" :hint="$t('formDescriptionFielDBookPedigree')" persistent-hint :items="fileColumns" v-model="columnMapping.pedigree" :options="fileColumns" />
            </v-col>
          </v-row>
        </div>
      </template>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('buttonCancel')" @click="hide" />
        <v-btn :text="$t('buttonLoad')" @click="save" :disabled="!columnsMapped" color="primary" variant="tonal" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { tsvParse, csvParse, autoType, type DSVParsedArray } from 'd3-dsv'
  import type { Layout } from '@/plugins/types/gridscore'
  import { getColumnIndex, getRowIndex } from '@/plugins/util'
  import type { CellPlus } from '@/plugins/types/client'
import { mdiViewSplitVertical } from '@mdi/js'

  interface SelectOption {
    title: string
    value: string | undefined
  }

  const compProps = defineProps<{
    currentLayout: Layout
  }>()

  const { t } = useI18n()

  const dialog = ref(false)
  const content = ref<string>('')
  const file = ref<File>()
  const columnMapping = ref<{ [key: string]: string | undefined }>({})
  const fileColumns = ref<SelectOption[]>([])
  const errorMessages = ref<string[]>([])
  let parsedData: DSVParsedArray<object> | undefined

  const emit = defineEmits(['content-loaded'])

  const columnsMapped = computed(() => columnMapping.value.row && columnMapping.value.column && columnMapping.value.germplasm)

  function show () {
    dialog.value = true
  }
  function hide () {
    content.value = ''
    dialog.value = false
  }
  function save () {
    const mapping: { [index: string]: CellPlus } = {}

    if (!parsedData || !columnMapping.value.row || !columnMapping.value.column || !columnMapping.value.germplasm) {
      return
    }

    for (let i = 0; i < parsedData.length; i++) {
      const r: any = parsedData[i]

      if (!r) {
        continue
      }

      const row = r[columnMapping.value.row]
      const column = r[columnMapping.value.column]
      const germplasm = r[columnMapping.value.germplasm]
      const rep = columnMapping.value.rep ? (r[columnMapping.value.rep] || undefined) : undefined
      const friendlyName = columnMapping.value.friendlyName ? (r[columnMapping.value.friendlyName] || undefined) : undefined
      const barcode = columnMapping.value.barcode ? (r[columnMapping.value.barcode] || undefined) : undefined
      const pedigree = columnMapping.value.pedigree ? (r[columnMapping.value.pedigree] || undefined) : undefined
      const treatment = columnMapping.value.treatment ? (r[columnMapping.value.treatment] || undefined) : undefined

      if (!germplasm || germplasm === '') {
        errorMessages.value = [t('formFeedbackFielDBookMissingGermplasm', { line: i + 1 })]
        return
      }
      if (row === undefined || row === null || row === '' || !(typeof row === 'number')) {
        errorMessages.value = [t('formFeedbackFielDBookMissingInvalidRow', { line: i + 1 })]
        return
      }
      if (column === undefined || column === null || column === '' || !(typeof column === 'number')) {
        errorMessages.value = [t('formFeedbackFielDBookMissingInvalidColumn', { line: i + 1 })]
        return
      }

      const rowIndex = getRowIndex(compProps.currentLayout, row)
      const columnIndex = getColumnIndex(compProps.currentLayout, column)

      if (rowIndex < 0 || rowIndex >= compProps.currentLayout.rows || columnIndex < 0 || columnIndex >= compProps.currentLayout.columns) {
        errorMessages.value = [t('formFeedbackFielDBookInvalidDimensions', { line: i + 1, row, column })]
        return
      }

      mapping[`${rowIndex}|${columnIndex}`] = {
        row: rowIndex,
        column: columnIndex,
        germplasm,
        rep,
        friendlyName,
        barcode,
        pedigree,
        treatment,
        isMarked: false,
        measurements: {},
        comments: [],
        categories: [],
      }
    }

    emit('content-loaded', mapping)

    hide()
  }

  function readColumns () {
    parsedData = undefined
    fileColumns.value = []
    errorMessages.value = []
    columnMapping.value = {
      row: undefined,
      column: undefined,
      germplasm: undefined,
      rep: undefined,
      friendlyName: undefined,
      barcode: undefined,
      pedigree: undefined,
      treatment: undefined,
    }

    if (!content.value || content.value.length === 0) {
      errorMessages.value = [t('formFeedbackFielDBookMissingData')]
      return
    }

    const csv = csvParse(content.value, autoType)
    const tsv = tsvParse(content.value, autoType)

    // @ts-ignore
    if (csv.columns.length > 1 && !csv.columns[0].includes('\t')) {
      parsedData = csv
    } else {
      parsedData = tsv
    }

    const tempColumns: SelectOption[] = parsedData.columns.map(v => {
      return {
        value: v,
        title: v,
      }
    })
    tempColumns.unshift({
      value: undefined,
      title: t('formSelectOptionUnmapped'),
    })
    fileColumns.value = tempColumns

    if (fileColumns.value.length > 1) {
      // Naive naming
      // @ts-ignore
      if (parsedData.columns.includes('Row')) {
        columnMapping.value.row = 'Row'
      }
      // @ts-ignore
      if (parsedData.columns.includes('Column')) {
        columnMapping.value.column = 'Column'
      }
      // @ts-ignore
      if (parsedData.columns.includes('Rep')) {
        columnMapping.value.rep = 'Rep'
      }
      // @ts-ignore
      if (parsedData.columns.includes('Germplasm')) {
        columnMapping.value.germplasm = 'Germplasm'
      }
      // @ts-ignore
      if (parsedData.columns.includes('FriendlyName')) {
        columnMapping.value.friendlyName = 'FriendlyName'
      }
      // @ts-ignore
      if (parsedData.columns.includes('Friendly name')) {
        columnMapping.value.friendlyName = 'Friendly name'
      }
      // @ts-ignore
      if (parsedData.columns.includes('Barcode')) {
        columnMapping.value.barcode = 'Barcode'
      }
      // @ts-ignore
      if (parsedData.columns.includes('Pedigree')) {
        columnMapping.value.pedigree = 'Pedigree'
      }
      // @ts-ignore
      if (parsedData.columns.includes('Treatment')) {
        columnMapping.value.treatment = 'Treatment'
      }
      // FielDHub specific naming
      // @ts-ignore
      if (parsedData.columns.includes('ROW')) {
        columnMapping.value.row = 'ROW'
      }
      // @ts-ignore
      if (parsedData.columns.includes('COLUMN')) {
        columnMapping.value.column = 'COLUMN'
      }
      // @ts-ignore
      if (parsedData.columns.includes('REP')) {
        columnMapping.value.rep = 'REP'
      }
      // @ts-ignore
      if (parsedData.columns.includes('TREATMENT')) {
        columnMapping.value.germplasm = 'TREATMENT'
      }
    } else {
      errorMessages.value = [t('formFeedbackFielDBookMissingData')]
    }
  }

  function tabber (event: any) {
    const text = content.value
    const originalSelectionStart = event.target.selectionStart
    const textStart = text.slice(0, originalSelectionStart)
    const textEnd = text.slice(originalSelectionStart)

    content.value = `${textStart}\t${textEnd}`
    event.target.value = content.value // required to make the cursor stay in place.
    event.target.selectionEnd = event.target.selectionStart = originalSelectionStart + 1
  }

  watch(file, async newValue => {
    if (newValue) {
      content.value = await newValue?.text() || ''
    }
    file.value = undefined
  })

  defineExpose({
    show,
    hide,
  })
</script>
