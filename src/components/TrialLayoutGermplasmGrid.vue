<template>
  <div>
    <b-form @submit.prevent>
      <b-row>
        <b-col cols=12 md=6>
          <b-dropdown variant="primary">
            <template #button-content>
              <IBiFileEarmarkPlus /> {{ $t('buttonImportLayoutData') }}
            </template>
            <b-dropdown-item @click="setTabInputConfig('germplasm')"><IBiTable /> {{ $t('dropdownImportGermplasmGrid') }}</b-dropdown-item>
            <b-dropdown-item @click="setTabInputConfig('rep')"><IBiTable /> {{ $t('dropdownImportRepGrid') }}</b-dropdown-item>
            <b-dropdown-item @click="setTabInputConfig('treatment')"><IBiTable /> {{ $t('dropdownImportTreatmentGrid') }}</b-dropdown-item>
            <b-dropdown-item @click="setTabInputConfig('friendlyName')"><IBiTable /> {{ $t('dropdownImportFriendlyNameGrid') }}</b-dropdown-item>
            <b-dropdown-item @click="setTabInputConfig('barcode')"><IBiTable /> {{ $t('dropdownImportBarcodeGrid') }}</b-dropdown-item>
            <b-dropdown-item @click="setTabInputConfig('pedigree')"><IBiTable /> {{ $t('dropdownImportPedigreeGrid') }}</b-dropdown-item>
            <b-dropdown-item @click="$refs.fieldbookInput.show()"><IBiFileEarmarkSpreadsheet /> {{ $t('dropdownImportFieldHub') }}</b-dropdown-item>
            <b-dropdown-item @click="fillRandom" v-if="isDevelopment"><IBiShuffle /> {{ $t('dropdownImportRandom') }}</b-dropdown-item>
          </b-dropdown>

          <b-card class="mt-3" title="Show input fields">
            <b-form-checkbox v-model="showTreatment" switch>{{ $t('formCheckboxSetupShowTreatment') }}</b-form-checkbox>
            <b-form-checkbox v-model="showFriendlyName" switch>{{ $t('formCheckboxSetupShowFriendlyName') }}</b-form-checkbox>
            <b-form-checkbox v-model="showBarcode" switch>{{ $t('formCheckboxSetupShowBarcode') }}</b-form-checkbox>
            <b-form-checkbox v-model="showPedigree" switch>{{ $t('formCheckboxSetupShowPedigree') }}</b-form-checkbox>
          </b-card>
        </b-col>
        <b-col cols=12 md=6>
          <b-form-group :label="$t('formLabelSetupGermplasmGridMarkCheck')" label-for="check">
            <b-input-group>
              <b-form-input id="check" v-model="checkName" @keyup.exact.enter="markChecks" />
              <template #append>
                <b-button @click="markChecks" :disabled="!checkName || checkName.length < 1"><IBiCheck2Square /></b-button>
              </template>
            </b-input-group>
            <template #description>
              <p class="mb-0">{{ $t('formDescriptionSetupGermplasmGridMarkCheck') }}</p>
              <span class="me-3"><IBiListCheck /> <a href="#" @click.prevent="markAll(true)">{{ $t('buttonMarkAll') }}</a></span>
              <span><IBiList /> <a href="#" @click.prevent="markAll(false)">{{ $t('buttonUnmarkAll') }}</a></span>
            </template>
          </b-form-group>
        </b-col>
      </b-row>
    </b-form>

    <div class="table-responsive responsive-wrapper mt-3">
      <table ref="germplasmTable" class="table table-striped table-bordered grid-table" ></table>
    </div>

    <TabbedInputToGridModal ref="tabInput" :label="selectedTabInputConfig.label" :placeholder="selectedTabInputConfig.placeholder" :formFeedbackRowCount="selectedTabInputConfig.rowCount" :formFeedbackColumnCount="selectedTabInputConfig.columnCount" @data-changed="selectedTabInputConfig.callback" v-if="selectedTabInputConfig" />
    <FielDBookInputModal ref="fieldbookInput" :layout="layout" @data-changed="updateTableFieldbook" />
  </div>
</template>

