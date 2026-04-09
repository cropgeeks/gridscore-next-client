<template>
  <v-dialog v-model="dialog" max-width="min(75vw, 720px)" scrollable>
    <v-card :title="$t('modalTitleTrialExpiration')" v-if="trial">
      <template #text>
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

          <p>{{ $t('modalTextTrialExpiration') }}</p>

          <p class="text-error">{{ $t('modalTextTrialExpirationDate', { date: new Date(trial.expiresOn || 0).toLocaleDateString() }) }}</p>

          <template v-if="trial.shareStatus === ShareStatus.EDITOR || trial.shareStatus === ShareStatus.OWNER">
            <v-card>
              <template #title>
                <div class="d-flex justify-space-between">
                  <span>{{ $t('formLabelTrialExpirationCaptcha') }}</span>
                  <v-btn size="small" class="mb-2" :icon="mdiRefresh" @click="getNewCaptcha" />
                </div>
              </template>

              <template #text>
                <v-img
                  :src="captchaUrl"
                  max-height="50px"
                >
                  <template #placeholder>
                    <div class="d-flex align-center justify-center fill-height">
                      <v-progress-circular
                        color="grey-lighten-4"
                        indeterminate
                      />
                    </div>
                  </template>
                </v-img>

                <v-text-field
                  v-model="captcha"
                  :label="$t('formLabelTrialExpirationCaptcha')"
                  :hint="$t('formDescriptionTrialExpirationCaptcha')"
                  persistent-hint
                  required
                />
              </template>
            </v-card>
          </template>
          <div v-else>
            <p class="text-warning">{{ $t('modalTextTrialExpirationNotAuthorized') }}</p>
          </div>
        </UseOnline>
      </template>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('buttonCancel')" @click="hide" variant="tonal" />
        <v-btn :text="$t('buttonExtendLifetime')" @click="extendLifetime" color="primary" :disabled="!captcha" variant="tonal" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { UseOnline } from '@vueuse/components'
  import { ShareStatus, type TrialPlus } from '@/plugins/types/client'
  import emitter from 'tiny-emitter/instance'
  import { mdiLanDisconnect, mdiRefresh } from '@mdi/js'
  import { coreStore } from '@/stores/app'
  import { extendTrialPeriod } from '@/plugins/api'

  const compProps = defineProps<{
    trial: TrialPlus
  }>()

  const store = coreStore()
  const error = ref<string>()
  const captcha = ref<string>()
  const captchaUrl = ref<string>()

  const dialog = ref(false)

  const shareCode = computed(() => compProps.trial?.shareCodes?.ownerCode || compProps.trial?.shareCodes?.editorCode)

  function getNewCaptcha () {
    captchaUrl.value = `${store.storeServerUrl}trial/${shareCode.value}/captcha?ts=${Date.now()}&darkMode=${store.storeIsDarkMode === true}`
  }

  function extendLifetime () {
    error.value = undefined
    emitter.emit('show-loading', true)

    let remoteConfig = undefined

    if (compProps.trial && compProps.trial.remoteUrl) {
      remoteConfig = {
        remoteUrl: compProps.trial.remoteUrl,
        token: compProps.trial.remoteToken || undefined,
      }
    }

    extendTrialPeriod(remoteConfig, shareCode.value || '', { captcha: captcha.value || '' })
      .then(() => {
        hide()
        emitter.emit('trials-updated')
      })
      .catch(err => {
        console.error(err)
        console.log(err.status)
      })
      .finally(() => emitter.emit('show-loading', false))
  }

  function show () {
    error.value = undefined
    captcha.value = undefined
    dialog.value = true

    getNewCaptcha()
  }
  function hide () {
    dialog.value = false
  }

  defineExpose({
    show,
    hide,
  })
</script>
