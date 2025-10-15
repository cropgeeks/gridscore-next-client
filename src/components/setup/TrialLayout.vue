<template>
  <div v-if="model">
    <v-stepper-vertical class="layout-stepper" eager v-model="stepperIndex">
      <template #default="{ step }">
        <v-stepper-vertical-item
          :complete="step > 1"
          :error="!areDimensionsValid"
          :title="t('pageTrialLayoutDimensionsTitle')"
          value="1"
        >
          <v-btn-toggle v-model="layoutType" :disabled="isEdit" mandatory color="primary" variant="tonal">
            <v-btn prepend-icon="mdi-grid" :text="$t('pageTrialLayoutDimensionsGrid')" value="grid" :append-icon="layoutType === 'grid' ? 'mdi-check' : undefined" />
            <v-btn prepend-icon="mdi-land-rows-horizontal" :text="$t('pageTrialLayoutDimensionsList')" value="list" :append-icon="layoutType === 'list' ? 'mdi-check' : undefined" />
          </v-btn-toggle>

          <p class="my-5">{{ $t(layoutType === 'grid' ? 'pageTrialLayoutDimensionsTextGrid' : 'pageTrialLayoutDimensionsTextList') }}</p>

          <v-row>
            <v-col cols="12" md="6">
              <NumberInputWithFallback
                v-model="model.layout.rows"
                :default-value="1"
                :min="1"
                required
                :disabled="isEdit"
                prepend-inner-icon="mdi-land-rows-horizontal"
                :label="$t('formLabelSetupRows')"
                :hint="$t('formLabelDescriptionRows')"
                persistent-hint
              />

              <v-btn-toggle v-model="model.layout.rowOrder" :disabled="isEdit" mandatory color="primary" variant="tonal" class="mt-3">
                <v-btn :value="DisplayOrder.TOP_TO_BOTTOM" :text="$t('buttonTopToBottom')" prepend-icon="mdi-sort-ascending" />
                <v-btn :value="DisplayOrder.BOTTOM_TO_TOP" :text="$t('buttonBottomToTop')">
                  <template #prepend><v-icon icon="mdi-sort-ascending" class="mdi-flip-v" /></template>
                </v-btn>
              </v-btn-toggle>
            </v-col>
            <v-col cols="12" md="6" v-if="layoutType === 'grid'">
              <NumberInputWithFallback
                v-model="model.layout.columns"
                :default-value="1"
                :min="1"
                required
                :disabled="isEdit"
                prepend-inner-icon="mdi-land-rows-vertical"
                :label="$t('formLabelSetupColumns')"
                :hint="$t('formLabelDescriptionColumns')"
                persistent-hint
              />

              <v-btn-toggle v-model="model.layout.columnOrder" :disabled="isEdit" mandatory color="primary" variant="tonal" class="mt-3">
                <v-btn :value="DisplayOrder.LEFT_TO_RIGHT" :text="$t('buttonLeftToRight')">
                  <template #prepend><v-icon icon="mdi-sort-ascending" class="sort-ltr" /></template>
                </v-btn>
                <v-btn :value="DisplayOrder.RIGHT_TO_LEFT" :text="$t('buttonRightToLeft')">
                  <template #prepend><v-icon icon="mdi-sort-ascending" class="sort-rtl" /></template>
                </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>

          <template #prev="{ prev }">
            <v-btn prepend-icon="mdi-arrow-up" color="primary" @click="prev" />
          </template>

          <template #next="{ next }">
            <v-btn append-icon="mdi-arrow-down" color="primary" @click="next" />
          </template>
        </v-stepper-vertical-item>

        <v-stepper-vertical-item
          :title="t('pageTrialLayoutGermplasmTitle')"
          :error="!isGermplasmValid"
          value="2"
        >
          <GermplasmLayoutTable v-model="model" :is-edit="isEdit" :is-clone="isClone" ref="germplasmLayoutTable" />

          <template #prev="{ prev }">
            <v-btn prepend-icon="mdi-arrow-up" color="primary" @click="checkLeave(prev)" />
          </template>

          <template #next="{ next }">
            <v-btn append-icon="mdi-arrow-down" color="primary" @click="checkLeave(next)" :disabled="!isGermplasmValid" />
          </template>
        </v-stepper-vertical-item>

        <v-stepper-vertical-item
          :title="t('pageTrialLayoutCornersTitle')"
          :error="!areCornersValid"
          value="3"
        >
          <CornerPointsMap v-model="model.layout" ref="cornerPointMap" />

          <template #prev="{ prev }">
            <v-btn prepend-icon="mdi-arrow-up" color="primary" @click="prev" />
          </template>

          <template #next="{ next }">
            <v-btn append-icon="mdi-arrow-down" color="primary" @click="next" />
          </template>
        </v-stepper-vertical-item>

        <v-stepper-vertical-item
          :title="t('pageTrialLayoutMarkersTitle')"
          :error="!areCornersValid"
          value="4"
        >
          <LayoutMarkers v-model="model.layout" ref="layoutMarkers" />

          <template #prev="{ prev }">
            <v-btn prepend-icon="mdi-arrow-up" color="primary" @click="prev" />
          </template>

          <template #next>
            <v-btn append-icon="mdi-arrow-down" color="primary" @click="emit('next')" :disabled="!isValid" />
          </template>
        </v-stepper-vertical-item>
      </template>
    </v-stepper-vertical>
  </div>
