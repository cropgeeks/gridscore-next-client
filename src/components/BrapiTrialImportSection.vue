<template>
  <b-container>
    <p>{{ $t('modalTextBrapiTrialImport') }}</p>

    <b-button class="d-block mb-3" @click="showBrapiSettings"><IBiGearFill /> {{ $t('buttonBrapiSettings') }}</b-button>

    <b-button class="d-block mb-3" variant="primary" @click="update"><IBiArrowClockwise /> {{ $t('buttonRefresh') }}</b-button>

    <b-form @submit.prevent="getData">
      <h3>{{ $t('pageBrapiExportFilterTitle') }}</h3>
      <b-row>
        <b-col cols=12 md=4 lg=3>
          <b-form-group :label="$t('formLabelExportBrapiProgram')" label-for="program">
            <b-form-select id="program" :options="programOptions" v-model="selectedProgram" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=4 lg=3>
          <b-form-group :label="$t('formLabelExportBrapiTrial')" label-for="trial">
            <b-form-select id="trial" :options="trialOptions" v-model="selectedTrial" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=4 lg=3>
          <b-form-group :label="$t('formLabelExportBrapiStudyType')" label-for="studyType">
            <b-form-select id="studyType" :options="studyTypeOptions" v-model="selectedStudyType" />
          </b-form-group>
        </b-col>
        <b-col cols=12 md=4 lg=3>
          <b-form-group :label="$t('formLabelExportBrapiStudy')" label-for="study">
            <b-form-select id="study" :options="studyOptions" v-model="selectedStudy" />
          </b-form-group>
        </b-col>
      </b-row>

      <b-button type="submit" variant="primary" :disabled="!canProceed"><IBiCloudDownload /> {{ $t('buttonReceiveData') }}</b-button>

      <template v-if="layoutValid">
        <hr />

        <TrialLayoutDimensionComponent class="mt-3" :editLabelsAllowed="false" :editValuesAllowed="false" :layout="layout" @layout-changed="updateLayout" ref="trialDimensionComponent" />

        <div v-if="errors && errors.length > 0" class="my-3">
          <h3>{{ $t('widgetBrapiTrialImportErrorsTitle') }}</h3>

          <b-list-group class="import-errors">
            <b-list-group-item variant="danger" v-for="(error, index) in errors" :key="`import-error-${index}`">{{ error }}</b-list-group-item>
          </b-list-group>
        </div>

        <b-button @click="importData" variant="primary" :disabled="!canImport"><IBiCloudDownload /> {{ $t('buttonImportData') }}</b-button>
      </template>
    </b-form>
  </b-container>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'

import { brapiGetPrograms, brapiGetTrials, brapiGetStudies, brapiGetStudyTypes, brapiDefaultCatchHandler, brapiGetObservationUnits } from '@/plugins/brapi'

import emitter from 'tiny-emitter/instance'
import { DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_TOP_TO_BOTTOM } from '@/plugins/constants'
import { getColumnIndex, getRowIndex } from '@/plugins/misc'

