<template>
  <div>
    <BrapiConfig :trial="trial" @brapi-config-updated="triggerTrialReload" />

    <v-row class="mt-5">
      <v-col cols="12" lg="6" v-if="germplasmWithBrapiDbIds">
        <v-card :title="$t('pageBrapiExportBrapiGermplasmIdTitle')" :loading="germplasmLoading">
          <template #loader="{ isActive }">
            <v-progress-linear :active="isActive" color="primary" height="3" indeterminate />
          </template>
          <template #text>
            <p :class="allGermplasmValidDbId ? 'text-success' : 'text-error'">{{ $t('pageBrapiExportBrapiGermplasmIdText', { count: germplasmWithBrapiDbIds.count, total: germplasmWithBrapiDbIds.total }) }}</p>
          </template>
          <template #actions>
            <v-btn variant="tonal" :color="allGermplasmValidDbId ? undefined : 'primary'" :disabled="!validBrapiUrl || germplasmLoading || allGermplasmValidDbId" @click="searchBrapiGermplasmMatches" :prepend-icon="mdiMagnify" :text="$t('buttonUpdate')" />
          </template>
        </v-card>
      </v-col>
      <v-col cols="12" lg="6" v-if="traitsWithBrapiDbIds">
        <v-card :title="$t('pageBrapiExportBrapiTraitIdTitle')" :loading="traitsLoading">
          <template #loader="{ isActive }">
            <v-progress-linear :active="isActive" color="primary" height="3" indeterminate />
          </template>
          <template #text>
            <p :class="allTraitsValidDbId ? 'text-success' : 'text-error'">{{ $t('pageBrapiExportBrapiTraitIdText', { count: traitsWithBrapiDbIds.count, total: traitsWithBrapiDbIds.total }) }}</p>
          </template>
          <template #actions>
            <v-btn variant="tonal" :color="allTraitsValidDbId ? undefined : 'primary'" :disabled="!validBrapiUrl || traitsLoading || allTraitsValidDbId" @click="searchBrapiTraitMatches" :prepend-icon="mdiMagnify" :text="$t('buttonUpdate')" />
            <template v-if="traitLookupRanAtLeastOnce && !allTraitsValidDbId">
              <v-spacer />
              <v-btn variant="tonal" color="primary" @click="writeTraitsWithoutBrapiId" :prepend-icon="mdiCloudPlus" :text="$t('buttonUpload')" />
            </template>
          </template>
        </v-card>
      </v-col>
    </v-row>

    <BrapiStudySelect
      class="mt-3"
      v-model:program="brapiProgram"
      v-model:trial="brapiTrial"
      v-model:study="brapiStudy"
      ref="brapiStudySelect"
      v-if="allGermplasmValidDbId && allTraitsValidDbId"
    />

    <template v-if="showForcePlotCreation">
      <v-alert
        :color="forcePlotCreation === false ? 'error' : 'success'"
        :icon="mdiViewGridPlus"
        density="compact"
        variant="tonal"
        border="start"
      >
        <template #prepend>
          <v-icon :icon="mdiViewGridPlus" class="mdi-rotate-315" />
        </template>
        <template #text>
          <div>{{ $t('errorMessageBrapiExportMissingPlots') }}</div>
          <v-checkbox v-model="forcePlotCreation" hide-details :label="$t('formLabelBrapiExportForcePlotCreation')" />
        </template>
      </v-alert>
    </template>

    <v-btn class="mt-5" :prepend-icon="mdiCloudUpload" color="primary" :text="$t('buttonSendData')" :disabled="!canProceed || brapiCallLoading" @click="sendData" />
  </div>
</template>

