<template>
  <v-app>
    <v-main>
      <v-app-bar :extension-height="60" absolute class="border-b border-primary border-opacity-100">
        <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer" v-if="smAndDown" />

        <v-img
          class="ms-4"
          src="/img/gridscore-next.svg"
          max-height="40"
          max-width="40"
          contain
        />

        <v-app-bar-title style="cursor: pointer" @click="$router.push('/')">
          <span v-if="smAndUp">GridScore NEXT</span>
        </v-app-bar-title>

        <v-spacer />

        <v-menu v-if="selectedTrial && trialInfoPages.includes(route.path)">
          <template #activator="{ props }">
            <v-btn :icon="mdiNotebook" v-bind="props" />
          </template>
          <TrialCard max-width="400px" :trial="selectedTrial" :show-actions="false" :interactive="false" />
        </v-menu>

        <v-menu>
          <template #activator="{ props }">
            <v-btn :icon="mdiThemeLightDark" v-bind="props" />
          </template>
          <v-list>
            <v-list-subheader class="text-high-emphasis text-uppercase font-weight-black">{{ $t('menuTheme') }}</v-list-subheader>
            <v-list-item :prepend-icon="mdiWhiteBalanceSunny" :active="store.storeTheme === 'light'" @click="store.setTheme('light')" :title="$t('menuItemThemeLight')"><template #append><v-icon :icon="mdiCheck" v-if="store.storeTheme === 'light'" /></template></v-list-item>
            <v-list-item :prepend-icon="mdiWeatherNight" :active="store.storeTheme === 'dark'" @click="store.setTheme('dark')" :title="$t('menuItemThemeDark')"><template #append><v-icon :icon="mdiCheck" v-if="store.storeTheme === 'dark'" /></template></v-list-item>
            <v-list-item :prepend-icon="mdiDesktopTowerMonitor" :active="store.storeTheme === 'system'" @click="store.setTheme('system')" :title="$t('menuItemThemeSystem')"><template #append><v-icon :icon="mdiCheck" v-if="store.storeTheme === 'system'" /></template></v-list-item>
          </v-list>
        </v-menu>

        <v-menu>
          <template #activator="{ props }">
            <v-btn v-bind="props" :icon="mdiTranslate" />
          </template>
          <v-list>
            <v-list-subheader class="text-high-emphasis text-uppercase font-weight-black">{{ $t('menuLocale') }}</v-list-subheader>
            <v-list-item
              @click="changeLocale(language.locale)"
              v-for="language in locales"
              :key="`locale-${language.icon}`"
              :value="language.locale"
              :active="language.locale === store.storeLocale"
            >
              <v-list-item-title>{{ language.name }}</v-list-item-title>
              <template #prepend>
                <span class="me-3">{{ language.icon }}</span>
              </template>
              <template #append>
                <v-icon v-if="language.locale === store.storeLocale" :icon="mdiCheck" />
              </template>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar>

      <v-navigation-drawer
        v-model="drawer"
        :location="mdAndUp ? 'start' : 'top'"
        absolute
        :rail="mdAndUp"
        :permanent="mdAndUp"
        :expand-on-hover="mdAndUp"
      >
        <v-list density="compact" nav>
          <v-list-item :prepend-icon="mdiHome" :title="$t('menuHome')" to="/" />
          <v-list-item :prepend-icon="mdiNotebookPlus" :title="$t('pageHomeCardTitleSetup')" to="/setup" />

          <v-list-group value="data-entry">
            <template #activator="{ props }">
              <v-list-item v-bind="props" :disabled="!selectedTrial" link :prepend-icon="mdiPencilRuler" :title="$t('menuDataEntry')" />
            </template>

            <v-list-item :prepend-icon="mdiGrid" :title="$t('menuDataEntryGrid')" to="/collect/grid" />
            <v-list-item :prepend-icon="mdiDirectionsFork" :title="$t('menuDataEntryGuidedWalk')" to="/collect/walk" />
            <v-list-item :prepend-icon="mdiBarcodeScan" :title="$t('menuDataEntryInput')" to="/collect/input" />
          </v-list-group>

          <v-list-group value="visualization">
            <template #activator="{ props }">
              <v-list-item v-bind="props" :disabled="!selectedTrial" link :prepend-icon="mdiChartWaterfall" :title="$t('menuDataVisualization')" />
            </template>

            <v-list-item :prepend-icon="mdiGradientHorizontal" :title="$t('menuVisualizationHeatmap')" to="/visualization/heatmap" />
            <v-list-item :prepend-icon="mdiChartGantt" :title="$t('menuVisualizationStatistics')" to="/visualization/statistics" />
            <v-list-item :prepend-icon="mdiMap" :title="$t('menuVisualizationMap')" to="/visualization/map" />
          </v-list-group>

          <v-list-item :prepend-icon="mdiCog" :title="$t('menuSettings')" to="/settings" />
          <v-list-item prepend-icon="$gridscore" :title="$t('menuAbout')" to="/about" />
        </v-list>
      </v-navigation-drawer>

      <div class="h-100">
        <router-view :key="$route.path" class="h-100" />

        <AppFooter v-if="route.path !== '/collect/grid'" />
      </div>
    </v-main>

    <ConfirmModal />
    <ChangelogModal />
    <v-snackbar-queue timeout="6000" location="top" v-model="snackbarQueue" />
    <v-overlay
      :model-value="loading"
      class="align-center justify-center"
      :close-on-content-click="false"
      persistent
    >
      <v-card :title="$t('modalTitleLoading')" width="min(50vw, 400px)" class="d-flex align-center justify-center" :loading="loading">
        <template #loader="{ isActive }">
          <v-progress-linear
            :active="isActive"
            color="primary"
            height="4"
            indeterminate
          />
        </template>
      </v-card>
    </v-overlay>

    <TrialSynchonizationModal />

    <v-dialog
      v-model="updateExists"
      persistent
      :max-width="`min(90vw, 400px)`"
    >
      <v-card :title="$t('modalTitleAppUpdateAvailable')" :text="$t('modalTextAppUpdateAvailable')">
        <template #actions>
          <v-btn :text="$t('buttonCancel')" variant="text" @click="updateExists = false" />
          <v-btn :text="$t('buttonUpdate')" variant="tonal" color="primary" @click="refreshApp" />
        </template>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script lang="ts" setup>
  import { useDisplay, useTheme, type SnackbarQueueMessage } from 'vuetify'
  import { coreStore } from '@/stores/app'
  import AppFooter from '@/components/AppFooter.vue'
  import { loadLanguageAsync, locales } from '@/plugins/vuetify'
  import ConfirmModal from '@/components/modals/ConfirmModal.vue'
  import ChangelogModal from '@/components/modals/ChangelogModal.vue'
  import { useDark } from '@vueuse/core'
  import { getTrialCached, init } from '@/plugins/datastore'

  import emitter from 'tiny-emitter/instance'
  import type { TrialPlus } from '@/plugins/types/client'
  import TrialCard from '@/components/trial/TrialCard.vue'
  import { axiosCall, getServerSettings } from '@/plugins/api'
  import Plausible from 'plausible-tracker'
  import { gridScoreVersion } from '@/plugins/constants'
  import { UAParser } from 'ua-parser-js'
  import { getId } from '@/plugins/id'
  import { mdiBarcodeScan, mdiChartGantt, mdiChartWaterfall, mdiCheck, mdiCog, mdiDesktopTowerMonitor, mdiDirectionsFork, mdiGradientHorizontal, mdiGrid, mdiHome, mdiMap, mdiNotebook, mdiNotebookPlus, mdiPencilRuler, mdiThemeLightDark, mdiTranslate, mdiWeatherNight, mdiWhiteBalanceSunny } from '@mdi/js'

  const { smAndUp, mdAndUp, smAndDown } = useDisplay()
  const theme = useTheme()
  const store = coreStore()
  const route = useRoute()
  const isDark = useDark()

  const drawer = ref(true)
  const loading = ref(false)
  const snackbarQueue = ref<SnackbarQueueMessage[]>([])
  const selectedTrial = ref<TrialPlus>()

  // PWA update stuff
  let registration: any
  const updateExists = ref(false)

  const changelogVersionNumber = ref<string>()

  const trialInfoPages = ref<string[]>(['/collect/grid', '/visualization/heatmap', '/visualization/timeline', '/visualization/statistics', '/visualization/map', '/collect/walk', '/collect/input', '/trial-export'])

  let plausible: any
  let wakeLock: WakeLockSentinel | undefined

  // Set base URL based on environment
  let baseUrl = './api/'
  if (import.meta.env.VITE_BASE_URL) {
    baseUrl = import.meta.env.VITE_BASE_URL
  }

  function changeLocale (locale: string) {
    store.setLocale(locale)
  }

  function showSnackbar (message: SnackbarQueueMessage) {
    snackbarQueue.value.push(message)
  }

  function showLoading (visible: boolean) {
    loading.value = visible
  }

  function loadTrialInfo () {
    selectedTrial.value = getTrialCached()
  }

  function enablePlausible () {
    if (store.storePlausible) {
      plausible = Plausible({
        domain: store.storePlausible.plausibleDomain,
        apiHost: store.storePlausible.plausibleApiHost,
        trackLocalhost: false,
        hashMode: store.storePlausible.plausibleHashMode || true,
      })

      plausible.enableAutoPageviews()

      let pwaMode = null
      try {
        if (document.referrer.startsWith('android-app://'))
          pwaMode = 'twa'
        if (window.matchMedia('(display-mode: browser)').matches)
          pwaMode = 'browser'
        // @ts-ignore
        if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone)
          pwaMode = 'standalone'
        if (window.matchMedia('(display-mode: minimal-ui)').matches)
          pwaMode = 'minimal-ui'
        if (window.matchMedia('(display-mode: fullscreen)').matches)
          pwaMode = 'fullscreen'
        if (window.matchMedia('(display-mode: window-controls-overlay)').matches)
          pwaMode = 'window-controls-overlay'
      } catch (e) {
        console.error(e)
      }

      plausibleEvent({ key: 'app-load', props: { version: gridScoreVersion, pwaMode: pwaMode || 'N/A' } })
    }
  }

  function isLocalhost () {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === ''
  }

  function plausibleEvent (data: any) {
    if (plausible && store.storePlausible.plausibleDomain && data) {
      if (data.props) {
        plausible.trackEvent(data.key, { props: data.props })
      } else {
        plausible.trackEvent(data.key)
      }
    }
  }

  function updateAvailable (event: CustomEvent) {
    plausibleEvent({ key: 'update-shown', props: { from: gridScoreVersion } })
    console.log('swUpdated called', event.detail)
    registration = event.detail
    updateExists.value = true
  }

  function refreshApp () {
    console.log('refreshApp')
    updateExists.value = false

    if (registration) {
      plausibleEvent({ key: 'update-finished', props: { from: gridScoreVersion } })
      registration()
    }
  }

  async function handleVisibilityChange () {
    // If the apps visibility changed (tab changed or window minimized), re-aquire the lock after return
    if (wakeLock !== null && document.visibilityState === 'visible') {
      await toggleWakeLock(true)
    }
  }

  async function toggleWakeLock (acquire: boolean) {
    if (wakeLock === null && acquire) {
      try {
        // Get the lock
        wakeLock = await navigator.wakeLock.request()
        // Listen for changes to it
        wakeLock.addEventListener('release', () => {
          wakeLock = undefined
        })
      } catch {
        wakeLock = undefined
      }
    } else if (wakeLock && !acquire) {
      // Release it
      wakeLock.release()
      wakeLock = undefined
    }
  }

  // Listen for theme changes in the store
  watchEffect(() => {
    const str = isDark.value ? 'dark' : 'light'
    theme.change(store.storeTheme === 'system' ? str : store.storeTheme)
    store.setSystemTheme(str)
  })

  // Listen for changes to store locale and update Vuetify current
  watchEffect(() => {
    loadLanguageAsync(store.storeLocale)
  })

  onBeforeMount(() => {
    loadLanguageAsync(store.storeLocale)
    store.setServerUrl(baseUrl)

    init()

    if (theme.themes.value.light) {
      theme.themes.value.light.colors.primary = store.storeThemeColor
    }
    if (theme.themes.value.dark) {
      theme.themes.value.dark.colors.primary = store.storeThemeColor
    }
  })

  onMounted(() => {
    if (!store.storePlausible || !store.storePlausible.plausibleDomain) {
      getServerSettings()
        .then(result => {
          if (result) {
            store.setPlausible(result)
            enablePlausible()
          }
        })
    } else {
      enablePlausible()
    }

    if ('wakeLock' in navigator) {
      toggleWakeLock(true)
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    const config = new UAParser().getResult()
    store.setDeviceConfig(config)

    // Log the run
    if (!isLocalhost()) {
      let id = store.storeUniqueClientId
      if (!id) {
        id = getId()

        store.setUniqueClientId(id)
      }

      if (config.os !== undefined && config.os !== null && config.os.name !== undefined && config.os.name !== null && config.os.name !== 'Search Bot') {
        const data = {
          application: 'GridScore',
          runCount: store.storeRunCount + 1,
          id,
          version: `${gridScoreVersion}`,
          locale: store.storeLocale,
          os: `${config.os.name} ${config.os.version}`,
        }
        axiosCall({ baseUrl: 'https://ics.hutton.ac.uk/app-logger/', url: 'log', params: data, method: 'get', ignoreErrors: true, checkRemote: false })
          .then(() => {
            // If the call succeeds, reset the run count
            store.setRunCount(0)
          })
          .catch(() => {
            // If this call fails (e.g. no internet), remember the run
            store.setRunCount(store.storeRunCount + 1)
          })
      }
    }

    changelogVersionNumber.value = store.storeChangelogVersionNumber
    if (changelogVersionNumber.value !== undefined && changelogVersionNumber.value !== gridScoreVersion) {
      emitter.emit('show-changelog', changelogVersionNumber.value)
      store.setChangelogVersionNumber(gridScoreVersion)
    } else if (changelogVersionNumber.value === undefined) {
      store.setChangelogVersionNumber(gridScoreVersion)
    }

    emitter.on('show-snackbar', showSnackbar)
    emitter.on('show-loading', showLoading)
    emitter.on('trial-data-loaded', loadTrialInfo)
    emitter.on('plausible-event', plausibleEvent)
  })
  onBeforeUnmount(() => {
    emitter.off('show-snackbar', showSnackbar)
    emitter.off('show-loading', showLoading)
    emitter.off('trial-data-loaded', loadTrialInfo)
    emitter.off('plausible-event', plausibleEvent)
  })

  onBeforeMount(() => {
    // Listen for our custom event from the SW registration
    // @ts-ignore
    document.addEventListener('swUpdated', updateAvailable, { once: true })
  })
</script>

<style>
p {
  margin-bottom: 0.5rem;
}

p a, p a:visited,
table a:not(.v-btn), table a:not(.v-btn):visited,
footer a, footer a:visited,
#about-page a, #about-page a:visited,
.v-card-title a, .v-card-title a:visited,
.scale-heading a, .scale-heading a:visited,
.v-messages a, .v-messages a:visited,
.v-list-item a, .v-list-item a:visited,
a.table-icon-link, a.table-icon-link:visited,
.v-card-text ul a, .v-card-text ul a:visited,
form a, form a:visited {
  color: rgb(var(--v-theme-primary));
}

ul:not([class]),
ul:not([class]) li:not([class]),
ol:not([class]),
ol:not([class]) li:not([class])
 {
  padding: revert;
}

.pe-none .v-badge__badge {
  pointer-events: none;
}

.flex-unset {
  flex: unset;
}

.no-select {
  -webkit-touch-callout: none; /* iOS Safari */
    -webkit-user-select: none; /* Safari */
     -khtml-user-select: none; /* Konqueror HTML */
       -moz-user-select: none; /* Old versions of Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
            user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Edge, Opera and Firefox */
}

.cursor-default {
  cursor: default;
}

.v-navigation-drawer--rail:not(.v-navigation-drawer--is-hovering) .v-list-group__items * {
  display: none;
}
.v-navigation-drawer--top.v-navigation-drawer--active  {
  height: auto !important;
}

code {
  color: #e83e8c;
}

.mdi-flip-v {
  transform: scaleY(-1);
}
</style>
