<template>
  <v-btn v-if="trial && trial.transactionCount !== undefined && trial.transactionCount > 0" :prepend-icon="mdiCloudUpload" @click="synchronize" color="info" variant="tonal" :text="$t('toolbarSyncInfo', trial.transactionCount)" />
</template>

<script setup lang="ts">
  import { getTrialById } from '@/plugins/idb'
  import type { TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'
  import { mdiCloudUpload } from '@mdi/js'

  import emitter from 'tiny-emitter/instance'

  const store = coreStore()

  const trial = ref<TrialPlus>()

  function loadTrial () {
    getTrialById(store.storeSelectedTrial || '').then(t => {
      trial.value = t
    })
  }

  function synchronize () {
    emitter.emit('synchronize-trial', trial.value)
  }

  onBeforeUnmount(() => {
    emitter.off('trial-data-loaded', loadTrial)
    emitter.off('trial-properties-changed', loadTrial)
    emitter.off('plot-cache-changed', loadTrial)
  })

  onMounted(() => {
    if (store.storeSelectedTrial) {
      loadTrial()
    }

    emitter.on('trial-data-loaded', loadTrial)
    emitter.on('trial-properties-changed', loadTrial)
    emitter.on('plot-cache-changed', loadTrial)
  })
</script>
