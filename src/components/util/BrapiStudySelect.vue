<template>
  <div>
    <v-row>
      <v-col cols="12" md="6" lg="3">
        <v-autocomplete
          v-model="program"
          :label="$t('formLabelExportBrapiProgram')"
          return-object
          auto-select-first
          item-value="programDbId"
          item-title="programName"
          :items="programs"
          autocomplete="off"
        />
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-autocomplete
          v-model="trial"
          :label="$t('formLabelExportBrapiTrial')"
          return-object
          auto-select-first
          item-value="trialDbId"
          item-title="trialName"
          :items="trials"
          autocomplete="off"
        />
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-autocomplete
          v-model="studyType"
          :label="$t('formLabelExportBrapiStudyType')"
          return-object
          auto-select-first
          :items="studyTypes"
          autocomplete="off"
        />
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-autocomplete
          v-model="study"
          :label="$t('formLabelExportBrapiStudy')"
          return-object
          auto-select-first
          item-value="studyDbId"
          item-title="studyName"
          :items="studies"
          autocomplete="off"
        />
      </v-col>
    </v-row>

    <v-btn :text="$t('buttonReceiveData')" :prepend-icon="mdiCloudDownload" color="primary" variant="tonal" :disabled="!study" @click="pullData" />

    <LayoutDimensions
      class="mt-3"
      v-model="layout"
      v-model:layout-type="layoutType"
      :is-edit="false"
      :can-change="false"
      v-if="layout"
    />
  </div>
</template>

