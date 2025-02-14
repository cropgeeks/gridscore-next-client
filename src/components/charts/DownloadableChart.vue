<template>
  <div class="base-chart">
    <div class="text-end">
      <!-- Chart options -->
      <b-button-group>
        <b-dropdown no-caret right v-b-tooltip.hover="$t('chartTooltipOptions')">
          <template v-slot:button-content>
            <IBiDownload />
          </template>
          <!-- Download options -->
          <b-dropdown-item @click="downloadPng"><IBiFileEarmarkImage /> {{ $t('buttonDownloadPng') }}</b-dropdown-item>
          <b-dropdown-item @click="downloadSvg"><IBiFileEarmarkCode /> {{ $t('buttonDownloadSvg') }}</b-dropdown-item>
        </b-dropdown>
      </b-button-group>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { downloadSvgsFromContainer } from '@/plugins/misc';
import Plotly from 'plotly.js/lib/core'

const props = defineProps<{
  elementId: string,
  filename: string
}>()

const downloadPng = () => {
  if (props.elementId) {
    const el = document.querySelector('#' + props.elementId)

    if (el) {
      const chart = el.classList.contains('js-plotly-plot') ? el : el.querySelector('.js-plotly-plot')
      // @ts-ignore
      Plotly.downloadImage(chart, { format: 'png', filename: props.filename })
    }
  }
}

const downloadSvg = () => {
  if (props.elementId) {
    const el = document.querySelector('#' + props.elementId)

    if (el) {
      downloadSvgsFromContainer(el, true, props.filename)
    }
  }
}
</script>