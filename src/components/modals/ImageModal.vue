<template>
  <b-modal :title="displayName"
           :ok-title="$t('buttonSave')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent="downloadImage"
           @hidden="hide"
           no-fade
           ref="imageModal"
           content-class="image-modal">
    <div v-if="trial || trialName" :id="id">
      <template v-if="imageData">
        <b-button v-if="canShare" class="mb-3" @click="share"><IBiShareFill /> {{ $t('buttonShareSocial') }}</b-button>
        <!-- Preview the image -->
        <b-img fluid rounded :src="imageData" class="image" />
      </template>
      <!-- Input for selecting (or taking) the image -->
      <b-form-file v-model="imageFile" id="image-tag-input" accept="image/*" capture class="file-selector" ref="imageInput" autofocus />

      <b-form-group class="mt-2" label-for="trait-selector" :label="$t('formLabelImageTagTraitSelector')">
        <b-form-select :options="traitOptions" multiple v-model="selectedTraits" id="trait-selector" />
      </b-form-group>

      <b-form-group class="mt-2" label-for="filename-postfix" :label="$t('formLabelImageTagFilenamePostfix')">
        <b-form-input v-model="postfix" id="filename-postfix" />
      </b-form-group>

      <b-form-group class="mt-2" label-for="filename-preview" :label="$t('formLabelImageTagFilenamePreview')">
        <b-form-input readonly :value="filename" id="filename-preview" />
      </b-form-group>

      <!-- Show image date if available -->
      <b-badge v-if="imageDate"><IBiCalendar3 /> {{ imageDate.toLocaleString() }}</b-badge><br/>
      <!-- Show a link to GeoHack website if geolocation is available. This is the resource Wikipedia uses and it link out to many other resources. -->
      <b-badge target="_blank" rel="noopener noreferrer" :href="`https://geohack.toolforge.org/geohack.php?params=${imageGps.latitude};${imageGps.longitude}`" v-if="imageGps && imageGps.latitude && imageGps.longitude">📍 {{ imageGps.latitude.toFixed(4) }}; {{ imageGps.longitude.toFixed(4) }}</b-badge>

      <div v-if="imageData && isIOS" class="modal-banner bg-warning text-black text-center mt-3 mb-0 p-2">
        {{ $t('modalTextImageTaggingIOSWarning') }}
      </div>
    </div>
  </b-modal>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'

import { getColumnLabel, getRowLabel, toLocalDateTimeString, truncateAfterWords } from '@/plugins/misc'
import { saveAs } from 'file-saver'

import emitter from 'tiny-emitter/instance'
import { getTrialCached } from '@/plugins/datastore'
import { getId } from '@/plugins/id'

