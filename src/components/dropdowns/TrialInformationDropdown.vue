<template>
  <b-dropdown v-if="trial" :title="$t('toolbarTrialInfo')">
    <template #button-content>
      <BIconInfoCircle /> <span class="d-none d-lg-inline-block">{{ $t('toolbarTrialInfo') }}</span>
    </template>
    <div class="b-dropdown-form trial-info">
      <TrialInformation class="m-0 p-0" :trial="trial" />
    </div>
  </b-dropdown>
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
  }
}
</script>

<style scoped>
.trial-info {
  max-width: 100vw;
  min-width: 33vw;
}
</style>
