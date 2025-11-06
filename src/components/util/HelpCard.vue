<template>
  <v-card
    v-if="store.storeHideHelpInformation !== true"
    class="mb-5"
    :prepend-icon="mdiHelpCircle"
  >
    <template #title>
      <div class="d-flex justify-space-between align-center">
        <span>{{ $t('widgetHelpInformationTitle') }}</span>
        <v-btn
          :icon="mdiClose"
          variant="text"
          size="x-small"
          @click="hideHelp"
          v-tooltip:top="$t('tooltipDontShowAgain')"
        />
      </div>
    </template>
    <template #subtitle>
      <span class="text-wrap">{{ $t('widgetHelpInformationText') }}</span>
    </template>
    <template #text>
      <v-row>
        <v-col v-if="showInstall">
          <v-list-item slim min-width="200" @click="install" :title="$t('widgetHelpToolbarInstall')" :prepend-icon="mdiCellphoneArrowDown" />
        </v-col>
        <v-col v-else-if="!isInstalledAndroid">
          <v-list-item slim min-width="200" @click="showInstallInfo = true" :title="$t('widgetHelpToolbarInstall')" :prepend-icon="mdiCellphoneArrowDown" />
        </v-col>
        <v-col>
          <v-list-item slim min-width="200" href="mailto:sebastian.raubach@hutton.ac.uk?subject=GridScore" :title="$t('widgetHelpToolbarSupport')" :prepend-icon="mdiAccountQuestion" />
        </v-col>
        <v-col>
          <v-list-item slim min-width="200" href="https://cropgeeks.github.io/gridscore-next-client" target="_blank" :title="$t('widgetHelpToolbarDocumentation')" :prepend-icon="mdiInformation" />
        </v-col>
        <v-col>
          <v-list-item slim min-width="200" href="https://github.com/cropgeeks/gridscore-next-client/issues/new/choose" target="_blank" :title="$t('widgetHelpToolbarSuggestions')" :prepend-icon="mdiGithub" />
        </v-col>
      </v-row>
    </template>

    <v-dialog
      v-model="showInstallInfo"
      max-width="min(75vw, 720px)"
    >
      <v-card :title="$t('widgetHelpToolbarInstall')">
        <template #text>
          <p>{{ $t('widgetHelpToolbarInstallInstructions') }}</p>
          <v-btn href="https://www.installpwa.com/from/gridscore.hutton.ac.uk" target="_blank" color="primary" :text="$t('widgetHelpToolbarInstallInstructionsButton')" />
        </template>
        <template #actions>
          <v-btn @click="showInstallInfo = false" :text="$t('buttonClose')" />
        </template>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
  import { coreStore } from '@/stores/app'
  import { mdiAccountQuestion, mdiCellphoneArrowDown, mdiClose, mdiGithub, mdiHelpCircle, mdiInformation } from '@mdi/js'

  import emitter from 'tiny-emitter/instance'

  const store = coreStore()

  const showInstall = ref(false)
  const showInstallInfo = ref(false)

  const isInstalledAndroid: ComputedRef<boolean> = computed(() => {
    // @ts-ignore
    return document.referrer.startsWith('android-app://') || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone
  })

  let deferredPrompt: any

  function hideHelp () {
    store.setHideHelpInformation(true)
  }

  async function install () {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      emitter.emit('plausible-event', { key: 'installation', props: { userChoice: outcome } })

      showInstall.value = false
      deferredPrompt = undefined
    }
  }

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later.
      deferredPrompt = e
      showInstall.value = true
    })
  })
</script>
