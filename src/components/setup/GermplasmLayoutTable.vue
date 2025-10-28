<template>
  <div v-if="model">
    <v-row>
      <v-col cols="12" md="6">
        <v-card :title="$t('formGroupSetupShowFields')">
          <template #text>
            <v-btn-toggle v-model="visibleFields" color="primary" variant="tonal" multiple direction="vertical">
              <v-btn value="treatment" :text="$t('formCheckboxSetupShowTreatment')" :prepend-icon="mdiSprinklerFire" />
              <v-btn value="friendlyName" :text="$t('formCheckboxSetupShowFriendlyName')" :prepend-icon="mdiEyeCheck" />
              <v-btn value="barcode" :text="$t('formCheckboxSetupShowBarcode')" :prepend-icon="mdiBarcode" />
              <v-btn value="pedigree" :text="$t('formCheckboxSetupShowPedigree')" :prepend-icon="mdiFamilyTree" />
            </v-btn-toggle>
          </template>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="checkName"
          :messages="['f']"
          :label="$t('formLabelSetupGermplasmGridMarkCheck')"
          :append-inner-icon="mdiCheckboxMultipleMarked"
          :disabled="isEdit === true"
          @click:append-inner="markChecks"
          @keyup.exact.enter="markChecks"
        >
          <template #message>
            <p>{{ $t('formDescriptionSetupGermplasmGridMarkCheck') }}</p>
            <p>
              <span class="me-3"><v-icon :icon="mdiPlaylistCheck" /> <a href="#" @click.prevent="markAll(true)">{{ $t('buttonMarkAll') }}</a></span>
              <span><v-icon :icon="mdiPlaylistRemove" /> <a href="#" @click.prevent="markAll(false)">{{ $t('buttonUnmarkAll') }}</a></span>
            </p>
          </template>
        </v-text-field>
      </v-col>
    </v-row>
    <p class="my-5">{{ $t('pageTrialLayoutGermplasmText') }}</p>

    <v-menu>
      <template #activator="{ props }">
        <v-btn v-bind="props" :prepend-icon="mdiFilePlus" :text="$t('buttonImportLayoutData')" :disabled="isEdit === true" />
      </template>

      <v-list :disabled="isEdit === true">
        <v-list-item :prepend-icon="mdiTable" :title="$t('dropdownImportGermplasmGrid')" @click="setTabInputConfig('germplasm')" />
        <v-list-item :prepend-icon="mdiTable" :title="$t('dropdownImportRepGrid')" @click="setTabInputConfig('rep')" />
        <v-list-item :prepend-icon="mdiTable" :title="$t('dropdownImportTreatmentGrid')" @click="setTabInputConfig('treatment')" />
        <v-list-item :prepend-icon="mdiTable" :title="$t('dropdownImportFriendlyNameGrid')" @click="setTabInputConfig('friendlyName')" />
        <v-list-item :prepend-icon="mdiTable" :title="$t('dropdownImportBarcodeGrid')" @click="setTabInputConfig('barcode')" />
        <v-list-item :prepend-icon="mdiTable" :title="$t('dropdownImportPedigreeGrid')" @click="setTabInputConfig('pedigree')" />
        <v-list-item :prepend-icon="mdiFileTable" :title="$t('dropdownImportFieldHub')" @click="fieldbookInputModal?.show()" />
        <v-list-item :prepend-icon="mdiShuffle" :title="$t('dropdownImportRandom')" @click="fillRandom" v-if="isDevelopment" />
      </v-list>
    </v-menu>

    <!-- Empty table to trick Vuetify into loading the styling -->
    <v-table />
    <v-card class="mt-3" :disabled="isEdit === true">
      <div class="v-table v-table--striped-odd v-table--density-default">
        <div class="v-table__wrapper table-max-height">
          <table id="grid-table" />
        </div>
      </div>
    </v-card>

    <v-btn @click="checkData" class="my-5" :disabled="isEdit === true" color="primary" :prepend-icon="mdiPlaylistCheck" :text="$t('buttonCheckOverData')" />

    <div class="">
      <v-btn v-if="hasErrors || hasWarnings" @click="bottomSheetVisible = true" :text="$t('formFeedbackLayout', feedback.length)" :prepend-icon="hasErrors ? mdiAlertCircle : mdiAlert" :color="hasErrors ? 'error' : 'warning'" />
    </div>

    <TabbedInputModal :label="dataImportConfig.label" :placeholder="dataImportConfig.placeholder" ref="inputModal" @content-loaded="content => updateTableFromTabbed(dataImportConfig?.field || '', content)" v-if="dataImportConfig" />
    <FieldHubInputModal :current-layout="model.layout" ref="fieldbookInputModal" @content-loaded="updateTableFromFile" />

    <v-bottom-sheet v-model="bottomSheetVisible" inset>
      <v-card :title="$t('modalTitleLayoutFeedback')">
        <template #text>
          <p>{{ $t('modalTextLayoutFeedback') }}</p>

          <v-list>
            <v-list-item
              v-for="(item, itemIndex) in feedback"
              :key="`feedback-item-${itemIndex}`"
              :prepend-icon="item.type === 'error' ? mdiAlertCircle : mdiAlert"
              :base-color="item.type === 'error' ? 'error' : 'warning'"
              :title="item.message"
            />
          </v-list>
        </template>
      </v-card>
    </v-bottom-sheet>
  </div>
