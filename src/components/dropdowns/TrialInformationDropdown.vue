<template>
  <b-nav-item-dropdown v-if="trial" right :title="$t('toolbarTrialInfo')" ref="dropdown" id="trial-information-dropdown" menu-class="position-absolute">
    <template #button-content>
      <BIconInfoCircle /> <span class="d-none d-lg-inline-block">{{ $t('toolbarTrialInfo') }}</span>
    </template>
    <div class="b-dropdown-form trial-info">
      <TrialInformation class="m-0 p-0" :trial="trial" />
    </div>
  </b-nav-item-dropdown>
</template>

<script>
import TrialInformation from '@/components/TrialInformation'
import { BIconInfoCircle } from 'bootstrap-vue'

export default {
  components: {
    TrialInformation,
    BIconInfoCircle
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  methods: {
    show: function () {
      this.$refs.dropdown.show()
    },
    hide: function () {
      this.$refs.dropdown.hide()
    }
  }
}
</script>

<style scoped>
.trial-info {
  max-width: 100vw;
  min-width: 20vw;
}
</style>
