<template>
  <v-container>
    <v-card class="mb-5">
      <div class="d-flex flex-nowrap flex-column flex-sm-row justify-space-between align-center ma-5 justify-center">
        <v-card-text class="flex-grow-1">
          <p class="text-h2">{{ $t('appTitle') }}</p>

          <p class="text-subtitle-1 my-3"><v-icon size="x-small" :icon="mdiTagOutline" /> {{ $t('pageAboutVersion', { version: gridScoreVersion }) }}</p>
          <p class="text-subtitle-1 my-3" v-if="storeDeviceConfigString"><v-icon size="x-small" :icon="mdiLaptop" /> {{ storeDeviceConfigString }}</p>
          <p class="text-subtitle-1 my-3"><v-icon size="x-small" :icon="mdiInformation" /> <a href="#" @click.prevent="showChangelog">{{ $t('pageAboutChangelog') }}</a></p>
        </v-card-text>
        <v-avatar
          class="ma-3"
          rounded="0"
          size="150"
          image="/img/gridscore-next.svg"
        />
      </div>
    </v-card>

    <p>{{ $t('pageAboutParagraphOne') }}</p>
    <p v-html="$t('pageAboutParagraphTwo')" />

    <v-list>
      <v-list-item :prepend-icon="mdiInformation">
        <template #title>
          <span class="text-wrap" v-html="$t('pageAboutDocumentationLink')" />
        </template>
      </v-list-item>
      <v-list-item :prepend-icon="mdiBookEducation">
        <template #title>
          <span class="text-wrap" v-html="$t('pageAboutTrainingLink')" />
        </template>
      </v-list-item>
      <v-list-item :prepend-icon="mdiGithub">
        <template #title>
          <span class="text-wrap" v-html="$t('pageAboutGitHubLink')" />
        </template>
      </v-list-item>
      <v-list-item :prepend-icon="mdiNewspaperVariant">
        <template #title>
          <span class="text-wrap" v-html="$t('pageHomeTextCitation')" />
        </template>
      </v-list-item>
    </v-list>

    <h2 class="mb-3">{{ $t('pageAboutGridScoreFundersTitle') }}<small class="text-muted"> - {{ $t('pageAboutGridScoreFundersSubtitle') }}</small></h2>
    <p>{{ $t('pageAboutGridScoreFundersText') }}</p>
    <v-row class="funders">
      <v-col v-for="(funder, i) in funders" :key="'about-funders-' + i" class="text-center pb-5 col-xxl-2">
        <div class="pa-3 pa-xl-4 img-container">
          <a :href="funder.href" :title="funder.name" target="_blank" rel="noopener noreferrer" v-if="funder.href">
            <v-img height="100" min-width="200" :src="`./img/funders/${funder.logo}`" alt="Funder logo" />
          </a>
          <v-img height="100" :src="`./img/funders/${funder.logo}`" alt="Funder logo" v-else />
        </div>
      </v-col>
    </v-row>

    <!-- Translations -->
    <section class="pb-3">
      <h2>{{ $t('pageAboutTranslationsTitle') }}</h2>
      <p>{{ $t('pageAboutTranslationsText') }}</p>
      <v-list>
        <v-list-item v-for="translation in translations" :key="`translation-${translation.locale}`" :title="$t(translation.name)" :subtitle="translation.by">
          <template #prepend>
            <v-avatar>{{ translation.flag }}</v-avatar>
          </template>
        </v-list-item>
      </v-list>
    </section>
  </v-container>
</template>

<script setup lang="ts">
  import { gridScoreVersion } from '@/plugins/constants'
  import { coreStore } from '@/stores/app'
  import { mdiBookEducation, mdiGithub, mdiInformation, mdiLaptop, mdiNewspaperVariant, mdiTagOutline } from '@mdi/js'

  import emitter from 'tiny-emitter/instance'

  interface Funder {
    name: string
    href?: string
    logo: string
  }

  interface Translation {
    name: string
    locale: string
    flag: string
    by: string
  }

  const translations = ref<Translation[]>([{
    flag: '🇩🇪',
    locale: 'de-DE',
    name: 'pageAboutTranslationsGerman',
    by: 'Sebastian Raubach',
  }, {
    flag: '🇻🇳',
    locale: 'vi-VN',
    name: 'pageAboutTranslationsVietnamese',
    by: 'Huu Loi Nguyen',
  }])

  const funders = ref<Funder[]>([
    {
      name: 'The James Hutton Institute',
      href: 'https://www.hutton.ac.uk/',
      logo: 'hutton.svg',
    },
    {
      name: 'Crop Trust',
      href: 'https://www.croptrust.org/',
      logo: 'crop-trust.svg',
    },
    {
      name: 'Biodiversity for Opportunities, Livelihoods and Development',
      href: 'https://bold.croptrust.org/',
      logo: 'bold.svg',
    },
    {
      name: 'Norway',
      href: 'https://www.norway.no/',
      logo: 'norway.svg',
    },
    {
      name: 'Norwegian Ministry of Foreign Affairs',
      href: 'https://www.regjeringen.no/en/dep/ud/id833/',
      logo: 'norwegian-ministry-of-foreign-affairs.svg',
    },
    {
      name: 'The Scottish Government',
      href: 'https://www.gov.scot/',
      logo: 'scottish-government.svg',
    },
    {
      name: 'International Barley Hub',
      href: 'https://www.barleyhub.org/',
      logo: 'ibh.svg',
    },
  ])

  const store = coreStore()

  const storeDeviceConfigString = computed(() => {
    if (store.storeDeviceConfig) {
      let result = ''

      if (store.storeDeviceConfig.os) {
        result += `${store.storeDeviceConfig.os.name} (${store.storeDeviceConfig.os.version || 'N/A'}); `
      }
      if (store.storeDeviceConfig.browser) {
        result += `${store.storeDeviceConfig.browser.name} (${store.storeDeviceConfig.browser.version || 'N/A'})`
      }

      return result
    } else {
      return undefined
    }
  })

  function showChangelog () {
    emitter.emit('show-changelog')
  }
</script>
