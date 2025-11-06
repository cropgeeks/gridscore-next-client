<template>
  <v-card class="trial-selector" :loading="loading" :disabled="loading" v-if="trials === undefined || trials.length > 0">
    <template #loader="{ isActive }">
      <v-progress-linear :active="isActive" color="primary" height="4" indeterminate />
    </template>
    <v-toolbar class="d-flex justify-space-between">
      <v-toolbar-title class="flex-unset ms-4 my-3" :text="$t('widgetTrialSelectorTitle')" />

      <div>
        <v-text-field
          v-model="searchTerm"
          type="search"
          class="ma-2"
          autocomplete="off"
          width="min(50vw, 250px)"
          :prepend-inner-icon="mdiMagnify"
          :placeholder="$t('formLabelTrialSelectorSearch')"
          clearable
          hide-details
          density="compact"
        />
      </div>

      <div class="me-3 d-flex align-center">
        <v-btn :disabled="loading" v-tooltip:top="$t('tooltipTrialSelectorRefresh')" :icon="mdiUpdate" @click="update" />
        <v-menu>
          <template #activator="{ props }">
            <v-btn v-bind="props" :icon="trialDisplayMode === TrialListType.GRID ? mdiViewGrid : mdiViewSequential" v-tooltip:top="$t('tooltipTrialSelectorArrangement')" />
          </template>
          <v-list slim v-model="trialDisplayMode">
            <v-list-item :prepend-icon="mdiViewGrid" :title="$t('tooltipTrialSelectorArrangementGrid')" @click="trialDisplayMode = TrialListType.GRID" :append-icon="trialDisplayMode === TrialListType.GRID ? mdiCheck : undefined" />
            <v-list-item :prepend-icon="mdiViewSequential" :title="$t('tooltipTrialSelectorArrangementList')" @click="trialDisplayMode = TrialListType.LIST" :append-icon="trialDisplayMode === TrialListType.LIST ? mdiCheck : undefined" />
          </v-list>
        </v-menu>
        <v-menu :close-on-content-click="false">
          <template #activator="{ props }">
            <v-btn v-bind="props" :icon="mdiSort" v-tooltip:top="$t('formLabelTrialSelectorOrderBy')" />
          </template>
          <v-sheet class="pa-3">
            <v-select v-model="sortField" :items="sortOptions" class="mb-3" :label="$t('formLabelTrialSelectorOrderBy')" persistent-hint :hint="$t('formDescriptionTrialSelectorOrderBy')" />

            <v-btn-toggle v-model="sortDescending" variant="tonal" color="primary" class="d-flex">
              <v-btn class="flex-grow-1" :prepend-icon="mdiSortAscending" :value="false" :text="$t('formCheckboxSortOrderAscending')">
                <template #append><v-icon :icon="mdiCheck" v-if="sortDescending === false" /></template>
              </v-btn>
              <v-btn class="flex-grow-1" :value="true" :text="$t('formCheckboxSortOrderDescending')">
                <template #prepend><v-icon :icon="mdiSortDescending" style="transform: scaleY(-1);" /></template>
                <template #append><v-icon :icon="mdiCheck" v-if="sortDescending === true" /></template>
              </v-btn>
            </v-btn-toggle>
          </v-sheet>
        </v-menu>
        <v-btn v-tooltip:top="$t('tooltipTrialSelectorMultiSelect')" :icon="selectionEnabled ? mdiCheckboxMultipleMarked : mdiCheckboxMultipleBlankOutline" @click="selectionEnabled = !selectionEnabled" v-if="selectedTrials.length === 0" />
        <v-menu v-else>
          <template #activator="{ props }">
            <v-badge class="pe-none" location="top left" color="primary" offset-y="10" offset-x="10" :content="getNumberWithSuffix(selectedTrials.length, 1)">
              <v-btn v-bind="props" :icon="selectionEnabled ? mdiCheckboxMultipleMarked : mdiCheckboxMultipleBlankOutline" />
            </v-badge>
          </template>
          <v-list slim>
            <v-list-item :prepend-icon="mdiCheckboxBlankOffOutline" :title="$t('buttonCancelSelection')" @click="selectionEnabled = false" />
            <v-divider />
            <v-list-item :prepend-icon="mdiTagPlus" :title="$t('buttonAddTrait')" :disabled="editableSelectedTrials.length === 0" @click="addTrait()" />
            <v-divider />
            <v-list-item :prepend-icon="mdiDelete" :title="$t('buttonDelete')" base-color="error" @click="deleteSelectedTrials" />
          </v-list>
        </v-menu>
      </div>
    </v-toolbar>

    <v-card-text>
      <p>{{ $t('widgetTrialSelectorText') }}</p>

      <v-chip-group mandatory column filter multiple variant="flat" color="primary" v-model="selectedGroups">
        <v-chip
          v-for="group in trialGroups"
          :key="`trial-groups-${group.name}`"
          label
          :text="group.name"
        >
          <template #append>
            <v-badge inline :content="getNumberWithSuffix(group.trialCount, 1)" />
          </template>
        </v-chip>
      </v-chip-group>

      <v-card class="my-2 trial-filter" :ripple="store.storePerformanceMode !== true" :append-icon="filterForWarning === 'remote' ? mdiCheck : undefined" :variant="filterForWarning === 'remote' ? 'elevated' : 'tonal'" color="warning" v-if="remoteUpdateCount > 0" :prepend-icon="mdiCloudDownload" @click="filterWarning('remote')">
        <template #title><span class="text-body-1">{{ $t('widgetTrialSelectorWarningUpdates', { count: remoteUpdateCount }) }}</span></template>
      </v-card>
      <v-card class="my-2 trial-filter" :ripple="store.storePerformanceMode !== true" :append-icon="filterForWarning === 'local' ? mdiCheck : undefined" :variant="filterForWarning === 'local' ? 'elevated' : 'tonal'" color="info" v-if="localUpdateCount > 0" :prepend-icon="mdiCloudUpload" @click="filterWarning('local')">
        <template #title><span class="text-body-1">{{ $t('widgetTrialSelectorWarningUpdatesLocal', { count: localUpdateCount }) }}</span></template>
      </v-card>
      <v-card class="my-2 trial-filter" :ripple="store.storePerformanceMode !== true" :append-icon="filterForWarning === 'expiry' ? mdiCheck : undefined" :variant="filterForWarning === 'expiry' ? 'elevated' : 'tonal'" color="error" v-if="expiryWarningCount > 0" :prepend-icon="mdiCalendarAlert" @click="filterWarning('expiry')">
        <template #title><span class="text-body-1">{{ $t('widgetTrialSelectorWarningExpiry', { count: expiryWarningCount }) }}</span></template>
      </v-card>
    </v-card-text>

    <v-card-text>
      <v-data-iterator
        v-model="selectedTrials"
        :search="searchTerm"
        return-object
        :items="visibleTrials"
        :page="page"
        item-value="localId"
        :items-per-page="perPage"
        :sort-by="sortBy"
        :custom-filter="filter"
      >
        <template #default="{ items, isSelected, toggleSelect }">
          <v-row>
            <v-col
              v-for="trial in items"
              :key="trial.raw.localId"
              cols="12"
              :sm="trialDisplayMode === TrialListType.LIST ? 12 : 6"
              :md="trialDisplayMode === TrialListType.LIST ? 12 : 4"
              :lg="trialDisplayMode === TrialListType.LIST ? 12 : 3"
              :xl="trialDisplayMode === TrialListType.LIST ? 12 : 2"
              class="d-flex"
            >
              <TrialCard
                :trial="trial.raw"
                :selected="isSelected(trial)"
                :selection-enabled="selectionEnabled"
                :horizontal="trialDisplayMode === TrialListType.LIST"
                @share="shareTrial(trial.raw)"
                @delete="deleteTrialLocal(trial.raw)"
                @load="loadTrial(trial.raw)"
                @add-trait="addTrait(trial.raw)"
                @add-person="addPerson(trial.raw)"
                @add-metadata="addMetadata(trial.raw)"
                @add-data="addData(trial.raw)"
                @duplicate="router.push(`/setup/${trial.raw.localId}/clone`)"
                @edit="router.push(`/setup/${trial.raw.localId}/edit`)"
                @toggle-select="toggleSelect(trial)"
              />
            </v-col>
          </v-row>
        </template>

        <template #footer="{ pageCount }">
          <v-pagination v-model="page" :length="pageCount" />
        </template>
      </v-data-iterator>
    </v-card-text>

    <TrialShareModal :trial="selectedTrial" ref="trialShareModal" v-if="selectedTrial" />
    <AddTraitModal ref="addTraitModal" v-if="selectedTrial || selectedTrials.length > 0" @traits-added="addTraitsToSelectedTrials" />
    <AddPersonModal ref="addPersonModal" v-if="selectedTrial || selectedTrials.length > 0" @person-added="addPersonToSelectedTrials" />
    <UpdateTrialMetadataModal :trial="selectedTrial" ref="updateTrialMetadataModal" v-if="selectedTrial" />
    <UpdateTrialDataModal :trial="selectedTrial" ref="updateTrialDataModal" v-if="selectedTrial" />
  </v-card>
