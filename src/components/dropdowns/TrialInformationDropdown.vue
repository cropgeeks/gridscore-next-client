<template>
  <b-nav-item-dropdown v-if="trial" right ref="dropdown" id="trial-information-dropdown" menu-class="px-2">
    <template #button-content>
      <IBiInfoCircle /> <span class="d-none d-lg-inline-block">{{ $t('toolbarTrialInfo') }}</span>
    </template>
    <div class="b-dropdown-form trial-info">
      <TrialInformation :trial="trial" />
    </div>
  </b-nav-item-dropdown>
</template>

<script>
import TrialInformation from '@/components/TrialInformation.vue'

export default {
  components: {
    TrialInformation
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