</template>

<script setup lang="ts">
  import { DisplayOrder } from '@/plugins/types/gridscore'
  import { getColumnLabel, getRowLabel } from '@/plugins/util'
  import { useI18n } from 'vue-i18n'
  import GermplasmLayoutTable from '@/components/setup/GermplasmLayoutTable.vue'
  import CornerPointsMap from '@/components/setup/CornerPointsMap.vue'
  import LayoutMarkers from '@/components/setup/LayoutMarkers.vue'
  import NumberInputWithFallback from '@/components/inputs/NumberInputWithFallback.vue'
  import type { TrialPlus } from '@/plugins/types/client'

  const { t } = useI18n()

  const emit = defineEmits(['next'])

  export interface TrialLayoutProps {
    isEdit?: boolean
    isClone?: boolean
  }

  const compProps = withDefaults(defineProps<TrialLayoutProps>(), {
    isEdit: false,
    isClone: false,
  })

  const model = defineModel<TrialPlus>()

  const stepperIndex = ref(1)
  const layoutType = ref<'grid' | 'list'>('grid')
  const germplasmLayoutTable = useTemplateRef('germplasmLayoutTable')
  const cornerPointMap = useTemplateRef('cornerPointMap')
  const layoutMarkers = useTemplateRef('layoutMarkers')

  const isValid: ComputedRef<boolean> = computed(() => areDimensionsValid.value && isGermplasmValid.value && areCornersValid.value)
  const areDimensionsValid: ComputedRef<boolean> = computed(() => model.value?.layout.rows !== undefined && model.value.layout.rows !== null && model.value.layout.columns !== undefined && model.value.layout.columns !== null)
  const isGermplasmValid: ComputedRef<boolean> = computed(() => germplasmLayoutTable.value?.isValid || false)
  const areCornersValid: ComputedRef<boolean> = computed(() => cornerPointMap.value?.isValid || false)

  function checkLeave (callback: () => void) {
    if (stepperIndex.value === 2) {
      germplasmLayoutTable.value?.removeTable()
        .then(() => callback())
    } else {
      callback()
    }
  }

  watchEffect(() => {
    if (model.value) {
      const m = model.value.layout
      model.value.layout.rowLabels = Array.from(new Array(model.value.layout.rows).keys()).map((_, i) => getRowLabel(m, i))
      model.value.layout.columnLabels = Array.from(new Array(model.value.layout.columns).keys()).map((_, i) => getColumnLabel(m, i))
    }
  })

  watch(() => model.value?.layout.rowOrder, async () => {
    if (model.value) {
      model.value.layout.rowLabels = model.value.layout.rowLabels.concat().reverse()
    }
  })
  watch(() => model.value?.layout.columnOrder, async () => {
    if (model.value) {
      model.value.layout.columnLabels = model.value.layout.columnLabels.concat().reverse()
    }
  })

  watch(stepperIndex, async newValue => {
    switch (newValue) {
      case 2:
        nextTick(() => germplasmLayoutTable.value?.update())
        break
      case 3:
        cornerPointMap.value?.invalidateSize()
        break
      case 4:
        nextTick(() => layoutMarkers.value?.reset())
        break
    }
  })

  function refreshTable () {
    if (stepperIndex.value === 2) {
      germplasmLayoutTable.value?.update()
    }
  }

  defineExpose({
    isValid,
    checkLeave,
    refreshTable,
  })
</script>

<style scoped>
.sort-ltr::before {
  transform: rotate(90deg) scaleX(-1) scaleY(-1);
}

.sort-rtl::before {
  transform: rotate(90deg) scaleX(-1);
}
</style>

<style>
.layout-stepper .v-stepper-actions {
  justify-content: flex-start !important;
  flex-direction: row !important;
}
</style>
