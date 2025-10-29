<template>
  <div v-if="model">
    <v-row>
      <v-col cols="12" md="6">
        <NumberInputWithFallback
          v-model="model.rows"
          :default-value="1"
          :min="1"
          required
          :disabled="isEdit || !canChange"
          :prepend-inner-icon="mdiLandRowsHorizontal"
          :label="$t('formLabelSetupRows')"
          :hint="$t('formLabelDescriptionRows')"
          persistent-hint
        />

        <v-btn-toggle v-model="model.rowOrder" :disabled="isEdit" mandatory color="primary" variant="tonal" class="mt-3">
          <v-btn :value="DisplayOrder.TOP_TO_BOTTOM" :text="$t('buttonTopToBottom')" :prepend-icon="mdiSortAscending" />
          <v-btn :value="DisplayOrder.BOTTOM_TO_TOP" :text="$t('buttonBottomToTop')">
            <template #prepend><v-icon :icon="mdiSortAscending" class="mdi-flip-v" /></template>
          </v-btn>
        </v-btn-toggle>
      </v-col>
      <v-col cols="12" md="6" v-if="layoutType === 'grid'">
        <NumberInputWithFallback
          v-model="model.columns"
          :default-value="1"
          :min="1"
          required
          :disabled="isEdit || !canChange"
          :prepend-inner-icon="mdiLandRowsVertical"
          :label="$t('formLabelSetupColumns')"
          :hint="$t('formLabelDescriptionColumns')"
          persistent-hint
        />

        <v-btn-toggle v-model="model.columnOrder" :disabled="isEdit" mandatory color="primary" variant="tonal" class="mt-3">
          <v-btn :value="DisplayOrder.LEFT_TO_RIGHT" :text="$t('buttonLeftToRight')">
            <template #prepend><v-icon :icon="mdiSortAscending" class="sort-ltr" /></template>
          </v-btn>
          <v-btn :value="DisplayOrder.RIGHT_TO_LEFT" :text="$t('buttonRightToLeft')">
            <template #prepend><v-icon :icon="mdiSortAscending" class="sort-rtl" /></template>
          </v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>

    <v-alert class="mt-3" color="warning" variant="tonal" :icon="mdiAlert" :text="$t('pageTrialLayoutDimensionsFielDHubNotice')" v-if="layoutType === 'grid'" />
  </div>
</template>

<script setup lang="ts">
  import NumberInputWithFallback from '@/components/inputs/NumberInputWithFallback.vue'
  import { DisplayOrder, type Layout } from '@/plugins/types/gridscore'
  import { mdiAlert, mdiLandRowsHorizontal, mdiLandRowsVertical, mdiSortAscending } from '@mdi/js'

  const model = defineModel<Layout>()
  const layoutType = defineModel<'grid' | 'list'>('layoutType')

  defineProps<{
    isEdit: boolean
    canChange: boolean
  }>()
</script>

<style>
.sort-ltr svg {
  transform: rotate(90deg) scaleX(-1) scaleY(-1);
}

.sort-rtl svg {
  transform: rotate(90deg) scaleX(-1);
}
</style>
