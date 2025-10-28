<template>
  <v-card
    :model-value:loading="localLoading"
    @update:loading="notifyLoading"
  >
    <v-toolbar density="comfortable" color="surface" class="trait-toolbar">
      <v-toolbar-title class="ms-4">
        <slot name="toolbar-title">
          <v-icon size="x-small" start :color="headerIconColor" :icon="compProps.headerIcon" /> {{ compProps.title ? $t(compProps.title) : undefined }}<slot name="title-append" />
        </slot>
      </v-toolbar-title>
      <slot name="toolbar-prepend" />
      <v-switch
        hide-details
        color="primary"
        v-model="interactive"
        v-tooltip:top="$t('formCheckboxChartInteractEnabled')"
      />
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" :icon="mdiDotsVertical" />
        </template>

        <v-list>
          <slot name="list-prepend" />
          <v-list-item :disabled="!canDownload" @click="downloadChart('png')" :title="$t('buttonDownloadPng')" :prepend-icon="mdiFileImage" v-if="compProps.supportsPngDownload" />
          <v-list-item :disabled="!canDownload" @click="downloadChart('svg')" :title="$t('buttonDownloadSvg')" :prepend-icon="mdiFileCode" v-if="compProps.supportsSvgDownload" />
          <v-list-item :disabled="!canDownload" @click="downloadSource" :title="$t('buttonDownloadFile')" :prepend-icon="mdiFileDocument" v-if="compProps.supportsFileDownload" />
          <slot name="list-append" />
        </v-list>
      </v-menu>
      <slot name="toolbar-append" />
    </v-toolbar>

    <slot name="card-text" />

    <v-card-text>
      <slot name="chart-content" ref="chart" />
    </v-card-text>

    <v-card-actions>
      <slot name="card-actions" />
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
  import { downloadBlob, downloadSvgsFromContainer, type DownloadBlob } from '@/plugins/file'
  import { getDateTimeString } from '@/plugins/formatting'
  import { coreStore } from '@/stores/app'
  import { mdiChartAreaspline, mdiDotsVertical, mdiFileCode, mdiFileDocument, mdiFileImage } from '@mdi/js'
  import Plotly from 'plotly.js/lib/core'

  const emit = defineEmits(['update:loading', 'force-redraw'])

  interface ChartProps {
    loading?: boolean
    title?: string
    downloadWidth?: number
    downloadHeight?: number
    supportsSvgDownload?: boolean
    supportsPngDownload?: boolean
    supportsFileDownload?: boolean
    canDownload?: boolean
    filename: string
    sourceFile?: DownloadBlob
    chartId: string
    headerIcon?: string
    headerIconColor?: string
  }

  const compProps = withDefaults(defineProps<ChartProps>(), {
    loading: false,
    downloadWidth: 1280,
    downloadHeight: 600,
    supportsPngDownload: true,
    supportsSvgDownload: true,
    supportsFileDownload: true,
    canDownload: false,
    headerIcon: mdiChartAreaspline,
    headerIconColor: 'primary',
  })

  const store = coreStore()

  const localLoading = ref(false)
  const interactive = defineModel('interactive')

  watch(() => compProps.loading, async (newValue: boolean) => {
    localLoading.value = newValue
  })

  function notifyLoading (value: boolean) {
    emit('update:loading', value)
  }

  function downloadChart (imageType: string) {
    const element = document.querySelector(`#${compProps.chartId}`)

    if (element) {
      if (imageType === 'svg') {
        downloadSvgsFromContainer(element, true, compProps.filename + '-' + getDateTimeString())
      } else if (imageType === 'png') {
        const chart = element.classList.contains('js-plotly-plot') ? element : element.querySelector('.js-plotly-plot')
        if (chart) {
          // @ts-ignore
          Plotly.downloadImage(chart, { format: 'png', filename: compProps.filename + '-' + getDateTimeString() })
        }
      }
    }
  }

  function downloadSource () {
    const request = compProps.sourceFile

    if (!request) {
      return
    }

    request.filename = request.filename + '-' + getDateTimeString()

    if (!request.extension) {
      request.extension = 'txt'
    }

    downloadBlob(request)
  }

  watch(() => store.storeIsDarkMode, async () => nextTick(() => emit('force-redraw')))
  watch(() => store.storeLocale, async () => nextTick(() => emit('force-redraw')))

  watch(interactive, async newValue => {
    const element = document.querySelector(`#${compProps.chartId}`)

    if (element) {
      const layoutDelta = {
        'xaxis.fixedrange': !newValue,
        'yaxis.fixedrange': !newValue,
      }

      // @ts-ignore
      Plotly.relayout(element, layoutDelta)
    }
  })
</script>

<style>
.trait-toolbar .v-toolbar__content {
  height: auto !important;
}
</style>
