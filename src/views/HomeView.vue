<template>
  <b-container>
    <div class="about-header bg-light p-5 my-4 border">
      <b-row>
        <b-col cols=12 md=4 class="text-center text-md-right" order="1" order-md="2">
          <b-img fluid src="img/gridscore-next-text.svg" alt="GridScore logo" />
        </b-col>
        <b-col cols=12 md=8 order="2" order-md="1">
          <h1 class="display-4 text-center text-md-left">{{ $t('appTitle') }}</h1>
          <p class="lead text-center text-md-left">{{ $t('pageHomeWelcome') }}</p>
          <p class="text-center text-md-left mb-0">{{ $t('pageHomeInstructions') }}</p>
        </b-col>
      </b-row>
    </div>

    <b-row>
      <b-col cols=6 md=3 class="mb-4" v-for="banner in homeBanners" :key="`home-banner-${banner.id}`">
        <b-card class="home-card h-100" no-body>
          <b-card-img class="p-2 p-md-4 p-lg-5" :top="true" :src="require(`@/assets/img/${banner.image}`)" />
          <b-card-body>
            <b-card-title>{{ banner.title }}</b-card-title>
            <b-card-sub-title>{{ banner.subtitle }}</b-card-sub-title>
          </b-card-body>
          <b-button variant="primary" class="stretched-link" :to="banner.to"><BIconCaretRight /> {{ $t('buttonSelect') }}</b-button>
        </b-card>
      </b-col>
    </b-row>

    <TrialSelector class="mb-4" />

    <b-card bg-variant="light" class="mb-4" v-if="!storeHideCitationMessage" no-body>
      <b-card-body>
        <b-row>
          <b-col cols=12 sm=3 md=2 class="d-flex align-items-center justify-content-center">
            <BIconNewspaper class="display-1 p-2" />
          </b-col>
          <b-col cols=12 sm=9 md=10>
            <b-card-title><span>{{ $t('pageHomeTitleCitation') }}</span><button type="button" @click.prevent="hideCitation" v-b-tooltip="$t('tooltipDontShowAgain')" aria-label="Close" class="close">×</button></b-card-title>
            <div v-html="$t('pageHomeTextCitation')" />
          </b-col>
        </b-row>
      </b-card-body>
    </b-card>
  </b-container>
</template>

<script>
import { mapGetters } from 'vuex'
import { BIconNewspaper, BIconCaretRight } from 'bootstrap-vue'

import TrialSelector from '@/components/TrialSelector'

const emitter = require('tiny-emitter/instance')

export default {
  name: 'HomeView',
  components: {
    BIconNewspaper,
    BIconCaretRight,
    TrialSelector
  },
  computed: {
    ...mapGetters([
      'storeHideCitationMessage'
    ]),
    homeBanners: function () {
      return [{
        id: 'setup',
        title: this.$t('pageHomeCardTitleSetup'),
        subtitle: this.$t('pageHomeCardSubtitleSetup'),
        image: 'banner-setup.svg',
        to: { name: 'trial-setup' }
      }, {
        id: 'share',
        title: this.$t('pageHomeCardTitleShareData'),
        subtitle: this.$t('pageHomeCardSubtitleShareData'),
        image: 'banner-share.svg',
        to: { name: 'trial-import' }
      }, {
        id: 'example',
        title: this.$t('pageHomeCardTitleLoadExample'),
        subtitle: this.$t('pageHomeCardSubtitleLoadExample'),
        image: 'banner-load-example.svg',
        to: { name: 'load-example' }
      }, {
        id: 'settings',
        title: this.$t('pageHomeCardTitleSettings'),
        subtitle: this.$t('pageHomeCardSubtitleSettings'),
        image: 'banner-settings.svg',
        to: { name: 'settings' }
      }]
    }
  },
  methods: {
    hideCitation: function () {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextHideCitation'), {
        title: this.$t('modalTitleHideCitation'),
        okTitle: this.$t('buttonYes'),
        okVariant: 'danger',
        cancelTitle: this.$t('buttonNo')
      })
        .then(value => {
          if (value) {
            this.$store.dispatch('setHideCitationMessage', true)

            emitter.emit('plausible-event', { key: 'citation-hidden' })
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
