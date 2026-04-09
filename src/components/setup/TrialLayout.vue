<template>
  <div v-if="model">
    <v-stepper-vertical class="layout-stepper" hide-actions eager v-model="stepperIndex">
      <template #default="{ step }">
        <v-stepper-vertical-item
          :complete="step > 1"
          :error="!areDimensionsValid"
          :title="t('pageTrialLayoutDimensionsTitle')"
          value="1"
        >
          <v-stepper-actions class="mb-4 pa-0">
            <template #prev>
              <v-btn :prepend-icon="mdiArrowUp" :disabled="stepperIndex === 1" color="primary" @click="stepperIndex--" />
            </template>
            <template #next>
              <v-btn :append-icon="mdiArrowDown" color="primary" @click="stepperIndex++" />
            </template>
          </v-stepper-actions>

          <v-btn-toggle v-model="layoutType" :disabled="isEdit" mandatory color="primary" variant="tonal">
            <v-btn :prepend-icon="mdiGrid" :text="$t('pageTrialLayoutDimensionsGrid')" value="grid" :append-icon="layoutType === 'grid' ? mdiCheck : undefined" />
            <v-btn :prepend-icon="mdiLandRowsHorizontal" :text="$t('pageTrialLayoutDimensionsList')" value="list" :append-icon="layoutType === 'list' ? mdiCheck : undefined" />
          </v-btn-toggle>

          <p class="my-5">{{ $t(layoutType === 'grid' ? 'pageTrialLayoutDimensionsTextGrid' : 'pageTrialLayoutDimensionsTextList', i18nParams) }}</p>

          <v-card
            class="mb-5"
            :title="$t('formLabelTrialSetupTrialCustomNames')"
          >
            <v-card-text>
              <p>{{ $t('formDescriptionTrialSetupTrialCustomNames') }}</p>

              <v-switch
                v-model="useCustomNames"
                color="primary"
                hide-details
                :label="$t('formLabelTrialSetupTrialUseCustomNames')"
              />

              <template v-if="useCustomNames && customNames">
                <v-alert
                  color="warning"
                  :icon="mdiAlert"
                  :text="$t('formDescriptionTrialSetupTrialCustomNamesWarning')"
                  variant="tonal"
                  class="mb-3"
                  border="start"
                />

                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customNames.row"
                      :prepend-inner-icon="mdiViewDayOutline"
                      :label="$t('formLabelTrialSetupTrialCustomNamesRow')"
                      :hint="$t('formDescriptionTrialSetupTrialCustomNamesRow')"
                      persistent-hint
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customNames.rows"
                      :prepend-inner-icon="mdiLandRowsHorizontal"
                      :label="$t('formLabelTrialSetupTrialCustomNamesRows')"
                      :hint="$t('formDescriptionTrialSetupTrialCustomNamesRows')"
                      persistent-hint
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customNames.column"
                      :label="$t('formLabelTrialSetupTrialCustomNamesColumn')"
                      :hint="$t('formDescriptionTrialSetupTrialCustomNamesColumn')"
                      persistent-hint
                    >
                      <template #prepend-inner>
                        <v-icon class="mdi-rotate-90" :icon="mdiViewDayOutline" />
                      </template>
                    </v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="customNames.columns"
                      :prepend-inner-icon="mdiLandRowsVertical"
                      :label="$t('formLabelTrialSetupTrialCustomNamesColumns')"
                      :hint="$t('formDescriptionTrialSetupTrialCustomNamesColumns')"
                      persistent-hint
                    />
                  </v-col>
                </v-row>
              </template>
            </v-card-text>
          </v-card>

          <LayoutDimensions
            v-model="model.layout"
            :dimension-names="model.dimensionNames"
            v-model:layout-type="layoutType"
            :is-edit="isEdit"
            can-change
          />

          <v-stepper-actions class="mt-4 pa-0">
            <template #prev>
              <v-btn :prepend-icon="mdiArrowUp" :disabled="stepperIndex === 1" color="primary" @click="stepperIndex--" />
            </template>
            <template #next>
              <v-btn :append-icon="mdiArrowDown" color="primary" @click="stepperIndex++" />
            </template>
          </v-stepper-actions>
        </v-stepper-vertical-item>

        <v-stepper-vertical-item
          :title="t('pageTrialLayoutGermplasmTitle')"
          :error="!isGermplasmValid"
          value="2"
        >
          <v-stepper-actions class="mb-4 pa-0">
            <template #prev>
              <v-btn :prepend-icon="mdiArrowUp" color="primary" @click="checkLeave(undefined, -1)" />
            </template>
            <template #next>
              <v-btn :append-icon="mdiArrowDown" color="primary" :disabled="!isGermplasmValid" @click="checkLeave(undefined, 1)" />
            </template>
          </v-stepper-actions>

          <GermplasmLayoutTable v-model="model" :is-edit="isEdit" :is-clone="isClone" ref="germplasmLayoutTable" />

          <v-stepper-actions class="mt-4 pa-0">
            <template #prev>
              <v-btn :prepend-icon="mdiArrowUp" color="primary" @click="checkLeave(undefined, -1)" />
            </template>
            <template #next>
              <v-btn :append-icon="mdiArrowDown" color="primary" :disabled="!isGermplasmValid" @click="checkLeave(undefined, 1)" />
            </template>
          </v-stepper-actions>
        </v-stepper-vertical-item>

        <v-stepper-vertical-item
          :title="t('pageTrialLayoutCornersTitle')"
          :error="!areCornersValid"
          value="3"
        >
          <v-stepper-actions class="mb-4 pa-0">
            <template #prev>
              <v-btn :prepend-icon="mdiArrowUp" :disabled="stepperIndex === 1" color="primary" @click="stepperIndex--" />
            </template>
            <template #next>
              <v-btn :append-icon="mdiArrowDown" color="primary" @click="stepperIndex++" />
            </template>
          </v-stepper-actions>

          <CornerPointsMap v-model="model.layout" :dimension-names="model.dimensionNames" ref="cornerPointMap" />

          <v-stepper-actions class="mt-4 pa-0">
            <template #prev>
              <v-btn :prepend-icon="mdiArrowUp" color="primary" @click="stepperIndex--" />
            </template>
            <template #next>
              <v-btn :append-icon="mdiArrowDown" color="primary" @click="stepperIndex++" />
            </template>
          </v-stepper-actions>
        </v-stepper-vertical-item>

        <v-stepper-vertical-item
          :title="t('pageTrialLayoutMarkersTitle')"
          :error="!areCornersValid"
          value="4"
        >
          <v-stepper-actions class="mb-4 pa-0">
            <template #prev>
              <v-btn :prepend-icon="mdiArrowUp" color="primary" @click="stepperIndex--" />
            </template>
            <template #next>
              <v-btn :append-icon="mdiArrowDown" :disabled="!isValid" color="primary" @click="emit('next')" />
            </template>
          </v-stepper-actions>

          <LayoutMarkers v-model="model.layout" :dimension-names="model.dimensionNames" ref="layoutMarkers" />

          <v-stepper-actions class="mt-4 pa-0">
            <template #prev>
              <v-btn :prepend-icon="mdiArrowUp" color="primary" @click="stepperIndex--" />
            </template>
            <template #next>
              <v-btn :append-icon="mdiArrowDown" :disabled="!isValid" color="primary" @click="emit('next')" />
            </template>
          </v-stepper-actions>
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
  import { mdiAlert, mdiArrowDown, mdiArrowUp, mdiCheck, mdiGrid, mdiLandRowsHorizontal, mdiLandRowsVertical, mdiViewDayOutline } from '@mdi/js'
  import { getI18nParams, isEmpty } from '@/plugins/formatting'
  import type { DimensionNames } from '@/plugins/types/gridscore'

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

  const useCustomNames = ref(false)
  const customNames = ref<DimensionNames>()

  const customNamesValid = computed(() => {
    if (!useCustomNames.value || !customNames.value) {
      return true
    } else {
      return !isEmpty(customNames.value.row) && !isEmpty(customNames.value.rows) && !isEmpty(customNames.value.column) && !isEmpty(customNames.value.columns)
    }
  })

  const i18nParams = computed(() => getI18nParams(model.value?.dimensionNames))

  const stepperIndex = ref(1)
  const layoutType = ref<'grid' | 'list'>('grid')
  const germplasmLayoutTable = useTemplateRef('germplasmLayoutTable')
  const cornerPointMap = useTemplateRef('cornerPointMap')
  const layoutMarkers = useTemplateRef('layoutMarkers')

  const isValid: ComputedRef<boolean> = computed(() => areDimensionsValid.value && isGermplasmValid.value && areCornersValid.value && areLabelsValid.value && customNamesValid.value)
  const areDimensionsValid: ComputedRef<boolean> = computed(() => model.value?.layout.rows !== undefined && model.value.layout.rows !== null && model.value.layout.columns !== undefined && model.value.layout.columns !== null)
  const isGermplasmValid: ComputedRef<boolean> = computed(() => germplasmLayoutTable.value?.isValid || false)
  const areCornersValid: ComputedRef<boolean> = computed(() => cornerPointMap.value?.isValid || false)
  const areLabelsValid: ComputedRef<boolean> = computed(() => {
    return (model.value?.layout.columnLabels.every(cl => cl !== undefined && cl !== null) && model.value.layout.rowLabels.every(rl => rl !== undefined && rl !== null) && model.value?.layout.columnLabels.length === model.value?.layout.columns && model.value?.layout.rowLabels.length === model.value?.layout.rows) || false
  })

  function checkLeave (callback: (() => void) | undefined, internalDelta: number) {
    if (stepperIndex.value === 2) {
      germplasmLayoutTable.value?.removeTable()
        .then(() => {
          if (callback) {
            callback()
          } else {
            stepperIndex.value += internalDelta
          }
        })
    } else {
      if (callback) {
        callback()
      } else {
        stepperIndex.value += internalDelta
      }
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

  watch(useCustomNames, async newValue => {
    if (newValue && !customNames.value) {
      customNames.value = {
        row: '',
        rows: '',
        column: '',
        columns: '',
      }
    } else if (!newValue && customNames.value !== undefined) {
      customNames.value = undefined
    }
  })

  watch(customNames, async newValue => {
    if (model.value) {
      model.value.dimensionNames = newValue
    }
  }, { deep: true })

  onMounted(() => {
    const mv = model.value
    if (mv) {
      customNames.value = mv.dimensionNames ? JSON.parse(JSON.stringify(mv.dimensionNames)) : undefined
      nextTick(() => {
        useCustomNames.value = mv.dimensionNames !== undefined
      })
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
