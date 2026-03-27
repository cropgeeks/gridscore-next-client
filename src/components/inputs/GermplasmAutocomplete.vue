<template>
  <div>
    <v-autocomplete
      v-model="searchMatch"
      :items="trialGermplasm"
      auto-select-first
      item-value="artificialId"
      :label="$t(label)"
      :hide-details="hint === undefined"
      :autofocus="store.storeAutoSelectSearch !== false"
      :density="density"
      clearable
      :readonly="abortController !== undefined"
      :multiple="multiple"
      :min-width="minWidth"
      :max-width="maxWidth"
      autocomplete="off"
      :hint="hint"
      :persistent-hint="hint !== undefined"
      :custom-filter="filterGermplasm"
      ref="searchField"
      :prepend-inner-icon="mdiMagnify"
    >
      <template #prepend>
        <v-btn :icon="mdiQrcodeScan" v-tooltip:top="$t('tooltipScanQRCode')" @click="toggleCamera" :color="showCamera ? 'info' : undefined" />
      </template>

      <template #append v-if="supportsNfc">
        <v-btn :icon="mdiNfcVariant" v-tooltip:top="$t('tooltipScanRFID')" @click="scanNfc" :color="abortController !== undefined ? 'info' : undefined" />
      </template>

      <template #selection="{ internalItem: item, index }" v-if="multiple">
        <v-chip size="small" v-if="index < 5" :text="item.title" />

        <span v-if="index === 5" class="text-grey text-body-small align-self-center">{{ $t('formDetailsItemSelectOther', (searchMatch || []).length - 5) }}</span>
      </template>

      <template #item="{ props, internalItem: item }">
        <v-list-item
          v-bind="props"
          :title="item.raw"
        />
      </template>
    </v-autocomplete>

    <v-bottom-sheet
      v-if="scanInBottomSheet"
      v-model="bottomSheetVisible"
      inset
      max-height="75vh"
    >
      <v-sheet>
        <QrcodeStream
          v-if="showCamera"
          :formats="['qr_code', 'code_128', 'code_39', 'upc_a', 'upc_e']"
          @detect="onDetect"
        />
      </v-sheet>
    </v-bottom-sheet>
    <template v-else>
      <QrcodeStream
        v-if="showCamera"
        :formats="['qr_code', 'code_128', 'code_39', 'upc_a', 'upc_e']"
        @detect="onDetect"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
  import { getTrialDataCached } from '@/plugins/datastore'
  import type { TrialPlus } from '@/plugins/types/client'
  import { filterGermplasm } from '@/plugins/util'
  import { coreStore } from '@/stores/app'
  import { mdiMagnify, mdiNfcVariant, mdiQrcodeScan } from '@mdi/js'
  import { QrcodeStream, type DetectedBarcode } from 'vue-qrcode-reader'

  import emitter from 'tiny-emitter/instance'
  import { useI18n } from 'vue-i18n'

  const store = coreStore()
  const { t } = useI18n()

  const searchMatch = defineModel<string[] | string>()
  const trialGermplasm = ref<string[]>([])
  const supportsNfc = ref(false)
  const showCamera = ref(false)
  const abortController = shallowRef<AbortController>()
  const bottomSheetVisible = ref(false)

  export interface CellAutocompleteProps {
    trial: TrialPlus
    density?: 'default' | 'comfortable' | 'compact'
    multiple?: boolean
    label?: string
    hint?: string
    scanInBottomSheet?: boolean
    minWidth?: string
    maxWidth?: string
  }

  const compProps = withDefaults(defineProps<CellAutocompleteProps>(), {
    density: 'default',
    multiple: false,
    label: 'formLabelSearch',
    scanInBottomSheet: false,
  })

  const searchField = useTemplateRef('searchField')

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

  function getTrialGermplasm () {
    const data = getTrialDataCached()

    if (data && compProps.trial) {
      const nameSet = new Set<string>()

      Object.values(data).forEach(v => {
        if (v) {
          nameSet.add(v.germplasm)
        }
      })
      trialGermplasm.value = [...nameSet].sort((a, b) => a.localeCompare(b))
    }
  }

  function focus () {
    if (store.storeAutoSelectSearch) {
      nextTick(() => searchField.value?.focus())
    }
  }

  function resetAbortController () {
    abortController.value = new AbortController()
    abortController.value.signal.onabort = () => {
      abortController.value = undefined
    }
  }

  function onDetect (detectedCodes: DetectedBarcode[]) {
    if (detectedCodes && detectedCodes.length > 0) {
      const c = detectedCodes[0]?.rawValue

      if (c) {
        setMatch(c)

        showCamera.value = false
        bottomSheetVisible.value = false
      }
    }
  }

  function setMatch (matchString: string) {
    const lower = matchString.trim().toLowerCase()

    const matches = trialGermplasm.value.filter(item => item.toLowerCase().includes(lower))

    if (matches.length > 0) {
      searchMatch.value = compProps.multiple ? matches : matches[0]
    } else {
      searchMatch.value = compProps.multiple ? [] : undefined
      emitter.emit('show-snackbar', {
        text: t('toastNfcNoMatchFound', { search: matchString.trim() }),
        color: 'warning',
      })
    }
  }

  async function scanNfc () {
    if (supportsNfc.value) {
      if (abortController.value) {
        abortController.value.abort()
        return
      } else {
        resetAbortController()
        // @ts-ignore
        const ndef = new NDEFReader()

        if (abortController.value) {
          const ac: AbortController = abortController.value

          await ndef.scan({ signal: ac.signal })
          // @ts-ignore
          ndef.addEventListener('reading', (event: NDEFReadingEvent) => {
            if (event.message && event.message.records && event.message.records.length > 0) {
              ac.abort()
              const record = event.message.records[0]

              let message = ''
              switch (record.recordType) {
                case 'text':
                  const textDecoder = new TextDecoder(record.encoding)
                  message = textDecoder.decode(record.data)
                  break
                case 'url':
                  const urlDecoder = new TextDecoder()
                  message = urlDecoder.decode(record.data)
                  break
              }

              if (message !== '') {
                const parts = message.split(/\r?\n/)

                if (parts.length > 0 && parts[0]) {
                  setMatch(parts[0])
                }
              }
            }
          }, { once: true })
        }
      }
    }
  }

  watch(() => compProps.trial, async () => {
    getTrialGermplasm()
  })

  watch(bottomSheetVisible, async () => {
    showCamera.value = false
  })

  onMounted(() => {
    supportsNfc.value = 'NDEFReader' in window

    if (compProps.trial) {
      getTrialGermplasm()
    }
  })

  onBeforeUnmount(() => {
    if (abortController.value) {
      abortController.value.abort()
    }
  })

  defineExpose({
    focus,
  })
</script>