<script setup lang="ts">
  import { brapiDefaultCatchHandler, brapiGetObservationUnits, brapiGetPrograms, brapiGetStudies, brapiGetStudyTypes, brapiGetTrials } from '@/plugins/brapi'
  import type { Study, Trial, Program } from '@/plugins/types/brapi'
  import type { BrapiImportCell } from '@/plugins/types/client'
  import { CellCategory, DisplayOrder, type Layout } from '@/plugins/types/gridscore'
  import { isNumber } from '@/plugins/util'
  import { mdiCloudDownload } from '@mdi/js'

  import emitter from 'tiny-emitter/instance'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  const programs = ref<Program[]>([])
  const program = defineModel<Program>('program')
  const trials = ref<Trial[]>([])
  const trial = defineModel<Trial>('trial')
  const studyTypes = ref<string[]>([])
  const studyType = defineModel<string>('studyType')
  const studies = ref<Study[]>([])
  const study = defineModel<Study>('study')

  const layout = ref<Layout>()
  const layoutType = ref<'grid' | 'list'>('grid')

  const errors = ref<string[]>([])

  function pullData () {
    errors.value = []
    layout.value = undefined
    emitter.emit('show-loading', true)

    if (study.value) {
      brapiGetObservationUnits(study.value.studyDbId)
        .then(result => {
          const rows = new Set<number>()
          const columns = new Set<number>()
          const cells: BrapiImportCell[] = []

          result.forEach(ou => {
            if (ou.observationUnitPosition && ou.observationUnitPosition.positionCoordinateX && ou.observationUnitPosition.positionCoordinateY) {
              let columnIndex: number | undefined = undefined
              let rowIndex: number | undefined = undefined
              let germplasmIdentifier = undefined
              let rep = undefined
              let brapiId = undefined
              let control = undefined

              if (ou.observationUnitPosition.positionCoordinateXType === 'GRID_COL' && isNumber(ou.observationUnitPosition.positionCoordinateX, true)) {
                columnIndex = +ou.observationUnitPosition.positionCoordinateX
                columns.add(columnIndex)
              } else {
                errors.value.push(t('widgetBrapiTrialImportErrorNoColumnInformation', { germplasm: ou.germplasmName || ou.observationUnitDbId }))
              }
              if (ou.observationUnitPosition.positionCoordinateYType === 'GRID_ROW' && isNumber(ou.observationUnitPosition.positionCoordinateY, true)) {
                rowIndex = +ou.observationUnitPosition.positionCoordinateY
                rows.add(rowIndex)
              } else {
                errors.value.push(t('widgetBrapiTrialImportErrorNoRowInformation', { germplasm: ou.germplasmName || ou.observationUnitDbId }))
              }
              if (ou.observationUnitName) {
                germplasmIdentifier = ou.observationUnitName
              } else if (ou.germplasmName) {
                germplasmIdentifier = ou.germplasmName
              } else {
                errors.value.push(t('widgetBrapiTrialImportErrorNoGermplasmName', { germplasm: ou.observationUnitDbId }))
              }
              if (ou.germplasmDbId) {
                brapiId = ou.germplasmDbId
              } else {
                errors.value.push(t('widgetBrapiTrialImportErrorNoGermplasmDbId', { germplasm: ou.observationUnitDbId }))
              }
              if (ou.observationUnitPosition.observationLevel && ou.observationUnitPosition.observationLevel.levelName === 'rep') {
                rep = ou.observationUnitPosition.observationLevel.levelCode
              }
              if (ou.observationUnitPosition.entryType && ou.observationUnitPosition.entryType === 'CHECK') {
                control = true
              }

              if (germplasmIdentifier && columnIndex !== undefined && rowIndex !== undefined && brapiId) {
                cells.push({
                  germplasm: germplasmIdentifier,
                  rep,
                  brapiId,
                  row: rowIndex,
                  column: columnIndex,
                  categories: control ? [CellCategory.CONTROL] : [],
                })
              }
            } else {
              errors.value.push(t('widgetBrapiTrialImportErrorNoPlotInformation', { germplasm: ou.germplasmName || ou.observationUnitDbId }))
            }
          })

          if (rows.size > 0 && columns.size > 0 && cells.length > 0) {
            layout.value = {
              rows: rows.size,
              columns: columns.size,
              rowLabels: [...rows].sort((a, b) => a - b),
              columnLabels: [...columns].sort((a, b) => a - b),
              columnOrder: DisplayOrder.LEFT_TO_RIGHT,
              rowOrder: DisplayOrder.TOP_TO_BOTTOM,
            }
          }
        })
        .catch(brapiDefaultCatchHandler)
        .finally(() => emitter.emit('show-loading', false))
    }
  }

  function updatePrograms () {
    brapiGetPrograms()
      .then(pr => {
        programs.value = pr || []

        if (programs.value.length > 0) {
          program.value = programs.value[0]
        }
      })
      .catch(brapiDefaultCatchHandler)
  }

  function updateTrials () {
    brapiGetTrials({
      programDbId: program.value?.programDbId,
    })
      .then(tr => {
        trials.value = tr || []

        if (trials.value.length > 0) {
          trial.value = trials.value[0]
        }
      })
      .catch(brapiDefaultCatchHandler)
  }

  function updateStudyTypes () {
    brapiGetStudyTypes()
      .then(result => {
        studyTypes.value = result || []

        if (result && result.length > 0) {
          if (result.includes('trials')) {
            studyType.value = 'trials'
          } else {
            studyType.value = result[0]
          }
        } else {
          studyType.value = undefined
        }
      })
      .catch(brapiDefaultCatchHandler)
  }

  function updateStudies () {
    brapiGetStudies({
      studyType: studyType.value,
      trialDbId: trial.value?.trialDbId,
    })
      .then(result => {
        studies.value = result

        if (result && result.length > 0) {
          // Preselect a study (Germinate import)
          const index = result.findIndex(r => study.value && (r.studyDbId === study.value.studyDbId))
          if (index !== -1) {
            study.value = result[index]
          } else {
            study.value = result[0]
          }
        } else {
          study.value = undefined
        }
      })
      .catch(brapiDefaultCatchHandler)
  }

  watch(program, async () => updateTrials(), { immediate: true })
  watch(trial, async () => updateStudyTypes(), { immediate: true })
  watch(studyType, async () => updateStudies(), { immediate: true })

  onMounted(() => {
    updatePrograms()
  })

  defineExpose({
    updatePrograms,
  })
</script>
