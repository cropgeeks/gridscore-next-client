<template>
  <v-container>
    <v-card class="mb-5">
      <div class="d-flex flex-nowrap flex-column flex-sm-row justify-space-between align-center ma-5 justify-center">
        <v-card-text class="flex-grow-1">
          <p class="text-h2">{{ $t('appTitle') }}</p>

          <p class="text-h5 my-3">{{ $t('pageHomeWelcome') }}</p>

          <p class="text-subtitle-1 my-3">{{ $t('pageHomeWelcome') }}</p>
        </v-card-text>
        <v-avatar
          class="ma-3"
          rounded="0"
          size="150"
          image="/img/gridscore-next.svg"
        />
      </div>
    </v-card>

    <v-row>
      <v-col
        v-for="banner in banners"
        :key="`banner-${banner.id}`"
        class="d-flex"
      >
        <v-card :to="banner.to" class="d-flex flex-column justify-content-between flex-grow-1" variant="tonal">
          <div class="d-flex flex-no-wrap align-center flex-grow-1">
            <v-avatar
              class="ma-3"
              rounded="0"
              size="72"
            >
              <v-icon size="72" :color="banner.color">{{ banner.icon }}</v-icon>
            </v-avatar>
            <div>
              <v-card-text>
                <p class="text-h4 font-weight-black">{{ banner.title }}</p>

                <div class="text-medium-emphasis">
                  {{ banner.subtitle }}
                </div>
              </v-card-text>
            </div>
          </div>

          <v-card-actions>
            <v-spacer />
            <v-btn
              color="primary"
              :text="$t('buttonSelect')"
              variant="text"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <TrialSelector class="mt-5" />

    <v-card variant="tonal" class="mt-5">
      <div class="d-flex flex-wrap flex-sm-nowrap justify-center justify-sm-start">
        <v-icon color="primary" class="ma-5" size="80" icon="mdi-newspaper-variant-outline" />
        <div>
          <v-card-title class="text-h5">{{ $t('pageHomeTitleCitation') }}</v-card-title>

          <v-card-subtitle class="text-wrap">
            <div v-html="$t('pageHomeTextCitation')" />
          </v-card-subtitle>
        </div>
      </div>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import TrialSelector from '@/components/trial/TrialSelector.vue'
  import { categoricalColors } from '@/plugins/color'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()
  const banners = computed(() => {
    return [{
      id: 'setup',
      title: t('pageHomeCardTitleSetup'),
      subtitle: t('pageHomeCardSubtitleSetup'),
      image: 'banner-setup.svg',
      color: categoricalColors.GridScoreDefault[0],
      icon: 'mdi-notebook-plus',
      to: '/setup',
    }, {
      id: 'share',
      title: t('pageHomeCardTitleShareData'),
      subtitle: t('pageHomeCardSubtitleShareData'),
      image: 'banner-share.svg',
      color: categoricalColors.GridScoreDefault[1],
      icon: 'mdi-qrcode-scan',
      to: '/trial/import',
    }, {
      id: 'example',
      title: t('pageHomeCardTitleLoadExample'),
      subtitle: t('pageHomeCardSubtitleLoadExample'),
      image: 'banner-load-example.svg',
      color: categoricalColors.GridScoreDefault[2],
      icon: 'mdi-clipboard-text-clock',
      to: '/trial/import/example',
    }, {
      id: 'settings',
      title: t('pageHomeCardTitleSettings'),
      subtitle: t('pageHomeCardSubtitleSettings'),
      image: 'banner-settings.svg',
      color: categoricalColors.GridScoreDefault[3],
      icon: 'mdi-cog',
      to: '/settings',
    }]
  })
</script>
