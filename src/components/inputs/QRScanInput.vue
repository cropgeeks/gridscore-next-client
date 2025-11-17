<template>
  <v-textarea v-model="model" :label="label" :hint="hint" :persistent-hint="hint !== undefined && hint !== ''" v-if="textarea">
    <template #append-inner>
      <v-btn :icon="mdiQrcodeScan" v-tooltip:top="localTooltip" @click="showCamera = !showCamera" />
    </template>
  </v-textarea>
  <v-text-field v-model="model" :label="label" :hint="hint" :persistent-hint="hint !== undefined && hint !== ''" v-else>
    <template #append>
      <v-btn :icon="mdiQrcodeScan" v-tooltip:top="localTooltip" @click="showCamera = !showCamera" />
    </template>
  </v-text-field>

  <QrcodeStream
    v-if="showCamera"
    :formats="formats"
    @detect="onDetect"
  />
</template>

<script setup lang="ts">
  import { mdiQrcodeScan } from '@mdi/js'
  import { useI18n } from 'vue-i18n'
  import { QrcodeStream, type BarcodeFormat, type DetectedBarcode } from 'vue-qrcode-reader'

  const { t } = useI18n()

  export interface QRScanInputProps {
    label: string
    hint?: string
    tooltip?: string
    textarea?: boolean
    formats?: BarcodeFormat[]
  }

  const model = defineModel<string>()

  const showCamera = ref(false)
  const localTooltip = computed(() => compProps.tooltip || t('buttonScanQR'))

  const compProps = withDefaults(defineProps<QRScanInputProps>(), {
    textarea: false,
    formats: () => ['qr_code'],
  })

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

        nextTick(() => emit('code-scanned'))
      }
    }
  }

  const emit = defineEmits(['code-scanned'])
</script>
