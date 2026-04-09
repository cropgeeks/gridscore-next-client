<template>
  <TrialCreation :source="toClone" is-clone v-if="toClone" />
</template>

<script setup lang="ts">
  import TrialCreation from '@/components/trial/TrialCreation.vue'
  import { getTrialById, getTrialData } from '@/plugins/idb'
  import type { TrialPlus } from '@/plugins/types/client'

  const route = useRoute('/setup/[id]/clone')

  const toClone = ref<TrialPlus>()

  onMounted(() => {
    if (route && route.params && route.params.id) {
      getTrialById(route.params.id)
        .then(trial => {
          getTrialData(trial.localId)
            .then(data => {
              trial.data = data
              toClone.value = trial
            })
        })
    }
  })
</script>
