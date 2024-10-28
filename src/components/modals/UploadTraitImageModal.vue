<template>
  <b-modal :title="$t('modalTitleUploadTraitImage')"
           :ok-title="$t('buttonUpload')"
           @ok.prevent="onSubmit"
           :ok-disabled="!imageFile || !imageData"
           no-fade
           ref="uploadTraitImageModal">
    <div v-if="trial && trait">
      <p>{{ $t('modalTextUploadTraitImage') }}</p>

      <b-form @submit.prevent="onSubmit">
        <!-- Preview the image -->
        <b-img fluid-grow rounded :src="imageData" class="image" v-if="imageData" />
        <!-- Input for selecting (or taking) the image -->
        <b-form-file v-model="imageFile" accept="image/png, image/jpeg" class="file-selector" ref="imageInput" />

        <p class="text-danger" v-if="errorMessage">{{ $t(errorMessage) }}</p>
      </b-form>
    </div>
  </b-modal>
</template>

<script>
import { postTraitImage } from '@/plugins/api'
import { updateTraitImageCache } from '@/plugins/traitcache'
import emitter from 'tiny-emitter/instance'

export default {
  props: {
    trial: {
      type: Object,
      default: () => null
    },
    trait: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      imageFile: null,
      imageData: null,
      errorMessage: null
    }
  },
  watch: {
    imageFile: async function (newValue) {
      if (newValue) {
        // Convert to base64 for displaying
        this.imageData = await this.toBase64(newValue)
      } else {
        this.imageData = null
      }
    }
  },
  methods: {
    /**
     * Converts the participant selected file into base64
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
    onSubmit: function () {
      const formData = new FormData()
      formData.append('imageFile', this.imageFile)

      emitter.emit('show-loading', true)

      let remoteConfig = null

      if (this.trial && this.trial.remoteUrl) {
        remoteConfig = {
          url: this.trial.remoteUrl,
          token: this.trial.remoteToken || null
        }
      }

      postTraitImage(remoteConfig, this.trial.shareCodes.ownerCode, this.trait.id, formData)
        .then(result => {
          if (result) {
            this.$emit('image-uploaded')
            this.hide()
            emitter.emit('plausible-event', { key: 'trait-image-uploaded' })

            updateTraitImageCache(this.trial, this.trait.id)
          }
        })
        .catch(error => {
          if (error.status === 401) {
            this.error = this.$t('errorMessageRemoteTrialInvalidToken')
          } else if (error.status === 400) {
            this.error = this.$t('errorMessageBadRequest')
          } else if (error.status === 403) {
            this.error = this.$t('errorMessageForbidden')
          } else if (error.status === 404) {
            this.error = this.$t('errorMessageNotFound')
          } else {
            this.error = error.message
            console.error(error)
          }
        })
        .finally(() => emitter.emit('show-loading', false))
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.imageFile = null
      this.imageData = null
      this.errorMessage = null
      this.$refs.uploadTraitImageModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.imageFile = null
      this.imageData = null
      this.errorMessage = null
      this.$nextTick(() => this.$refs.uploadTraitImageModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
