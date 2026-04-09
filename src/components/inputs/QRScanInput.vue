<template>
  <v-textarea v-model="model" :clearable="clearable" :label="label" :hint="hint" :persistent-hint="hint !== undefined && hint !== ''" v-if="textarea">
    <template #append-inner>
      <v-btn :icon="mdiQrcodeScan" v-tooltip:top="localTooltip" @click="toggleCamera" />
    </template>
  </v-textarea>
  <v-text-field v-model="model" :clearable="clearable" :label="label" :hint="hint" :persistent-hint="hint !== undefined && hint !== ''" v-else>
    <template #append>
      <v-btn :icon="mdiQrcodeScan" v-tooltip:top="localTooltip" @click="toggleCamera" />
    </template>
  </v-text-field>

  <v-bottom-sheet
    v-if="scanInBottomSheet"
    v-model="bottomSheetVisible"
    inset
    max-height="75vh"
  >
    <v-sheet>
      <QrcodeStream
        v-if="showCamera"
        :formats="formats"
        @detect="onDetect"
      />
    </v-sheet>
  </v-bottom-sheet>
  <template v-else>
    <QrcodeStream
      v-if="showCamera"
      :formats="formats"
      @detect="onDetect"
    />
  </template>
</template>

<script setup lang="ts">
  import { mdiQrcodeScan } from '@mdi/js'
  import { useI18n } from 'vue-i18n'
  import { QrcodeStream, type BarcodeFormat, type DetectedBarcode } from 'vue-qrcode-reader'

  const { t } = useI18n()

  export interface QRScanInputProps {
    label: string
    hint?: string
    clearable?: boolean
    tooltip?: string
    textarea?: boolean
    formats?: BarcodeFormat[]
    scanInBottomSheet?: boolean
  }

  const model = defineModel<string>()

  const showCamera = ref(false)
  const localTooltip = computed(() => compProps.tooltip || t('buttonScanQR'))
  const bottomSheetVisible = ref(false)

  const compProps = withDefaults(defineProps<QRScanInputProps>(), {
    textarea: false,
    formats: () => ['qr_code'],
    scanInBottomSheet: false,
  })

  function toggleCamera () {
    if (compProps.scanInBottomSheet) {
      bottomSheetVisible.value = true

      nextTick(() => {
        showCamera.value = !showCamera.value
      })
    } else {
      showCamera.value = !showCamera.value
    }
  }

  function onDetect (detectedCodes: DetectedBarcode[]) {
    if (detectedCodes && detectedCodes.length > 0) {
      let c = detectedCodes[0]?.rawValue

      if (c) {
        if (c.includes('/')) {
          c = c.slice(c.lastIndexOf('/') + 1)
        }

        if (compProps.textarea && model.value) {
          model.value += `\n${c}`
        } else {
          model.value = c
        }
        showCamera.value = false
        bottomSheetVisible.value = false

        nextTick(() => emit('code-scanned'))
      }
    }
  }

  watch(bottomSheetVisible, async () => {
    showCamera.value = false
  })

  const emit = defineEmits(['code-scanned'])
</script>
