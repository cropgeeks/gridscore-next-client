<template>
  <v-container max-width="1280">
    <h1 class="text-h4 mb-3">{{ $t('pageImportTitle') }}</h1>
    <v-divider class="mb-3" />
    <p>{{ $t('pageImportText') }}</p>

    <!-- We don't have the codes yet, so need to be able to share the trial -->
    <UseOnline v-slot="{ isOnline }">
      <v-alert
        v-if="isOnline === false"
        color="error"
        :icon="mdiLanDisconnect"
        density="compact"
        :text="$t('modalTextNetworkUnavailableWarning')"
        variant="tonal"
        border="start"
      />
      <div v-else>
        <v-switch v-model="loadFromRemote" color="primary" :label="$t('formCheckboxLoadFromRemote')" />

        <v-card class="mb-5" v-if="loadFromRemote" :title="$t('pageImportRemoteConfigTitle')">
          <template #subtitle>
            <span class="text-wrap">{{ $t('pageImportRemoteConfigText') }}</span>
          </template>
          <template #text>
            <v-text-field class="mb-3" v-model="remoteUrl" type="url" :label="$t('formLabelTrialLoadRemoteUrl')" :hint="$t('formDescriptionTrialLoadRemoteUrl')" persistent-hint />
            <v-text-field class="mb-3" v-model="remoteToken" type="url" :label="$t('formLabelTrialLoadRemoteToken')" :hint="$t('formDescriptionTrialLoadRemoteToken')" persistent-hint />
          </template>
        </v-card>

        <QRScanInput
          v-model="shareCode"
          :label="$t('formLabelTrialImportCode')"
          :hint="$t('formDescriptionTrialImportCode')"
          :tooltip="$t('buttonScanQR')"
          @code-scanned="getTrial"
        />

        <p class="text-error mt-3 mb-0" v-if="serverError"><span v-html="serverError" /></p>

        <v-btn color="primary" class="mt-3" :disabled="!shareCode || loading" :text="$t('buttonCheckShareCode')" :prepend-icon="mdiMagnify" @click="getTrial" />
      </div>
    </UseOnline>

    <v-bottom-sheet
      v-model="bottomSheetVisible"
      inset
      scrollable
      max-height="75vh"
    >
      <v-card>
        <template #title>
          <div class="d-flex justify-space-between flex-wrap">
            <div>{{ $t('modalTitleTrialPreview') }}</div>
            <div>
              <v-btn :text="$t('modalTextTrialImportPermissionUpgradeNew')" :prepend-icon="mdiNotebookPlus" color="primary" @click="importAsNew" v-if="trial" />
            </div>
          </div>
        </template>
        <template #text>
          <v-banner class="mb-3" bg-color="info" color="white" :text="infoMessage" v-if="infoMessage" :icon="mdiInformation">
            <template #actions v-if="noChangeRequired">
              <v-btn :text="$t('buttonLoadTrial')" :prepend-icon="mdiNotebookCheck" @click="navigateToLocal" />
              <v-btn :text="$t('modalTextTrialImportPermissionUpgradeNew')" :prepend-icon="mdiNotebookPlus" @click="importAsNew" />
            </template>
            <template #actions v-else-if="!trial">
              <v-btn :text="$t('buttonLoadTrial')" :prepend-icon="mdiNotebookCheck" @click="navigateToLocal" />
            </template>
          </v-banner>

          <template v-if="trial">
            <p>{{ $t('modalTextTrialPreview') }}</p>

            <v-combobox class="my-3" v-model="trialGroup" autocomplete="off" :label="$t('formLabelTrialSetupTrialGroup')" :prepend-icon="mdiFolderTable" :hint="$t('formDescriptionTrialSetupTrialGroup')" persistent-hint :items="trialGroups" />

            <TrialCard :trial="trial" :interactive="false" :can-share="false" :show-actions="false" />
          </template>
        </template>
      </v-card>
    </v-bottom-sheet>
  </v-container>
</template>

