<template>
  <b-dropdown :title="$t('toolbarTraitVisibility')" menuClass="overflow-hidden" ref="dropdown" id="trait-dropdown" auto-close="outside">
    <template #button-content>
      <IBiDiamondHalf :style="{ transform: 'rotate(45deg)' }" width="1.3em" height="1.3em" v-if="store.canvasShape === CANVAS_SHAPE_SQUARE" /><IBiCircleHalf v-else /> <span class="d-none d-lg-inline-block">{{ $t('toolbarTraitVisibility') }}</span>
    </template>
    <b-dropdown-item-button @click="store.setHideTraitCircles(!store.storeHideTraitCircles)">{{ $t(store.storeCanvasShape === CANVAS_SHAPE_CIRCLE ? 'buttonHideTraitCircles' : 'buttonHideTraitSquares') }} <IBiCheck2 v-if="store.storeHideTraitCircles" /></b-dropdown-item-button>
    <b-dropdown-form>
      <b-form-group class="mb-0" :label="$t('formLabelTraitDropdownCutoffDate')" label-for="cutoff" :title="$t('formDescriptionTraitDropdownCutoffDate')" v-if="atLeastOneMultiTrait">
        <b-input-group>
          <b-form-input id="cutoff" type="date" v-model="traitCutoff" />
          <b-button variant="danger" v-if="traitCutoff" @click="traitCutoff = undefined"><IBiSlashCircle /></b-button>
        </b-input-group>
      </b-form-group>
      <b-button-group class="w-100">
        <b-button @click="toggleVisibilityAll(true)"><IBiSquareFill v-if="store.canvasShape === CANVAS_SHAPE_SQUARE" /><IBiCircleFill v-else /> {{ $t('buttonSelectAll') }}</b-button>
        <b-button @click="toggleVisibilityAll(false)"><IBiSquare v-if="store.canvasShape === CANVAS_SHAPE_SQUARE" /><IBiCircle v-else /> {{ $t('buttonSelectNone') }}</b-button>
      </b-button-group>
    </b-dropdown-form>
    <div class="trait-dropdown-list">
      <b-dropdown-group header-class="pb-0 pt-3" v-for="(group, index) in traitsByGroup" :key="`trait-group-${group.name}-${index}`">
        <template #header>
          <b-form-checkbox :model-value="group.allMarked" @change="updateHiddenTraits(group)">{{ group.name || $t('toolbarTraitGroupGeneric') }}</b-form-checkbox>
        </template>
        <b-dropdown-item-button v-for="trait in group.traits"
                                buttonClass="position-relative"
                                :key="`trait-visibility-${group.name}-${index}-${trait.id}`"
                                @click="toggleTraitVisibility(trait)">
          <span :style="{ color: trait.visible ? trait.color : 'lightgray' }"><TraitIcon :trait="trait" /> {{ trait.name }}</span>

          <b-progress class="trait-progress position-absolute" height="3px">
            <b-progress-bar :value="trait.progress" :style="{ backgroundColor: trait.visible ? trait.color : 'lightgray' }"/>
          </b-progress>
        </b-dropdown-item-button>
      </b-dropdown-group>
    </div>
  </b-dropdown>
</template>

<script setup lang="ts">
import { coreStore } from '@/store'
import { CANVAS_SHAPE_CIRCLE, CANVAS_SHAPE_SQUARE } from '@/plugins/constants'
import TraitIcon from '@/components/icons/TraitIcon.vue'
import { TraitPlus } from '@/plugins/types/client'
import { useI18n } from 'vue-i18n'
import emitter from 'tiny-emitter/instance'

// Composition stuff
const store = coreStore()
const { t } = useI18n()

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
}
type TraitMap = { [index: string]: MiniTrait[] }

// Props
const props = defineProps<{
  traits: TraitPlus[]
}>()

const emit = defineEmits(['trait-cutoff-changed'])

// Refs
const dropdown = ref()
const traitCutoff = ref<string>()

// Watch
watch(traitCutoff, async newValue => {
  if (newValue) {
    emit('trait-cutoff-changed', newValue)
  } else {
    emit('trait-cutoff-changed', undefined)
  }
})

const atLeastOneMultiTrait: ComputedRef<boolean> = computed(() => {
  if (props.traits) {
    return props.traits.filter(t => t.allowRepeats).length > 0
  } else {
    return false
  }
})

// Computed
const traitsByGroup: ComputedRef<TraitGroup[]> = computed(() => {
  if (props.traits) {
    const result: TraitMap = {}

    props.traits.forEach((trait: TraitPlus) => {
      const group = trait.group ? trait.group.name : t('dropdownOptionTraitNoGroup')
      const traitDef: MiniTrait = {
        id: trait.id,
        name: trait.name,
        color: trait.color,
        allowRepeats: trait.allowRepeats,
        progress: trait.progress,
        visible: !store.hiddenTraits.includes(trait.id)
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
        traits: result[k],
        allMarked: result[k].every(t => t.visible)
      }
    })
  } else {
    return []
  }
})

const updateHiddenTraits = (group: TraitGroup) => {
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

const toggleTraitVisibility = (trait: MiniTrait) => {
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

const toggleVisibilityAll = (select: boolean) => {
  if (select) {
    store.setHiddenTraits([])
  } else {
    store.setHiddenTraits(props.traits.map(t => t.id))
  }
  emitter.emit('plausible-event', { key: 'toggle-traits', props: { type: 'all' } })
}

// Expose
const show = () => dropdown.value.show()
const hide = () => dropdown.value.hide()
defineExpose({
  show,
  hide
})
</script>

<style scoped>
.trait-dropdown-list {
  max-height: 66vh;
  overflow-y: auto;
}
.trait-progress {
  right: 0;
  left: 0;
}
</style>
