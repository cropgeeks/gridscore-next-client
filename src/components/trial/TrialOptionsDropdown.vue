<template>
  <v-list slim height="100%" v-click-outside="clickOutside">
    <v-list-item prepend-icon="mdi-export-variant" :title="$t('buttonShare')" @click="internalEmit('share')" />
    <v-list-item prepend-icon="mdi-database-sync" :title="$t('buttonSynchronize')" @click="internalEmit('synchronize')" v-if="canSynchronize" />
    <v-list-item prepend-icon="mdi-notebook-multiple" :title="$t('buttonDuplicateTrial')" @click="internalEmit('duplicate')" />
    <template v-if="editable">
      <v-divider />
      <v-list-item prepend-icon="mdi-notebook-edit" :title="$t('buttonEditTrial')" @click="internalEmit('edit')" v-if="isOwner" />
      <v-list-item prepend-icon="mdi-tag-plus" :title="$t('buttonAddTrait')" @click="internalEmit('add-trait')" />
      <v-list-item prepend-icon="mdi-account-plus" :title="$t('buttonAddPerson')" @click="internalEmit('add-person')" />
      <v-list-item prepend-icon="mdi-format-list-group-plus" :title="$t('buttonAddGermplasm')" @click="internalEmit('add-germplasm')" v-if="isListMode" />
      <v-list-item prepend-icon="mdi-file-upload" :title="$t('buttonUploadData')" @click="internalEmit('add-data')" />
      <v-list-item prepend-icon="mdi-table-arrow-up" :title="$t('buttonUpdateMetadata')" @click="internalEmit('add-metadata')" />
    </template>
    <v-divider />
    <v-list-item prepend-icon="mdi-delete" :title="$t('buttonDelete')" base-color="error" @click="internalEmit('delete')" />
  </v-list>
</template>

<script setup lang="ts">
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
