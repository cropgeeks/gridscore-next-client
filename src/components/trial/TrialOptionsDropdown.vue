<template>
  <v-list slim height="100%" v-click-outside="clickOutside" class="d-flex flex-column justify-end">
    <v-list-item :prepend-icon="mdiExportVariant" :title="$t('buttonShare')" @click="internalEmit('share')" />
    <v-list-item :prepend-icon="mdiDatabaseSync" :title="$t('buttonSynchronize')" @click="internalEmit('synchronize')" v-if="canSynchronize" />
    <v-list-item :prepend-icon="mdiNotebookMultiple" :title="$t('buttonDuplicateTrial')" @click="internalEmit('duplicate')" />
    <template v-if="editable">
      <v-divider />
      <v-list-item :prepend-icon="mdiNotebookEdit" :title="$t('buttonEditTrial')" @click="internalEmit('edit')" v-if="isOwner" />
      <v-list-item :prepend-icon="mdiTagPlus" :title="$t('buttonAddTrait')" @click="internalEmit('add-trait')" />
      <v-list-item :prepend-icon="mdiAccountPlus" :title="$t('buttonAddPerson')" @click="internalEmit('add-person')" />
      <v-list-item :prepend-icon="mdiFormatListGroupPlus" :title="$t('buttonAddGermplasm')" @click="internalEmit('add-germplasm')" v-if="isListMode" />
      <v-list-item :prepend-icon="mdiFileUpload" :title="$t('buttonUploadData')" @click="internalEmit('add-data')" />
      <v-list-item :prepend-icon="mdiTableArrowUp" :title="$t('buttonUpdateMetadata')" @click="internalEmit('add-metadata')" />
    </template>
    <v-divider />
    <v-list-item :prepend-icon="mdiDelete" :title="$t('buttonDelete')" base-color="error" @click="internalEmit('delete')" />
  </v-list>
</template>

<script setup lang="ts">
  import { mdiAccountPlus, mdiDatabaseSync, mdiDelete, mdiExportVariant, mdiFileUpload, mdiFormatListGroupPlus, mdiNotebookEdit, mdiNotebookMultiple, mdiTableArrowUp, mdiTagPlus } from '@mdi/js'

  const compProps = defineProps<{
    editable: boolean
    isOwner: boolean
    isListMode: boolean
    canSynchronize: boolean
  }>()

  type Event = 'delete' | 'duplicate' | 'edit' | 'synchronize' | 'share' | 'add-trait' | 'add-person' | 'add-data' | 'add-metadata' | 'add-germplasm' | 'close-menu'

  const emit = defineEmits(['delete', 'duplicate', 'edit', 'synchronize', 'share', 'add-trait', 'add-person', 'add-data', 'add-metadata', 'add-germplasm', 'close-menu'])

  function clickOutside () {
    emit('close-menu')
  }

  function internalEmit (value: Event) {
    emit(value)
    emit('close-menu')
  }
</script>