export default {
  props: {
    trial: {
      type: Object,
      default: () => null
    },
    trialName: {
      type: String,
      default: null
    },
    /** The variety name to use as the title */
    displayName: {
      type: String,
      default: null
    },
    row: {
      type: Number,
      default: 0
    },
    column: {
      type: Number,
      default: 0
    },
    preferredTraitId: {
      type: String,
      default: null
    }
  },
  data: function () {
    const id = getId()

    return {
      id,
      imageFile: null,
      imageData: null,
      imageDate: null,
      imageGps: null,
      supportsSaving: false,
      supportsGps: false,
      selectedTraits: [],
      postfix: null
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeGpsEnabled',
      'storeDeviceConfig'
    ]),
    canShare: function () {
      return 'share' in navigator && this.trial && this.trial.socialShareConfig
    },
    isIOS: function () {
      return this.storeDeviceConfig && this.storeDeviceConfig.os && this.storeDeviceConfig.os.name === 'iOS'
    },
    useGps: function () {
      return this.supportsGps && this.storeGpsEnabled
    },
    traitOptions: function () {
      if (this.trial && this.trial.traits) {
        return this.trial.traits.map(t => {
          return {
            value: t.id,
            text: t.name
          }
        })
      } else {
        return []
      }
    },
    shortTrialName: function () {
      if (this.trial) {
        return truncateAfterWords(this.trial.name, 3)
      } else if (this.trialName) {
        return this.trialName
      } else {
        return 'NA'
      }
    },
    filename: function () {
      const trial = this.trial || getTrialCached()
      if (trial && this.imageFile) {
        const row = getRowLabel(trial.layout, this.row)
        const column = getColumnLabel(trial.layout, this.column)
        return `${this.shortTrialName}_${this.getDateTime(this.imageDate)}_${this.displayName}_${row}_${column}_${this.selectedTraits.map(t => trial.traits.find(ot => ot.id === t).name).join('-')}${this.postfix ? ('_' + this.postfix) : ''}.${this.imageFile.name.split('.').pop()}`
      } else {
        return ''
      }
    }
  },
  watch: {
    preferredTraitId: function (newValue) {
      if (newValue) {
        this.selectedTraits = [newValue]
      } else {
        this.selectedTraits = []
      }
    },
    imageFile: function (newValue) {
      if (newValue) {
        // If there is a new image file, reset data
        this.imageGps = null
        this.imageDate = null
        // Convert to base64 for displaying
        this.imageData = URL.createObjectURL(newValue)

        if (newValue.lastModified) {
          // If there is a last modified date, use it
          this.imageDate = new Date(newValue.lastModified)
        } else {
          // Use current date as fallback as this is required for the filename
          this.imageDate = new Date()
        }

        emitter.emit('plausible-event', { key: 'data-input', props: { type: 'image' } })
      }
    }
  },
  methods: {
    share: async function () {
      const files = [this.imageFile]
      const shareData = {
        text: `${this.displayName} ${(this.trial.socialShareConfig ? this.trial.socialShareConfig.text : '') || '#GridScore'}`,
        title: (this.trial.socialShareConfig ? this.trial.socialShareConfig.title : '') || 'GridScore image share',
        // url: (this.trial.socialShareConfig ? this.trial.socialShareConfig.url : '') || 'https://gridscore.hutton.ac.uk',
        files
      }
      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData)
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error(err.name, err.message)
          }
        }
      } else {
        console.warn('Sharing not supported', shareData)
      }
    },
    /**
     * Returns the datetime string based on the given date
     * @param date The date to convert
     */
    getDateTime: function (date) {
      return toLocalDateTimeString(date)
    },
    downloadImageAsync: async function () {
      // create a new handle
      const newHandle = await window.showSaveFilePicker({
        suggestedName: this.filename,
        excludeAcceptAllOption: true,
        types: [{
          description: 'Image file',
          accept: {
            'image/*': ['.jpg']
          }
        }]
      })
      // create a FileSystemWritableFileStream to write to
      const writableStream = await newHandle.createWritable()
      // write our file
      await writableStream.write(this.imageFile)
      // close the file and write the contents to disk.
      await writableStream.close()

      this.$nextTick(() => {
        this.$emit('image-saved', this.filename)
        this.hide()
      })
    },
    /**
     * Downloads the image as a file attachment
     */
    downloadImage: function () {
      if (this.imageFile) {
        if (this.supportsSaving) {
          this.downloadImageAsync()
        } else {
          saveAs(this.imageData, this.filename)

          this.$nextTick(() => {
            this.$emit('image-saved', this.filename)
            this.hide()
          })
        }
      }
    },
    /**
     * Shows the modal dialog and resets it to its initial state
     */
    show: function () {
      this.supportsSaving = window.showSaveFilePicker !== undefined
      this.supportsGps = navigator.geolocation !== undefined && navigator.geolocation !== null
      this.postfix = null

      if (this.preferredTraitId) {
        this.selectedTraits = [this.preferredTraitId]
      } else {
        this.selectedTraits = []
      }

      this.$nextTick(() => {
        this.$refs.imageModal.show()

        this.$nextTick(() => {
          // Open up the capture/file selector initially
          document.querySelector(`#${this.id} #image-tag-input`).click()
        })
      })
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      if (this.imageData) {
        URL.revokeObjectURL(this.imageData)
      }

      this.imageFile = null
      this.imageData = null
      this.imageDate = null
      this.imageGps = null
      this.postfix = null

      this.$nextTick(() => this.$refs.imageModal.hide())
    }
  }
}
</script>

<style>
</style>
