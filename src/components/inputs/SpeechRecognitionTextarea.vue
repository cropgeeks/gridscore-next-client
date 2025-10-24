<template>
  <v-textarea
    :label="$t('formLabelCommentContent')"
    :hint="$t('formDescriptionCommentContent')"
    persistent-hint
    v-model="textContent"
  >
    <template #append-inner v-if="isSupported">
      <v-btn icon="mdi-microphone-message" :color="isListening ? 'primary' : undefined" @click="toggleRecording" />
    </template>
  </v-textarea>
</template>

<script setup lang="ts">
  import { coreStore } from '@/stores/app'
  import emitter from 'tiny-emitter/instance'
  import { useSpeechRecognition } from '@vueuse/core'

  const store = coreStore()

  console.log(window.isSecureContext)

  const {
    isSupported,
    isListening,
    isFinal,
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
      console.log('test', newValue)
    })
    watch(isListening, async newValue => {
      console.log('listening', newValue)
    })
  }

  function toggleRecording () {
    console.log('toggle')
    if (isListening) {
      stop()
    } else {
      start()
    }

    emitter.emit('plausible-event', { key: 'data-input', props: { type: 'speech-recognition' } })
  }
</script>
