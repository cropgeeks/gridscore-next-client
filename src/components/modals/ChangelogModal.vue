<template>
  <v-dialog v-model="dialog" max-width="min(90vw, 1024px)" scrollable>
    <v-card :title="$t('modalTitleChangelog')">
      <template #text>
        <p v-html="$t('modalTextChangelog')" />

        <v-data-iterator
          :items="changelog"
          item-value="version"
          :search="highlightVersion"
          :items-per-page="perPage"
          :page="page"
          :custom-filter="filter"
        >
          <template #header="{ pageCount }">
            <v-pagination v-model="page" :length="pageCount" />
          </template>

          <template #default="{ items }">
            <template
              v-for="(version, i) in items"
              :key="`changelog-entry-${i}`"
            >
              <v-card :title="version.raw.version" class="mb-4">
                <template #subtitle><v-chip label prepend-icon="mdi-calendar" :text="new Date(version.raw.date).toLocaleDateString()" /></template>

                <v-list>
                  <v-list-item
                    v-for="(item, index) in version.raw.items"
                    class="changelog-list-item"
                    :key="`changelog-${version.raw.version}-${index}`"
                    :title="item.title"
                  >
                    <template #prepend>
                      <v-avatar :color="badges[item.type]?.color" :icon="badges[item.type]?.icon" v-tooltip:top="badges[item.type]?.text" />
                    </template>
                    <template #subtitle>
                      <span class="text-wrap" v-html="item.text" />
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>
            </template>
          </template>

          <template #footer="{ pageCount }">
            <v-pagination v-model="page" :length="pageCount" />
          </template>
        </v-data-iterator>
      </template>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('buttonClose')" @click="hide" color="primary" variant="tonal" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import emitter from 'tiny-emitter/instance'

  import deDE from '@/plugins/changelog/de_DE.json'
  import enGB from '@/plugins/changelog/en_GB.json'
  import viVN from '@/plugins/changelog/vi_VN.json'

  import semver from 'semver'
  import { coreStore } from '@/stores/app'
  import { useI18n } from 'vue-i18n'
  import type { FilterMatch, InternalItem } from 'vuetify'

  const { t } = useI18n()

  interface VersionInfo {
    version: string
    date: string
    items: VersionItem[]
  }

  interface VersionItem {
    type: 'new' | 'update' | 'bugfix'
    title: string
    text: string
  }

  interface BadgeInfo {
    color: string
    text: string
    icon: string
  }

  const store = coreStore()

  function sorting (a: VersionInfo, b: VersionInfo) {
    if (semver.eq(a.version, b.version)) {
      return 0
    } else if (semver.gt(a.version, b.version)) {
      return -1
    } else {
      return 1
    }
  }

  function filter (value: string, query: string, item?: InternalItem<VersionInfo>): FilterMatch {
    const trimmed = query.trim()
    const parsed = semver.valid(trimmed)
    if (item && trimmed !== '' && parsed) {
      return semver.gt(item.raw.version, trimmed)
    } else {
      return true
    }
  }

  const badges: ComputedRef<{ [index: string]: BadgeInfo }> = computed(() => {
    return {
      new: { color: 'success', text: t('changelogBadgeNew'), icon: 'mdi-new-box' },
      update: { color: 'info', text: t('changelogBadgeUpdate'), icon: 'mdi-chevron-triple-up' },
      bugfix: { color: 'warning', text: t('changelogBadgeFix'), icon: 'mdi-bug-check' },
    }
  })

  const changelogMap: { [index: string]: VersionInfo[] } = {
    'de-DE': (deDE as VersionInfo[]).sort(sorting),
    'en-GB': (enGB as VersionInfo[]).sort(sorting),
    'vi-VN': (viVN as VersionInfo[]).sort(sorting),
  }

  const changelog = computed(() => {
    if (store.storeLocale in changelogMap) {
      // Get the translated changelog
      const other = changelogMap[store.storeLocale]
      // Start with the English
      const result = JSON.parse(JSON.stringify(enGB)) as VersionInfo[]

      // For each English entry
      return result.map(c => {
        // Check if a translation exists
        const match = other?.find(o => o.version === c.version)

        // Then use that translation match or fall back to original English version
        return match || c
      })
    } else {
      return enGB
    }
  })

  const dialog = ref(false)
  const perPage = ref(5)
  const page = ref(1)
  const highlightVersion = ref<string>()

  function show (hv?: string) {
    highlightVersion.value = hv
    dialog.value = true
  }
  function hide () {
    dialog.value = false
  }

  onMounted(() => {
    emitter.on('show-changelog', show)
  })

  onBeforeUnmount(() => {
    emitter.off('show-changelog', show)
  })

  defineExpose({
    show,
    hide,
  })
</script>

<style>
.changelog-list-item .v-list-item-subtitle {
  white-space: normal !important;
  -webkit-line-clamp: unset;
  line-clamp: unset;
}
</style>
