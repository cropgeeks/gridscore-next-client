<template>
  <DynamicScroller
    v-if="traits.length > 20"
    :items="traits"
    :min-item-size="100"
    key-field="id"
    class="scrolled-content"
    ref="scroller"
  >
    <template #default="{ item, index, active }">
      <DynamicScrollerItem
        :item="item"
        :active="active"
        :size-dependencies="[
          item.message,
        ]"
        :data-index="index"
      >
        <TraitInputSection
          v-model="cellData[item.id || '']"
          v-if="cellData[item.id || '']"
          :cell="{ row: cell.row || 0, column: cell.column || 0, germplasm: cell.germplasm, categories: cell.categories }"
          :trait="item"
          :editable="isEditable || false"
          :measurements="cell.measurements[item.id || '']"
          :people="trial.people"
          @traverse="(setIndex: number) => emit('traverse', item, index, traits, setIndex)"
          :ref="(el) => (refs[`${item.id}`] = el)"
          @valid-changed="v => emit('set-valid', item.id || '', v)"
        >
          <div class="d-flex flex-column flex-sm-row ga-2">
            <v-btn
              :icon="mdiHistory"
              size="small"
              :disabled="!hasHistoricData[item.id || '']"
              v-tooltip:top="$t('tooltipViewTraitDataHistory')"
              @click="emit('show-history', item)"
            />
            <v-btn
              :icon="mdiCamera"
              size="small"
              v-tooltip:top="$t('buttonTagPhoto')"
              @click="emitter.emit('tag-media', cell.row || 0, cell.column || 0, 'image', [item.id || ''])"
            />
          </div>
        </TraitInputSection>
      </DynamicScrollerItem>
    </template>
  </DynamicScroller>
  <template
    v-else
    v-for="(trait, traitIndex) in traits"
    :key="`trait-group-${group}-trait-${trait.id}`"
  >
    <TraitInputSection
      v-model="cellData[trait.id || '']"
      v-if="cellData[trait.id || '']"
      :cell="{ row: cell.row || 0, column: cell.column || 0, germplasm: cell.germplasm, categories: cell.categories }"
      :trait="trait"
      :editable="isEditable || false"
      :measurements="cell.measurements[trait.id || '']"
      :people="trial.people"
      @traverse="(setIndex: number) => emit('traverse', trait, traitIndex, traits, setIndex)"
      :ref="(el) => (refs[`${trait.id}`] = el)"
      @valid-changed="v => emit('set-valid', trait.id || '', v)"
    >
      <div class="d-flex flex-column flex-sm-row ga-2">
        <v-btn
          :icon="mdiHistory"
          size="small"
          :disabled="!hasHistoricData[trait.id || '']"
          v-tooltip:top="$t('tooltipViewTraitDataHistory')"
          @click="emit('show-history', trait)"
        />
        <v-btn
          :icon="mdiCamera"
          size="small"
          v-tooltip:top="$t('buttonTagPhoto')"
          @click="emitter.emit('tag-media', cell.row || 0, cell.column || 0, 'image', [trait.id || ''])"
        />
      </div>
    </TraitInputSection>
  </template>
</template>

<script lang="ts" setup>
  import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
  import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

  import type { CellPlus, TraitPlus, TrialPlus } from '@/plugins/types/client'
  import { mdiCamera, mdiHistory } from '@mdi/js'
  import emitter from 'tiny-emitter/instance'
  import { coreStore } from '@/stores/app'

  export type CellData = { [key: string]: TraitData }
  export type TraitData = { [key: string]: string | undefined }

  const store = coreStore()
  const emit = defineEmits(['traverse', 'set-valid', 'show-history'])

  const scroller = useTemplateRef<typeof DynamicScroller>('scroller')

  const refs = ref<{ [index: string]: any }>({})

  const cellData = defineModel<CellData>({
    default: {},
  })

  const compProps = defineProps<{
    traits: TraitPlus[]
    trial: TrialPlus
    isEditable: boolean
    cell: CellPlus
    hasHistoricData: { [index: string]: boolean }
    group?: string
  }>()

  function removeRefs (traitIds: Set<string>) {
    Object.keys(refs.value).forEach(k => {
      if (!traitIds.has(k)) {
        delete refs.value[k]
      }
    })
  }

  function focus (id: string, position: number) {
    refs.value[`${id}`]?.focus(position)
  }

  watch(() => compProps.traits, async newValue => {
    if (newValue && store.storeAutoSelectFirstInput) {
      if (scroller.value) {
        nextTick(() => {
          scroller.value?.scrollToItem(0)
          setTimeout(() => {
            focus(newValue[0]?.id || '', 1)
          }, 500)
        })
      } else {
        setTimeout(() => {
          focus(newValue[0]?.id || '', 1)
        }, 500)
      }
    }
  })

  defineExpose({
    removeRefs,
    focus,
  })
</script>

<style scoped>
  .scrolled-content {
    max-height: 80vh;
  }
</style>
