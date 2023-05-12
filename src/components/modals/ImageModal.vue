<template>
  <b-modal :title="displayName"
           :ok-title="$t('buttonSave')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent="downloadImage"
           no-fade
           ref="imageModal"
           content-class="image-modal">
    <div v-if="trial">
      <!-- Preview the image -->
      <b-img fluid rounded :src="imageData" class="image" v-if="imageData" />
      <!-- Input for selecting (or taking) the image -->
      <b-form-file v-model="imageFile" accept="image/*" capture class="file-selector" ref="imageInput" />

      <b-form-group class="mt-2" label-for="trait-selector" :label="$t('formLabelImageTagTraitSelector')">
        <b-form-select :options="traitOptions" multiple v-model="selectedTraits" id="trait-selector" />
      </b-form-group>

      <!-- Show image date if available -->
      <b-badge v-if="imageDate"><BIconCalendar3 /> {{ imageDate.toLocaleString() }}</b-badge><br/>
      <!-- Show geolocation if available -->
      <b-badge target="_blank" rel="noopener noreferrer" :href="`https://www.google.com/maps/place/${imageGps.latitude},${imageGps.longitude}/@${imageGps.latitude},${imageGps.longitude},9z`" v-if="imageGps && imageGps.latitude && imageGps.longitude">📍 {{ imageGps.latitude.toFixed(4) }}; {{ imageGps.longitude.toFixed(4) }}</b-badge>
    </div>
  </b-modal>
</template>

<script>
import { mapGetters } from 'vuex'

import exifr from 'exifr/dist/lite.umd.js'
import { BIconCalendar3 } from 'bootstrap-vue'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconCalendar3
  },
  props: {
    trial: {
      type: Object,
      default: () => null
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
    return {
      imageFile: null,
      imageData: null,
      imageDate: null,
      imageGps: null,
      supportsSaving: false,
      supportsGps: false,
      selectedTraits: null
    }
  },
  computed: {
    ...mapGetters([
      'storeGpsEnabled'
    ]),
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
    imageFile: async function (newValue) {
      if (newValue) {
        // If there is a new image file, reset data
        this.imageGps = null
        this.imageDate = null
        // Convert to base64 for displaying
        this.imageData = await this.toBase64(newValue)

        if (newValue.lastModified) {
          // If there is a last modified date, use it
          this.imageDate = new Date(newValue.lastModified)
        } else {
          // Use current date as fallback as this is required for the filename
          this.imageDate = new Date()
        }

        // Extract exif data
        exifr.parse(newValue)
          .then(exif => {
            // Try and extract the exact date
            if (exif.DateTimeOriginal) {
              this.imageDate = exif.DateTimeOriginal
            } else if (exif.CreateTime) {
              this.imageDate = exif.CreateTime
            }
            // Get the georeference information
            if (exif.latitude && exif.longitude) {
              return new Promise(resolve => {
                resolve({ lat: exif.latitude, lng: exif.longitude })
              })
            } else if (this.useGps) {
              return new Promise(resolve => navigator.geolocation.getCurrentPosition(geolocation => {
                if (geolocation && geolocation.coords) {
                  resolve({ lat: geolocation.coords.latitude, lng: geolocation.coords.longitude })
                } else {
                  resolve(null)
                }
              }))
            } else {
              return new Promise(resolve => resolve(null))
            }
          })
          .then(geolocation => {
            if (geolocation) {
              this.imageGps = {
                latitude: geolocation.lat,
                longitude: geolocation.lng
              }
            }
          })
          .catch(() => {
            // No exif available
            if (this.useGps) {
              navigator.geolocation.getCurrentPosition(geolocation => {
                if (geolocation && geolocation.coords) {
                  this.imageGps = {
                    latitude: geolocation.coords.latitude,
                    longitude: geolocation.coords.longitude
                  }
                }
              })
            }
          })

        emitter.emit('plausible-event', { key: 'data-input', props: { type: 'image' } })
      }
    }
  },
  methods: {
    /**
     * Converts the user selected file into base64
     * @param file The image file
     */
    toBase64: function (file) {
      // Return a promise as we can't wait for this
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = error => reject(error)
      })
    },
    /**
     * Returns the datetime string based on the given date
     * @param date The date to convert
     */
    getDateTime: function (date) {
      const dateString = date.toISOString().split('T')
      return `${dateString[0]}_${dateString[1].split('.')[0].replace(/:/g, '-')}`
    },
    /**
     * Downloads the image as a file attachment
     */
    downloadImage: async function () {
      if (this.imageFile) {
        const filename = `${this.getDateTime(this.imageDate)}_${this.displayName}_${this.row + 1}_${this.column + 1}_${this.selectedTraits.map(t => this.trial.traits.find(ot => ot.id === t).name).join('-')}.${this.imageFile.name.split('.').pop()}`
        if (this.supportsSaving) {
          // create a new handle
          const newHandle = await window.showSaveFilePicker({
            suggestedName: filename,
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
        } else {
          const dl = document.createElement('a')
          dl.setAttribute('href', this.imageData)
          dl.setAttribute('download', filename)
          dl.click()
        }
      }

      this.$nextTick(() => this.hide())
    },
    /**
     * Shows the modal dialog and resets it to its initial state
     */
    show: function () {
      this.supportsSaving = window.showSaveFilePicker !== undefined
      this.supportsGps = navigator.geolocation !== undefined && navigator.geolocation !== null

      if (this.preferredTraitId) {
        this.selectedTraits = [this.preferredTraitId]
      } else {
        this.selectedTraits = []
      }

      this.$nextTick(() => {
        this.$refs.imageModal.show()

        this.$nextTick(() => {
          // Open up the capture/file selector initially
          this.$refs.imageInput.$el.childNodes[0].focus()
          this.$refs.imageInput.$el.childNodes[0].click()
        })
      })
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.imageFile = null
      this.imageData = null
      this.imageDate = null
      this.imageGps = null

      this.$nextTick(() => this.$refs.imageModal.hide())
    }
  }
}
</script>

<style>
</style>