export default {
  props: {
    studyDbId: {
      type: String,
      default: null
    }
  },
  data: function () {
    return {
      selectedProgram: null,
      selectedTrial: null,
      selectedStudyType: null,
      selectedStudy: null,
      programs: [],
      trials: [],
      studyTypes: [],
      studies: [],
      cells: [],
      layoutValid: false,
      layout: {
        rows: 0,
        columns: 0,
        rowLabels: [],
        columnLabels: [],
        columnOrder: DISPLAY_ORDER_LEFT_TO_RIGHT,
        rowOrder: DISPLAY_ORDER_TOP_TO_BOTTOM
      },
      errors: []
    }
  },
  watch: {
    selectedProgram: function () {
      this.selectedTrial = null

      this.updateTrials()
    },
    selectedTrial: function () {
      this.selectedStudyType = null

      this.updateStudyTypes()
    },
    selectedStudyType: function () {
      this.selectedStudy = null

      this.updateStudies()
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeSelectedTrial'
    ]),
    canProceed: function () {
      return this.selectedProgram && this.selectedTrial && this.selectedStudyType && this.selectedStudy
    },
    canImport: function () {
      return this.canProceed && this.errors.length < 1 && this.layoutValid
    },
    programOptions: function () {
      if (this.programs) {
        return this.programs.map(t => {
          return {
            value: t,
            text: `${t.programDbId} - ${t.programName}`
          }
        })
      } else {
        return []
      }
    },
    trialOptions: function () {
      if (this.trials) {
        return this.trials.map(t => {
          return {
            value: t,
            text: `${t.trialDbId} - ${t.trialName}`
          }
        })
      } else {
        return []
      }
    },
    studyTypeOptions: function () {
      if (this.studyTypes) {
        return this.studyTypes.map(t => {
          return {
            value: t,
            text: t
          }
        })
      } else {
        return []
      }
    },
    studyOptions: function () {
      if (this.studies) {
        return this.studies.map(t => {
          return {
            value: t,
            text: `${t.studyDbId} - ${t.studyName}`
          }
        })
      } else {
        return []
      }
    }
  },
  methods: {
    updateLayout: function (layout) {
      this.layout = JSON.parse(JSON.stringify(layout))
    },
    importData: function () {
      this.errors = []
      const plotMapping = {}

      this.cells.forEach(c => {
        const rowIndex = getRowIndex(this.layout, c.rowIndex)
        const columnIndex = getColumnIndex(this.layout, c.columnIndex)

        plotMapping[`${rowIndex}|${columnIndex}`] = {
          germplasm: c.germplasmIdentifier,
          rep: c.rep,
          brapiId: c.brapiId,
          control: c.control
        }
      })

      this.$emit('data-changed', {
        trialInfo: {
          name: this.selectedStudy.studyName,
          description: this.selectedStudy.studyDescription,
          brapiId: this.selectedStudy.studyDbId
        },
        layout: this.layout,
        plots: plotMapping
      })
    },
    getData: function () {
      brapiGetObservationUnits(this.selectedStudy.studyDbId)
        .then(result => {
          if (result && result.length > 0) {
            const rows = new Set()
            const columns = new Set()
            const cells = []

            result.forEach(ou => {
              if (ou.observationUnitPosition && ou.observationUnitPosition.positionCoordinateX && ou.observationUnitPosition.positionCoordinateY) {
                let columnIndex = null
                let rowIndex = null
                let germplasmIdentifier = null
                let rep = null
                let brapiId = null
                let control = null

                if (ou.observationUnitPosition.positionCoordinateXType === 'GRID_COL') {
                  columnIndex = +ou.observationUnitPosition.positionCoordinateX
                  columns.add(columnIndex)
                } else {
                  this.errors.push(this.$t('widgetBrapiTrialImportErrorNoColumnInformation', { germplasm: ou.germplasmName || ou.observationUnitDbId }))
                }
                if (ou.observationUnitPosition.positionCoordinateYType === 'GRID_ROW') {
                  rowIndex = +ou.observationUnitPosition.positionCoordinateY
                  rows.add(rowIndex)
                } else {
                  this.errors.push(this.$t('widgetBrapiTrialImportErrorNoRowInformation', { germplasm: ou.germplasmName || ou.observationUnitDbId }))
                }
                if (ou.observationUnitName) {
                  germplasmIdentifier = ou.observationUnitName
                } else if (ou.germplasmName) {
                  germplasmIdentifier = ou.germplasmName
                } else {
                  this.errors.push(this.$t('widgetBrapiTrialImportErrorNoGermplasmName', { germplasm: ou.observationUnitDbId }))
                }
                if (ou.germplasmDbId) {
                  brapiId = ou.germplasmDbId
                } else {
                  this.errors.push(this.$t('widgetBrapiTrialImportErrorNoGermplasmDbId', { germplasm: ou.observationUnitDbId }))
                }
                if (ou.observationUnitPosition.observationLevel) {
                  if (ou.observationUnitPosition.observationLevel.levelName === 'rep') {
                    rep = ou.observationUnitPosition.observationLevel.levelCode
                  }
                }
                if (ou.observationUnitPosition.entryType) {
                  if (ou.observationUnitPosition.entryType === 'CHECK') {
                    control = true
                  }
                }

                if (germplasmIdentifier && columnIndex !== null && rowIndex !== null && brapiId) {
                  cells.push({
                    germplasmIdentifier,
                    rep,
                    brapiId,
                    rowIndex,
                    columnIndex,
                    control
                  })
                }
              }
            })

            if (rows.size > 0 && columns.size > 0 && cells.length > 0) {
              this.layout = {
                rows: rows.size,
                columns: columns.size,
                rowLabels: [...rows].sort((a, b) => a - b),
                columnLabels: [...columns].sort((a, b) => a - b),
                columnOrder: DISPLAY_ORDER_LEFT_TO_RIGHT,
                rowOrder: DISPLAY_ORDER_TOP_TO_BOTTOM
              }
              this.cells = cells
              this.layoutValid = true

              this.$nextTick(() => this.$refs.trialDimensionComponent.forceUpdate())
            }
          }
        })
    },
    showBrapiSettings: function () {
      emitter.emit('show-brapi-settings')
    },
    updatePrograms: function () {
      brapiGetPrograms()
        .then(result => {
          this.programs = result

          if (result && result.length > 0) {
            this.selectedProgram = result[0]
          } else {
            this.selectedProgram = null
          }
        })
        .catch(brapiDefaultCatchHandler)
    },
    updateTrials: function () {
      brapiGetTrials({
        programDbId: this.selectedProgram ? this.selectedProgram.programDbId : null
      })
        .then(result => {
          this.trials = result

          if (result && result.length > 0) {
            this.selectedTrial = result[0]
          } else {
            this.selectedTrial = null
          }
        })
        .catch(brapiDefaultCatchHandler)
    },
    updateStudyTypes: function () {
      brapiGetStudyTypes()
        .then(result => {
          this.studyTypes = result

          if (result && result.length > 0) {
            if (result.includes('trials')) {
              this.selectedStudyType = 'trials'
            } else {
              this.selectedStudyType = result[0]
            }
          } else {
            this.selectedStudyType = null
          }
        })
        .catch(brapiDefaultCatchHandler)
    },
    updateStudies: function () {
      brapiGetStudies({
        studyType: this.selectedStudyType,
        trialDbId: this.selectedTrial ? this.selectedTrial.trialDbId : null
      })
        .then(result => {
          this.studies = result

          if (result && result.length > 0) {
            const index = result.findIndex(r => r.studyDbId === this.studyDbId)
            if (index !== -1) {
              this.selectedStudy = result[index]
            } else {
              this.selectedStudy = result[0]
            }
          } else {
            this.selectedStudy = null
          }
        })
        .catch(brapiDefaultCatchHandler)
    },
    update: function () {
      this.updatePrograms()
    }
  },
  mounted: function () {
    emitter.on('trial-data-loaded', this.update)
    emitter.on('brapi-settings-changed', this.updatePrograms)
  },
  beforeUnmount: function () {
    emitter.off('trial-data-loaded', this.update)
    emitter.off('brapi-settings-changed', this.updatePrograms)
  }
}
</script>

<style scoped>
.import-errors {
  max-height: min(300px, 50vh);
  overflow-y: auto;
}
</style>
