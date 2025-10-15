<template>
  <TrialCreation :source="toEdit" is-edit v-if="toEdit" />
</template>

<script setup lang="ts">
  import TrialCreation from '@/components/trial/TrialCreation.vue'
  import { getTrialById, getTrialData } from '@/plugins/idb'
  import type { TrialPlus } from '@/plugins/types/client'

  const route = useRoute('/setup/[id]/clone')

  const toEdit = ref<TrialPlus>()

  onMounted(() => {
    if (route && route.params && route.params.id) {
      getTrialById(route.params.id)
        .then(trial => {
          getTrialData(trial.localId)
            .then(data => {
              trial.data = data
              toEdit.value = trial
            })
        })
    }
  })
</script>