</template>

<script setup lang="ts">
  import { addTrialPeople, addTrialTraits, deleteTrial, getTrials } from '@/plugins/idb'
  import { TrialListType, type TraitPlus, type TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'
  import TrialCard from '@/components/trial/TrialCard.vue'
  import TrialShareModal from '@/components/modals/TrialShareModal.vue'

  import emitter from 'tiny-emitter/instance'
  import type { SortItem } from 'vuetify/lib/components/VDataTable/composables/sort.mjs'
  import { useI18n } from 'vue-i18n'
  import { getNumberWithSuffix } from '@/plugins/formatting'
  import type { FilterMatch, InternalItem } from 'vuetify'
  import { postCheckUpdate } from '@/plugins/api'
  import type { Person, TrialUpdateCheck } from '@/plugins/types/gridscore'
  import AddTraitModal from '@/components/modals/AddTraitModal.vue'
  import { mdiCalendarAlert, mdiCheck, mdiCheckboxBlankOffOutline, mdiCheckboxMultipleBlankOutline, mdiCheckboxMultipleMarked, mdiCloudDownload, mdiCloudUpload, mdiDelete, mdiMagnify, mdiSort, mdiSortAscending, mdiSortDescending, mdiTagPlus, mdiUpdate, mdiViewGrid, mdiViewSequential } from '@mdi/js'
  import AddPersonModal from '@/components/modals/AddPersonModal.vue'
  import UpdateTrialMetadataModal from '@/components/modals/UpdateTrialMetadataModal.vue'
  import UpdateTrialDataModal from '@/components/modals/UpdateTrialDataModal.vue'

  interface TrialGroup {
    id: string
    name: string
    trialCount: number
    expiryWarningCount: number
    remoteUpdateCount: number
    localUpdateCount: number
  }

  const UNCATEGORIZED_TRIALS = '__UNCATEGORIZED__'

  const store = coreStore()
  const { t } = useI18n()
  const router = useRouter()

  const selectionEnabled = ref(false)
  const searchTerm = ref<string>()
  const perPage = ref(12)
  const trials = ref<TrialPlus[]>()
  const trialUpdates = ref<TrialUpdateCheck>({})
  const selectedTrials = ref<TrialPlus[]>([])
  const selectedTrial = ref<TrialPlus>()
  const page = ref(1)
  const selectedGroups = ref<number[]>([])
  const loading = ref(false)
  const sortField = ref('updatedOn')
  const sortDescending = ref(true)
  const trialDisplayMode = ref(store.storeTrialListArrangement)
  const trialShareModal = useTemplateRef('trialShareModal')
  const addTraitModal = useTemplateRef('addTraitModal')
  const addPersonModal = useTemplateRef('addPersonModal')
  const updateTrialMetadataModal = useTemplateRef('updateTrialMetadataModal')
  const updateTrialDataModal = useTemplateRef('updateTrialDataModal')

  const filterForWarning = ref<'local' | 'remote' | 'expiry'>()

  const editableSelectedTrials = computed(() => selectedTrials.value.filter(t => t.editable === true))

  watch(selectionEnabled, async () => {
    selectedTrials.value = []
  })

  const remoteUpdateCount = computed(() => (visibleTrials.value || []).map(t => t.hasRemoteUpdate ? 1 : 0).reduce((a: number, b: number) => a + b, 0))
  const localUpdateCount = computed(() => (visibleTrials.value || []).map(t => t.hasLocalUpdate ? 1 : 0).reduce((a: number, b: number) => a + b, 0))
  const expiryWarningCount = computed(() => (visibleTrials.value || []).map(t => t.showExpiryWarning ? 1 : 0).reduce((a: number, b: number) => a + b, 0))

  const sortBy: ComputedRef<SortItem[]> = computed(() => {
    return [{
      key: sortField.value,
      order: sortDescending.value ? 'desc' : 'asc',
    }]
  })

  const sortOptions = computed(() => {
    return [{
      title: t('formSelectOptionTrialSortLastUpdate'),
      value: 'updatedOn',
    }, {
      title: t('formSelectOptionTrialSortName'),
      value: 'name',
    }]
  })

  const visibleTrials = computed(() => {
    const selectedGroupsNames = new Set(selectedGroups.value.map(gi => trialGroups.value[gi]?.id))
    const hasUngrouped = selectedGroupsNames.has(UNCATEGORIZED_TRIALS)
    return (trials.value || []).filter(t => {
      let result = true
      if (filterForWarning.value) {
        switch (filterForWarning.value) {
          case 'local':
            result &&= (t.hasLocalUpdate || false)
            break
          case 'remote':
            result &&= (t.hasRemoteUpdate || false)
            break
          case 'expiry':
            result &&= (t.showExpiryWarning || false)
            break
        }
      }
      if (t.group && t.group.name) {
        result &&= selectedGroupsNames.has(t.group.name)
      } else {
        result &&= hasUngrouped
      }

      return result
    })
  })

  const trialGroups: ComputedRef<TrialGroup[]> = computed(() => {
    if (trials.value) {
      const result: { [index: string]: TrialGroup } = {}
      result[UNCATEGORIZED_TRIALS] = {
        id: UNCATEGORIZED_TRIALS,
        name: t('tabTitleUncategorizedTrials'),
        trialCount: 0,
        expiryWarningCount: 0,
        remoteUpdateCount: 0,
        localUpdateCount: 0,
      }

      trials.value.forEach(t => {
        let g = result[UNCATEGORIZED_TRIALS]
        if (t.group && t.group.name) {
          g = result[t.group.name]

          if (!g) {
            g = {
              id: t.group.name,
              name: t.group.name,
              trialCount: 0,
              expiryWarningCount: 0,
              remoteUpdateCount: 0,
              localUpdateCount: 0,
            }
          }

          result[t.group.name] = g
        }

        if (g) {
          g.trialCount++
          g.remoteUpdateCount += t.hasRemoteUpdate ? 1 : 0
          g.localUpdateCount += t.hasLocalUpdate ? 1 : 0
          g.expiryWarningCount += t.showExpiryWarning ? 1 : 0
        }
      })

      if (result[UNCATEGORIZED_TRIALS].trialCount === 0) {
        delete result[UNCATEGORIZED_TRIALS]
      }

      return Object.values(result)
    } else {
      return []
    }
  })

  function filterWarning (type: 'local' | 'remote' | 'expiry') {
    if (filterForWarning.value === type) {
      filterForWarning.value = undefined
    } else {
      filterForWarning.value = type
    }
  }

  function addMetadata (trial: TrialPlus) {
    selectedTrial.value = trial

    nextTick(() => updateTrialMetadataModal.value?.show())
  }

  function addData (trial: TrialPlus) {
    selectedTrial.value = trial

    nextTick(() => updateTrialDataModal.value?.show())
  }

  function addPersonToSelectedTrials (person: Person) {
    let trials: TrialPlus[] = []
    if (selectionEnabled.value) {
      trials = selectedTrials.value
    } else if (selectedTrial.value) {
      trials = [selectedTrial.value]
    }

    Promise.all(trials.map(t => addTrialPeople(t.localId || '', [person])))
      .then(() => {
        emitter.emit('trials-updated')
        emitter.emit('plausible-event', { key: 'person-added' })

        if (store.storeSelectedTrial && trials.map(t => t.localId || '').includes(store.storeSelectedTrial)) {
          store.setSelectedTrialPerson(undefined)
        }
      })
  }

  function addTraitsToSelectedTrials (traits: TraitPlus[]) {
    let trials: TrialPlus[] = []
    if (selectionEnabled.value) {
      trials = selectedTrials.value
    } else if (selectedTrial.value) {
      trials = [selectedTrial.value]
    }

    Promise.all(trials.map(t => addTrialTraits(t.localId || '', traits)))
      .then(() => {
        emitter.emit('trials-updated')
        emitter.emit('plausible-event', { key: 'traits-added', props: { count: traits.length } })
      })
  }

  function addTrait (trial?: TrialPlus) {
    selectedTrial.value = trial

    nextTick(() => addTraitModal.value?.show())
    nextTick(() => addTraitModal.value?.show())
  }

  function addPerson (trial?: TrialPlus) {
    selectedTrial.value = trial

    nextTick(() => addPersonModal.value?.show())
  }

  function shareTrial (trial: TrialPlus) {
    selectedTrial.value = trial

    nextTick(() => trialShareModal.value?.show())
  }

  async function loadTrial (trial: TrialPlus) {
    await store.setSelectedTrial(trial.localId)

    router.push('/collect/grid')
  }

  function deleteSelectedTrials () {
    emitter.emit('show-confirm', {
      title: t('modalTitleDeleteTrials'),
      message: t('modalTextDeleteTrials'),
      okTitle: t('buttonYes'),
      cancelTitle: t('buttonNo'),
      okVariant: 'error',
      callback: (result: boolean) => {
        if (result) {
          store.setSelectedTrial(undefined)

          Promise.all(selectedTrials.value.map(t => deleteTrial(t.localId || '')))
            .then(() => update())
        }
      },
    })
  }

  function deleteTrialLocal (trial: TrialPlus) {
    emitter.emit('show-confirm', {
      title: t('modalTitleDeleteTrial'),
      message: t('modalTextDeleteTrial'),
      okTitle: t('genericYes'),
      cancelTitle: t('genericNo'),
      okVariant: 'error',
      callback: (result: boolean) => {
        if (result === true) {
          store.setSelectedTrial(undefined)
          deleteTrial(trial.localId || '').then(() => {
            update()
          })

          emitter.emit('plausible-event', { key: 'trial-deleted' })
        }
      },
    })
  }

  function filter (value: string, query: string, item?: InternalItem<TrialPlus>): FilterMatch {
    const trimmed = query.trim()
    if (item && trimmed !== '') {
      const lower = trimmed.toLowerCase()
      const t = item.raw
      // Check if the name matches
      if (t.name.toLowerCase().includes(lower)) {
        return true
      }
      // Check if the description matches
      if (t.description && t.description.toLowerCase().includes(lower)) {
        return true
      }
      // Check if any of the trait names matches
      if (t.traits.map(t => t.name).join('|').toLowerCase().includes(lower)) {
        return true
      }
      // Check if it matches any of the share codes
      if (t.shareCodes) {
        if (t.shareCodes.viewerCode === trimmed) {
          return true
        }
        if (t.shareCodes.editorCode === trimmed) {
          return true
        }
        if (t.shareCodes.ownerCode === trimmed) {
          return true
        }
      }

      return false
    } else {
      return true
    }
  }

  function update () {
    loading.value = true
    selectedTrials.value = []
    // selectedTrial.value = undefined
    selectionEnabled.value = false
    filterForWarning.value = undefined

    getTrials(true)
      .then(result => {
        trials.value = result
        loading.value = false

        return postCheckUpdate()
      })
      .then(result => {
        trialUpdates.value = result

        trials.value?.forEach(t => {
          t.hasRemoteUpdate = false
          t.showExpiryWarning = false
          t.hasLocalUpdate = t.shareCodes && t.transactionCount !== undefined && t.transactionCount > 0

          if (t.shareCodes && trialUpdates.value) {
            const shareCode = t.shareCodes.ownerCode || t.shareCodes.editorCode || t.shareCodes.viewerCode
            const timestamp = trialUpdates.value[shareCode]

            if (timestamp !== undefined && timestamp !== null && timestamp.updatedOn !== undefined && timestamp.updatedOn !== null && t.updatedOn !== undefined) {
              t.hasRemoteUpdate = timestamp.updatedOn > t.updatedOn
            } else {
              t.hasRemoteUpdate = false
            }

            if (timestamp !== undefined && timestamp !== null && timestamp.showExpiryWarning !== undefined && timestamp.showExpiryWarning !== null) {
              t.showExpiryWarning = timestamp.showExpiryWarning || false
              t.expiresOn = timestamp.expiresOn
            } else {
              t.showExpiryWarning = false
            }
          }
        })
      })
      .finally(() => {
        loading.value = false
      })
  }

  watch(trialGroups, async newValue => {
    selectedGroups.value = newValue.map((g, index) => index)
  })
  watch(trialDisplayMode, async newValue => {
    store.setTrialListArrangement(newValue)
  })

  onMounted(() => {
    emitter.on('trial-properties-changed', update)
    emitter.on('trial-information-updated', update)
    emitter.on('trials-updated', update)
    update()
  })
  onBeforeUnmount(() => {
    emitter.off('trial-properties-changed', update)
    emitter.off('trial-information-updated', update)
    emitter.off('trials-updated', update)
  })
</script>

<style>
.trial-selector .v-toolbar__content {
  height: auto !important;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}
</style>

<style scoped>
.trial-filter:hover {
  cursor: pointer;
}
</style>
