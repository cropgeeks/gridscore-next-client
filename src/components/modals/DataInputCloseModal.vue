<template>
  <v-dialog v-model="dialog" max-width="min(90vw, 1024px)" scrollable>
    <v-card :title="$t('modalTitleConfirmCloseDataInput')">
      <template #text>
        <p v-html="$t('modalTextConfirmCloseDataInput')" />
      </template>

      <v-card-actions>
        <v-btn class="me-auto" @click="localEmit('cancel')">{{ $t('buttonCancel') }}</v-btn>
        <v-spacer />
        <v-btn color="error" @click="localEmit('close')">{{ $t('buttonClose') }}</v-btn>
        <v-btn color="success" @click="localEmit('save')">{{ $t('buttonSave') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  const dialog = ref(false)

  const emit = defineEmits(['cancel', 'close', 'save'])

  function localEmit (value: 'cancel' | 'close' | 'save') {
    emit(value)
    hide()
  }

  function show () {
    dialog.value = true
  }
  function hide () {
    dialog.value = false
  }

  defineExpose({
    show,
    hide,
  })
</script>

<style>
</style>
