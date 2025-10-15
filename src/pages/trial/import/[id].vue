<template>
  <TrialImport :code="code" />
</template>

<script setup lang="ts">
  import TrialImport from '@/components/trial/TrialImport.vue'

  const route = useRoute('/trial/import/[id]')

  const code = ref<string>()

  onMounted(() => {
    if (route && route.params && route.params.id) {
      code.value = route.params.id
    }
  })
</script>
