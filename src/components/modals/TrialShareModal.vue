<template>
  <v-dialog v-model="dialog" max-width="min(75vw, 720px)" scrollable>
    <v-card :title="$t('modalTitleTrialShare')">
      <template #text>
        <div v-if="shareCodes">
          <p v-html="$t('modalTextTrialShareCodes')" />
          <v-btn-toggle v-model="selectedShareStatus" variant="tonal" color="primary" mandatory class="d-flex justify-content-around">
            <v-btn stacked class="flex-grow-1" :value="ShareStatus.OWNER" :prepend-icon="shareStatusTypes[ShareStatus.OWNER]?.icon" :text="$t(shareStatusTypes[ShareStatus.OWNER]?.text || '')" />
            <v-btn stacked class="flex-grow-1" :value="ShareStatus.EDITOR" :prepend-icon="shareStatusTypes[ShareStatus.EDITOR]?.icon" :text="$t(shareStatusTypes[ShareStatus.EDITOR]?.text || '')" />
            <v-btn stacked class="flex-grow-1" :value="ShareStatus.VIEWER" :prepend-icon="shareStatusTypes[ShareStatus.VIEWER]?.icon" :text="$t(shareStatusTypes[ShareStatus.VIEWER]?.text || '')" />
          </v-btn-toggle>

          <StyledQRCode class="mt-3" :base-url="remoteUrlWithoutApi" :text="selectedShareCode" v-if="selectedShareCode" />
        </div>

        <!-- We don't have the codes yet, so need to be able to share the trial -->
        <UseOnline v-slot="{ isOnline }" v-else>
          <v-alert
            v-if="isOnline === false"
            color="error"
            icon="mdi-lan-disconnect"
            density="compact"
            :text="$t('modalTextNetworkUnavailableWarning')"
            variant="tonal"
            border="start"
          />

          <p v-html="$t('modalTextTrialShare')" />

          <div class="mb-3">
            <v-switch v-model="shareWithRemote" color="primary" hide-details :label="$t('formCheckboxShareWithRemote')" />

            <v-card class="mb-3" v-if="shareWithRemote">
              <template #text>
                <v-text-field class="mb-3" v-model="remoteUrl" :messages="['f']" :label="$t('formLabelTrialShareRemoteUrl')" persistent-hint>
                  <template #message>
                    <span v-html="$t('formDescriptionTrialShareRemoteUrl')" />
                  </template>
                </v-text-field>

                <v-text-field v-model="remoteToken" :messages="['f']" :label="$t('formLabelTrialShareRemoteToken')" persistent-hint>
                  <template #message>
                    <span v-html="$t('formDescriptionTrialShareRemoteToken')" />
                  </template>
                </v-text-field>
              </template>
            </v-card>

            <div v-if="error" class="my-3 text-error">{{ error }}</div>

            <v-btn color="primary" prepend-icon="mdi-qrcode" :text="$t('buttonGenerateShareCodes')" @click="share" />
          </div>
        </UseOnline>
      </template>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('buttonClose')" @click="hide" color="primary" variant="tonal" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { UseOnline } from '@vueuse/components'
  import type { ShareCodes } from '@/plugins/types/gridscore'
  import { ShareStatus, type TrialPlus } from '@/plugins/types/client'
  import { shareStatusTypes } from '@/plugins/types/types'
  import { useI18n } from 'vue-i18n'
  import { shareTrial } from '@/plugins/api'
  import emitter from 'tiny-emitter/instance'

  const { t } = useI18n()

  const compProps = defineProps<{
    trial: TrialPlus
  }>()
  const selectedShareStatus = ref<ShareStatus>()
  const shareCodes = ref<ShareCodes>()

  // Remove sharing
  const shareWithRemote = ref<boolean>(false)
  const remoteUrl = ref<string>()
  const remoteToken = ref<string>()

  const error = ref<string>()

  const dialog = ref(false)

  const selectedShareCode = computed(() => {
    if (selectedShareStatus.value) {
      switch (selectedShareStatus.value) {
        case ShareStatus.OWNER:
          return shareCodes.value?.ownerCode
        case ShareStatus.EDITOR:
          return shareCodes.value?.editorCode
        case ShareStatus.VIEWER:
          return shareCodes.value?.viewerCode
      }
    }

    return undefined
  })

  const remoteUrlWithoutApi = computed(() => {
    if (compProps.trial && compProps.trial.remoteUrl) {
      return compProps.trial.remoteUrl.replace('/api/', '/')
    } else {
      return undefined
    }
  })

  function share () {
    error.value = undefined
    emitter.emit('show-loading', true)
    shareTrial({ remoteUrl: shareWithRemote.value ? remoteUrl.value : undefined, token: remoteToken.value }, compProps.trial.localId || '')
      .then(trial => {
        if (trial) {
          shareCodes.value = trial.shareCodes
          emitter.emit('plausible-event', { key: 'trial-shared' })
        }
      })
      .catch(error => {
        if (error.status === 401) {
          error.value = t('errorMessageRemoteTrialInvalidToken')
        } else {
          error.value = error.message
          console.error(error)
        }
      })
      .finally(() => emitter.emit('show-loading', false))
  }

  function show () {
    selectedShareStatus.value = undefined
    shareWithRemote.value = false
    remoteUrl.value = undefined
    remoteToken.value = undefined
    error.value = undefined
    shareCodes.value = compProps.trial.shareCodes
    dialog.value = true
  }
  function hide () {
    dialog.value = false
  }

  defineExpose({
    show,
    hide,
  })
</script>
