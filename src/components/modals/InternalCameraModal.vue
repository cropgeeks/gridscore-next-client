<template>
  <v-dialog v-model="dialog" fullscreen>
    <v-card>
      <CameraView :can-switch-modes="false" :selected-mode="selectedMode" @media-selected="handleMediaSelected" />
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  const dialog = ref(false)

  export interface CameraViewModalProps {
    selectedMode?: 'image' | 'video'
  }

  const compProps = withDefaults(defineProps<CameraViewModalProps>(), {
    selectedMode: 'image',
  })

  function handleMediaSelected (data: Blob) {
    emit('media-selected', data)
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

  const emit = defineEmits(['media-selected'])
</script>

<style>
</style>