<script setup lang="ts">
  import BrapiConfig from '@/components/util/BrapiConfig.vue'
  import { brapiDefaultCatchHandler, brapiPostGermplasmSearch, brapiPostObservationData, brapiPostObservationVariables, brapiPostObservationVariableSearch } from '@/plugins/brapi'
  import { getTrialDataCached } from '@/plugins/datastore'
  import { updateGermplasmBrapiIds, updateTraitBrapiIds } from '@/plugins/idb'
  import type { Program, Study, Trial, ObservationVariable, Scale } from '@/plugins/types/brapi'
  import type { CellPlus, TrialPlus } from '@/plugins/types/client'
  import { TraitDataType } from '@/plugins/types/gridscore'
  import { mdiCloudPlus, mdiCloudUpload, mdiMagnify, mdiViewGridPlus } from '@mdi/js'
  import { AxiosError } from 'axios'

  import emitter from 'tiny-emitter/instance'
  import { useI18n } from 'vue-i18n'

  const compProps = defineProps<{
    trial: TrialPlus
  }>()

  interface Counts {
    count: number
    total: number
    itemsWithoutId: string[]
  }

  const brapiStudySelect = useTemplateRef('brapiStudySelect')

  const { t } = useI18n()
  const emit = defineEmits(['trigger-reload-trial'])

  const germplasmWithBrapiDbIds = ref<Counts>()
  const germplasmLoading = ref(false)
  const traitsWithBrapiDbIds = ref<Counts>()
  const traitsLoading = ref(false)
  const traitLookupRanAtLeastOnce = ref(false)

  const brapiCallLoading = ref(false)
  const brapiProgram = ref<Program>()
  const brapiTrial = ref<Trial>()
  const brapiStudy = ref<Study>()

  const showForcePlotCreation = ref(false)
  const forcePlotCreation = ref(false)

  let trialData: { [index: string]: CellPlus } | undefined

  const allGermplasmValidDbId = computed(() => germplasmWithBrapiDbIds.value !== undefined && germplasmWithBrapiDbIds.value.count === germplasmWithBrapiDbIds.value.total)
  const allTraitsValidDbId = computed(() => traitsWithBrapiDbIds.value !== undefined && traitsWithBrapiDbIds.value.count === traitsWithBrapiDbIds.value.total)

  const validBrapiUrl = computed(() => compProps.trial && compProps.trial.brapiConfig && compProps.trial.brapiConfig.url)

  const canProceed = computed(() => {
    return brapiProgram.value && brapiTrial.value && brapiStudy.value && allGermplasmValidDbId.value && allTraitsValidDbId.value && (!showForcePlotCreation.value || forcePlotCreation.value)
  })

  function updateBrapiGermplasmDbIdCounts () {
    const trialData = getTrialDataCached()
    if (!trialData) {
      germplasmWithBrapiDbIds.value = {
        count: 0,
        total: 0,
        itemsWithoutId: [],
      }
    } else {
      let count = 0
      let total = 0
      const itemsWithoutId = []
      // For each field row
      for (let y = 0; y < compProps.trial.layout.rows; y++) {
        // And each field column
        for (let x = 0; x < compProps.trial.layout.columns; x++) {
          // Get the data cell
          const cell = trialData[`${y}|${x}`]
          // If there is data
          if (cell) {
            total++

            if (cell.brapiId) {
              count++
            } else {
              itemsWithoutId.push(cell.germplasm)
            }
          }
        }
      }

      germplasmWithBrapiDbIds.value = {
        count,
        total,
        itemsWithoutId,
      }
    }
  }

  function updateBrapiTraitDbIdCounts () {
    let count = 0
    const total = compProps.trial.traits.length
    const itemsWithoutId: string[] = []

    compProps.trial.traits.forEach(t => {
      if (t.brapiId !== undefined && t.brapiId !== null) {
        count++
      } else {
        itemsWithoutId.push(t.name)
      }
    })

    traitsWithBrapiDbIds.value = {
      count,
      total,
      itemsWithoutId,
    }
  }

  function sendData () {
    if (brapiProgram.value && brapiTrial.value && brapiStudy.value) {
      brapiCallLoading.value = true
      brapiPostObservationData(compProps.trial, brapiProgram.value, brapiTrial.value, brapiStudy.value, forcePlotCreation.value)
        .catch(e => {
          if (e instanceof AxiosError && e.code === '406') {
            showForcePlotCreation.value = true
          }
          emitter.emit('show-loading', false)
          brapiCallLoading.value = false
        })
        .finally(() => {
          emitter.emit('show-loading', false)
          brapiCallLoading.value = false
          showForcePlotCreation.value = false

          emitter.emit('show-snackbar', {
            text: t('toastTextBrapiSendDataSuccessful'),
            color: 'success',
          })
        })
    }
  }

  function searchBrapiTraitMatches () {
    traitsLoading.value = true

    brapiPostObservationVariableSearch({
      observationVariableNames: traitsWithBrapiDbIds.value?.itemsWithoutId,
    }).then(result => {
      traitLookupRanAtLeastOnce.value = true
      const map = new Map<string, ObservationVariable[]>()
      if (result) {
        result.forEach(g => {
          const lower = g.observationVariableName?.toLowerCase() || ''
          let match = map.get(lower)
          if (!match) {
            match = []
          }

          match.push(g)

          map.set(lower, match)
        })

        updateBrapiTraitDbIdsInDatabase(map)
      }
    }).catch(brapiDefaultCatchHandler).finally(() => {
      traitsLoading.value = false
    })
  }

  function updateBrapiTraitDbIdsInDatabase (map: Map<string, ObservationVariable[]>) {
    traitsLoading.value = true

    const mapping: { [index: string]: string } = {}

    compProps.trial.traits.forEach(t => {
      const brapiMatches = map.get(t.name.toLowerCase())

      if (brapiMatches && brapiMatches.length > 0) {
        brapiMatches.forEach(brapiMatch => {
          if (brapiMatch && brapiMatch.scale) {
            // Check data type
            let matches = false
            switch (brapiMatch.scale.dataType) {
              case 'Date':
                matches = t.dataType === TraitDataType.date
                break
              case 'Text':
                matches = t.dataType === TraitDataType.text
                break
              case 'Numeric':
              case 'Numerical':
                matches = TraitDataType.isNumeric(t.dataType)
                break
              case 'Duration':
                matches = t.dataType === TraitDataType.int
                break
              case 'Nominal':
              case 'Ordinal':
                matches = t.dataType === TraitDataType.categorical
                break
            }

            if (matches) {
              t.brapiId = brapiMatch.observationVariableDbId
              mapping[t.id || ''] = brapiMatch.observationVariableDbId || ''
            }
          }
        })
      }
    })

    if (Object.keys(mapping).length > 0) {
      updateTraitBrapiIds(compProps.trial.localId || '', mapping)
        .then(() => emitter.emit('trial-selected'))
    }

    traitsLoading.value = false
  }

  function writeTraitsWithoutBrapiId () {
    traitsLoading.value = true
    const twbdi = traitsWithBrapiDbIds.value

    if (twbdi && twbdi.itemsWithoutId && twbdi.itemsWithoutId.length > 0) {
      const newTraits = compProps.trial.traits.concat().filter(t => twbdi.itemsWithoutId.includes(t.name)).map(t => {
        const newObsv: ObservationVariable = {
          observationVariableName: t.name,
          trait: {
            traitName: t.name,
            traitClass: t.group ? t.group.name : undefined,
          },
        }

        const scale: Scale = {
          dataType: undefined,
          validValues: undefined,
        }

        switch (t.dataType) {
          case TraitDataType.date:
            scale.dataType = 'Date'
            break
          case TraitDataType.float:
          case TraitDataType.int:
          case TraitDataType.range:
            scale.dataType = 'Numerical'
            break
          case TraitDataType.categorical:
            scale.dataType = 'Ordinal'
            break
          default:
            scale.dataType = 'Text'
        }

        if (t.restrictions) {
          scale.validValues = {}
          if (t.restrictions.min !== undefined && t.restrictions.min !== null) {
            scale.validValues.minimumValue = `${t.restrictions.min}`
          }
          if (t.restrictions.max !== undefined && t.restrictions.max !== null) {
            scale.validValues.maximumValue = `${t.restrictions.max}`
          }
          if (t.restrictions.categories && t.restrictions.categories.length > 0) {
            scale.validValues.categories = t.restrictions.categories.map(c => {
              return {
                label: c,
                value: c,
              }
            })
          }
        }

        newObsv.scale = scale

        return newObsv
      })

      brapiPostObservationVariables(newTraits)
        .then(() => searchBrapiTraitMatches())
        .catch(brapiDefaultCatchHandler)
        .finally(() => {
          traitsLoading.value = false
        })
    }
  }

  function searchBrapiGermplasmMatches () {
    germplasmLoading.value = true
    brapiPostGermplasmSearch({
      germplasmNames: germplasmWithBrapiDbIds.value?.itemsWithoutId,
    }).then(result => {
      const map = new Map<string, string>()
      if (result) {
        result.forEach(g => {
          map.set(g.germplasmName.toLowerCase(), g.germplasmDbId)
        })

        updateBrapiGermplasmDbIdsInDatabase(map)
      }
    }).catch(brapiDefaultCatchHandler).finally(() => {
      germplasmLoading.value = false
    })

    brapiPostGermplasmSearch({
      accessionNumbers: germplasmWithBrapiDbIds.value?.itemsWithoutId,
    }).then(result => {
      const map = new Map<string, string>()
      if (result) {
        result.forEach(g => {
          map.set(g.accessionNumber.toLowerCase(), g.germplasmDbId)
        })

        updateBrapiGermplasmDbIdsInDatabase(map)
      }
    }).catch(brapiDefaultCatchHandler).finally(() => {
      germplasmLoading.value = false
    })
  }

  function updateBrapiGermplasmDbIdsInDatabase (map: Map<string, string>) {
    if (trialData) {
      germplasmLoading.value = true

      const mapping: { [index: string]: string } = {}
      // For each field row
      for (let y = 0; y < compProps.trial.layout.rows; y++) {
        // And each field column
        for (let x = 0; x < compProps.trial.layout.columns; x++) {
          // Get the data cell
          const cell = trialData[`${y}|${x}`]
          // If there is data
          if (cell) {
            const id = map.get(cell.germplasm.toLowerCase())

            if (id !== undefined && id !== null) {
              mapping[`${y}|${x}`] = id
            }
          }
        }
      }

      // Store the data in the database
      if (Object.keys(mapping).length > 0) {
        updateGermplasmBrapiIds(compProps.trial.localId || '', mapping)
          .then(() => emitter.emit('trial-selected'))
      }

      germplasmLoading.value = false
    }
  }

  function triggerTrialReload () {
    emit('trigger-reload-trial')

    brapiStudySelect.value?.updatePrograms()
  }

  function update () {
    updateBrapiGermplasmDbIdCounts()
    updateBrapiTraitDbIdCounts()
  }

  watch(() => compProps.trial, async () => update())

  watch(showForcePlotCreation, async newValue => {
    if (newValue === true) {
      forcePlotCreation.value = false
    }
  })

  onMounted(() => {
    trialData = getTrialDataCached()

    update()

    emitter.on('trial-data-loaded', update)
  })

  onBeforeUnmount(() => {
    emitter.off('trial-data-loaded', update)
  })
</script>
