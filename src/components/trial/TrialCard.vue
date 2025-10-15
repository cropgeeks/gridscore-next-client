<template>
  <v-card :title="trial.name" :variant="isSelected ? 'outlined' : undefined" class="d-flex flex-column flex-grow-1">
    <template #prepend>
      <slot name="prepend">
        <v-btn v-tooltip:top="$t(shareStatusConfig?.text || '')" :color="getTraitColor(shareStatusConfig?.colorIndex || 0)" :icon="shareStatusConfig?.icon" @click="emit('share')" :disabled="!interactive" />
      </slot>
    </template>
    <template #append v-if="trial.hasLocalUpdate || trial.hasRemoteUpdate">
      <v-btn v-if="trial.hasLocalUpdate" icon="mdi-cloud-upload" color="info" v-tooltip:bottom="$t('tooltipTrialHasTransactions')" @click="emitter.emit('synchronize-trial', trial)" />
      <v-btn v-else-if="trial.hasRemoteUpdate" icon="mdi-cloud-download" color="warning" v-tooltip:bottom="$t('tooltipTrialHasRemoteUpdate')" @click="emitter.emit('synchronize-trial', trial)" />
    </template>
    <template #subtitle v-if="trial.description">
      <span class="text-wrap" v-if="wrapDescription" v-html="trial.description" />
      <span v-tooltip:top="trial.description" v-else>{{ trial.description }}</span>
    </template>

    <v-card-text class="pb-0">
      <div class="d-flex flex-row flex-wrap ga-2">
        <v-chip v-if="trial.updatedOn" prepend-icon="mdi-calendar-edit" variant="tonal" color="primary" label v-tooltip:bottom="new Date(trial.updatedOn).toLocaleString()" :text="formatTimeAgo(trial.updatedOn)" />
        <slot name="chips" />
      </div>
    </v-card-text>

    <v-card-text class="bg-tonal" v-if="horizontal">
      <v-row>
        <v-col class="d-flex align-center justify-center">
          <v-btn variant="tonal" class="cursor-default" icon="mdi-folder-table" v-tooltip:top="trial.group?.name || $t('widgetTrialSelectorGroupUnassigned')" />
        </v-col>
        <v-col class="d-flex align-center justify-center">
          <v-badge location="bottom right" :offset-x="10" :offset-y="10" color="info" :content="getNumberWithSuffix(trial.layout.rows, 1)">
            <v-btn variant="tonal" class="cursor-default" icon="mdi-land-rows-horizontal" v-tooltip:top="$t('widgetTrialSelectorRows')" />
          </v-badge>
        </v-col>
        <v-col class="d-flex align-center justify-center">
          <v-badge location="bottom right" :offset-x="10" :offset-y="10" color="info" :content="getNumberWithSuffix(trial.layout.columns, 1)">
            <v-btn variant="tonal" class="cursor-default" icon="mdi-land-rows-vertical" v-tooltip:top="$t('widgetTrialSelectorColumns')" />
          </v-badge>
        </v-col>
        <v-col class="d-flex align-center justify-center">
          <v-badge location="bottom right" :offset-x="10" :offset-y="10" color="info" :content="getNumberWithSuffix(trial.traits.length, 1)">
            <v-btn variant="tonal" class="cursor-default" icon="mdi-tag-multiple" v-tooltip:top="$t('widgetTrialSelectorTraits')" />
          </v-badge>
        </v-col>
        <v-col class="d-flex align-center justify-center">
          <v-badge location="bottom right" :offset-x="10" :offset-y="10" color="info" :content="getNumberWithSuffix((trial.people || []).length, 1)">
            <v-btn variant="tonal" class="cursor-default" icon="mdi-account-multiple" v-tooltip:top="$t('widgetTrialSelectorPeople')" />
          </v-badge>
        </v-col>
        <v-col class="d-flex align-center justify-center">
          <v-badge location="bottom right" :offset-x="10" :offset-y="10" color="info" :content="getNumberWithSuffix((trial.comments || []).length, 1)">
            <v-btn variant="tonal" class="cursor-default" icon="mdi-comment-multiple" v-tooltip:top="$t('widgetTrialSelectorComments')" />
          </v-badge>
        </v-col>
        <v-col class="d-flex align-center justify-center">
          <v-badge location="bottom right" :offset-x="10" :offset-y="10" color="info" :content="getNumberWithSuffix((trial.events || []).length, 1)">
            <v-btn variant="tonal" class="cursor-default" icon="mdi-flag-variant" v-tooltip:top="$t('widgetTrialSelectorEvents')" />
          </v-badge>
        </v-col>
        <v-col class="d-flex align-center justify-center">
          <v-badge location="bottom right" :offset-x="10" :offset-y="10" color="info" :content="getNumberWithSuffix(trialDuration, 1)">
            <v-btn variant="tonal" class="cursor-default" icon="mdi-calendar-expand-horizontal" v-tooltip:top="$t('widgetTrialSelectorTrialDuration')" />
          </v-badge>
        </v-col>
      </v-row>
    </v-card-text>

    <v-list variant="tonal" slim v-else>
      <v-list-item prepend-icon="mdi-folder-table" :title="trial.group?.name || $t('widgetTrialSelectorGroupUnassigned')" />
      <v-list-item prepend-icon="mdi-land-rows-horizontal" :title="$t('widgetTrialSelectorRows')"><template #append><v-badge :content="getNumberWithSuffix(trial.layout.rows, 1)" inline /></template></v-list-item>
      <v-list-item prepend-icon="mdi-land-rows-vertical" :title="$t('widgetTrialSelectorColumns')"><template #append><v-badge :content="getNumberWithSuffix(trial.layout.columns, 1)" inline /></template></v-list-item>
      <v-list-item prepend-icon="mdi-tag-multiple" :title="$t('widgetTrialSelectorTraits')"><template #append><v-badge :content="getNumberWithSuffix(trial.traits.length, 1)" inline /></template></v-list-item>
      <v-list-item prepend-icon="mdi-account-multiple" :title="$t('widgetTrialSelectorPeople')"><template #append><v-badge :content="getNumberWithSuffix((trial.people || []).length, 1)" inline /></template></v-list-item>
      <v-list-item prepend-icon="mdi-comment-multiple" :title="$t('widgetTrialSelectorComments')"><template #append><v-badge :content="getNumberWithSuffix((trial.comments || []).length, 1)" inline /></template></v-list-item>
      <v-list-item prepend-icon="mdi-flag-variant" :title="$t('widgetTrialSelectorEvents')"><template #append><v-badge :content="getNumberWithSuffix((trial.events || []).length, 1)" inline /></template></v-list-item>
      <v-list-item prepend-icon="mdi-calendar-expand-horizontal" :title="$t('widgetTrialSelectorTrialDuration')"><template #append><v-badge :content="getNumberWithSuffix(trialDuration, 1)" inline /></template></v-list-item>
    </v-list>

    <v-card-actions v-if="showActions">
      <slot name="actions">
        <div class="d-flex justify-space-between flex-grow-1 flex-wrap ga-2">
          <div>
            <v-btn variant="tonal" :color="selected ? 'info' : undefined" :text="$t(selected ? 'buttonDeselect' : 'buttonSelect')" :prepend-icon="selected ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'" v-if="selectionEnabled" @click="emit('toggle-select')" />
            <template v-else>
              <v-btn variant="tonal" append-icon="mdi-menu-down" v-if="horizontal === false" @click="menuShown = true"><v-icon icon="mdi-cog" /></v-btn>
              <v-menu v-else>
                <template #activator="{ props }">
                  <v-btn variant="tonal" append-icon="mdi-menu-down" v-bind="props"><v-icon icon="mdi-cog" /></v-btn>
                </template>
                <TrialOptionsDropdown
                  :editable="trial.editable || false"
                  :is-owner="trial.shareStatus === ShareStatus.NOT_SHARED || trial.shareStatus === ShareStatus.OWNER"
                  :is-list-mode="trial.layout.columns === 1"
                  :can-synchronize="(trial.transactionCount && trial.transactionCount > 0) || trial.hasRemoteUpdate || false"
                  @delete="emit('delete')"
                  @edit="emit('edit')"
                  @synchronize="emit('synchronize')"
                  @duplicate="emit('duplicate')"
                  @add-trait="emit('add-trait')"
                  @add-person="emit('add-person')"
                  @add-germplasm="emit('add-germplasm')"
                  @add-data="emit('add-data')"
                  @add-metadata="emit('add-metadata')"
                  @share="emit('share')"
                />
              </v-menu>
            </template>
          </div>
          <v-btn :prepend-icon="isSelected ? 'mdi-notebook-check' : 'mdi-notebook-edit'" :text="$t(isSelected ? 'buttonActive' : 'buttonSelect')" :color="isSelected ? 'primary' : 'info'" variant="tonal" @click="emit('load')" />
        </div>
      </slot>
    </v-card-actions>
    <v-expand-transition v-if="horizontal === false">
      <v-card :title="$t('widgetTrialSelectorMenuTitle')" v-if="menuShown" class="d-flex flex-column position-absolute w-100" height="100%" style="bottom: 0;">
        <TrialOptionsDropdown
          :editable="trial.editable || false"
          :is-owner="trial.shareStatus === ShareStatus.NOT_SHARED || trial.shareStatus === ShareStatus.OWNER"
          :is-list-mode="trial.layout.columns === 1"
          :can-synchronize="(trial.transactionCount && trial.transactionCount > 0) || trial.hasRemoteUpdate || false"
          @delete="emit('delete')"
          @edit="emit('edit')"
          @synchronize="emit('synchronize')"
          @duplicate="emit('duplicate')"
          @add-trait="emit('add-trait')"
          @add-person="emit('add-person')"
          @add-germplasm="emit('add-germplasm')"
          @add-data="emit('add-data')"
          @add-metadata="emit('add-metadata')"
          @share="emit('share')"
          @close-menu="menuShown = false"
        />
        <template #actions>
          <v-btn variant="tonal" color="primary" append-icon="mdi-menu-up" @click="menuShown = false"><v-icon icon="mdi-cog" /></v-btn>
        </template>
      </v-card>
    </v-expand-transition>
  </v-card>
</template>

<script setup lang="ts">
  import { getNumberWithSuffix } from '@/plugins/formatting'
  import { ShareStatus, type TrialPlus } from '@/plugins/types/client'
  import { shareStatusTypes } from '@/plugins/types/types'
  import { formatTimeAgo, getTraitColor, toLocalDateString } from '@/plugins/util'
  import { coreStore } from '@/stores/app'
  import TrialOptionsDropdown from '@/components/trial/TrialOptionsDropdown.vue'

  import emitter from 'tiny-emitter/instance'

  const store = coreStore()

  const menuShown = ref(false)

  export interface TrialCardProps {
    trial: TrialPlus
    selectionEnabled?: boolean
    selected?: boolean
    wrapDescription?: boolean
    showActions?: boolean
    interactive?: boolean
    horizontal?: boolean
  }

  const compProps = withDefaults(defineProps<TrialCardProps>(), {
    selectionEnabled: false,
    selected: false,
    wrapDescription: false,
    showActions: true,
    interactive: true,
    horizontal: false,
  })

  const emit = defineEmits(['share', 'delete', 'edit', 'load', 'toggle-select', 'duplicate', 'synchronize', 'add-trait', 'add-person', 'add-data', 'add-metadata', 'add-germplasm'])

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
</script>
