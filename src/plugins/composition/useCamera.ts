import { ref, shallowRef, onUnmounted } from 'vue'

export function useCamera () {
  const stream = shallowRef<MediaStream | null>(null)
  const videoElement = ref<HTMLVideoElement | null>(null)
  const isRecording = ref(false)
  const error = ref<string | null>(null)
  const recordingSeconds = ref(0)

  const reviewingBlob = ref<Blob | null>(null)
  const lastCapturedType = ref<'image' | 'video' | null>(null)

  let mediaRecorder: MediaRecorder | null = null
  let imageCapture: any | null = null
  let recordedChunks: Blob[] = []
  let timerInterval: number | null = null

  function startTimer () {
    recordingSeconds.value = 0
    timerInterval = window.setInterval(() => {
      recordingSeconds.value++
    }, 1000)
  }

  function stopTimer () {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function takePhotoFallback (): Blob | null {
    if (!videoElement.value || !stream.value) {
      return null
    }
    const videoTrack = stream.value.getVideoTracks()[0]
    // @ts-expect-error
    const settings = videoTrack.getSettings()

    const canvas = document.createElement('canvas')
    canvas.width = settings.width || videoElement.value.videoWidth
    canvas.height = settings.height || videoElement.value.videoHeight

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(videoElement.value, 0, 0, canvas.width, canvas.height)
      let resultBlob: Blob | null = null
      canvas.toBlob(blob => {
        resultBlob = blob
      }, 'image/jpeg', 0.95)
      return resultBlob
    }
    return null
  }

  function convertToJpeg (pngBlob: Blob): Promise<Blob> {
    return new Promise(resolve => {
      const img = new Image()
      img.src = URL.createObjectURL(pngBlob)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')

        if (ctx) {
          ctx.drawImage(img, 0, 0)
          canvas.toBlob(jpegBlob => {
            URL.revokeObjectURL(img.src)
            resolve(jpegBlob || pngBlob)
          }, 'image/jpeg', 0.95)
        } else {
          resolve(pngBlob)
        }
      }
      img.onerror = () => resolve(pngBlob)
    })
  }

  async function startCamera (constraints: MediaStreamConstraints = {}) {
    // Clear any previous review state on restart
    reviewingBlob.value = null
    lastCapturedType.value = null
    error.value = null

    const defaultConstraints: MediaStreamConstraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 3840 },
        height: { ideal: 2160 },
      },
      audio: true,
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        ...defaultConstraints,
        ...constraints,
      })
      stream.value = mediaStream
      if (videoElement.value) {
        videoElement.value.srcObject = mediaStream
      }

      const videoTrack = mediaStream.getVideoTracks()[0]
      if (videoTrack && 'ImageCapture' in window) {
        // @ts-ignore
        imageCapture = new ImageCapture(videoTrack)
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to access camera'
    }
  }

  function stopCamera () {
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop())
      stream.value = null
    }
    if (videoElement.value) {
      videoElement.value.srcObject = null
    }
    imageCapture = null
    stopTimer()
  }

  async function takePhoto () {
    if (!stream.value) {
      return
    }
    if (!imageCapture) {
      const blob = takePhotoFallback()
      if (blob) {
        reviewingBlob.value = blob
        lastCapturedType.value = 'image'
      }
      return
    }

    try {
      let blob = await imageCapture.takePhoto()
      if (blob) {
        if (blob.type === 'image/png') {
          blob = await convertToJpeg(blob)
        }

        reviewingBlob.value = blob
        lastCapturedType.value = 'image'
      }
    } catch {
      const blob = takePhotoFallback()
      if (blob) {
        reviewingBlob.value = blob
        lastCapturedType.value = 'image'
      }
    }
  }

  function startRecording () {
    if (!stream.value) {
      return
    }

    reviewingBlob.value = null
    lastCapturedType.value = null
    recordedChunks = []

    const options = { mimeType: 'video/mp4;codecs=avc1' }

    try {
      mediaRecorder = new MediaRecorder(stream.value, options)
    } catch {
      try {
        mediaRecorder = new MediaRecorder(stream.value, { mimeType: 'video/webm' })
      } catch {
        mediaRecorder = new MediaRecorder(stream.value)
      }
    }

    mediaRecorder.ondataavailable = event => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data)
      }
    }

    mediaRecorder.onstart = () => {
      isRecording.value = true
      startTimer()
    }

    mediaRecorder.start()
  }

  async function stopRecording () {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      return
    }

    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(recordedChunks, { type: mediaRecorder?.mimeType || 'video/mp4' })
      isRecording.value = false
      stopTimer()

      // Set the video for review
      reviewingBlob.value = videoBlob
      lastCapturedType.value = 'video'
    }

    mediaRecorder.stop()
  }

  // NEW: Helper to restart the camera and clear review state
  async function redoCapture () {
    await startCamera({
      video: {
        facingMode: (imageCapture?.track?.getSettings()?.facingMode || 'environment'),
      },
    })
  }

  onUnmounted(() => {
    stopCamera()
  })

  return {
    stream,
    videoElement,
    isRecording,
    recordingSeconds,
    error,
    reviewingBlob,
    lastCapturedType,
    startCamera,
    stopCamera,
    takePhoto,
    startRecording,
    stopRecording,
    redoCapture,
  }
}
