<template>
  <v-footer
    app
    height="40"
    class="d-flex justify-space-between border-t border-primary border-opacity-100"
  >
    <div class="text-caption text-disabled">
      &copy; {{ new Date().getFullYear() }} <span class="d-none d-sm-inline-block">GridScore: <a class="text-muted" href="https://www.hutton.ac.uk">The James Hutton Institute</a></span>
    </div>

    <div class="text-caption text-disabled">
      <a href="#" @click.prevent="showChangelog" class="text-muted">{{ $t('pageFooterVersion', { version: gridScoreVersion }) }}</a>
    </div>

    <div>
      <a
        v-for="item in items"
        :key="item.title"
        class="d-inline-block mx-2 social-link"
        :href="item.href"
        rel="noopener noreferrer"
        target="_blank"
        :title="item.title"
      >
        <v-icon :icon="item.icon" />
      </a>
    </div>
  </v-footer>
</template>

<script setup lang="ts">
  import { gridScoreVersion } from '@/plugins/constants'
  import { mdiGithub, mdiTwitter, mdiWeb } from '@mdi/js'

  import emitter from 'tiny-emitter/instance'

  const items = [
    {
      title: 'GridScore NEXT website',
      icon: mdiWeb,
      href: 'https://ics.hutton.ac.uk/get-gridscore',
    },
    {
      title: 'GridScore on Bluesky',
      icon: '$bluesky',
      href: 'https://bsky.app/profile/germinate.hutton.ac.uk',
    },
    {
      title: 'GridScore in Twitter',
      icon: mdiTwitter,
      href: 'https://twitter.com/GerminateHub',
    },
    {
      title: 'GridScore GitHub',
      icon: mdiGithub,
      href: 'https://github.com/cropgeeks/gridscore-next-client',
    },
  ]

  function showChangelog () {
    emitter.emit('show-changelog')
  }
</script>

<style scoped lang="sass">
  .social-link :deep(.v-icon)
    color: rgba(var(--v-theme-on-background), var(--v-disabled-opacity))
    text-decoration: none
    transition: .2s ease-in-out

    &:hover
      color: rgba(25, 118, 210, 1)
</style>
