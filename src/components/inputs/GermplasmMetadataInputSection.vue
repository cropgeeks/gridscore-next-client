<template>
  <div v-if="cell">
    <v-text-field
      v-model="cell.germplasm"
      hide-details
      density="compact"
      required
      :label="$t('formLabelSetupGermplasm')"
    />
    <v-text-field
      v-model="cell.rep"
      hide-details
      density="compact"
      :label="$t('formLabelSetupRep')"
    />
    <v-text-field
      v-model="cell.treatment"
      hide-details
      density="compact"
      v-show="visibleFields.includes('treatment')"
      :label="$t('formLabelSetupTreatment')"
    />
    <v-text-field
      v-model="cell.friendlyName"
      hide-details
      density="compact"
      v-show="visibleFields.includes('friendlyName')"
      :label="$t('formLabelSetupFriendlyName')"
    />
    <v-text-field
      v-model="cell.barcode"
      hide-details
      density="compact"
      v-show="visibleFields.includes('barcode')"
      :label="$t('formLabelSetupBarcode')"
    />
    <v-text-field
      v-model="cell.pedigree"
      hide-details
      density="compact"
      v-show="visibleFields.includes('pedigree')"
      :label="$t('formLabelSetupPedigree')"
    />
  </div>
</template>

<script setup lang="ts">
  import type { CellMetadata } from '@/plugins/types/gridscore'

  const compProps = defineProps<{
    visibleFields: ('treatment' | 'friendlyName' | 'pedigree' | 'barcode')[]
  }>()

  const cell = defineModel<CellMetadata>()

  const valid = computed(() => cell.value && cell.value.germplasm && cell.value.germplasm.trim().length > 0)

  defineExpose({
    valid,
  })
</script>
