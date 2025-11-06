<template>
  <div>
    <v-autocomplete
      v-model="searchMatch"
      :items="trialGermplasm"
      auto-select-first
      item-value="artificialId"
      item-title="displayName"
      :label="$t(label)"
      :hide-details="hint === undefined"
      :autofocus="store.storeAutoSelectSearch !== false"
      :density="density"
      return-object
      clearable
      :readonly="abortController !== undefined"
      :multiple="multiple"
      :chips="multiple"
      autocomplete="off"
      :hint="hint"
      :persistent-hint="hint !== undefined"
      :custom-filter="filterGermplasm"
      ref="searchField"
      :prepend-inner-icon="mdiMagnify"
    >
      <template #prepend>
        <v-btn :icon="mdiQrcodeScan" v-tooltip:top="$t('tooltipScanQRCode')" @click="showCamera = !showCamera" :color="showCamera ? 'info' : undefined" />
      </template>

      <template #append v-if="supportsNfc">
        <v-btn :icon="mdiNfcVariant" v-tooltip:top="$t('tooltipScanRFID')" @click="scanNfc" :color="abortController !== undefined ? 'info' : undefined" />
      </template>

      <template #item="{ props, item }">
        <v-list-item
          v-bind="props"
          :title="`${item.raw.displayName} (${$t('formLabelFieldLayoutRowColumn', { row: item.raw.displayRow || 1, column: item.raw.displayColumn || 1 })})`"
        >
          <template #title v-if="performanceMode === false"><PlotInformation :cell="item.raw" /></template>
        </v-list-item>
      </template>
    </v-autocomplete>

    <QrcodeStream
      v-if="showCamera"
      :formats="['qr_code', 'code_128', 'code_39', 'upc_a', 'upc_e']"
      @detect="onDetect"
    />
  </div>
</template>

<script setup lang="ts">
  import { getTrialDataCached, getTrialGermplasmCached } from '@/plugins/datastore'
  import type { CellPlus, TrialPlus } from '@/plugins/types/client'
  import { filterGermplasm } from '@/plugins/util'
  import { coreStore } from '@/stores/app'
  import { mdiMagnify, mdiNfcVariant, mdiQrcodeScan } from '@mdi/js'
  import PlotInformation from '@/components/plot/PlotInformation.vue'
  import { QrcodeStream, type DetectedBarcode } from 'vue-qrcode-reader'

  const store = coreStore()

  const searchMatch = defineModel<CellPlus[] | CellPlus>()
  const trialGermplasm = ref<CellPlus[]>([])
  const supportsNfc = ref(false)
  const showCamera = ref(false)
  const abortController = shallowRef<AbortController>()

  export interface GermplasmAutoCompleteProps {
    trial: TrialPlus
    density?: 'default' | 'comfortable' | 'compact'
    multiple?: boolean
    label?: string
    hint?: string
  }

  const compProps = withDefaults(defineProps<GermplasmAutoCompleteProps>(), {
    density: 'default',
    multiple: false,
    label: 'formLabelSearch',
  })

  const searchField = useTemplateRef('searchField')
  const performanceMode = computed(() => store.storePerformanceMode === true || trialGermplasm.value.length > 1000)

  function getTrialGermplasm () {
    const data = getTrialDataCached()

    if (data && compProps.trial) {
      trialGermplasm.value = getTrialGermplasmCached()
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
      }
    }
  }

  function setMatch (matchString: string) {
    const lower = matchString.trim().toLowerCase()

    const matches = trialGermplasm.value.filter(item => {
      const barcode = (item.barcode || '').toLowerCase()
      const displayName = (item.displayName || '').toLowerCase()
      const germplasm = (item.germplasm || '').toLowerCase()

      return barcode.includes(lower) || displayName.includes(lower) || germplasm.includes(lower)
    })

    if (matches.length > 0) {
      searchMatch.value = matches
    } else {
      searchMatch.value = []
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
