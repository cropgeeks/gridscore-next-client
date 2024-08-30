<template>
  <b-row>
    <b-col cols=12 md=6 class="mb-4" v-for="banner in homeBanners" :key="`home-banner-${banner.id}`">
      <b-card class="home-card h-100" no-body>
        <b-row class="g-0 h-100">
          <b-col cols=5 xl=4 :class="storeDarkMode ? 'bg-dark' : 'bg-light'">
            <b-card-img class="p-2 p-md-4 h-100" :src="`img/${banner.image}`" />
          </b-col>
          <b-col cols=7 xl=8>
            <b-card-body class="d-flex flex-column justify-content-between h-100">
              <div>
                <b-card-title>{{ banner.title }}</b-card-title>
                <b-card-subtitle>{{ banner.subtitle }}</b-card-subtitle>
              </div>
              <b-button variant="primary" class="align-self-start stretched-link" :to="banner.to"><IBiCaretRight /> {{ $t('buttonSelect') }}</b-button>
            </b-card-body>
          </b-col>
        </b-row>
      </b-card>
    </b-col>
  </b-row>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'

export default {
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeDarkMode'
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
  }
}
</script>

<style>

</style>
