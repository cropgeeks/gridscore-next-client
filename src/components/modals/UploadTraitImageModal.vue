<template>
  <v-dialog eager scrollable v-model="dialog" max-width="min(90vw, 1024px)">
    <v-card :title="$t('modalTitleUploadTraitImage')" id="media-modal">
      <template #text>
        <p>{{ $t('modalTextUploadTraitImage') }}</p>

        <v-file-input
          v-model="inputFile"
          :label="$t('formLabelImageFile')"
          accept="image/jpeg,image/png"
          ref="imageInput"
        />

        <template v-if="mediaData">
          <v-img :src="mediaData" class="media-preview" />
        </template>

        <v-alert class="mt-3" color="error" variant="tonal" :icon="mdiAlert" :text="errorMessage" v-if="errorMessage" />
      </template>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('buttonCancel')" @click="hide" />
        <v-btn :text="$t('buttonUpload')" @click="upload" :disabled="!canContinue" color="primary" variant="tonal" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { postTraitImage } from '@/plugins/api'
  import { updateTraitImageCache } from '@/plugins/traitcache'
  import type { TraitPlus, TrialPlus } from '@/plugins/types/client'
  import { mdiAlert } from '@mdi/js'
  import Compressor from 'compressorjs'

  import emitter from 'tiny-emitter/instance'
  import { useI18n } from 'vue-i18n'

  const compProps = defineProps<{
    trial: TrialPlus
    trait: TraitPlus
  }>()

  const { t } = useI18n()
  const errorMessage = ref<string>()
  const dialog = ref(false)
  const inputFile = ref<File>()
  const mediaData = ref<string>()

  const canContinue = computed(() => {
    return mediaData.value !== undefined
  })

  watch(inputFile, newValue => {
    if (mediaData.value) {
      try {
        URL.revokeObjectURL(mediaData.value)
      } catch {
        // Do nothing here
      }
    }

    if (newValue) {
      new Compressor(newValue, {
        quality: 0.6,
        maxWidth: 1080,
        maxHeight: 1080,
        resize: 'contain',
        // The compression process is asynchronous,
        // which means you have to access the `result` in the `success` hook function.
        success(result) {
          // Convert to base64 for displaying
          mediaData.value = URL.createObjectURL(result)
        },
        error(err) {
          console.log(err.message)
        },
      })
    } else {
      mediaData.value = undefined
    }
  })

  function upload () {
    if (inputFile.value) {
      const formData = new FormData()
      formData.append('imageFile', inputFile.value)

      emitter.emit('show-loading', true)

      let remoteConfig = undefined

      if (compProps.trial && compProps.trial.remoteUrl) {
        remoteConfig = {
          remoteUrl: compProps.trial.remoteUrl,
          token: compProps.trial.remoteToken || undefined,
        }
      }

      postTraitImage(remoteConfig, compProps.trial.shareCodes?.ownerCode || '', compProps.trait.id || '', formData)
        .then(result => {
          if (result) {
            emitter.emit('plausible-event', { key: 'trait-image-uploaded' })

            return updateTraitImageCache(compProps.trial, compProps.trait.id || '')
          } else {
            return new Promise<void>(resolve => resolve())
          }
        })
        .then(() => {
          emit('image-uploaded')
          hide()
        })
        .catch(error => {
          switch (error.status) {
            case 401:
              errorMessage.value = t('errorMessageRemoteTrialInvalidToken')
              break
            case 400:
              errorMessage.value = t('errorMessageBadRequest')
              break
            case 403:
              errorMessage.value = t('errorMessageForbidden')
              break
            case 404:
              errorMessage.value = t('errorMessageNotFound')
              break
            default:
              errorMessage.value = error.message
              console.error(error)
              break
          }
        })
        .finally(() => emitter.emit('show-loading', false))
    }
  }
  function show () {
    errorMessage.value = undefined
    dialog.value = true
  }
  function hide () {
    dialog.value = false
  }

  watch(dialog, async newValue => {
    if (!newValue) {
      inputFile.value = undefined
      if (mediaData.value) {
        try {
          URL.revokeObjectURL(mediaData.value)
        } catch {
          // Do nothing here
        }
      }
      mediaData.value = undefined
    }
  })

  defineExpose({
    show,
    hide,
  })

  const emit = defineEmits(['hide', 'image-uploaded'])
</script>

<style scoped>
.media-preview {
  max-height: 75vh;
}
</style>
