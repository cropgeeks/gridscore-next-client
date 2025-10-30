<template>
  <!--
    We keep this modal eagerly loaded so that the input can be triggered from user interaction events.
    If we didn't do this (either with nextTick or waiting for the modal to be mounted etc) some browsers
    would not allow to call the `.click()` method on the file input as it's not triggered from a user interaction.
  -->
  <v-dialog eager scrollable v-model="dialog" max-width="min(90vw, 1024px)">
    <v-card :title="$t(mode === 'video' ? 'modalTitleVideoTag' : 'modalTitleImageTag')" id="media-modal">
      <template #text>
        <v-file-input
          v-model="inputFile"
          :class="mode === 'video' ? 'opacity-0' : ''"
          :label="$t('formLabelImageFile')"
          accept="image/*"
          ref="imageInput"
        />
        <v-file-input
          v-model="inputFile"
          capture="environment"
          :class="mode === 'image' ? 'opacity-0' : ''"
          :label="$t('formLabelVideoFile')"
          accept="video/*"
          ref="videoInput"
        />

        <template v-if="mediaData">
          <v-img :src="mediaData" v-if="mode === 'image'" />
          <video class="video" controls ref="video" v-else />
        </template>

        <template v-if="inputFile">
          <v-chip class="my-5" label :prepend-icon="mdiCalendar" :text="inputFileDate.toLocaleString()" v-if="inputFileDate" />

          <v-select
            v-model="selectedTraits"
            return-object
            :items="trial.traits"
            item-title="name"
            multiple
            chips
            clearable
            :label="$t('formLabelImageTagTraitSelector')"
          />

          <v-text-field
            class="mt-3"
            v-model="postfix"
            clearable
            :label="$t('formLabelImageTagFilenamePostfix')"
          />

          <v-text-field
            class="mt-3"
            readonly
            :model-value="filename"
            :label="$t('formLabelImageTagFilenamePreview')"
          />

          <v-banner
            v-if="platform.ios"
            :text="$t('modalTextImageTaggingIOSWarning')"
            color="warning"
            :icon="mdiAlert"
          />
        </template>
      </template>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('buttonCancel')" @click="hide" />
        <v-btn :text="$t('buttonSave')" @click="save" :disabled="!canContinue" color="primary" variant="tonal" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { mediaFilenameParts } from '@/plugins/constants'
  import { getCell } from '@/plugins/idb'
  import type { TraitPlus, CellPlus, TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'
  import emitter from 'tiny-emitter/instance'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import { saveAs } from 'file-saver'
  import { mdiAlert, mdiCalendar, mdiPaperclip } from '@mdi/js'

  const store = coreStore()
  const { platform } = useDisplay()
  const { t } = useI18n()

  const compProps = defineProps<{
    trial: TrialPlus
  }>()

  const dialog = ref(false)
  const inputFile = ref<File>()
  const inputFileDate = ref<Date>()
  const mediaData = ref<string>()
  const cell = ref<CellPlus>()
  const selectedTraits = ref<TraitPlus[]>([])
  const mode = ref<'image' | 'video'>('image')
  const postfix = ref<string>()

  const imageInput = useTemplateRef('imageInput')
  const videoInput = useTemplateRef('videoInput')
  const video = useTemplateRef('video')

  const canContinue = computed(() => {
    return mediaData.value !== undefined
  })
  const filename = computed(() => {
    const c = cell.value

    if (!c || !inputFile.value) {
      return ''
    }

    const parts = compProps.trial.mediaFilenameFormat || mediaFilenameParts.map(p => p.id)
    const extension = inputFile.value.name.includes('.') ? `.${inputFile.value.name.split('.').pop()}` : ''

    const mapped = parts.map(p => {
      if (p === 'trait' && selectedTraits.value.length > 0) {
        return selectedTraits.value.map(t => mediaFilenameParts.find(op => op.id === p)?.extract(compProps.trial, c, t)).join('-')
      } else {
        return mediaFilenameParts.find(op => op.id === p)?.extract(compProps.trial, c, undefined, inputFileDate.value)
      }
    }).filter(p => p !== undefined && p.length > 0)

    if (postfix.value && postfix.value.trim().length > 0) {
      mapped.push(postfix.value.trim())
    }

    return mapped.join('_') + extension
  })

  watch(inputFile, newValue => {
    // If there is a new media file, reset data
    inputFileDate.value = undefined

    if (mediaData.value) {
      try {
        URL.revokeObjectURL(mediaData.value)
      } catch {
        // Do nothing here
      }
    }

    if (newValue) {
      // Convert to base64 for displaying
      mediaData.value = URL.createObjectURL(newValue)

      if (newValue.lastModified) {
        // If there is a last modified date, use it
        inputFileDate.value = new Date(newValue.lastModified)
      } else {
        // Use current date as fallback as this is required for the filename
        inputFileDate.value = new Date()
      }

      emitter.emit('plausible-event', { key: 'data-input', props: { type: mode.value } })

      nextTick(() => {
        if (mode.value === 'video' && video.value) {
          video.value.src = mediaData.value || ''
          video.value.load()
        }

        nextTick(() => {
          if (store.storeMediaMode !== undefined) {
            // Save straightaway
            save()
          }
        })
      })
    } else {
      mediaData.value = undefined
    }
  })

  function save () {
    if (mediaData.value) {
      saveAs(mediaData.value, filename.value)

      emitter.emit('show-snackbar', {
        text: t('toastMediaSavedAs', { filename: filename.value }),
        color: 'warning',
      })

      hide()
    }
  }
  function show (row: number, column: number, type: 'image' | 'video' = 'image', traitIds?: string[]) {
    mode.value = type

    if (traitIds && traitIds.length > 0) {
      selectedTraits.value = compProps.trial.traits.filter(t => traitIds.includes(t.id || ''))
    } else {
      selectedTraits.value = []
    }

    getCell(store.storeSelectedTrial || '', row, column)
      .then(c => {
        cell.value = c
      })
    dialog.value = true
    if (type === 'image') {
      imageInput.value?.click()
    } else {
      videoInput.value?.click()
    }
  }
  function hide () {
    dialog.value = false
    emit('hide')
  }

  watch(dialog, async newValue => {
    if (!newValue) {
      cell.value = undefined
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

  onMounted(() => {
    emitter.on('tag-media', show)

    // Manually force this attribute onto the input field as Vuetify does not support setting it otherwise
    document.querySelector('#media-modal input[type=file]')?.setAttribute('capture', 'environment')
  })
  onBeforeUnmount(() => {
    emitter.off('tag-media', show)
  })

  defineExpose({
    show,
    hide,
  })

  const emit = defineEmits(['hide'])
</script>

<style scoped>
.opacity-0 {
  opacity: 0;
  height: 1px;
}
.video {
  max-width: 100%;
}
</style>
