<template>
  <v-list slim height="100%" v-click-outside="clickOutside" class="d-flex flex-column justify-end">
    <v-list-item :prepend-icon="mdiExportVariant" :title="$t('buttonShare')" @click="internalEmit('share')" />
    <v-list-item :prepend-icon="mdiDatabaseSync" :title="$t('buttonSynchronize')" @click="internalEmit('synchronize')" v-if="canSynchronize" />
    <v-list-item :prepend-icon="mdiNotebookMultiple" :title="$t('buttonDuplicateTrial')" @click="internalEmit('duplicate')" />
    <template v-if="editable">
      <v-divider />
      <v-list-item :prepend-icon="isLocked ? mdiLockOpen : mdiLockAlert" color="warning" :active="isLocked" :title="$t(isLocked ? 'buttonReactivateTrial' : 'buttonDeactivateTrial')" @click="internalEmit('lock')" v-if="isOwner" />
      <v-list-item :prepend-icon="mdiPlus" :disabled="isLocked === true" :title="$t('buttonAdd')">
        <template #append>
          <v-icon :icon="mdiMenuRight" />
        </template>

        <v-menu :open-on-focus="false" activator="parent" open-on-click submenu>
          <v-list>
            <v-list-item :prepend-icon="mdiTagPlus" :disabled="isLocked === true" :title="$t('buttonAddTrait')" @click="internalEmit('add-trait')" />
            <v-list-item :prepend-icon="mdiAccountPlus" :disabled="isLocked === true" :title="$t('buttonAddPerson')" @click="internalEmit('add-person')" />
            <v-list-item :prepend-icon="mdiFormatListGroupPlus" :disabled="isLocked === true" :title="$t('buttonAddGermplasm')" @click="internalEmit('add-germplasm')" v-if="isListMode" />
          </v-list>
        </v-menu>
      </v-list-item>
      <v-list-item :prepend-icon="mdiNotebookEdit" :disabled="isLocked === true" :title="$t('buttonEditTrial')" @click="internalEmit('edit')" v-if="isOwner" />
      <v-list-item :prepend-icon="mdiFileUpload" :disabled="isLocked === true" :title="$t('buttonUploadData')" @click="internalEmit('add-data')" />
      <v-list-item :prepend-icon="mdiTableArrowUp" :disabled="isLocked === true" :title="$t('buttonUpdateMetadata')" @click="internalEmit('add-metadata')" />
    </template>
    <v-divider />
    <v-list-item :prepend-icon="mdiDelete" :title="$t('buttonDelete')" base-color="error" @click="internalEmit('delete')" />
  </v-list>
</template>

<script setup lang="ts">
  import { mdiAccountPlus, mdiDatabaseSync, mdiDelete, mdiExportVariant, mdiFileUpload, mdiFormatListGroupPlus, mdiLockAlert, mdiLockOpen, mdiMenuRight, mdiNotebookEdit, mdiNotebookMultiple, mdiPlus, mdiTableArrowUp, mdiTagPlus } from '@mdi/js'

  const compProps = defineProps<{
    editable: boolean
    isOwner: boolean
    isLocked?: boolean
    isListMode: boolean
    canSynchronize: boolean
  }>()

  type Event = 'lock' | 'delete' | 'duplicate' | 'edit' | 'synchronize' | 'share' | 'add-trait' | 'add-person' | 'add-data' | 'add-metadata' | 'add-germplasm' | 'close-menu'

  const emit = defineEmits(['lock', 'delete', 'duplicate', 'edit', 'synchronize', 'share', 'add-trait', 'add-person', 'add-data', 'add-metadata', 'add-germplasm', 'close-menu'])

  function clickOutside () {
    emit('close-menu')
  }

  function internalEmit (event: Event) {
    emit(event)
    emit('close-menu')
  }
</script>
