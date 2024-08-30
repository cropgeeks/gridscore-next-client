<template>
  <b-modal :title="$t('modalTitleChangelog')"
           :ok-title="$t('buttonClose')"
           ok-only
           scrollable
           no-fade
           size="lg"
           @hidden="$emit('modal-hidden')"
           ref="changelogModal">
    <p v-html="$t('modalTextChangelog')" />

    <b-pagination :per-page="perPage" :total-rows="totalCount" v-model="page" v-if="totalCount > perPage" />

    <b-card :title="version.version" v-for="version in visibleChangelog" :key="`changelog-${version.version}`" class="mb-3">
      <b-card-subtitle v-if="version.date" class="mb-3">
        <IBiCalendarDate /> {{ new Date(version.date).toLocaleDateString() }}
      </b-card-subtitle>
      <dl class="row mb-0">
        <template v-for="(item, index) in version.items" :key="`changelog-${version.version}-${index}`">
          <dt class="col-md-4 d-flex align-items-start"><b-badge class="my-1 me-2" :variant="badge[item.type].variant">{{ badge[item.type].text }}</b-badge> <span>{{ item.title }}</span></dt>
          <dd class="col-md-8">{{ item.text }}</dd>
        </template>
      </dl>
    </b-card>

    <b-pagination :per-page="perPage" :total-rows="totalCount" v-model="page" v-if="totalCount > perPage" />
  </b-modal>
</template>

<script>
import { mapStores, mapState } from 'pinia'
import { coreStore } from '@/store'

import deDE from '@/plugins/changelog/de_DE.json'
import enGB from '@/plugins/changelog/en_GB.json'
import viVN from '@/plugins/changelog/vi_VN.json'

import semver from 'semver'

const sorting = (a, b) => {
  if (semver.eq(a.version, b.version)) {
    return 0
  } else if (semver.gt(a.version, b.version)) {
    return -1
  } else {
    return 1
  }
}

const changelogMap = {
  'de-DE': deDE.sort(sorting),
  'en-GB': enGB.sort(sorting),
  'vi-VN': viVN.sort(sorting)
}

export default {
  props: {
    prevVersion: {
      type: String,
      default: null
    }
  },
  data: function () {
    return {
      page: 1,
      perPage: 5
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeLocale'
    ]),
    badge: function () {
      return {
        new: { variant: 'success', text: this.$t('changelogBadgeNew') },
        update: { variant: 'info', text: this.$t('changelogBadgeUpdate') },
        bugfix: { variant: 'warning', text: this.$t('changelogBadgeFix') }
      }
    },
    totalCount: function () {
      if (this.totalChangelog) {
        return this.totalChangelog.length
      } else {
        return 0
      }
    },
    changelog: function () {
      if (this.storeLocale in changelogMap) {
        // Get the translated changelog
        const other = changelogMap[this.storeLocale]
        // Start with the English
        const result = JSON.parse(JSON.stringify(enGB))

        // For each English entry
        return result.map(c => {
          // Check if a translation exists
          const match = other.find(o => o.version === c.version)

          // Then use that translation match or fall back to original English version
          return match || c
        })
      } else {
        return enGB
      }
    },
    totalChangelog: function () {
      let cl = []
      if (!this.prevVersion) {
        cl = this.changelog
      } else {
        const parsed = semver.valid(this.prevVersion)

        if (parsed) {
          cl = this.changelog.filter(c => semver.gt(c.version, this.prevVersion))
        } else {
          cl = this.changelog
        }
      }

      return cl
    },
    visibleChangelog: function () {
      if (this.totalChangelog) {
        return this.totalChangelog.slice((this.page - 1) * this.perPage, this.page * this.perPage)
      } else {
        return []
      }
    }
  },
  methods: {
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.changelogModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.changelogModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
