<template>
  <StyledQRCode class="mt-3" :is-trial-code="false" :show-code="false" :size="size" :text="settingsShareCodeContent" v-if="shareConfig === 'export'" />
  <template v-else>
    <!-- TODO: ERROR HERE! -->
    <QrcodeStream
      :formats="['qr_code']"
      @detect="onDetect"
    />
  </template>
</template>

<script setup lang="ts">
  import { CanvasDensity, CanvasShape, CanvasSize, DataEntryView, MainDisplayMode, NavigationMode, TraitGroupMode } from '@/plugins/types/client'
  import { loadLanguageAsync } from '@/plugins/vuetify'
  import { coreStore } from '@/stores/app'

  import emitter from 'tiny-emitter/instance'
  import { QrcodeStream, type DetectedBarcode } from 'vue-qrcode-reader'

  const compProps = defineProps<{
    shareConfig: 'import' | 'export'
  }>()

  const errorMessage = ref<string>()
  const size = ref(300)

  const store = coreStore()

  const settingsShareCodeContent = computed(() => {
    return JSON.stringify({
      cd: store.storeCanvasDensity === CanvasDensity.HIGH ? 0 : (store.storeCanvasDensity === CanvasDensity.MEDIUM ? 1 : 2),
      sz: store.storeCanvasSize === CanvasSize.LARGE ? 2 : (store.storeCanvasSize === CanvasSize.MEDIUM ? 1 : 0),
      ddev: store.storeDefaultDataEntryView === DataEntryView.GRID ? 2 : (store.storeDefaultDataEntryView === DataEntryView.GUIDED_WALK ? 1 : 0),
      cs: store.storeCanvasShape === CanvasShape.SQUARE ? 1 : 0,
      md: store.storeMainDisplayMode === MainDisplayMode.CANVAS_ONLY ? 1 : 0,
      df: store.storePlotDisplayField,
      lc: store.storeLocale,
      th: store.storeTheme,
      hc: store.storeHideCitationMessage ? 1 : 0,
      hh: store.storeHideHelpInformation ? 1 : 0,
      hi: store.storeHighlightControls ? 1 : 0,
      mi: store.storeDisplayMarkerIndicators ? 1 : 0,
      hw: (store.storeHomeWidgetOrder || []).join(','),
      cw: store.storeDisplayMinCellWidth,
      ge: store.storeGpsEnabled ? 1 : 0,
      vf: store.storeVoiceFeedbackEnabled ? 1 : 0,
      rm: store.storeRestrictInputToMarked ? 1 : 0,
      nm: store.storeNavigationMode === NavigationMode.DRAG ? 1 : 0,
      tc: store.storeTraitColors.map(c => c.replace('#', '')).join(','),
      tg: store.storeTraitGroupMode === TraitGroupMode.SECTIONS ? 1 : 0,
      ft: store.storeShowFullTraitDescription ? 1 : 0,
      lb: store.storeLargeButtonsForIntTraits ? 1 : 0,
      cc: store.storeCategoryCountInline,
      enb: store.storeEnterBarcode,
      esb: store.storeEscapeBarcode,
      ass: store.storeAutoSelectSearch,
      asf: store.storeAutoSelectFirstInput,
      api: store.storeAutoProgressInputs,
      pm: store.storePerformanceMode ? 1 : 0,
      pc: store.storeThemeColor,
    })
  })

  function onDetect (detectedCodes: DetectedBarcode[]) {
    if (detectedCodes && detectedCodes.length > 0) {
      const c = detectedCodes[0]?.rawValue

      if (c) {
        try {
          const parsed = JSON.parse(c)

          console.log(parsed)

          if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
            errorMessage.value = 'errorMessageInvalidSettingsQR'
            return
          }

          if (parsed.pc) {
            store.setThemeColor(parsed.pc)
          }
          if (parsed.dm) {
            store.setTheme(parsed.th)
          }
          if (parsed.pm === 1) {
            store.setPerformanceMode(true)
          } else if (parsed.pm === 0) {
            store.setPerformanceMode(false)
          }
          if (parsed.lc) {
            store.setLocale(parsed.lc)
            loadLanguageAsync(parsed.lc)
          }
          if (parsed.hw) {
            store.setHomeWidgetOrder(parsed.hw.split(','))
          }
          if (parsed.mi === 1) {
            store.setDisplayMarkerIndicators(true)
          } else if (parsed.mi === 0) {
            store.setDisplayMarkerIndicators(false)
          }
          if (parsed.cw !== undefined && parsed.cw !== null) {
            store.setDisplayMinCellWidth(+parsed.cw)
          }
          if (parsed.cc !== undefined && parsed.cc !== null) {
            store.setCategoryCountInline(+parsed.cc)
          }
          if (parsed.ge === 1) {
            store.setGpsEnabled(true)
          } else if (parsed.ge === 0) {
            store.setGpsEnabled(false)
          }
          if (parsed.vf === 1) {
            store.setVoiceFeedbackEnabled(true)
          } else if (parsed.vf === 0) {
            store.setVoiceFeedbackEnabled(false)
          }
          if (parsed.hc === 1) {
            store.setHideCitationMessage(true)
          } else if (parsed.hc === 0) {
            store.setHideCitationMessage(false)
          }
          if (parsed.hh === 1) {
            store.setHideHelpInformation(true)
          } else if (parsed.hh === 0) {
            store.setHideHelpInformation(false)
          }
          if (parsed.hi === 1) {
            store.setHighlightControls(true)
          } else if (parsed.hi === 0) {
            store.setHighlightControls(false)
          }
          if (parsed.rm === 1) {
            store.setRestrictInputToMarked(true)
          } else if (parsed.rm === 0) {
            store.setRestrictInputToMarked(false)
          }
          if (parsed.nm === 1) {
            store.setNavigationMode(NavigationMode.DRAG)
          } else if (parsed.nm === 0) {
            store.setNavigationMode(NavigationMode.JUMP)
          }
          if (parsed.tg === 1) {
            store.setTraitGroupMode(TraitGroupMode.SECTIONS)
          } else if (parsed.tg === 0) {
            store.setTraitGroupMode(TraitGroupMode.TABS)
          }
          if (parsed.cd === 0) {
            store.setCanvasDensity(CanvasDensity.HIGH)
          } else if (parsed.cd === 1) {
            store.setCanvasDensity(CanvasDensity.MEDIUM)
          } else if (parsed.cd === 2) {
            store.setCanvasDensity(CanvasDensity.LOW)
          }
          if (parsed.ddev === 0) {
            store.setDefaultDataEntryView(DataEntryView.SCAN_SEARCH)
          } else if (parsed.cd === 1) {
            store.setDefaultDataEntryView(DataEntryView.GUIDED_WALK)
          } else if (parsed.cd === 2) {
            store.setDefaultDataEntryView(DataEntryView.GRID)
          }
          if (parsed.cs === 0) {
            store.setCanvasShape(CanvasShape.CIRCLE)
          } else if (parsed.cs === 1) {
            store.setCanvasShape(CanvasShape.SQUARE)
          }
          if (parsed.sz === 0) {
            store.setCanvasSize(CanvasSize.SMALL)
          } else if (parsed.sz === 1) {
            store.setCanvasSize(CanvasSize.MEDIUM)
          } else if (parsed.sz === 2) {
            store.setCanvasSize(CanvasSize.LARGE)
          }
          if (parsed.md === 0) {
            store.setMainDisplayMode(MainDisplayMode.AUTO)
          } else if (parsed.md === 1) {
            store.setMainDisplayMode(MainDisplayMode.CANVAS_ONLY)
          }
          if (parsed.df) {
            store.setPlotDisplayField(parsed.df)
          }
          if (parsed.tc) {
            const traitColors = parsed.tc.split(',').map((c: string) => `#${c}`)
            store.setTraitColors(traitColors)
          }

          if (parsed.ft === 1) {
            store.setShowFullTraitDescription(true)
          } else if (parsed.ft === 0) {
            store.setShowFullTraitDescription(false)
          }

          if (parsed.lb === 1) {
            store.setLargeButtonsForIntTraits(true)
          } else if (parsed.lb === 0) {
            store.setLargeButtonsForIntTraits(false)
          }
          if (parsed.enb) {
            store.setEnterBarcode(parsed.enb)
          }
          if (parsed.esb) {
            store.setEscapeBarcode(parsed.esb)
          }
          if (parsed.ass === 1) {
            store.setAutoSelectSearch(true)
          } else if (parsed.ass === 0) {
            store.setAutoSelectSearch(false)
          }
          if (parsed.asf === 1) {
            store.setAutoSelectFirstInput(true)
          } else if (parsed.asf === 0) {
            store.setAutoSelectFirstInput(false)
          }
          if (parsed.api === 1) {
            store.setAutoProgressInputs(true)
          } else if (parsed.api === 0) {
            store.setAutoProgressInputs(false)
          }

          emit('data-changed')

          emitter.emit('plausible-event', { key: 'settings-shared', props: { type: 'load' } })
        } catch {
          errorMessage.value = 'errorMessageInvalidSettingsQR'
        }
      }
    }
  }

  onMounted(() => emitter.emit('plausible-event', { key: 'settings-shared', props: { type: compProps.shareConfig === 'export' ? 'share' : 'load' } }))

  onBeforeMount(() => {
    errorMessage.value = undefined
    size.value = Math.min(window.innerHeight * 0.5, window.innerWidth * 0.9)
  })

  const emit = defineEmits(['data-changed'])
</script>
