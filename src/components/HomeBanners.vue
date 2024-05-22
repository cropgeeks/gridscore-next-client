<template>
  <b-row>
    <b-col cols=6 md=3 class="mb-4" v-for="banner in homeBanners" :key="`home-banner-${banner.id}`">
      <b-card class="home-card h-100" no-body>
        <b-card-img class="p-2 p-md-4 p-lg-5" :top="true" :src="`img/${banner.image}`" />
        <b-card-body>
          <b-card-title>{{ banner.title }}</b-card-title>
          <b-card-subtitle>{{ banner.subtitle }}</b-card-subtitle>
        </b-card-body>
        <b-button variant="primary" class="stretched-link" :to="banner.to"><IBiCaretRight /> {{ $t('buttonSelect') }}</b-button>
      </b-card>
    </b-col>
  </b-row>
</template>

<script>
export default {
  computed: {
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
