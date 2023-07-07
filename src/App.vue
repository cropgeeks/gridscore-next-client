<template>
  <div id="app">
    <b-navbar toggleable="xl" type="dark" variant="dark" >
      <b-navbar-brand :to="{ name: 'home' }" class="d-flex align-items-center">
        <img src="img/gridscore-next.svg" height="40px" class="d-inline-block align-top mr-3" alt="GridScore">
        {{ $t('appTitle') }}
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item :active="$route.name === 'home'" :to="{ name: 'home' }"><BIconHouse /> {{ $t('menuHome') }}</b-nav-item>
          <b-nav-item :disabled="menuItemsDisabled" :active="$route.name === 'data-entry'" :to="{ name: 'data-entry' }"><BIconUiChecksGrid /> {{ $t('menuDataEntry') }}</b-nav-item>
          <b-nav-item-dropdown :disabled="menuItemsDisabled">
            <template #button-content>
              <BIconEasel /> {{ $t('menuDataVisualization') }}
            </template>
            <b-dropdown-item :disabled="menuItemsDisabled" :to="{ name: 'visualization-timeline' }"><BIconGraphUp /> {{ $t('menuVisualizationTimeline') }}</b-dropdown-item>
            <b-dropdown-item :disabled="menuItemsDisabled" :to="{ name: 'visualization-heatmap' }"><BIconGridFill /> {{ $t('menuVisualizationHeatmap') }}</b-dropdown-item>
            <!-- <b-dropdown-item :disabled="menuItemsDisabled" :to="{ name: 'visualization-scatter' }"><BIconDice3 flip-h /> {{ $t('menuVisualizationScatter') }}</b-dropdown-item> -->
            <b-dropdown-item :disabled="menuItemsDisabled" :to="{ name: 'visualization-statistics' }"><BIconBarChartSteps /> {{ $t('menuVisualizationStatistics') }}</b-dropdown-item>
            <b-dropdown-item :disabled="menuItemsDisabled" :to="{ name: 'visualization-map' }"><BIconPinMapFill /> {{ $t('menuVisualizationMap') }}</b-dropdown-item>
          </b-nav-item-dropdown>
          <b-nav-item :disabled="menuItemsDisabled" :active="$route.name === 'trial-export'" :to="{ name: 'trial-export' }"><BIconCloudDownload /> {{ $t('menuDataExport') }}</b-nav-item>
          <b-nav-item :active="$route.name === 'settings'" :to="{ name: 'settings' }"><BIconGear /> {{ $t('menuSettings') }}</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <b-nav-item href="#" @click.prevent="toggleDarkMode">
            <BIconMoon v-if="storeDarkMode" />
            <BIconSun v-else />
            <span> {{ $t('menuToggleDarkMode') }}</span>
          </b-nav-item>
          <b-nav-item-dropdown right>
            <template #button-content>
              <BIconFlag /><span> {{ $t('menuLocale') }}</span>
            </template>
            <b-dropdown-item v-for="language in languages" :key="`locale-${language.locale}`" @click="onLocaleChanged(language)">
              <span class="mr-2">{{ language.icon }}</span>
              <span>{{ language.name }}</span>
            </b-dropdown-item>
          </b-nav-item-dropdown>
          <b-nav-item :to="{ name: 'about' }"><BIconInfoCircle /> {{ $t('menuAbout') }}</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>

    <router-view/>

    <BrapiModal ref="brapiSettingsModal"
                :title="'modalTitleBrapiSettings'"
                :okTitle="'buttonOk'"
                :cancelTitle="'buttonCancel'"
                :okDisabled="true"
                :errorMessage="brapiErrorMessage"
                no-fade />

    <b-modal v-model="loadingVisible" hide-header hide-footer no-close-on-backdrop no-close-on-esc hide-header-close>
      <div class="text-center">
        <b-spinner style="width: 3rem; height: 3rem;" variant="primary" type="grow" />
        <p class="text-muted mt-3" v-if="$t('modalTextLoading')">{{ $t('modalTextLoading') }}</p>
      </div>
    </b-modal>

    <ChangelogModal :prevVersion="changelogVersionNumber" ref="changelogModal" />

    <b-modal :visible="updateExists"
             :title="$t('modalTitleAppUpdateAvailable')"
             :ok-title="$t('buttonUpdate')"
             @ok="refreshApp"
             no-close-on-esc
             no-close-on-backdrop
             :cancel-title="$t('buttonCancel')">
      <p>{{ $t('modalTextAppUpdateAvailable') }}</p>
    </b-modal>
  </div>
</template>

<script>
import BrapiModal from '@/components/modals/BrapiModal'
import ChangelogModal from '@/components/modals/ChangelogModal'
import { mapGetters } from 'vuex'
import { loadLanguageAsync } from '@/plugins/i18n'
import { init } from '@/plugins/datastore'
import { VuePlausible } from 'vue-plausible'
import Vue from 'vue'
import { axiosCall, getServerSettings } from '@/plugins/api'
import { Detector } from '@/plugins/browser-detect'

