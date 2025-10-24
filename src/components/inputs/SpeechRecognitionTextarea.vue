<template>
  <v-textarea
    :label="$t('formLabelCommentContent')"
    :hint="$t('formDescriptionCommentContent')"
    persistent-hint
    v-model="textContent"
  >
    <template #append-inner v-if="isSupported">
      <v-btn icon="mdi-microphone-message" :color="isListening ? 'primary' : undefined" @click="toggleRecording" v-tooltip:top="$t('tooltipDataEntryCommentMicrophone')" />
    </template>
  </v-textarea>
</template>

<script setup lang="ts">
  import { coreStore } from '@/stores/app'
  import emitter from 'tiny-emitter/instance'
  import { useSpeechRecognition } from '@vueuse/core'

  const store = coreStore()

  const {
    isSupported,
    isListening,
    result,
    start,
    stop,
  } = useSpeechRecognition({
    lang: store.storeLocale.replace('_', '-'),
    continuous: true,
    interimResults: true,
  })

  const textContent = defineModel<string>()

  if (isSupported.value) {
    watch(result, async newValue => {
      textContent.value = newValue
    })
  }

  function toggleRecording () {
    if (isListening.value) {
      stop()
    } else {
      start()
    }

    emitter.emit('plausible-event', { key: 'data-input', props: { type: 'speech-recognition' } })
  }

  onBeforeUnmount(() => {
    if (isListening.value) {
      stop()
    }
  })
</script>
