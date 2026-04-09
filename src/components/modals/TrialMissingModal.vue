<template>
  <v-dialog v-model="dialog" max-width="min(75vw, 720px)" scrollable>
    <UseOnline v-slot="{ isOnline }">
      <v-card :title="$t('modalTitleMissingTrial')">
        <template #text>
          <v-alert
            v-if="isOnline === false"
            color="error"
            :icon="mdiLanDisconnect"
            density="compact"
            :text="$t('modalTextNetworkUnavailableWarning')"
            variant="tonal"
            border="start"
          />

          <p>{{ $t('pageArchiveTrialNotFound') }}</p>

          <p v-if="!shareCode" class="text-warning">
            {{ $t('pageArchiveNoPermission') }}
          </p>
          <div v-else-if="archiveExists === undefined">
            <v-progress-linear color="primary" indeterminate class="mt-3" height="25">
              <template #default>
                {{ $t('progressLabelCheckingForArchive') }}
              </template>
            </v-progress-linear>
          </div>
          <div v-else-if="archiveExists === true && archiveInformation">
            <v-card :title="$t('pageArchiveTitle')" :subtitle="$t('pageArchiveSubtitle')" :prepend-icon="mdiArchive">
              <v-list>
                <v-list-item :prepend-icon="mdiFileCog" :title="$t('pageArchiveTextSize')" :subtitle="fileSize" />
                <v-list-item :prepend-icon="mdiArchiveLock" :title="$t('pageArchiveTextExportedOn')" :subtitle="new Date(archiveInformation.trialExportedOn).toLocaleDateString()" />
                <v-list-item :prepend-icon="mdiRepeat" :title="$t('pageArchiveTextUpdatedOn')" :subtitle="new Date(archiveInformation.trialUpdatedOn).toLocaleDateString()" />
              </v-list>

              <template #actions v-if="archiveUrl">
                <v-spacer />
                <v-btn :href="archiveUrl" :text="$t('buttonDownload')" :prepend-icon="mdiDownload" color="primary" variant="tonal" />
              </template>
            </v-card>
          </div>
          <p v-else-if="archiveExists === false">{{ $t('pageArchiveNoArchiveFound') }}</p>
        </template>

        <v-card-actions>
          <v-spacer />
          <v-btn :text="$t('buttonClose')" @click="hide()" color="primary" variant="tonal" />
        </v-card-actions>
      </v-card>
    </UseOnline>
  </v-dialog>
</template>

<script setup lang="ts">
  import type { TrialPlus } from '@/plugins/types/client'
  import { UseOnline } from '@vueuse/components'
  import emitter from 'tiny-emitter/instance'
  import type { ArchiveInformation } from '@/plugins/types/gridscore'
  import { checkTrialArchiveExists } from '@/plugins/api'
  import { coreStore } from '@/stores/app'
  import { mdiArchive, mdiArchiveLock, mdiDownload, mdiFileCog, mdiLanDisconnect, mdiRepeat } from '@mdi/js'
  import { getNumberWithSuffix } from '@/plugins/formatting'

  const store = coreStore()

  const trial = ref<TrialPlus>()
  const serverError = ref<string>()
  const archiveExists = ref<boolean>()
  const archiveUrl = ref<string>()
  const archiveInformation = ref<ArchiveInformation>()

  const dialog = ref(false)

  const shareCode = computed(() => trial.value?.shareCodes?.ownerCode || trial.value?.shareCodes?.editorCode)
  const fileSize = computed(() => archiveInformation.value ? getNumberWithSuffix(archiveInformation.value.fileSize, 2, 1024) : undefined)

  function show (t: TrialPlus) {
    trial.value = t
    serverError.value = undefined
    archiveExists.value = undefined
    archiveUrl.value = undefined
    archiveInformation.value = undefined

    dialog.value = true

    nextTick(() => checkBackup())
  }
  function hide () {
    dialog.value = false
  }

  function checkBackup () {
    let remoteConfig = undefined

    if (trial.value && trial.value.remoteUrl) {
      remoteConfig = {
        remoteUrl: trial.value.remoteUrl,
        token: trial.value.remoteToken || undefined,
      }
    }

    checkTrialArchiveExists(remoteConfig, shareCode.value || '')
      .then(result => {
        archiveExists.value = true
        archiveInformation.value = result
        archiveUrl.value = `${store.storeServerUrl}trial/${shareCode.value}/export/archive`
      })
      .catch(err => {
        if (err && err.status === 404) {
          archiveExists.value = false
          archiveUrl.value = undefined
          archiveInformation.value = undefined
        }
      })
  }

  onMounted(() => {
    emitter.on('show-missing-trial', show)
  })

  onBeforeUnmount(() => {
    emitter.off('show-missing-trial', show)
  })

  defineExpose({
    show,
    hide,
  })
</script>
