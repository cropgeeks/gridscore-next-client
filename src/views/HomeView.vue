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

    <component v-for="c in sortedWidgets" :key="c.id" :is="c.component" class="mb-3" />

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
import { BIconNewspaper } from 'bootstrap-vue'

import HomeBanners from '@/components/HomeBanners'
import TrialSelector from '@/components/TrialSelector'

const emitter = require('tiny-emitter/instance')

export default {
  name: 'HomeView',
  data: function () {
    return {
      widgets: [{
        id: 'banners',
        component: HomeBanners
      }, {
        id: 'trials',
        component: TrialSelector
      }]
    }
  },
  components: {
    BIconNewspaper,
    HomeBanners,
    TrialSelector
  },
  computed: {
    ...mapGetters([
      'storeHideCitationMessage',
      'storeHomeWidgetOrder'
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
