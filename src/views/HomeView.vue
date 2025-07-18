<template>
  <b-container>
    <div :class="`about-header ${storeDarkMode ? 'bg-dark' : 'bg-light'} p-5 my-4 border`">
      <b-row>
        <b-col cols=12 md=4 class="text-center text-md-end" order="1" order-md="2">
          <b-img fluid src="img/gridscore-next-text.svg" alt="GridScore logo" />
        </b-col>
        <b-col cols=12 md=8 order="2" order-md="1">
          <h1 class="display-4 text-center text-md-start">{{ $t('appTitle') }}</h1>
          <p class="lead text-center text-md-start">{{ $t('pageHomeWelcome') }}</p>
          <p class="text-center text-md-start mb-0">{{ $t('pageHomeInstructions') }}</p>
        </b-col>
      </b-row>
    </div>

    <component v-for="c in sortedWidgets" :key="c.id" :is="c.component" class="mb-3" />

    <b-card class="mb-4" v-if="!storeHideCitationMessage" no-body :bg-variant="storeDarkMode ? 'dark' : 'light'">
      <b-card-body>
        <b-row>
          <b-col cols=12 sm=3 md=2 class="d-flex align-items-center justify-content-center">
            <IBiNewspaper class="display-1 p-2" />
          </b-col>
          <b-col cols=12 sm=9 md=10>
            <b-card-title>
              <span>{{ $t('pageHomeTitleCitation') }}</span>
              <b-button size="sm" @click.prevent="showCitationHideConfirm" v-b-tooltip="$t('tooltipDontShowAgain')" aria-label="Close" class="btn-close float-end"></b-button>
            </b-card-title>
            <div v-html="$t('pageHomeTextCitation')" />
          </b-col>
        </b-row>
      </b-card-body>
    </b-card>

    <!-- <PatternLock :correctPattern="[7, 5, 4, 2, 6, 8]" style="max-width: 400px;" /> -->
  </b-container>
</template>

<script>
import HomeBanners from '@/components/HomeBanners.vue'
import TrialSelector from '@/components/TrialSelector.vue'
// import PatternLock from '@/components/canvas/PatternLock.vue'
import { coreStore } from '@/store'
import { mapState, mapStores } from 'pinia'

import emitter from 'tiny-emitter/instance'
import { markRaw } from 'vue'

export default {
  name: 'HomeView',
  data: function () {
    return {
      widgets: [{
        id: 'banners',
        component: markRaw(HomeBanners)
      }, {
        id: 'trials',
        component: markRaw(TrialSelector)
      }]
    }
  },
  components: {
    HomeBanners,
    // PatternLock,
    TrialSelector
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeHideCitationMessage',
      'storeHomeWidgetOrder',
      'storeDarkMode'
    ]),
    sortedWidgets: function () {
      if (this.storeHomeWidgetOrder && this.storeHomeWidgetOrder.length > 0) {
        return this.storeHomeWidgetOrder.map(o => this.widgets.find(w => w.id === o))
      } else {
        return this.widgets
      }
    }
  },
  methods: {
    hideCitationConfirm: function () {
      this.coreStore.setHideCitationMessage(true)

      emitter.emit('plausible-event', { key: 'citation-hidden', props: { hidden: true } })
    },
    showCitationHideConfirm: function () {
      emitter.emit('show-confirm', {
        title: 'modalTitleHideCitation',
        message: 'modalTextHideCitation',
        okTitle: 'buttonYes',
        cancelTitle: 'buttonNo',
        okVariant: 'danger',
        callback: (result) => {
          if (result) {
            this.hideCitationConfirm()
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.about-header img {
  max-height: 125px;
}

@media (min-width: 768px) {
  .about-header img {
    max-height: 150px;
  }
}
</style>