import { BIconInfoCircle, BIconFlag, BIconHouse, BIconGear, BIconUiChecksGrid, BIconGraphUp, BIconPinMapFill, BIconGridFill, BIconBarChartSteps, BIconEasel, BIconMoon, BIconSun, BIconCloudDownload } from 'bootstrap-vue'
import { getId } from '@/plugins/id'
import { gridScoreVersion } from '@/plugins/constants'
import { isOffline } from '@/plugins/misc'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconInfoCircle,
    BIconGear,
    BIconFlag,
    BIconHouse,
    BIconUiChecksGrid,
    BIconGraphUp,
    BIconGridFill,
    BIconBarChartSteps,
    BIconEasel,
    BIconMoon,
    BIconPinMapFill,
    BIconSun,
    BIconCloudDownload,
    BrapiModal,
    ChangelogModal
  },
  data: function () {
    return {
      languages: [{
        locale: 'en_GB',
        name: 'British English',
        icon: '🇬🇧'
      }, {
        locale: 'de_DE',
        name: 'Deutsch - Deutschland',
        icon: '🇩🇪'
      }],
      loadingVisible: false,
      refreshing: false,
      registration: null,
      updateExists: false,
      changelogVersionNumber: null,
      brapiErrorMessage: null
    }
  },
  computed: {
    ...mapGetters([
      'storeLocale',
      'storeDarkMode',
      'storeSelectedTrial',
      'storePlausible',
      'storeUniqueClientId',
      'storeRunCount',
      'storeChangelogVersionNumber'
    ]),
    menuItemsDisabled: function () {
      return this.storeSelectedTrial === undefined || this.storeSelectedTrial === null
    }
  },
  watch: {
    storeDarkMode: function (newValue) {
      document.documentElement.className = newValue ? 'dark-mode' : 'light-mode'
    }
  },
  methods: {
    toggleDarkMode: function () {
      this.$store.dispatch('setDarkMode', !this.storeDarkMode)
    },
    /**
     * When the locale is changed, update the i18n settings
     * @param language The newly selected locale
     */
    onLocaleChanged: function (language) {
      loadLanguageAsync(language.locale).then(() => {
        this.$i18n.locale = language.locale
        this.$store.dispatch('setLocale', language.locale)

        emitter.emit('plausible-event', { key: 'locale-changed', props: { locale: language.locale } })
      })
    },
    enablePlausible: function () {
      if (this.storePlausible) {
        Vue.use(VuePlausible, {
          domain: this.storePlausible.plausibleDomain,
          hashMode: this.storePlausible.plausibleHashMode || true,
          apiHost: this.storePlausible.plausibleApiHost,
          trackLocalhost: false
        })

        this.$nextTick(() => {
          this.$plausible.enableAutoPageviews()
        })
      }
    },
    plausibleEvent: function (data) {
      if (this.$plausible && data) {
        if (data.props) {
          this.$plausible.trackEvent(data.key, { props: data.props })
        } else {
          this.$plausible.trackEvent(data.key)
        }
      }
    },
    handleApiError: function (error) {
      this.$bvModal.msgBoxOk(this.$t('modalTextApiError', { error: JSON.stringify(error) }), {
        title: this.$t('modalTitleApiError'),
        okVariant: 'primary'
      })
    },
    showBrapiSettings: function (message = null) {
      this.brapiErrorMessage = message
      this.$refs.brapiSettingsModal.show()
    },
    showLoading: function (visible) {
      this.loadingVisible = visible
    },
    handleVisibilityChange: async function () {
      // If the apps visibility changed (tab changed or window minimized), re-aquire the lock after return
      if (this.wakeLock !== null && document.visibilityState === 'visible') {
        await this.toggleWakeLock(true)
      }
    },
    toggleWakeLock: async function (acquire) {
      if (this.wakeLock === null && acquire) {
        try {
          // Get the lock
          this.wakeLock = await navigator.wakeLock.request()
          // Listen for changes to it
          this.wakeLock.addEventListener('release', () => {
            this.wakeLock = null
          })
        } catch (err) {
          this.wakeLock = null
        }
      } else if (this.wakeLock && !acquire) {
        // Release it
        this.wakeLock.release()
        this.wakeLock = null
      }
    },
    isLocalhost: function () {
      return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === ''
    },
    handleOffline: function () {
      this.$store.dispatch('setIsOffline', true)
    },
    handleOnline: function () {
      this.$store.dispatch('setIsOffline', false)
    },
    updateAvailable: function (event) {
      console.log('swUpdated called')
      this.registration = event.detail
      this.updateExists = true
    },
    refreshApp: function () {
      this.updateExists = false
      // Make sure we only send a 'skip waiting' message if the SW is waiting
      if (!this.registration || !this.registration.waiting) {
        return
      }
      // send message to SW to skip the waiting and activate the new SW
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  },
  created: function () {
    // Listen for our custom event from the SW registration
    document.addEventListener('swUpdated', this.updateAvailable, { once: true })

    // Prevent multiple refreshes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('controllerchange called')
      if (this.refreshing) {
        return
      }
      this.refreshing = true
      // Here the actual reload of the page occurs
      console.log('reloading')
      window.location.reload(true)
    })
  },
  mounted: function () {
    loadLanguageAsync(this.storeLocale)

    document.documentElement.className = this.storeDarkMode ? 'dark-mode' : 'light-mode'

    init()

    if (!this.storePlausible || !this.storePlausible.plausibleDomain) {
      getServerSettings()
        .then(result => {
          if (result) {
            this.$store.commit('ON_PLAUSIBLE_CHANGED', result)
            this.enablePlausible()
          }
        })
    } else {
      this.enablePlausible()
    }

    if ('wakeLock' in navigator) {
      this.toggleWakeLock(true)
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
    }

    // Log the run
    if (!this.isLocalhost()) {
      let id = this.storeUniqueClientId
      if (!id) {
        id = getId()

        this.$store.dispatch('setUniqueClientId', id)
      }

      const config = new Detector().detect()
      if (config.os !== undefined && config.os !== null && config.os !== 'Search Bot') {
        const data = {
          application: 'GridScore',
          runCount: this.storeRunCount + 1,
          id: id,
          version: `${gridScoreVersion}`,
          locale: this.storeLocale,
          os: `${config.os} ${config.osVersion}`
        }
        axiosCall({ baseUrl: 'https://ics.hutton.ac.uk/app-logger/', url: 'log', params: data, method: 'get', ignoreErrors: true })
          .then(() => {
            // If the call succeeds, reset the run count
            this.$store.dispatch('setRunCount', 0)
          })
          .catch(() => {
            // If this call fails (e.g. no internet), remember the run
            this.$store.dispatch('setRunCount', this.storeRunCount + 1)
          })
      }
    }

    this.changelogVersionNumber = this.storeChangelogVersionNumber
    if (this.changelogVersionNumber !== null && this.changelogVersionNumber !== gridScoreVersion) {
      this.$refs.changelogModal.show()
      this.$store.dispatch('setChangelogVersionNumber', gridScoreVersion)
    } else if (this.changelogVersionNumber === null) {
      this.$store.dispatch('setChangelogVersionNumber', gridScoreVersion)
    }

    emitter.on('plausible-event', this.plausibleEvent)
    emitter.on('api-error', this.handleApiError)
    emitter.on('show-brapi-settings', this.showBrapiSettings)
    emitter.on('show-loading', this.showLoading)
    window.addEventListener('offline', this.handleOffline)
    window.addEventListener('online', this.handleOnline)

    if (isOffline()) {
      this.handleOffline()
    } else {
      this.handleOnline()
    }
  },
  beforeDestroy: function () {
    emitter.off('plausible-event', this.plausibleEvent)
    emitter.off('api-error', this.handleApiError)
    emitter.off('show-brapi-settings', this.showBrapiSettings)
    emitter.off('show-loading', this.showLoading)
  },
  destroyed: function () {
    if ('wakeLock' in navigator) {
      this.toggleWakeLock(false)
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    }
  }
}