<script>
import TabbedInputToGridModal from '@/components/modals/TabbedInputToGridModal.vue'
import FielDBookInputModal from '@/components/modals/FielDBookInputModal.vue'
import { CELL_CATEGORIES, CELL_CATEGORY_CONTROL, DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_TOP_TO_BOTTOM } from '@/plugins/constants'
import { getColumnLabel, getRandomGivenName, getRowLabel } from '@/plugins/misc'

export default {
  components: {
    TabbedInputToGridModal,
    FielDBookInputModal
  },
  props: {
    layout: {
      type: Object,
      default: () => {
        return {
          rows: 1,
          colums: 1,
          rowOrder: DISPLAY_ORDER_TOP_TO_BOTTOM,
          columnOrder: DISPLAY_ORDER_LEFT_TO_RIGHT
        }
      }
    },
    initialGermplasm: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      germplasmMap: {},
      checkName: null,
      showBarcode: false,
      showFriendlyName: false,
      showPedigree: false,
      showTreatment: false,
      tabInputConfigs: {
        germplasm: {
          label: 'formLabelSetupGermplasmNames',
          placeholder: 'formPlaceholderSetupGermplasmNames',
          rowCount: 'formFeedbackDataGridImportInvalidRowCount',
          columnCount: 'formFeedbackDataGridImportInvalidColumnCount',
          callback: (parsedGrid) => this.updateTableFields(parsedGrid, 'germplasm')
        },
        rep: {
          label: 'formLabelSetupRepNames',
          placeholder: 'formPlaceholderSetupRepNames',
          rowCount: 'formFeedbackDataGridImportInvalidRowCount',
          columnCount: 'formFeedbackDataGridImportInvalidColumnCount',
          callback: (parsedGrid) => this.updateTableFields(parsedGrid, 'rep')
        },
        friendlyName: {
          label: 'formLabelSetupFriendlyNames',
          placeholder: 'formPlaceholderSetupFriendlyNames',
          rowCount: 'formFeedbackDataGridImportInvalidRowCount',
          columnCount: 'formFeedbackDataGridImportInvalidColumnCount',
          callback: (parsedGrid) => this.updateTableFields(parsedGrid, 'friendlyName')
        },
        barcode: {
          label: 'formLabelSetupBarcodeNames',
          placeholder: 'formPlaceholderSetupBarcodeNames',
          rowCount: 'formFeedbackDataGridImportInvalidRowCount',
          columnCount: 'formFeedbackDataGridImportInvalidColumnCount',
          callback: (parsedGrid) => this.updateTableFields(parsedGrid, 'barcode')
        },
        pedigree: {
          label: 'formLabelSetupPedigreeNames',
          placeholder: 'formPlaceholderSetupPedigreeNames',
          rowCount: 'formFeedbackDataGridImportInvalidRowCount',
          columnCount: 'formFeedbackDataGridImportInvalidColumnCount',
          callback: (parsedGrid) => this.updateTableFields(parsedGrid, 'pedigree')
        },
        treatment: {
          label: 'formLabelSetupTreatmentNames',
          placeholder: 'formPlaceholderSetupTreatmentNames',
          rowCount: 'formFeedbackDataGridImportInvalidRowCount',
          columnCount: 'formFeedbackDataGridImportInvalidColumnCount',
          callback: (parsedGrid) => this.updateTableFields(parsedGrid, 'treatment')
        }
      },
      selectedTabInputConfig: null
    }
  },
  computed: {
    isDevelopment: function () {
      return import.meta.env.DEV
    }
  },
  watch: {
    layout: {
      deep: true,
      handler: function (newValue, oldValue) {
        if (!newValue || !oldValue || newValue.rows !== oldValue.rows || newValue.columns !== oldValue.columns) {
          // Only update if one of the relevant properties of the layout changed.
          this.resetFormAndGermplasm()
        }
      }
    },
    initialGermplasm: {
      immediate: true,
      handler: function (newValue) {
        if (newValue) {
          this.germplasmMap = JSON.parse(JSON.stringify(newValue))
        } else {
          this.germplasmMap = {}
        }
      }
    },
    showBarcode: function () {
      this.toggleFieldVisibility()
    },
    showPedigree: function () {
      this.toggleFieldVisibility()
    },
    showTreatment: function () {
      this.toggleFieldVisibility()
    },
    showFriendlyName: function () {
      this.toggleFieldVisibility()
    }
  },
  methods: {
    setTabInputConfig: function (name) {
      this.selectedTabInputConfig = this.tabInputConfigs[name]

      nextTick(() => this.$refs.tabInput.show())
    },
    fillRandom: function () {
      const ids = new Map()
      for (let row = 0; row < this.layout.rows; row++) {
        for (let column = 0; column < this.layout.columns; column++) {
          const tableRep = document.querySelector(`#rep-${row}-${column}`).value
          const tableBrapiId = document.querySelector(`#brapiId-${row}-${column}`).value
          const tableControl = document.querySelector(`#control-${row}-${column}`).checked

          if (!this.germplasmMap[`${row}|${column}`]) {
            this.germplasmMap[`${row}|${column}`] = {
              germplasm: null,
              rep: null,
              control: false,
              brapiId: null
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

          this.germplasmMap[`${row}|${column}`].germplasm = random
          document.querySelector(`#germplasm-${row}-${column}`).value = random
          document.querySelector(`#rep-${row}-${column}`).value = rep
          // Set the value from the table here, this is important, because the direct input into the table is not synchronized with the `germplasm` 2d array until the user hits save or loads another input (here)
          this.germplasmMap[`${row}|${column}`].rep = rep || tableRep
          this.germplasmMap[`${row}|${column}`].brapiId = tableBrapiId
          this.germplasmMap[`${row}|${column}`].control = tableControl
        }
      }

      this.$emit('data-changed', this.germplasmMap)
    },
    toggleFieldVisibility: function () {
      document.querySelectorAll('.input-barcode').forEach(i => {
        i.className = `input-barcode grid-input ${this.showBarcode ? '' : 'd-none'}`
      })
      document.querySelectorAll('.input-pedigree').forEach(i => {
        i.className = `input-pedigree grid-input ${this.showPedigree ? '' : 'd-none'}`
      })
      document.querySelectorAll('.input-treatment').forEach(i => {
        i.className = `input-treatment grid-input ${this.showTreatment ? '' : 'd-none'}`
      })
      document.querySelectorAll('.input-friendlyName').forEach(i => {
        i.className = `input-friendlyName grid-input ${this.showFriendlyName ? '' : 'd-none'}`
      })
    },
    markChecks: function () {
      if (!this.checkName || this.checkName.length < 1) {
        return
      }

      const match = this.checkName.trim().toLowerCase()
      for (let row = 0; row < this.layout.rows; row++) {
        for (let column = 0; column < this.layout.columns; column++) {
          const germplasm = document.querySelector(`#germplasm-${row}-${column}`).value

          if (germplasm && germplasm.trim().toLowerCase() === match) {
            document.querySelector(`#control-${row}-${column}`).checked = true
          }
        }
      }

      this.checkName = null
    },
    markAll: function (mark) {
      for (let row = 0; row < this.layout.rows; row++) {
        for (let column = 0; column < this.layout.columns; column++) {
          document.querySelector(`#control-${row}-${column}`).checked = mark
        }
      }
    },
    updateTableFieldbook: function (dataMap) {
      this.germplasmMap = dataMap

      this.$nextTick(() => this.resetTable())
    },
    updateTableFields: function (parsedGrid, fieldName) {
      for (let row = 0; row < this.layout.rows; row++) {
        for (let column = 0; column < this.layout.columns; column++) {
          const tableGermplasm = document.querySelector(`#germplasm-${row}-${column}`).value
          const tableRep = document.querySelector(`#rep-${row}-${column}`).value
          const tableFriendlyName = document.querySelector(`#friendlyName-${row}-${column}`).value
          const tableBarcode = document.querySelector(`#barcode-${row}-${column}`).value
          const tablePedigree = document.querySelector(`#pedigree-${row}-${column}`).value
          const tableTreatment = document.querySelector(`#treatment-${row}-${column}`).value
          const tableBrapiId = document.querySelector(`#brapiId-${row}-${column}`).value
          const tableControl = document.querySelector(`#control-${row}-${column}`).checked

          if (!this.germplasmMap[`${row}|${column}`]) {
            this.germplasmMap[`${row}|${column}`] = {
              germplasm: null,
              rep: null,
              friendlyName: null,
              barcode: null,
              pedigree: null,
              treatment: null,
              control: false,
              brapiId: null
            }
          }

          this.germplasmMap[`${row}|${column}`].germplasm = tableGermplasm
          this.germplasmMap[`${row}|${column}`].rep = tableRep
          this.germplasmMap[`${row}|${column}`].friendlyName = tableFriendlyName
          this.germplasmMap[`${row}|${column}`].barcode = tableBarcode
          this.germplasmMap[`${row}|${column}`].pedigree = tablePedigree
          this.germplasmMap[`${row}|${column}`].treatment = tableTreatment
          this.germplasmMap[`${row}|${column}`].brapiId = tableBrapiId
          this.germplasmMap[`${row}|${column}`].control = tableControl

          // Now update with new value
          this.germplasmMap[`${row}|${column}`][fieldName] = parsedGrid[row][column]
          document.querySelector(`#${fieldName}-${row}-${column}`).value = parsedGrid[row][column]
        }
      }

      this.$emit('data-changed', this.germplasmMap)
    },
    resetFormAndGermplasm: function () {
      if (this.initialGermplasm) {
        let rows = 0
        let columns = 0

        Object.keys(this.initialGermplasm).forEach(k => {
          const [row, column] = k.split('|').map(c => +c)

          rows = Math.max(rows, row + 1)
          columns = Math.max(columns, column + 1)
        })

        if (this.layout.rows !== rows || this.layout.columns !== columns) {
          this.germplasmMap = {}
        }
      }

      this.selectedTabInputConfig = null
    },
    createElement: function (parent, type) {
      const element = document.createElement(type)
      parent.appendChild(element)
      return element
    },
    resetTable: function () {
      const table = this.$refs.germplasmTable
      // Clear the table
      table.innerHTML = ''

      // Create the head and header row
      const tHead = this.createElement(table, 'thead')
      const tRow = this.createElement(tHead, 'tr')
      // Blank element top left
      this.createElement(tRow, 'th')

      // Column headers
      for (let column = 0; column < this.layout.columns; column++) {
        const th = this.createElement(tRow, 'th')
        th.innerHTML = getColumnLabel(this.layout, column)
      }

      const tBody = this.createElement(table, 'tbody')

      for (let row = 0; row < this.layout.rows; row++) {
        // Create a new row
        const rowElement = this.createElement(tBody, 'tr')
        const displayRowIndex = getRowLabel(this.layout, row)

        // Row header
        this.createElement(rowElement, 'th').innerHTML = displayRowIndex

        for (let column = 0; column < this.layout.columns; column++) {
          const displayColumnIndex = getColumnLabel(this.layout, column)
          // New cell
          const cell = this.createElement(rowElement, 'td')
          cell.id = `cell-${row}-${column}`
          const dataCell = this.germplasmMap[`${row}|${column}`]
          // Germplasm name input
          const cellId = this.createElement(cell, 'small')
          cellId.className = 'text-muted'
          cellId.innerHTML = this.$t('pageSetupGermplasmGridTableCellRowColumn', { row: displayRowIndex, column: displayColumnIndex })
          const g = this.createElement(cell, 'input')
          g.id = `germplasm-${row}-${column}`
          if (dataCell) {
            g.value = dataCell.germplasm
          } else {
            g.value = ''
          }
          g.placeholder = 'Name/Id'
          g.className = 'grid-input'
          // Rep input
          const rep = this.createElement(cell, 'input')
          rep.id = `rep-${row}-${column}`
          rep.className = 'grid-input'
          rep.placeholder = 'Rep'
          if (dataCell) {
            rep.value = dataCell.rep || ''
          } else {
            rep.value = ''
          }
          // Treatment input
          const treatment = this.createElement(cell, 'input')
          treatment.id = `treatment-${row}-${column}`
          treatment.className = `input-treatment grid-input ${this.showTreatment ? '' : 'd-none'}`
          treatment.placeholder = 'Treatment'
          if (dataCell) {
            treatment.value = dataCell.treatment || ''
          } else {
            treatment.value = ''
          }
          // Friendly name input
          const friendlyName = this.createElement(cell, 'input')
          friendlyName.id = `friendlyName-${row}-${column}`
          friendlyName.className = `input-friendlyName grid-input ${this.showFriendlyName ? '' : 'd-none'}`
          friendlyName.placeholder = 'Friendly name'
          if (dataCell) {
            friendlyName.value = dataCell.friendlyName || ''
          } else {
            friendlyName.value = ''
          }
          // Barcode input
          const barcode = this.createElement(cell, 'input')
          barcode.id = `barcode-${row}-${column}`
          barcode.className = `input-barcode grid-input ${this.showBarcode ? '' : 'd-none'}`
          barcode.placeholder = 'Barcode'
          if (dataCell) {
            barcode.value = dataCell.barcode || ''
          } else {
            barcode.value = ''
          }
          // Barcode input
          const pedigree = this.createElement(cell, 'input')
          pedigree.id = `pedigree-${row}-${column}`
          pedigree.className = `input-pedigree grid-input ${this.showPedigree ? '' : 'd-none'}`
          pedigree.placeholder = 'Pedigree'
          if (dataCell) {
            pedigree.value = dataCell.pedigree || ''
          } else {
            pedigree.value = ''
          }
          // BrapiId input
          const brapiId = this.createElement(cell, 'input')
          brapiId.id = `brapiId-${row}-${column}`
          brapiId.className = 'grid-input d-none'
          brapiId.placeholder = 'BrAPI DB Id'
          if (dataCell) {
            brapiId.value = dataCell.brapiId
          } else {
            brapiId.value = ''
          }
          // Add the control
          const container = this.createElement(cell, 'div')
          const control = this.createElement(container, 'input')
          control.setAttribute('type', 'checkbox')
          control.className = 'me-1'
          control.id = `control-${row}-${column}`
          const label = this.createElement(container, 'label')
          label.htmlFor = `control-${row}-${column}`
          label.appendChild(document.createTextNode(this.$t(CELL_CATEGORIES[CELL_CATEGORY_CONTROL].title)))
          // Set previous value
          if (dataCell) {
            control.checked = dataCell.control
          } else {
            control.checked = false
          }
        }
      }

      this.loading = false
    },
    getGermplasmMap: function () {
      const tempMap = {}
      for (let row = 0; row < this.layout.rows; row++) {
        for (let column = 0; column < this.layout.columns; column++) {
          const germplasm = document.querySelector(`#germplasm-${row}-${column}`).value.trim()
          const rep = document.querySelector(`#rep-${row}-${column}`).value.trim()
          const friendlyName = document.querySelector(`#friendlyName-${row}-${column}`).value.trim()
          const barcode = document.querySelector(`#barcode-${row}-${column}`).value.trim()
          const pedigree = document.querySelector(`#pedigree-${row}-${column}`).value.trim()
          const treatment = document.querySelector(`#treatment-${row}-${column}`).value.trim()
          const control = document.querySelector(`#control-${row}-${column}`).checked
          const brapiId = document.querySelector(`#brapiId-${row}-${column}`).value

          if (germplasm !== '' || rep !== '') {
            tempMap[`${row}|${column}`] = {
              germplasm: germplasm === '' ? null : germplasm, 
              rep: rep === '' ? null : rep,
              friendlyName: friendlyName === '' ? null : friendlyName,
              barcode: barcode === '' ? null : barcode,
              pedigree: pedigree === '' ? null : pedigree,
              treatment: treatment === '' ? null : treatment,
              control,
              brapiId: brapiId === '' ? null : brapiId
            }
          }
        }
      }

      this.germplasmMap = tempMap

      return this.germplasmMap
    },
    toggleTable: function (visible) {
      if (visible) {
        this.resetTable()
      } else {
        this.getGermplasmMap()

        this.$emit('data-changed', this.germplasmMap)
        this.$refs.germplasmTable.innerHTML = ''
      }
    }
  }
}
</script>

<style>
.grid-table td > * {
  display: block;
}
.grid-table td .grid-input {
  border-radius: 0;
  min-width: 100px;
  height: calc(1.5em + 0.75rem + 2px);
  padding: 0.375rem 0.75rem;
  font-size: 0.9375rem;
  font-weight: 400;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid #ced4da;
}
.grid-table td :not(.grid-input:first-of-type) {
  border-top: 0;
}
</style>
