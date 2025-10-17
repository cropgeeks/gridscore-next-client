<template>
  <div>
    <v-btn-toggle mandatory color="primary" variant="tonal" v-model="scoreWidth" class="height-auto">
      <v-btn class="pa-2" stacked :value="1" :text="$t('widgetGuideWidth', 1)">
        <template #prepend>
          <v-icon :icon="guidedWalkSingle" size="60" class="ma-4" />
        </template>
      </v-btn>
      <v-btn class="pa-2" stacked :value="2" :text="$t('widgetGuideWidth', 2)">
        <template #prepend>
          <v-icon :icon="guidedWalkDouble" size="60" class="ma-4" />
        </template>
      </v-btn>
    </v-btn-toggle>

    <v-expansion-panels v-model="tabIndex" class="mt-5" v-if="precomputedOrders">
      <v-expansion-panel
        value="snake"
      >
        <template #title>
          <v-icon
            class="me-3"
            :icon="guidedWalkSnake"
          /> {{ $t('widgetGuideOrderTabSnake') }}
        </template>

        <template #text>
          <v-row class="guide-order mt-3">
            <v-col v-for="option in precomputedOrders['snake']" :key="`guide-option-${option.type.name}`" cols="6" md="3" class="d-flex">
              <v-btn
                class="height-auto flex-grow-1"
                stacked
                :text="$t(option.type.i18n)"
                :active="option.type.name === walkName"
                active-color="primary"
                variant="tonal"
                :disabled="!option.valid"
                @click="walkName = option.type.name"
              >
                <template #prepend>
                  <v-icon :icon="option.type.image" size="60" class="ma-4" />
                </template>
              </v-btn>
            </v-col>
          </v-row>
        </template>
      </v-expansion-panel>
      <v-expansion-panel
        value="zigzag"
      >
        <template #title>
          <v-icon
            class="me-3"
            :icon="guidedWalkZigzag"
          /> {{ $t('widgetGuideOrderTabZigzag') }}
        </template>
        <template #text>
          <v-row class="guide-order mt-3">
            <v-col v-for="option in precomputedOrders['zigzag']" :key="`guide-option-${option.type.name}`" cols="6" md="3" class="d-flex">
              <v-btn
                class="height-auto flex-grow-1"
                stacked
                :text="$t(option.type.i18n)"
                :active="option.type.name === walkName"
                active-color="primary"
                variant="tonal"
                :disabled="!option.valid"
                @click="walkName = option.type.name"
              >
                <template #prepend>
                  <v-icon :icon="option.type.image" size="60" class="ma-4" />
                </template>
              </v-btn>
            </v-col>
          </v-row>
        </template>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-row class="mt-5">
      <v-col cols="12" lg="6" v-if="neighborOptions.length > 0">
        <h3>{{ $t('widgetGuideWidthNeighborSelectorTitle') }}</h3>
        <p>{{ $t('widgetGuideWidthNeighborSelectorText') }}</p>
        <v-row>
          <v-col
            :cols="12"
            :md="6"
            class="mb-3"
            v-for="option in neighborOptions"
            :key="`neighbor-option-${option.value.x}-${option.value.y}`"
          >
            <v-card
              :color="neighbor && (neighbor.key === option.key) ? 'primary' : undefined"
              variant="tonal"
              :title="option.name"
              :subtitle="$t('widgetGuidedWalkPreviewColumnRow', { row: option.displayRow, column: option.displayColumn })"
              @click="neighbor = option"
            />
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" lg="6" id="guided-walk-preview">
        <TrialPreviewCanvas :layout="layout" :column="column" :row="row" :cells="guidedWalkCells" :path="guidedWalkPath" :width="guidedWalkDimensions[0]" :height="(guidedWalkDimensions[1] || 200) * 0.5" v-if="guidedWalkPath" />
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
  import type { CellPlus } from '@/plugins/types/client'
  import { guidedWalkDouble, guidedWalkSingle, guidedWalkSnake, guidedWalkZigzag } from '@/plugins/icons'
  import { Direction, getSequence, methods, type Method } from '@/plugins/guidedwalk'
  import type { Layout } from '@/plugins/types/gridscore'
  import { getTrialDataCached } from '@/plugins/datastore'
  import { getColumnLabel, getRowLabel } from '@/plugins/util'
  import type { XY } from '@/plugins/location'
  import TrialPreviewCanvas from '@/components/data/TrialPreviewCanvas.vue'

  export interface GuideOrderConfig {
    order: string
    scoreWidth: 1 | 2
    neighbor: CellPlus
  }

  interface OrderTypeConfig {
    type: Method
    valid: boolean
  }

  interface Neighbor {
    key: string
    name: string
    value: XY
    displayRow: number
    displayColumn: number
  }

  const compProps = defineProps<{
    row: number
    column: number
    layout: Layout
  }>()

  const tabIndex = ref('snake')

  const walkName = defineModel<string>('walkName')
  const scoreWidth = defineModel<1 | 2>('scoreWidth')
  const neighbor = defineModel<Neighbor>('neighbor')

  const guidedWalkDimensions: ComputedRef<number[]> = computed(() => {
    const wrapper = document.getElementById('guided-walk-preview')

    return [wrapper?.offsetWidth || 200, window.innerHeight || 200]
  })

  const precomputedOrders = computed(() => {
    const sw = scoreWidth.value
    if (sw) {
      const result = {
        zigzag: [] as OrderTypeConfig[],
        snake: [] as OrderTypeConfig[],
      }

      methods.forEach(m => {
        result[m.type].push({
          type: m,
          valid: m.valid({ x: compProps.column, y: compProps.row, direction: m.initialDirection }, compProps.layout, sw),
        })
      })

      return result
    } else {
      return undefined
    }
  })

  const neighborOptions: ComputedRef<Neighbor[]> = computed(() => {
    if (scoreWidth.value && scoreWidth.value > 1 && walkName.value) {
      const trialData = getTrialDataCached()

      if (!trialData) {
        return []
      }

      const order = methods.find(m => m.name === walkName.value)

      const currentCell = trialData[`${compProps.row}|${compProps.column}`]
      const result: Neighbor[] = []

      if (!order || !currentCell) {
        return []
      }

      if (order.initialDirection === Direction.d || order.initialDirection === Direction.u) {
        if (compProps.column > 0) {
          const n = trialData[`${compProps.row}|${compProps.column - 1}`]

          if (n) {
            result.push({
              key: `${compProps.row}|${compProps.column - 1}`,
              name: n.displayName || n.germplasm,
              value: { x: compProps.column - 1, y: compProps.row },
              displayRow: getRowLabel(compProps.layout, compProps.row),
              displayColumn: getColumnLabel(compProps.layout, compProps.column - 1),
            })
          }
        }
        if (compProps.column < compProps.layout.columns - 1) {
          const n = trialData[`${compProps.row}|${compProps.column + 1}`]

          if (n) {
            result.push({
              key: `${compProps.row}|${compProps.column + 1}`,
              name: n.displayName || n.germplasm,
              value: { x: compProps.column + 1, y: compProps.row },
              displayRow: getRowLabel(compProps.layout, compProps.row),
              displayColumn: getColumnLabel(compProps.layout, compProps.column + 1),
            })
          }
        }
      } else {
        if (compProps.row > 0) {
          const n = trialData[`${compProps.row - 1}|${compProps.column}`]

          if (n) {
            result.push({
              key: `${compProps.row - 1}|${compProps.column}`,
              name: n.displayName || n.germplasm,
              value: { x: compProps.column, y: compProps.row - 1 },
              displayRow: getRowLabel(compProps.layout, compProps.row - 1),
              displayColumn: getColumnLabel(compProps.layout, compProps.column),
            })
          }
        }
        if (compProps.row < compProps.layout.rows - 1) {
          const n = trialData[`${compProps.row + 1}|${compProps.column}`]

          if (n) {
            result.push({
              key: `${compProps.row + 1}|${compProps.column}`,
              name: n.displayName || n.germplasm,
              value: { x: compProps.column, y: compProps.row + 1 },
              displayRow: getRowLabel(compProps.layout, compProps.row + 1),
              displayColumn: getColumnLabel(compProps.layout, compProps.column),
            })
          }
        }
      }

      return result
    } else {
      return []
    }
  })

  const guidedWalkPath = computed(() => {
    if (walkName.value && (scoreWidth.value === 1 || neighbor.value)) {
      const order = methods.find(m => m.name === walkName.value)

      if (!order) {
        return undefined
      }

      let x = compProps.column
      let y = compProps.row

      if (neighbor.value) {
        x = (x + neighbor.value.value.x) / 2
        y = (y + neighbor.value.value.y) / 2
      }

      const path = getSequence(x, y, order.initialDirection, order, compProps.layout, scoreWidth.value || 1).steps

      return path
    }

    return undefined
  })

  const guidedWalkCells: ComputedRef<XY[]> = computed(() => {
    const result = [{ y: compProps.row, x: compProps.column }]

    if (neighbor.value) {
      result.push({
        y: neighbor.value.value.y,
        x: neighbor.value.value.x,
      })
    }

    return result
  })

  watch(tabIndex, async () => {
    walkName.value = undefined
    neighbor.value = undefined
  })

  watch(scoreWidth, async () => {
    neighbor.value = undefined
  })

  watch(walkName, async () => {
    neighbor.value = undefined
  })

  const emit = defineEmits(['order-changed'])
</script>

<style scoped>
.height-auto {
  height: auto;
}
</style>
