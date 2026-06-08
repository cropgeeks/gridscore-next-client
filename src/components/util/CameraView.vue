<template>
  <v-theme-provider theme="dark">
    <div :class="['d-flex', 'h-100', { 'flex-column': !isLandscape, 'flex-row': isLandscape }]">
      <div class="w-100 h-100 d-flex align-center justify-center" style="background: rgb(0,0,0);">
        <div v-if="reviewingBlob" class="review-viewport d-flex align-top justify-center">
          <img v-if="lastCapturedType === 'image'" :src="reviewUrl" alt="Photo captured preview" class="preview-media photo">
          <video v-if="lastCapturedType === 'video'" :src="reviewUrl" muted playsinline controls autoplay loop class="preview-media video" />
          <v-chip color="info" variant="elevated" class="review-label">{{ lastCapturedType === 'image' ? 'Photo Preview' : 'Video Preview' }}</v-chip>
        </div>

        <video
          v-else
          ref="videoElement"
          autoplay
          playsinline
          muted
          class="viewfinder-feed"
        />

        <div v-if="error" class="error-overlay">
          <p><v-icon :icon="mdiAlert" /> {{ error }}</p>
          <button @click="initCamera" class="retry-btn">Grant Permission</button>
        </div>

        <v-chip color="error" variant="elevated" class="recording-indicator" v-if="isRecording">
          <span class="red-dot me-2" /> {{ formattedTime }}
        </v-chip>
      </div>

      <div class="d-flex align-center justify-center" style="background: rgb(18,18,18);">
        <v-theme-provider theme="light">
          <div :class="['d-flex flex-row justify-content-between ga-5 align-center pa-3', { 'flex-column': isLandscape, 'flex-row': !isLandscape }]">
            <template v-if="reviewingBlob">
              <v-btn size="x-large" color="success" variant="tonal" disabled :icon="mdiCheck" style="visibility: hidden;" />
              <v-btn @click="acceptCapture" size="x-large" color="success" variant="tonal" :icon="mdiCheck" />
              <v-btn @click="handleRedo" size="default" color="warning" variant="tonal" :icon="mdiRefresh" />
            </template>

            <template v-else>
              <v-btn :icon="mdiCameraFlip" disabled style="visibility: hidden;" />

              <div class="d-flex align-center justify-center" style="width: 76px; height: 76px;">
                <v-btn
                  :color="currentMode === 'video' ? 'error' : 'white'"
                  icon
                  variant="outlined"
                  size="72"
                  style="border-width: 4px;"
                  @click="handleShutterClick"
                >
                  <v-avatar
                    :color="currentMode === 'video' ? 'error' : 'white'"
                    :size="isRecording ? 28 : 54"
                    :rounded="isRecording ? 'lg' : 'circle'"
                    class="transition-all duration-200"
                  />
                </v-btn>
              </div>

              <v-btn :icon="mdiCameraFlip" @click="toggleFacingMode" :disabled="isRecording" />
            </template>
          </div>
        </v-theme-provider>
      </div>
    </div>
  </v-theme-provider>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
  import { useCamera } from '@/plugins/composition/useCamera'
  import { mdiAlert, mdiCameraFlip, mdiCheck, mdiRefresh } from '@mdi/js'
  import { useDisplay } from 'vuetify'
  import * as piexif from 'piexifjs'

  import { useGeolocation } from '@vueuse/core'

  const { coords } = useGeolocation()

  export interface CameraViewProps {
    canSwitchModes?: boolean
    selectedMode?: 'image' | 'video'
  }

  const compProps = withDefaults(defineProps<CameraViewProps>(), {
    canSwitchModes: false,
    selectedMode: 'image',
  })

  const {
    videoElement,
    isRecording,
    recordingSeconds,
    error,
    reviewingBlob,
    lastCapturedType,
    startCamera,
    takePhoto,
    startRecording,
    stopRecording,
    redoCapture,
  } = useCamera()

  const { width, height } = useDisplay()

  const currentMode = ref<'image' | 'video'>('image')
  const facingMode = ref<VideoFacingModeEnum>('environment')

  // Persisted saves after review is accepted
  const lastSavedUrl = ref<string | undefined>(undefined)
  const lastSavedType = ref<'image' | 'video' | null>(null)

  // Transient review URL
  const reviewUrl = ref<string | undefined>(undefined)

  const isLandscape = computed(function () {
    return width.value > height.value
  })

  // NEW: Manage the review object URL lifecycle
  watch(reviewingBlob, (newBlob, oldBlob) => {
    if (oldBlob) URL.revokeObjectURL(reviewUrl.value!)
    reviewUrl.value = newBlob ? URL.createObjectURL(newBlob) : undefined
  })

  const formattedTime = computed(() => {
    const mins = Math.floor(recordingSeconds.value / 60).toString().padStart(2, '0')
    const secs = (recordingSeconds.value % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  })

  async function initCamera () {
    await startCamera({
      video: {
        facingMode: facingMode.value,
        width: { ideal: 3840 },
        height: { ideal: 2160 },
      },
      audio: true, // required for video
    })
  }

  function toggleFacingMode () {
    facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
    initCamera()
  }

  async function handleShutterClick () {
    if (currentMode.value === 'image') {
      await takePhoto()
    } else {
      if (!isRecording.value) {
        startRecording()
      } else {
        await stopRecording()
      }
    }
  }

  // NEW: Review logic: Redo clears review and restarts camera
  async function handleRedo () {
    await redoCapture()
  }

  // NEW: Review logic: Accept persists the blob and reloads camera feed
  async function acceptCapture () {
    if (reviewingBlob.value) {
      // 1. Move transient review media to persistent saved slots
      if (lastSavedUrl.value) {
        URL.revokeObjectURL(lastSavedUrl.value)
      }

      let finalBlob = reviewingBlob.value
      if (compProps.selectedMode === 'image' && coords.value && isFinite(coords.value.latitude) && isFinite(coords.value.longitude)) {
        try {
          const base64DataUrl = await blobToDataUrl(reviewingBlob.value)
          const gpsExifData: any = {}

          // Define North/South and East/West designators
          gpsExifData[piexif.GPSIFD.GPSLatitudeRef] = coords.value.latitude >= 0 ? 'N' : 'S'
          gpsExifData[piexif.GPSIFD.GPSLatitude] = degToExifRational(coords.value.latitude)

          gpsExifData[piexif.GPSIFD.GPSLongitudeRef] = coords.value.longitude >= 0 ? 'E' : 'W'
          gpsExifData[piexif.GPSIFD.GPSLongitude] = degToExifRational(coords.value.longitude)

          const exifObj = {
            '0th': {},
            'Exif': {},
            'GPS': gpsExifData,
          }

          // Generate the binary EXIF string block
          const exifBytes = piexif.dump(exifObj)

          // Inject the metadata bytes straight into the image string payload
          const modifiedBase64DataUrl = piexif.insert(exifBytes, base64DataUrl)

          finalBlob = dataUrlToBlob(modifiedBase64DataUrl, reviewingBlob.value.type)
        } catch {
          // Do nothing here... something with the tagging failed. We'll use the fallback instead.
        }
      }

      emit('media-selected', finalBlob)
    }
  }

  function degToExifRational (decimalDegrees: number): number[][] {
    const absolute = Math.abs(decimalDegrees)
    const degrees = Math.floor(absolute)
    const minutesNotTruncated = (absolute - degrees) * 60
    const minutes = Math.floor(minutesNotTruncated)
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60 * 100)

    return [
      [degrees, 1],
      [minutes, 1],
      [seconds, 100],
    ]
  }

  // Helper function: Reads a Blob as a Data URL string
  function blobToDataUrl (blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Helper function: Converts a base64/DataURL string back into a raw binary Blob
  function dataUrlToBlob (dataUrl: string, mimeType: string): Blob {
    const byteString = atob(dataUrl.split(',')[1] || '')
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }

    return new Blob([ab], { type: mimeType })
  }

  onMounted(() => {
    currentMode.value = compProps.selectedMode

    initCamera()
  })

  onBeforeUnmount(() => {
    if (lastSavedUrl.value) {
      URL.revokeObjectURL(lastSavedUrl.value)
    }
    if (reviewUrl.value) {
      URL.revokeObjectURL(reviewUrl.value)
    }
  })

  const emit = defineEmits(['media-selected'])
</script>

<style scoped>
.viewfinder-feed {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.preview-media {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.review-label {
  position: absolute;
  top: 25px;
}
.recording-indicator {
  position: absolute;
  top: 25px;
}
.red-dot { width: 10px;
  height: 10px;
  background-color: #fff;
  border-radius: 50%;
  animation: blink 1s infinite;
}
.error-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
@keyframes blink { 50% { opacity: 0.3; } }
</style>
