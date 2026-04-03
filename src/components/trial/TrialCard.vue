<template>
  <v-card :variant="isSelected ? 'outlined' : undefined" class="d-flex flex-column flex-grow-1">
    <template #title>
      <span v-tooltip:top="trial.name">{{ trial.name }}</span>
    </template>
    <template #prepend>
      <slot name="prepend">
        <v-btn v-tooltip:top="$t(shareStatusConfig?.text || '')" :color="getThemeColor(shareStatusConfig?.colorIndex || 0)" :icon="shareStatusConfig?.icon" @click="emit('share')" :disabled="!canShare" />
      </slot>
    </template>
    <template #append v-if="trial.hasLocalUpdate || trial.hasRemoteUpdate">
      <v-btn v-if="trial.hasLocalUpdate" :icon="mdiCloudUpload" color="info" v-tooltip:bottom="$t('tooltipTrialHasTransactions')" @click="emitter.emit('synchronize-trial', trial)" />
      <v-btn v-else-if="trial.hasRemoteUpdate" :icon="mdiCloudDownload" color="warning" v-tooltip:bottom="$t('tooltipTrialHasRemoteUpdate')" @click="emitter.emit('synchronize-trial', trial)" />
    </template>
    <template #subtitle>
      <span class="text-wrap" v-if="wrapDescription" v-html="trial.description || '&nbsp;'" />
      <span v-tooltip:top="trial.description" v-html="trial.description || '&nbsp;'" v-else />
    </template>

    <v-card-text class="pb-0">
      <div class="d-flex flex-row flex-wrap ga-2">
        <v-chip v-if="trial.updatedOn" :prepend-icon="mdiCalendarEdit" variant="tonal" color="primary" label v-tooltip:bottom="new Date(trial.updatedOn).toLocaleString()" :text="formatTimeAgo(trial.updatedOn)" />
        <v-chip v-if="trial.isLocked" :prepend-icon="mdiLockAlert" variant="tonal" color="warning" label v-tooltip:bottom="$t('widgetDataInputLockedWarning')" :text="$t('widgetDataInputLockedChip')" />
        <v-chip v-if="trial.showExpiryWarning" :disabled="!interactive" :prepend-icon="mdiCalendarAlert" variant="tonal" color="error" label :text="$t('widgetTrialSelectorTrialExpiryWarning')" @click="emit('extend-lifetime')" />
        <slot name="chips" />
      </div>
    </v-card-text>

    <v-list variant="tonal" class="pb-0" slim v-if="horizontal" :disabled="!interactive">
      <v-row no-gutters>
        <template v-if="forceShowDetails || (store.storeTrialShowDetails !== false)">
          <v-col cols="12" sm="6" md="4" lg="3">
            <v-list-item :prepend-icon="mdiFolderTable" :title="trial.group?.name || $t('widgetTrialSelectorGroupUnassigned')" />
          </v-col>
          <v-col cols="12" sm="6" md="4" lg="3">
            <v-list-item :prepend-icon="mdiLandRowsHorizontal" :title="$t('widgetTrialSelectorRows', i18nParams)"><template #append><v-badge :content="getNumberWithSuffix(trial.layout.rows, 1)" inline /></template></v-list-item>
          </v-col>
          <v-col cols="12" sm="6" md="4" lg="3">
            <v-list-item :prepend-icon="mdiLandRowsVertical" :title="$t('widgetTrialSelectorColumns', i18nParams)"><template #append><v-badge :content="getNumberWithSuffix(trial.layout.columns, 1)" inline /></template></v-list-item>
          </v-col>
          <v-col cols="12" sm="6" md="4" lg="3">
            <v-list-item :prepend-icon="mdiTagMultiple" :title="$t('widgetTrialSelectorTraits')">
              <template #title="{ title }">{{ title }} <v-icon v-if="hasTimeframeTraits" @click="trialTimeFrameModal = true" v-tooltip:top="$t('widgetTrialSelectorTraitTimeframe')" :icon="mdiCalendarExpandHorizontal" class="ms-5" size="small" color="muted" /></template>
              <template #append><v-badge :content="getNumberWithSuffix(trial.traits.length, 1)" inline /></template>
            </v-list-item>
          </v-col>
          <v-col cols="12" sm="6" md="4" lg="3">
            <v-list-item :prepend-icon="mdiAccountMultiple" :title="$t('widgetTrialSelectorPeople')"><template #append><v-badge :content="getNumberWithSuffix((trial.people || []).length, 1)" inline /></template></v-list-item>
          </v-col>
          <v-col cols="12" sm="6" md="4" lg="3">
            <v-list-item :prepend-icon="mdiCommentMultiple" :title="$t('widgetTrialSelectorComments')" @click.prevent.stop="commentModal?.show()"><template #append><v-badge :content="getNumberWithSuffix((trial.comments || []).length, 1)" inline /></template></v-list-item>
          </v-col>
          <v-col cols="12" sm="6" md="4" lg="3">
            <v-list-item :prepend-icon="mdiFlagVariant" :title="$t('widgetTrialSelectorEvents')" @click.prevent.stop="eventModal?.show()"><template #append><v-badge :content="getNumberWithSuffix((trial.events || []).length, 1)" inline /></template></v-list-item>
          </v-col>
          <v-col cols="12" sm="6" md="4" lg="3">
            <v-list-item :prepend-icon="mdiCalendarRange" :title="$t('widgetTrialSelectorTrialDuration')"><template #append><v-badge :content="getNumberWithSuffix(trialDuration, 1)" inline /></template></v-list-item>
          </v-col>
        </template>
      </v-row>
    </v-list>
    <v-list variant="tonal" class="pb-0" slim :disabled="!interactive" v-else>
      <template v-if="forceShowDetails || (store.storeTrialShowDetails !== false)">
        <v-list-item :prepend-icon="mdiFolderTable" :title="trial.group?.name || $t('widgetTrialSelectorGroupUnassigned')" />
        <v-list-item :prepend-icon="mdiLandRowsHorizontal" :title="$t('widgetTrialSelectorRows', i18nParams)"><template #append><v-badge :content="getNumberWithSuffix(trial.layout.rows, 1)" inline /></template></v-list-item>
        <v-list-item :prepend-icon="mdiLandRowsVertical" :title="$t('widgetTrialSelectorColumns', i18nParams)"><template #append><v-badge :content="getNumberWithSuffix(trial.layout.columns, 1)" inline /></template></v-list-item>
        <v-list-item :prepend-icon="mdiTagMultiple" :title="$t('widgetTrialSelectorTraits')">
          <template #title="{ title }">{{ title }} <v-icon v-if="hasTimeframeTraits" @click="trialTimeFrameModal = true" v-tooltip:top="$t('widgetTrialSelectorTraitTimeframe')" :icon="mdiCalendarExpandHorizontal" class="ms-5" size="small" color="muted" /></template>
          <template #append><v-badge :content="getNumberWithSuffix(trial.traits.length, 1)" inline /></template>
        </v-list-item>
        <v-list-item :prepend-icon="mdiAccountMultiple" :title="$t('widgetTrialSelectorPeople')"><template #append><v-badge :content="getNumberWithSuffix((trial.people || []).length, 1)" inline /></template></v-list-item>
        <v-list-item :prepend-icon="mdiCommentMultiple" :title="$t('widgetTrialSelectorComments')" @click.prevent.stop="commentModal?.show()"><template #append><v-badge :content="getNumberWithSuffix((trial.comments || []).length, 1)" inline /></template></v-list-item>
        <v-list-item :prepend-icon="mdiFlagVariant" :title="$t('widgetTrialSelectorEvents')" @click.prevent.stop="eventModal?.show()"><template #append><v-badge :content="getNumberWithSuffix((trial.events || []).length, 1)" inline /></template></v-list-item>
        <v-list-item :prepend-icon="mdiCalendarRange" :title="$t('widgetTrialSelectorTrialDuration')"><template #append><v-badge :content="getNumberWithSuffix(trialDuration, 1)" inline /></template></v-list-item>
      </template>
    </v-list>

    <v-card-actions v-if="showActions">
      <slot name="actions">
        <div class="d-flex justify-space-between flex-grow-1 flex-wrap ga-2">
          <div>
            <v-btn variant="tonal" :color="selected ? 'info' : undefined" :text="$t(selected ? 'buttonDeselect' : 'buttonSelect')" :prepend-icon="selected ? mdiCheckboxMarked : mdiCheckboxBlankOutline" v-if="selectionEnabled" @click="emit('toggle-select')" />
            <template v-else>
              <v-btn variant="tonal" :append-icon="mdiMenuDown" v-if="horizontal === false" @click="menuShown = true"><v-icon :icon="mdiCog" /></v-btn>
              <v-menu v-else>
                <template #activator="{ props }">
                  <v-btn variant="tonal" :append-icon="mdiMenuDown" v-bind="props"><v-icon :icon="mdiCog" /></v-btn>
                </template>
                <TrialOptionsDropdown
                  :editable="trial.editable || false"
                  :is-owner="trial.shareStatus === ShareStatus.NOT_SHARED || trial.shareStatus === ShareStatus.OWNER"
                  :is-list-mode="trial.layout.columns === 1"
                  :is-locked="trial.isLocked"
                  :is-shared="trial.shareStatus !== ShareStatus.NOT_SHARED"
                  :can-synchronize="(trial.transactionCount && trial.transactionCount > 0) || trial.hasRemoteUpdate || false"
                  @delete="emit('delete')"
                  @edit="emit('edit')"
                  @lock="emit('lock')"
                  @synchronize="emit('synchronize')"
                  @duplicate="emit('duplicate')"
                  @add-trait="emit('add-trait')"
                  @add-trait-reference-image="emit('add-trait-reference-image')"
                  @add-person="emit('add-person')"
                  @add-germplasm="emit('add-germplasm')"
                  @add-data="emit('add-data')"
                  @add-metadata="emit('add-metadata')"
                  @share="emit('share')"
                  @print="print"
                />
              </v-menu>
            </template>
          </div>
          <v-btn :prepend-icon="isSelected ? mdiNotebookCheck : mdiNotebookEdit" :text="$t(isSelected ? 'buttonActive' : 'buttonSelect')" :color="isSelected ? 'primary' : 'info'" variant="tonal" @click="emit('load')" />
        </div>
      </slot>
    </v-card-actions>
    <v-expand-transition v-if="horizontal === false">
      <v-card :title="$t('widgetTrialSelectorMenuTitle')" v-if="menuShown" class="d-flex flex-column position-absolute w-100" height="100%" style="bottom: 0;">
        <TrialOptionsDropdown
          :editable="trial.editable || false"
          :is-owner="trial.shareStatus === ShareStatus.NOT_SHARED || trial.shareStatus === ShareStatus.OWNER"
          :is-list-mode="trial.layout.columns === 1"
          :is-locked="trial.isLocked"
          :is-shared="trial.shareStatus !== ShareStatus.NOT_SHARED"
          :can-synchronize="(trial.transactionCount && trial.transactionCount > 0) || trial.hasRemoteUpdate || false"
          @delete="emit('delete')"
          @edit="emit('edit')"
          @lock="emit('lock')"
          @synchronize="emit('synchronize')"
          @duplicate="emit('duplicate')"
          @add-trait="emit('add-trait')"
          @add-trait-reference-image="emit('add-trait-reference-image')"
          @add-person="emit('add-person')"
          @add-germplasm="emit('add-germplasm')"
          @add-data="emit('add-data')"
          @add-metadata="emit('add-metadata')"
          @share="emit('share')"
          @print="print"
          @close-menu="menuShown = false"
        />
        <template #actions>
          <v-btn variant="tonal" color="primary" :append-icon="mdiMenuUp" @click="menuShown = false"><v-icon :icon="mdiCog" /></v-btn>
        </template>
      </v-card>
    </v-expand-transition>

    <CommentModal
      type="trial"
      :comments="trial.comments || []"
      :editable="canEdit || false"
      @comment-added="addNewComment"
      @comment-deleted="deleteComment"
      ref="commentModal"
    />

    <EventModal
      :events="trial.events || []"
      :editable="canEdit || false"
      @event-added="addNewEvent"
      @event-deleted="deleteEvent"
      ref="eventModal"
    />

    <v-dialog v-model="trialPrintViewModal" fullscreen scrollable v-if="trialPrintViewModal">
      <v-card :title="$t('modalTitleTrialPrintView')">
        <template #text>
          <p>{{ $t('modalTextTrialPrintView') }}</p>
          <PrintCanvas :trial="trial" />
        </template>
        <template #actions>
          <v-spacer />
          <v-btn :text="$t('buttonClose')" color="primary" variant="tonal" @click="trialPrintViewModal = false" />
        </template>
      </v-card>
    </v-dialog>

    <v-dialog v-model="trialTimeFrameModal" max-width="min(90vw, 1024px)">
      <v-card :title="$t('modalTitleTraitTimeframe')">
        <template #text>
          <p>{{ $t('modalTextTraitTimeframe') }}</p>

          <TraitTimeframeChart
            :trial="compProps.trial"
          />
        </template>
        <template #actions>
          <v-spacer />
          <v-btn :text="$t('buttonClose')" color="primary" variant="tonal" @click="trialTimeFrameModal = false" />
        </template>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
  import { getI18nParams, getNumberWithSuffix } from '@/plugins/formatting'
  import { ShareStatus, type TrialPlus } from '@/plugins/types/client'
  import { shareStatusTypes } from '@/plugins/types/types'
  import { formatTimeAgo, getThemeColor, toLocalDateString } from '@/plugins/util'
  import { coreStore } from '@/stores/app'
  import TrialOptionsDropdown from '@/components/trial/TrialOptionsDropdown.vue'

  import emitter from 'tiny-emitter/instance'
  import { mdiAccountMultiple, mdiCalendarAlert, mdiCalendarEdit, mdiCalendarExpandHorizontal, mdiCalendarRange, mdiCheckboxBlankOutline, mdiCheckboxMarked, mdiCloudDownload, mdiCloudUpload, mdiCog, mdiCommentMultiple, mdiFlagVariant, mdiFolderTable, mdiLandRowsHorizontal, mdiLandRowsVertical, mdiLockAlert, mdiMenuDown, mdiMenuUp, mdiNotebookCheck, mdiNotebookEdit, mdiTagMultiple } from '@mdi/js'
  import CommentModal from '@/components/modals/CommentModal.vue'
  import { addTrialComment, addTrialEvent, deleteTrialComment, deleteTrialEvent } from '@/plugins/idb'
  import type { Comment, Event } from '@/plugins/types/gridscore'
  import EventModal from '@/components/modals/EventModal.vue'
  import PrintCanvas from '@/components/data/PrintCanvas.vue'

  const store = coreStore()

  const menuShown = ref(false)
  const trialTimeFrameModal = ref(false)
  const trialPrintViewModal = ref(false)

  export interface TrialCardProps {
    trial: TrialPlus
    selectionEnabled?: boolean
    selected?: boolean
    wrapDescription?: boolean
    showActions?: boolean
    interactive?: boolean
    canShare?: boolean
    horizontal?: boolean
    forceShowDetails?: boolean
  }

  const compProps = withDefaults(defineProps<TrialCardProps>(), {
    selectionEnabled: false,
    selected: false,
    wrapDescription: false,
    showActions: true,
    interactive: true,
    canShare: true,
    horizontal: false,
    forceShowDetails: false,
  })

  const emit = defineEmits(['lock', 'share', 'extend-lifetime', 'delete', 'edit', 'load', 'toggle-select', 'duplicate', 'synchronize', 'add-trait', 'add-person', 'add-data', 'add-metadata', 'add-germplasm', 'add-trait-reference-image'])
  const commentModal = useTemplateRef('commentModal')
  const eventModal = useTemplateRef('eventModal')

  const i18nParams = computed(() => getI18nParams(compProps.trial.dimensionNames))
  const canEdit = computed(() => compProps.trial.editable === true && compProps.trial.isLocked !== true)

  const hasTimeframeTraits = computed(() => compProps.trial?.traits.some(t => t.timeframe))

  const trialDuration = computed(() => {
    if (compProps.trial && compProps.trial.createdOn && compProps.trial.updatedOn) {
      const start = toLocalDateString(compProps.trial.createdOn)
      const end = toLocalDateString(compProps.trial.updatedOn)

      return (new Date(end).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000) + 1
    } else {
      return 1
    }
  })

  const shareStatusConfig = computed(() => {
    if (compProps.trial) {
      return shareStatusTypes[compProps.trial.shareStatus || ShareStatus.NOT_SHARED]
    } else {
      return shareStatusTypes[ShareStatus.NOT_SHARED]
    }
  })

  const isSelected = computed(() => {
    return compProps.trial && compProps.trial.localId === store.selectedTrial
  })

  function print () {
    trialPrintViewModal.value = true
  }

  function addNewEvent (event: Event) {
    addTrialEvent(compProps.trial.localId || '', event)
      .then(() => {
        emitter.emit('trial-properties-changed', compProps.trial.localId || '')
        emitter.emit('plausible-event', { key: 'trial-event', props: { type: 'added' } })
      })
  }

  function deleteEvent (event: Event) {
    deleteTrialEvent(compProps.trial.localId || '', event)
      .then(() => {
        emitter.emit('trial-properties-changed', compProps.trial.localId || '')
        emitter.emit('plausible-event', { key: 'trial-event', props: { type: 'deleted' } })
      })
  }

  function addNewComment (content: string) {
    addTrialComment(compProps.trial.localId || '', content)
      .then(() => {
        emitter.emit('trial-properties-changed', compProps.trial.localId || '')
        emitter.emit('plausible-event', { key: 'trial-comment', props: { type: 'added' } })
      })
  }

  function deleteComment (comment: Comment) {
    deleteTrialComment(compProps.trial.localId || '', comment)
      .then(() => {
        emitter.emit('trial-properties-changed', compProps.trial.localId || '')
        emitter.emit('plausible-event', { key: 'trial-comment', props: { type: 'deleted' } })
      })
  }
</script>
