<template>
  <v-dialog v-model="dialog" scrollable max-width="min(90vw, 1024px)">
    <v-card :title="$t('modalTitleBrapiTrialImport')">
      <template #text>
        <p>{{ $t('modalTextBrapiTrialImport') }}</p>
        <v-form @submit.prevent>
          <BrapiConfig @brapi-config-updated="getPrograms" />

          <BrapiStudySelect
            class="mt-3"
            v-model:study="study"
            ref="brapiStudySelect"
          />

          <v-btn :text="$t('buttonReceiveData')" :prepend-icon="mdiCloudDownload" color="primary" variant="tonal" :disabled="!study" @click="pullData" />

          <v-virtual-scroll
            max-height="25vh"
            class="my-3"
            :items="errors"
          >
            <template #default="{ item }">
              <v-list-item :title="item" :prepend-icon="mdiAlertCircle" active active-class="text-error" />
            </template>
          </v-virtual-scroll>

          <LayoutDimensions
            class="mt-3"
            v-model="layout"
            v-model:layout-type="layoutType"
            :is-edit="false"
            :can-change="false"
            v-if="layout"
          />
        </v-form>
      </template>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('buttonCancel')" @click="hide" />
        <v-btn :text="$t('buttonImport')" @click="save" :disabled="!canContinue" color="primary" variant="tonal" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import BrapiConfig from '@/components/util/BrapiConfig.vue'
  import BrapiStudySelect from '@/components/util/BrapiStudySelect.vue'
  import { brapiDefaultCatchHandler, brapiGetObservationUnits } from '@/plugins/brapi'
  import type { Study } from '@/plugins/types/brapi'
  import type { TrialPlus, BrapiImportCell } from '@/plugins/types/client'
  import { CellCategory, DisplayOrder, type Cell, type Layout } from '@/plugins/types/gridscore'
  import { getColumnIndex, getRowIndex, isNumber } from '@/plugins/util'
  import { mdiAlertCircle, mdiCloudDownload } from '@mdi/js'

  import emitter from 'tiny-emitter/instance'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  const trial = defineModel<TrialPlus>()
  const dialog = ref(false)
  const layout = ref<Layout>()
  const study = ref<Study>()
  const layoutType = ref<'grid' | 'list'>('grid')
  const errors = ref<string[]>([])
  const cells = ref<BrapiImportCell[]>([])

  const canContinue = computed(() => study.value !== undefined && trial.value !== undefined && cells.value.length > 0)

  const brapiStudySelect = useTemplateRef('brapiStudySelect')

  function pullData () {
    errors.value = []
    layout.value = undefined
    emitter.emit('show-loading', true)

    if (study.value) {
      brapiGetObservationUnits(study.value.studyDbId)
        .then(result => {
          const rows = new Set<number>()
          const columns = new Set<number>()
          cells.value = []

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
                cells.value.push({
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

          if (rows.size > 0 && columns.size > 0 && cells.value.length > 0) {
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

  function getPrograms () {
    brapiStudySelect.value?.updatePrograms()
  }

  function show () {
    dialog.value = true
  }
  function hide () {
    dialog.value = false
  }
  function save () {
    const ll = layout.value
    if (trial.value && study.value && ll) {
      trial.value.name = study.value.studyName
      trial.value.description = study.value.studyDescription
      trial.value.layout = JSON.parse(JSON.stringify(ll))

      const data: { [index: string]: Cell } = {}

      cells.value.forEach(c => {
        const row = getRowIndex(ll, c.row)
        const column = getColumnIndex(ll, c.column)
        data[`${row}|${column}`] = {
          germplasm: c.germplasm,
          categories: c.categories || [],
          rep: c.rep,
          isMarked: false,
          brapiId: c.brapiId,
          measurements: {},
          comments: [],
        }
      })

      trial.value.data = data

      hide()
    }
  }

  defineExpose({
    show,
    hide,
  })
</script>