<script setup lang="ts">
  import { getTrialByCode } from '@/plugins/api'
  import { addTrial, getTrialGroups, getTrials, updateTrial } from '@/plugins/idb'
  import { ShareStatus, type TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'
  import { UseOnline } from '@vueuse/components'
  import { useI18n } from 'vue-i18n'

  import emitter from 'tiny-emitter/instance'
  import { mdiFolderTable, mdiInformation, mdiLanDisconnect, mdiMagnify, mdiNotebookCheck, mdiNotebookPlus } from '@mdi/js'
  import QRScanInput from '@/components/inputs/QRScanInput.vue'

  const compProps = defineProps<{
    code?: string
  }>()

  const store = coreStore()
  const router = useRouter()
  const { t } = useI18n()

  const shareCode = ref<string>()
  const loadFromRemote = ref(false)
  const remoteUrl = ref<string>()
  const remoteToken = ref<string>()
  const bottomSheetVisible = ref(false)
  const trialGroup = ref<string>()
  const noChangeRequired = ref(false)
  const loading = ref(false)

  const existingTrials = ref<TrialPlus[]>([])
  const trial = ref<TrialPlus>()
  const localTrialMatch = ref<TrialPlus>()
  const remotePermissionType = ref<ShareStatus>()
  const trialGroups = ref<string[]>([])
  const serverError = ref<string>()
  const infoMessage = ref<string>()

  function getTrial () {
    if (!shareCode.value) {
      return
    }

    serverError.value = undefined
    infoMessage.value = undefined
    noChangeRequired.value = false

    let remoteUrlWithApi = undefined
    if (remoteUrl.value) {
      if (!remoteUrl.value.endsWith('/')) {
        remoteUrl.value += '/'
      }

      remoteUrlWithApi = remoteUrl.value
      if (!remoteUrlWithApi.endsWith('api/')) {
        remoteUrlWithApi += 'api/'
      }
    }

    loading.value = true
    emitter.emit('show-loading', true)

    getTrialByCode({ remoteUrl: remoteUrlWithApi || undefined, token: remoteToken.value }, shareCode.value)
      .then((result: TrialPlus) => {
        if (result) {
          result.remoteUrl = remoteUrlWithApi
          result.remoteToken = remoteToken.value
        }

        trial.value = result

        const match = existingTrials.value.filter(t => {
          if (t.shareCodes && result.shareCodes) {
            if (t.shareCodes.ownerCode && result.shareCodes.ownerCode && (t.shareCodes.ownerCode === result.shareCodes.ownerCode)) {
              return true
            } else if (t.shareCodes.editorCode && result.shareCodes.editorCode && (t.shareCodes.editorCode === result.shareCodes.editorCode)) {
              return true
            } else if (t.shareCodes.viewerCode && result.shareCodes.viewerCode && (t.shareCodes.viewerCode === result.shareCodes.viewerCode)) {
              return true
            } else {
              return false
            }
          } else {
            return false
          }
        })

        if (match && match.length > 0 && match[0] && match[0].shareStatus) {
          localTrialMatch.value = JSON.parse(JSON.stringify(match[0])) as TrialPlus

          switch (shareCode.value) {
            case result.shareCodes?.ownerCode:
              remotePermissionType.value = ShareStatus.OWNER
              break
            case result.shareCodes?.editorCode:
              remotePermissionType.value = ShareStatus.EDITOR
              break
            case result.shareCodes?.viewerCode:
              remotePermissionType.value = ShareStatus.VIEWER
              break
            default:
              remotePermissionType.value = ShareStatus.NOT_SHARED
              break
          }

          bottomSheetVisible.value = true

          // TODO
          if (match[0].shareStatus === remotePermissionType.value) {
            // Loaded a trial that already exists with the same permissions
            infoMessage.value = t('toastTextTrialShareCodeSameOrHigherPermission')
            noChangeRequired.value = true
          } else if (isHigherPermission(remotePermissionType.value, match[0].shareStatus)) {
            const localPermission = localTrialMatch.value.shareStatus
            // The new code that was used is a higher permission grade than the local one, so just use them (auto-upgrade)
            localTrialMatch.value.shareCodes = JSON.parse(JSON.stringify(trial.value.shareCodes))

            updateTrial(localTrialMatch.value.localId || '', toRaw(localTrialMatch.value))
              .then(() => {
                trial.value = undefined
                infoMessage.value = t('modalTextTrialImportPermissionUpgrade', { local: localPermission, remote: remotePermissionType.value })
              })
          } else {
            // The new code that was used is a lower permission grade than the local one, don't do anything, as this is pointless. Notify user.
            infoMessage.value = t('toastTextTrialShareCodeSameOrHigherPermission')
            noChangeRequired.value = true
          }
        } else {
          // TODO
          // nextTick(() => this.$refs.confirmationModal.show())
          bottomSheetVisible.value = true
        }
      })
      .catch(error => {
        if (error.status === 401) {
          serverError.value = t('errorMessageRemoteTrialInvalidToken')
        } else if (error.status === 404) {
          serverError.value = t('apiErrorTrialNotFound')
        } else {
          serverError.value = t('modalTextApiError', { error: JSON.stringify(error, Object.getOwnPropertyNames(error)) })
        }
        window.scrollTo(0, document.body.scrollHeight)
      })
      .finally(() => {
        loading.value = false
        emitter.emit('show-loading', false)
      })
  }

  function isHigherPermission (one: ShareStatus, two: ShareStatus) {
    return (one === ShareStatus.OWNER && (two === ShareStatus.EDITOR || two === ShareStatus.VIEWER)) || (one === ShareStatus.EDITOR && two === ShareStatus.VIEWER)
  }

  async function navigateToLocal () {
    if (localTrialMatch.value) {
      await store.setSelectedTrial(localTrialMatch.value.localId)
      router.push('/collect/grid')
    }
  }

  function importAsNew () {
    if (!trial.value) {
      return
    }

    if (trialGroup.value) {
      trial.value.group = {
        name: trialGroup.value,
      }
    }

    addTrial(trial.value)
      .then(async trialId => {
        await store.setSelectedTrial(trialId)
        router.push('/collect/grid')
      })
  }

  watch(() => compProps.code, async newValue => {
    shareCode.value = newValue
  }, { immediate: true })

  onMounted(() => {
    getTrials().then(trials => {
      existingTrials.value = (trials || []).filter(t => t.shareCodes !== undefined && t.shareStatus !== ShareStatus.NOT_SHARED)
    })
    getTrialGroups().then(groups => {
      trialGroups.value = groups || []
    })
  })
</script>