</script>

<style lang="scss">
$primary: #3498db;
$secondary: #bdc3c7;
$light: #ecf0f1;
$dark: #2c3e50;
// $info: #60a3bc;
$success: #A3CB38;
$info: #12CBC4;
$warning: #FFC312;
$danger: #EA2027;

@import '~bootswatch/dist/cosmo/variables';
@import '~bootstrap/scss/bootstrap';
@import '~bootstrap-vue/src/index.scss';
@import '~bootswatch/dist/cosmo/bootswatch';

@each $breakpoint in map-keys($grid-breakpoints) {
  @include media-breakpoint-up($breakpoint) {
    $infix: breakpoint-infix($breakpoint, $grid-breakpoints);

    .border#{$infix}-top {      border-top: $border-width solid $border-color !important; }
    .border#{$infix}-right {    border-right: $border-width solid $border-color !important; }
    .border#{$infix}-bottom {   border-bottom: $border-width solid $border-color !important; }
    .border#{$infix}-left {     border-left: $border-width solid $border-color !important; }

    .border#{$infix}-top-0 {    border-top: 0 !important; }
    .border#{$infix}-right-0 {  border-right: 0 !important; }
    .border#{$infix}-bottom-0 { border-bottom: 0 !important; }
    .border#{$infix}-left-0 {   border-left: 0 !important; }

    .border#{$infix}-x {
      border-left: $border-width solid $border-color !important;
      border-right: $border-width solid $border-color !important;
    }

    .border#{$infix}-y {
      border-top: $border-width solid $border-color !important;
      border-bottom: $border-width solid $border-color !important;
    }
  }
}

@import '@/assets/css/dark-mode';

html {
  position: relative !important;
  min-height: 100vh !important;
}

body {
  overflow-y: scroll !important; /* Show vertical scrollbar to prevent main canvas from jumping */
  min-height: 100vh !important;
}

.display-1, .display-2, .display-3, .display-4 {
  word-break: break-word;
}

.b-sidebar {
  top: 65px;
  max-height: calc(100% - 65px);
}

.modal-banner {
  margin: -1rem -1rem 0 -1rem
}
</style>
