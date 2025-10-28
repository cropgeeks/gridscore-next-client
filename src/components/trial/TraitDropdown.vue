<template>
  <v-menu v-model="menuShown" :close-on-content-click="false">
    <template #activator="{ props }">
      <ResponsiveButton
        v-bind="props"
        variant="tonal"
        :size="size || 'default'"
        :prepend-icon="mdiTagMultiple"
        :text="$t('toolbarTraitVisibility')"
      />
    </template>

    <v-list
      slim
      density="compact"
      v-model:opened="openedGroups"
      class="trait-list"
      :open-on-click="false"
      select-strategy="classic"
    >
      <v-list-item v-if="atLeastOneMultiTrait">
        <v-date-input
          :label="$t('formLabelTraitDropdownCutoffDate')"
          prepend-icon=""
          :prepend-inner-icon="mdiCalendarStart"
          clearable
          hide-details
          density="compact"
          autocomplete="off"
          :model-value="traitCutoff ? date.toJsDate(traitCutoff) : undefined"
          @update:model-value="d => { traitCutoff = d ? date.toISO(d) : undefined }"
        />
      </v-list-item>

      <v-list-item>
        <v-btn-group density="compact" class="d-flex">
          <v-btn class="flex-grow-1" variant="tonal" :text="$t('buttonSelectAll')" @click="toggleVisibilityAll(true)" :prepend-icon="isSquare ? mdiSquare : mdiCircle" />
          <v-btn class="flex-grow-1" variant="tonal" :text="$t('buttonSelectNone')" @click="toggleVisibilityAll(false)" :prepend-icon="isSquare ? mdiSquareOutline : mdiCircleOutline" />
        </v-btn-group>
      </v-list-item>

      <v-list-group
        v-for="(group, index) in traitsByGroup"
        :key="`trait-group-${group.name}-${index}`"
        :value="group.name"
      >
        <template #activator="{ props }">
          <v-list-item
            v-bind="props"
            :title="group.name"
          >
            <template #prepend>
              <v-icon :icon="group.allMarked ? mdiCheckboxMarked : (group.someMarked ? mdiMinusBox : mdiCheckboxBlankOutline)" @click.prevent.stop="updateHiddenTraits(group)" />
            </template>
          </v-list-item>
        </template>
        <v-list-item
          v-for="trait in group.traits"
          :key="`trait-visibility-${group.name}-${index}-${trait.id}`"
          @click="toggleTraitVisibility(trait)"
          :title="trait.name"
        >
          <v-progress-linear
            :color="trait.visible ? trait.color : 'muted'"
            location="bottom"
            absolute
            v-model="trait.progress"
          />
          <template #prepend>
            <v-icon :icon="getIcon(trait)" :color="trait.visible ? trait.color : 'muted'" />
          </template>
        </v-list-item>
      </v-list-group>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
  import { CanvasShape, type TraitPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'
  import emitter from 'tiny-emitter/instance'
  import { useI18n } from 'vue-i18n'
  import { useDate } from 'vuetify'
  import ResponsiveButton from '@/components/util/ResponsiveButton.vue'
  import { mdiCalendarStart, mdiCheckboxBlankOutline, mdiCheckboxMarked, mdiCircle, mdiCircleHalfFull, mdiCircleOutline, mdiMinusBox, mdiSquare, mdiSquareOpacity, mdiSquareOutline, mdiTagMultiple } from '@mdi/js'

  const date = useDate()
  const store = coreStore()
  const { t } = useI18n ()

  // Type definitions
  interface MiniTrait {
    id: string
    name: string
    color: string | undefined
    allowRepeats: boolean
    progress: number | undefined
    visible: boolean
  }
  interface TraitGroup {
    name: string
    traits: MiniTrait[]
    allMarked: boolean
    someMarked: boolean
  }
  type TraitMap = { [index: string]: MiniTrait[] }

  // Props
  const compProps = defineProps<{
    traits: TraitPlus[]
    size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
  }>()
  const emit = defineEmits(['trait-cutoff-changed'])

  const openedGroups = ref<string[]>([])
  const traitCutoff = ref<string>()
  const menuShown = ref(false)

  // Watch
  watch(traitCutoff, async newValue => {
    if (newValue) {
      emit('trait-cutoff-changed', newValue)
    } else {
      emit('trait-cutoff-changed', undefined)
    }
  })

  const isSquare = computed(() => store.storeCanvasShape === CanvasShape.SQUARE)

  const atLeastOneMultiTrait = computed(() => {
    if (compProps.traits) {
      return compProps.traits.some(t => t.allowRepeats)
    } else {
      return false
    }
  })

  const traitsByGroup: ComputedRef<TraitGroup[]> = computed(() => {
    if (compProps.traits) {
      const result: TraitMap = {}

      compProps.traits.forEach((trait: TraitPlus) => {
        const group = (trait.group ? trait.group.name : t('dropdownOptionTraitNoGroup')) || ''
        const traitDef: MiniTrait = {
          id: trait.id || '',
          name: trait.name,
          color: trait.color,
          allowRepeats: trait.allowRepeats,
          progress: trait.progress,
          visible: !store.storeHiddenTraits.includes(trait.id || ''),
        }

        let groupTraits = result[group]
        if (!groupTraits) {
          groupTraits = [traitDef]
        } else {
          groupTraits.push(traitDef)
        }
        result[group] = groupTraits
      })

      return Object.keys(result).map(k => {
        return {
          name: k,
          traits: result[k] || [],
          allMarked: result[k]?.every(t => t.visible) || false,
          someMarked: result[k]?.some(t => t.visible) || false,
        }
      })
    } else {
      return []
    }
  })

  function getIcon (trait: MiniTrait) {
    if (trait.allowRepeats) {
      return isSquare.value ? mdiSquareOpacity : mdiCircleHalfFull
    } else {
      return isSquare.value ? mdiSquare : mdiCircle
    }
  }

  function updateHiddenTraits (group: TraitGroup) {
    const hiddenTraits = new Set(store.hiddenTraits)

    const isHide = !group.traits.some(t => hiddenTraits.has(t.id))

    group.traits.forEach(t => {
      if (isHide) {
        hiddenTraits.add(t.id)
      } else {
        hiddenTraits.delete(t.id)
      }
    })

    store.setHiddenTraits([...hiddenTraits])
    emitter.emit('plausible-event', { key: 'toggle-traits', props: { type: 'group' } })
  }

  function toggleTraitVisibility (trait: MiniTrait) {
    const isHide = !store.hiddenTraits.includes(trait.id)

    const distinct = new Set(store.hiddenTraits)

    if (isHide) {
      distinct.add(trait.id)
    } else {
      distinct.delete(trait.id)
    }

    store.setHiddenTraits([...distinct])
    emitter.emit('plausible-event', { key: 'toggle-traits', props: { type: 'individual' } })
  }

  function toggleVisibilityAll (select: boolean) {
    if (select) {
      store.setHiddenTraits([])
    } else {
      store.setHiddenTraits(compProps.traits.map(t => t.id || ''))
    }
    emitter.emit('plausible-event', { key: 'toggle-traits', props: { type: 'all' } })
  }

  // Expose
  function show () {
    menuShown.value = true
  }
  function hide () {
    menuShown.value = false
  }

  watch(traitsByGroup, async newValue => {
    openedGroups.value = newValue.map(g => g.name)
  }, { immediate: true })

  defineExpose({
    show,
    hide,
  })
</script>

<style>
.trait-list .v-list-group__items .v-list-item {
  padding-inline-start: 32px !important;
}
</style>