</template>

<script setup lang="ts">
  import { CELL_CATEGORIES, getRandomGivenName } from '@/plugins/constants'
  import { CellCategory, type Cell } from '@/plugins/types/gridscore'
  import { getColumnLabel, getRowLabel } from '@/plugins/util'
  import { useI18n } from 'vue-i18n'
  import TabbedInputModal from '@/components/modals/TabbedInputModal.vue'
  import FieldHubInputModal from '@/components/modals/FieldHubInputModal.vue'

  import emitter from 'tiny-emitter/instance'
  import type { TrialPlus } from '@/plugins/types/client'
  import { mdiAlert, mdiAlertCircle, mdiBarcode, mdiCheckboxMultipleMarked, mdiEyeCheck, mdiFamilyTree, mdiFilePlus, mdiFileTable, mdiPlaylistCheck, mdiPlaylistRemove, mdiShuffle, mdiSprinklerFire, mdiTable } from '@mdi/js'

  export interface LayoutFeedback {
    type: 'warning' | 'error'
    message: string
  }

  interface DataImportConfig {
    field: string
    label: string
    placeholder: string
  }

  export interface GermplasmLayoutTableProps {
    isEdit?: boolean
    isClone?: boolean
  }

  const dataImportConfigs: { [key: string]: DataImportConfig } = {
    germplasm: {
      field: 'germplasm',
      label: 'formLabelSetupGermplasmNames',
      placeholder: 'formPlaceholderSetupGermplasmNames',
    },
    rep: {
      field: 'rep',
      label: 'formLabelSetupRepNames',
      placeholder: 'formPlaceholderSetupRepNames',
    },
    friendlyName: {
      field: 'friendlyName',
      label: 'formLabelSetupFriendlyNames',
      placeholder: 'formPlaceholderSetupFriendlyNames',
    },
    barcode: {
      field: 'barcode',
      label: 'formLabelSetupBarcodeNames',
      placeholder: 'formPlaceholderSetupBarcodeNames',
    },
    pedigree: {
      field: 'pedigree',
      label: 'formLabelSetupPedigreeNames',
      placeholder: 'formPlaceholderSetupPedigreeNames',
    },
    treatment: {
      field: 'treatment',
      label: 'formLabelSetupTreatmentNames',
      placeholder: 'formPlaceholderSetupTreatmentNames',
    },
  }

  const compProps = withDefaults(defineProps<GermplasmLayoutTableProps>(), {
    isEdit: false,
    isClone: false,
  })

  export type Grid = { [key: string]: Cell }

  const model = defineModel<TrialPlus>()

  const emit = defineEmits(['data-changed'])

  const { t } = useI18n()

  const gridData = ref<Grid>({})
  const visibleFields = ref<('treatment' | 'friendlyName' | 'pedigree' | 'barcode')[]>([])
  const checkName = ref<string>()
  const dataImportConfig = ref<DataImportConfig>()
  const inputModal = useTemplateRef('inputModal')
  const fieldbookInputModal = useTemplateRef('fieldbookInputModal')
  const feedback = ref<LayoutFeedback[]>([])
  const bottomSheetVisible = ref(false)
  const tableHasModifications = ref(false)

  const isDevelopment = computed(() => import.meta.env.DEV)

  const hasErrors = computed(() => feedback.value && feedback.value.some(f => f.type === 'error'))
  const hasWarnings = computed(() => feedback.value && feedback.value.some(f => f.type === 'warning'))

  function checkData () {
    const trial = model.value
    if (!trial) {
      return
    }

    readFromTable()

    feedback.value = []
    const germplasmSet = new Set<string>()
    const barcodeSet = new Set<string>()
    const repSet = new Set<string>()

    Object.keys(gridData.value).forEach(key => {
      const cell: Cell | undefined = gridData.value[key]

      if (cell) {
        const [row, column] = key.split('|').map(Number)

        if (row !== undefined && column !== undefined) {
          if (row < 0 || row >= trial.layout.rows) {
            feedback.value.push({
              type: 'error',
              message: t('formFeedbackSetupInvalidRow', { rowIndex: getRowLabel(trial.layout, row), germplasm: cell.germplasm, rep: cell.rep }),
            })
          }
          if (column < 0 || column >= trial.layout.columns) {
            feedback.value.push({
              type: 'error',
              message: t('formFeedbackSetupInvalidColumn', { columnIndex: getColumnLabel(trial.layout, column), germplasm: cell.germplasm, rep: cell.rep }),
            })
          }

          if (cell.rep) {
            repSet.add(cell.rep)
          }

          const barcode = cell.barcode
          console.log(barcode)
          if (barcode) {
            if (barcodeSet.has(barcode)) {
              feedback.value.push({
                type: 'error',
                message: t('formFeedbackSetupDuplicateBarcode', { columnIndex: getColumnLabel(trial.layout, column), rowIndex: getRowLabel(trial.layout, row), germplasm: cell.germplasm, rep: cell.rep, barcode: barcode }),
              })
            }
            barcodeSet.add(barcode)
          }

          const displayName = `${cell.germplasm}|${cell.rep}`
          if (germplasmSet.has(displayName)) {
            feedback.value.push({
              type: 'warning',
              message: t('formFeedbackSetupDuplicateGermplasmRep', { columnIndex: getColumnLabel(trial.layout, column), rowIndex: getRowLabel(trial.layout, row), germplasm: cell.germplasm, rep: cell.rep || 'N/A' }),
            })
          } else {
            germplasmSet.add(displayName)
          }
        }
      }
    })

    if (repSet.size > 2 && repSet.size > germplasmSet.size / 2) {
      feedback.value.push({
        type: 'warning',
        message: t('formFeedbackSetupHighNumberOfReps', { germplasmCount: germplasmSet.size, repCount: repSet.size }),
      })
    }

    if (germplasmSet.size === 0) {
      feedback.value.push({
        type: 'error',
        message: t('formFeedbackSetupNoGermplasm'),
      })
    }

    if (feedback.value.filter(f => f.type === 'error').length === 0) {
      trial.data = JSON.parse(JSON.stringify(gridData.value))
    } else {
      trial.data = {}
    }

    tableHasModifications.value = false
  }

  function updateTableFromTabbed (fieldName: string, content: string) {
    if (!model.value) {
      return
    }

    const table = content.split('\n').filter(n => n !== null && n.length > 0).map(r => r.split('\t').map(v => v.trim()))

    for (let row = 0; row < model.value.layout.rows; row++) {
      for (let column = 0; column < model.value.layout.columns; column++) {
        const tableGermplasm = (document.querySelector(`#germplasm-${row}-${column}`) as HTMLInputElement).value.trim()
        const tableRep = (document.querySelector(`#rep-${row}-${column}`) as HTMLInputElement).value.trim()
        const tableFriendlyName = (document.querySelector(`#friendlyName-${row}-${column}`) as HTMLInputElement).value.trim()
        const tableBarcode = (document.querySelector(`#barcode-${row}-${column}`) as HTMLInputElement).value.trim()
        const tablePedigree = (document.querySelector(`#pedigree-${row}-${column}`) as HTMLInputElement).value.trim()
        const tableTreatment = (document.querySelector(`#treatment-${row}-${column}`) as HTMLInputElement).value.trim()
        const tableControl = (document.querySelector(`#control-${row}-${column}`) as HTMLInputElement).checked
        const tableBrapiId = (document.querySelector(`#brapiId-${row}-${column}`) as HTMLInputElement).value

        if (!gridData.value[`${row}|${column}`]) {
          gridData.value[`${row}|${column}`] = {
            germplasm: '',
            rep: undefined,
            friendlyName: undefined,
            barcode: undefined,
            pedigree: undefined,
            treatment: undefined,
            categories: [],
            brapiId: undefined,
            isMarked: false,
            comments: [],
            geography: undefined,
            measurements: {},
          }
        }

        const cell = gridData.value[`${row}|${column}`]
        if (cell) {
          cell.germplasm = tableGermplasm
          cell.rep = tableRep
          cell.friendlyName = tableFriendlyName === '' ? undefined : tableFriendlyName
          cell.barcode = tableBarcode === '' ? undefined : tableBarcode
          cell.pedigree = tablePedigree === '' ? undefined : tablePedigree
          cell.treatment = tableTreatment === '' ? undefined : tableTreatment
          cell.categories = tableControl ? [CellCategory.CONTROL] : []
          cell.brapiId = tableBrapiId
          cell.isMarked = false
          cell.comments = []
          cell.geography = undefined
          cell.measurements = {}

          // @ts-ignore
          cell[fieldName] = table[row][column]
          // @ts-ignore
          document.querySelector(`#${fieldName}-${row}-${column}`).value = table[row][column]
        }
      }
    }
  }

  function updateTableFromFile (grid: Grid) {
    gridData.value = grid
    update()
  }

  function setTabInputConfig (key: string) {
    dataImportConfig.value = dataImportConfigs[key]

    nextTick(() => inputModal.value?.show())
  }

  function createElement (parent: HTMLElement, type: string, applyStyling?: boolean) {
    const element = document.createElement(type)
    if (type === 'input' && applyStyling !== false) {
      element.classList.add('v-field', 'v-field__input', 'v-field--variant-outlined', 'setup-germplasm-table-input')
    }
    parent.appendChild(element)

    element.addEventListener('change', () => {
      tableHasModifications.value = true
    }, { once: true })
    return element
  }

  function markAll (mark: boolean) {
    if (model.value) {
      for (let row = 0; row < model.value.layout.rows; row++) {
        for (let column = 0; column < model.value.layout.columns; column++) {
          (document.querySelector(`#control-${row}-${column}`) as HTMLInputElement).checked = mark
        }
      }
    }
  }

  function markChecks () {
    if (!model.value || !checkName.value || checkName.value.length === 0) {
      return
    }

    const match = checkName.value.trim().toLowerCase()
    for (let row = 0; row < model.value.layout.rows; row++) {
      for (let column = 0; column < model.value.layout.columns; column++) {
        const element = document.querySelector(`#germplasm-${row}-${column}`) as HTMLInputElement
        const germplasm = element?.value || ''

        if (germplasm && germplasm.trim().toLowerCase() === match) {
          (document.querySelector(`#control-${row}-${column}`) as HTMLInputElement).checked = true
        }
      }
    }

    checkName.value = undefined
  }

  function readFromTable () {
    const result: Grid = {}
    if (model.value) {
      for (let row = 0; row < model.value.layout.rows; row++) {
        for (let column = 0; column < model.value.layout.columns; column++) {
          const germplasm = (document.querySelector(`#germplasm-${row}-${column}`) as HTMLInputElement).value.trim()
          const rep = (document.querySelector(`#rep-${row}-${column}`) as HTMLInputElement).value.trim()
          const friendlyName = (document.querySelector(`#friendlyName-${row}-${column}`) as HTMLInputElement).value.trim()
          const barcode = (document.querySelector(`#barcode-${row}-${column}`) as HTMLInputElement).value.trim()
          const pedigree = (document.querySelector(`#pedigree-${row}-${column}`) as HTMLInputElement).value.trim()
          const treatment = (document.querySelector(`#treatment-${row}-${column}`) as HTMLInputElement).value.trim()
          const control = (document.querySelector(`#control-${row}-${column}`) as HTMLInputElement).checked
          const brapiId = (document.querySelector(`#brapiId-${row}-${column}`) as HTMLInputElement).value

          if (germplasm !== '' || rep !== '') {
            result[`${row}|${column}`] = {
              germplasm: germplasm,
              rep: rep,
              friendlyName: friendlyName === '' ? undefined : friendlyName,
              barcode: barcode === '' ? undefined : barcode,
              pedigree: pedigree === '' ? undefined : pedigree,
              treatment: treatment === '' ? undefined : treatment,
              categories: control ? [CellCategory.CONTROL] : [],
              brapiId: brapiId,
              isMarked: false,
              comments: [],
              geography: undefined,
              measurements: {},
            }
          }
        }
      }
    }

    gridData.value = result
  }

  function update () {
    if (model.value && model.value.data && Object.keys(model.value.data).length > 0) {
      gridData.value = JSON.parse(JSON.stringify(model.value.data))
    }

    const table = document.querySelector('#grid-table') as HTMLElement
    // Clear the table
    if (!table || !model.value) {
      return
    }

    table.innerHTML = ''

    // Create the head and header row
    const tHead = createElement(table, 'thead')
    const tRow = createElement(tHead, 'tr')
    // Blank element top left
    createElement(tRow, 'th')

    // Column headers
    for (let column = 0; column < model.value.layout.columns; column++) {
      const th = createElement(tRow, 'th')
      th.innerHTML = `${getColumnLabel(model.value.layout, column)}`
    }

    const tBody = createElement(table, 'tbody')

    for (let row = 0; row < model.value.layout.rows; row++) {
      // Create a new row
      const rowElement = createElement(tBody, 'tr')
      const displayRowIndex = `${getRowLabel(model.value.layout, row)}`

      // Row header
      createElement(rowElement, 'th').innerHTML = displayRowIndex

      for (let column = 0; column < model.value.layout.columns; column++) {
        const displayColumnIndex = getColumnLabel(model.value.layout, column)
        // New cell
        const cell = createElement(rowElement, 'td')
        cell.id = `cell-${row}-${column}`
        const dataCell = gridData.value[`${row}|${column}`]
        // Germplasm name input
        const cellId = createElement(cell, 'small')
        cellId.classList.add('text-muted')
        cellId.innerHTML = t('pageSetupGermplasmGridTableCellRowColumn', { row: displayRowIndex, column: displayColumnIndex })
        const g = createElement(cell, 'input') as HTMLInputElement
        g.id = `germplasm-${row}-${column}`
        if (dataCell) {
          g.value = dataCell.germplasm || ''
        } else {
          g.value = ''
        }
        g.placeholder = 'Name/Id'
        // Rep input
        const rep = createElement(cell, 'input') as HTMLInputElement
        rep.id = `rep-${row}-${column}`
        rep.placeholder = 'Rep'
        if (dataCell) {
          rep.value = dataCell.rep || ''
        } else {
          rep.value = ''
        }
        // Treatment input
        const treatment = createElement(cell, 'input') as HTMLInputElement
        treatment.id = `treatment-${row}-${column}`
        treatment.classList.add('input-treatment')
        if (!visibleFields.value.includes('treatment')) {
          treatment.classList.add('d-none')
        }
        treatment.placeholder = 'Treatment'
        if (dataCell) {
          treatment.value = dataCell.treatment || ''
        } else {
          treatment.value = ''
        }
        // Friendly name input
        const friendlyName = createElement(cell, 'input') as HTMLInputElement
        friendlyName.id = `friendlyName-${row}-${column}`
        friendlyName.classList.add('input-friendlyName')
        if (!visibleFields.value.includes('friendlyName')) {
          friendlyName.classList.add('d-none')
        }
        friendlyName.placeholder = 'Friendly name'
        if (dataCell) {
          friendlyName.value = dataCell.friendlyName || ''
        } else {
          friendlyName.value = ''
        }
        // Barcode input
        const barcode = createElement(cell, 'input') as HTMLInputElement
        barcode.id = `barcode-${row}-${column}`
        barcode.classList.add('input-barcode')
        if (!visibleFields.value.includes('barcode')) {
          barcode.classList.add('d-none')
        }
        barcode.placeholder = 'Barcode'
        if (dataCell) {
          barcode.value = dataCell.barcode || ''
        } else {
          barcode.value = ''
        }
        // Barcode input
        const pedigree = createElement(cell, 'input') as HTMLInputElement
        pedigree.id = `pedigree-${row}-${column}`
        pedigree.classList.add('input-pedigree')
        if (!visibleFields.value.includes('pedigree')) {
          pedigree.classList.add('d-none')
        }
        pedigree.placeholder = 'Pedigree'
        if (dataCell) {
          pedigree.value = dataCell.pedigree || ''
        } else {
          pedigree.value = ''
        }
        // BrapiId input
        const brapiId = createElement(cell, 'input') as HTMLInputElement
        brapiId.id = `brapiId-${row}-${column}`
        brapiId.classList.add('d-none')
        brapiId.placeholder = 'BrAPI DB Id'
        if (dataCell) {
          brapiId.value = dataCell.brapiId || ''
        } else {
          brapiId.value = ''
        }
        // Add the control
        const container = createElement(cell, 'div')
        const control = createElement(container, 'input', false) as HTMLInputElement
        control.setAttribute('type', 'checkbox')
        control.classList.add('me-1')
        control.id = `control-${row}-${column}`
        const label = createElement(container, 'label') as HTMLLabelElement
        label.htmlFor = `control-${row}-${column}`
        label.appendChild(document.createTextNode(t(CELL_CATEGORIES[CellCategory.CONTROL]?.title || '')))
        // Set previous value
        if (dataCell) {
          control.checked = dataCell.categories.includes(CellCategory.CONTROL) || false
        } else {
          control.checked = false
        }
      }
    }
  }

  function fillRandom () {
    const trial = model.value
    if (!trial) {
      return
    }

    visibleFields.value = ['barcode', 'friendlyName', 'pedigree', 'treatment']

    nextTick(() => {
      const ids = new Map()
      for (let row = 0; row < trial.layout.rows; row++) {
        for (let column = 0; column < trial.layout.columns; column++) {
          const tableRep = (document.querySelector(`#rep-${row}-${column}`) as HTMLInputElement).value
          const tableBrapiId = (document.querySelector(`#brapiId-${row}-${column}`) as HTMLInputElement).value
          const tableControl = (document.querySelector(`#control-${row}-${column}`) as HTMLInputElement).checked

          if (!gridData.value[`${row}|${column}`]) {
            gridData.value[`${row}|${column}`] = {
              germplasm: '',
              rep: undefined,
              friendlyName: undefined,
              treatment: undefined,
              pedigree: undefined,
              barcode: undefined,
              categories: [],
              brapiId: undefined,
              isMarked: false,
              measurements: {},
              comments: [],
            }
          }

          const random = getRandomGivenName()
          let rep = 1

          if (ids.has(random)) {
            rep = ids.get(random) + 1
            ids.set(random, rep)
          } else {
            ids.set(random, 1)
          }

          const displayRow = getRowLabel(trial.layout, row)
          const displayColumn = getColumnLabel(trial.layout, column)

          const cell = gridData.value[`${row}|${column}`]

          if (cell) {
            cell.germplasm = `GS-${displayRow}|${displayColumn}`;
            (document.querySelector(`#germplasm-${row}-${column}`) as HTMLInputElement).value = `GS-${displayRow}|${displayColumn}`;
            (document.querySelector(`#rep-${row}-${column}`) as HTMLInputElement).value = `${rep}`;
            (document.querySelector(`#friendlyName-${row}-${column}`) as HTMLInputElement).value = random || '';
            (document.querySelector(`#pedigree-${row}-${column}`) as HTMLInputElement).value = `${getRandomGivenName()} x ${getRandomGivenName()}`;
            (document.querySelector(`#barcode-${row}-${column}`) as HTMLInputElement).value = `b-${displayRow}|${displayColumn}`;
            // (document.querySelector(`#treatment-${row}-${column}`) as HTMLInputElement).value = row < Math.ceil(trial.layout.rows / 2) ? 'Untreated' : 'High nitrogen'
            // Set the value from the table here, this is important, because the direct input into the table is not synchronized with the `germplasm` 2d array until the user hits save or loads another input (here)
            cell.rep = `${rep || tableRep}`
            cell.brapiId = tableBrapiId
            cell.categories = tableControl ? [CellCategory.CONTROL] : []
          }
        }
      }

      emit('data-changed', gridData.value)
    })
  }

  function toggleFieldVisibility () {
    const showBarcode = visibleFields.value.includes('barcode')
    const showFriendlyName = visibleFields.value.includes('friendlyName')
    const showTreatment = visibleFields.value.includes('treatment')
    const showPedigree = visibleFields.value.includes('pedigree')

    document.querySelectorAll('.input-barcode').forEach(i => {
      if (showBarcode) {
        i.classList.remove('d-none')
      } else {
        i.classList.add('d-none')
      }
    })
    document.querySelectorAll('.input-pedigree').forEach(i => {
      if (showPedigree) {
        i.classList.remove('d-none')
      } else {
        i.classList.add('d-none')
      }
    })
    document.querySelectorAll('.input-treatment').forEach(i => {
      if (showTreatment) {
        i.classList.remove('d-none')
      } else {
        i.classList.add('d-none')
      }
    })
    document.querySelectorAll('.input-friendlyName').forEach(i => {
      if (showFriendlyName) {
        i.classList.remove('d-none')
      } else {
        i.classList.add('d-none')
      }
    })
  }

  function removeTable () {
    return new Promise<boolean>((resolve, reject) => {
      if (tableHasModifications.value === true) {
        emitter.emit('show-confirm', {
          title: t('modalTitleSaveTableChanges'),
          message: t('modalTextSaveTableChanges'),
          okTitle: t('genericYes'),
          cancelTitle: t('genericNo'),
          okVariant: 'error',
          callback: (result: boolean) => {
            if (result === true) {
              clearTable()
              resolve(true)
            } else {
              reject()
            }
          },
        })
      } else {
        clearTable()

        resolve(true)
      }
    })
  }

  function clearTable () {
    const table = document.querySelector('#grid-table') as HTMLElement
    // Clear the table
    if (!table) {
      return
    }

    table.innerHTML = ''

    tableHasModifications.value = false
  }

  const isValid = computed(() => Object.keys(gridData.value).length > 0 && (feedback.value.length === 0 || !feedback.value.some(f => f.type === 'error')))

  // watch(() => model.value.layout, async () => nextTick(() => update()), { immediate: true })
  watch(visibleFields, async () => toggleFieldVisibility())

  onMounted(() => update())

  defineExpose({
    update,
    isValid,
    removeTable,
  })
</script>

<style scoped>
.table-max-height {
  max-height: 65vh;
}
</style>

<style>
.setup-germplasm-table-input {
  border: 1px solid;
  height: 46px;
  min-height: unset;
  margin-bottom: 0.4em;
  min-width: 100px;
  width: unset;
}
</style>
