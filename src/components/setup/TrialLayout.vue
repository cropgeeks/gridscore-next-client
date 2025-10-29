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
            <v-btn :prepend-icon="mdiGrid" :text="$t('pageTrialLayoutDimensionsGrid')" value="grid" :append-icon="layoutType === 'grid' ? mdiCheck : undefined" />
            <v-btn :prepend-icon="mdiLandRowsHorizontal" :text="$t('pageTrialLayoutDimensionsList')" value="list" :append-icon="layoutType === 'list' ? mdiCheck : undefined" />
          </v-btn-toggle>

          <p class="my-5">{{ $t(layoutType === 'grid' ? 'pageTrialLayoutDimensionsTextGrid' : 'pageTrialLayoutDimensionsTextList') }}</p>

          <LayoutDimensions
            v-model="model.layout"
            v-model:layout-type="layoutType"
            :is-edit="isEdit"
            can-change
          />

          <template #prev="{ prev }">
            <v-btn :prepend-icon="mdiArrowUp" color="primary" @click="prev" />
          </template>

          <template #next="{ next }">
            <v-btn :append-icon="mdiArrowDown" color="primary" @click="next" />
          </template>
        </v-stepper-vertical-item>

        <v-stepper-vertical-item
          :title="t('pageTrialLayoutGermplasmTitle')"
          :error="!isGermplasmValid"
          value="2"
        >
          <GermplasmLayoutTable v-model="model" :is-edit="isEdit" :is-clone="isClone" ref="germplasmLayoutTable" />

          <template #prev="{ prev }">
            <v-btn :prepend-icon="mdiArrowUp" color="primary" @click="checkLeave(prev)" />
          </template>

          <template #next="{ next }">
            <v-btn :append-icon="mdiArrowDown" color="primary" @click="checkLeave(next)" :disabled="!isGermplasmValid" />
          </template>
        </v-stepper-vertical-item>

        <v-stepper-vertical-item
          :title="t('pageTrialLayoutCornersTitle')"
          :error="!areCornersValid"
          value="3"
        >
          <CornerPointsMap v-model="model.layout" ref="cornerPointMap" />

          <template #prev="{ prev }">
            <v-btn :prepend-icon="mdiArrowUp" color="primary" @click="prev" />
          </template>

          <template #next="{ next }">
            <v-btn :append-icon="mdiArrowDown" color="primary" @click="next" />
          </template>
        </v-stepper-vertical-item>

        <v-stepper-vertical-item
          :title="t('pageTrialLayoutMarkersTitle')"
          :error="!areCornersValid"
          value="4"
        >
          <LayoutMarkers v-model="model.layout" ref="layoutMarkers" />

          <template #prev="{ prev }">
            <v-btn :prepend-icon="mdiArrowUp" color="primary" @click="prev" />
          </template>

          <template #next>
            <v-btn :append-icon="mdiArrowDown" color="primary" @click="emit('next')" :disabled="!isValid" />
          </template>
        </v-stepper-vertical-item>
      </template>
    </v-stepper-vertical>
  </div>
</template>

<script setup lang="ts">
  import { getColumnLabel, getRowLabel } from '@/plugins/util'
  import { useI18n } from 'vue-i18n'
  import GermplasmLayoutTable from '@/components/setup/GermplasmLayoutTable.vue'
  import CornerPointsMap from '@/components/setup/CornerPointsMap.vue'
  import LayoutMarkers from '@/components/setup/LayoutMarkers.vue'
  import type { TrialPlus } from '@/plugins/types/client'
  import { mdiArrowDown, mdiArrowUp, mdiCheck, mdiGrid, mdiLandRowsHorizontal } from '@mdi/js'

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

<style>
.layout-stepper .v-stepper-actions {
  justify-content: flex-start !important;
  flex-direction: row !important;
}
</style>
