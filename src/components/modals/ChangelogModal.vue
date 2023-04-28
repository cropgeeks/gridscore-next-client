<template>
  <b-modal :title="$t('modalTitleChangelog')"
           :ok-title="$t('buttonClose')"
           ok-only
           no-fade
           size="lg"
           ref="changelogModal">
    <p>{{ $t('modalTextChangelog') }}</p>

    <b-pagination :per-page="perPage" :total-rows="totalCount" v-model="page" v-if="totalCount > perPage" />

    <b-card :title="version.version" v-for="version in visibleChangelog" :key="`changelog-${version.version}`" class="mb-3">
      <b-card-sub-title v-if="version.date" class="mb-3">
        <BIconCalendarDate /> {{ new Date(version.date).toLocaleDateString() }}
      </b-card-sub-title>
      <dl class="row mb-0">
        <template v-for="(item, index) in version.items">
          <dt :key="`changelog-${version.version}-dt-${index}`" class="col-md-4"><b-badge :variant="badge[item.type].variant">{{ badge[item.type].text }}</b-badge> {{ item.title }}</dt>
          <dd :key="`changelog-${version.version}-dd-${index}`" class="col-md-8">{{ item.text }}</dd>
        </template>
      </dl>
    </b-card>

    <b-pagination :per-page="perPage" :total-rows="totalCount" v-model="page" v-if="totalCount > perPage" />
  </b-modal>
</template>

<script>
import { mapGetters } from 'vuex'
import { BIconCalendarDate } from 'bootstrap-vue'

import deDE from '@/plugins/changelog/de_DE.json'
import enGB from '@/plugins/changelog/en_GB.json'

const semver = require('semver')

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
  de_DE: deDE.sort(sorting),
  en_GB: enGB.sort(sorting)
}

export default {
  components: {
    BIconCalendarDate
  },
  props: {
    prevVersion: {
      type: String,
      default: null
    }
  },
  data: function () {
    return {
      badge: {
        new: { variant: 'success', text: 'NEW' },
        update: { variant: 'info', text: 'UPD' },
        bugfix: { variant: 'warning', text: 'FIX' }
      },
      page: 1,
      perPage: 5
    }
  },
  computed: {
    ...mapGetters([
      'storeLocale'
    ]),
    totalCount: function () {
      if (this.changelog) {
        return this.changelog.length
      } else {
        return 0
      }
    },
    changelog: function () {
      if (this.storeLocale in changelogMap) {
        return changelogMap[this.storeLocale]
      } else {
        return enGB
      }
    },
    visibleChangelog: function () {
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

      return cl.slice((this.page - 1) * this.perPage, this.page * this.perPage)
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
