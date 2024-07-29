<template>
  <b-dropdown :title="$t('toolbarTraitVisibility')" menuClass="overflow-hidden" ref="dropdown" id="trait-dropdown" auto-close="outside">
    <template #button-content>
      <IBiDiamondHalf :style="{ transform: 'rotate(45deg)' }" width="1.3em" height="1.3em" v-if="storeCanvasShape === CANVAS_SHAPE_SQUARE" /><IBiCircleHalf v-else /> <span class="d-none d-lg-inline-block">{{ $t('toolbarTraitVisibility') }}</span>
    </template>
    <b-dropdown-form>
      <b-button-group>
        <b-button @click="toggleVisibilityAll(true)"><IBiSquareFill v-if="storeCanvasShape === CANVAS_SHAPE_SQUARE" /><IBiCircleFill v-else /> {{ $t('buttonSelectAll') }}</b-button>
        <b-button @click="toggleVisibilityAll(false)"><IBiSquare v-if="storeCanvasShape === CANVAS_SHAPE_SQUARE" /><IBiCircle v-else /> {{ $t('buttonSelectNone') }}</b-button>
      </b-button-group>
    </b-dropdown-form>
    <div class="trait-dropdown-list">
      <b-dropdown-group header-class="pb-0 pt-3" v-for="(group, index) in traitsByGroup" :key="`trait-group-${group.name}-${index}`">
        <template #header>
          <b-form-checkbox :checked="group.allMarked" @change="updateHiddenTraits(group)">{{ group.name || $t('toolbarTraitGroupGeneric') }}</b-form-checkbox>
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

<script>
import { mapGetters } from 'vuex'
import { CANVAS_SHAPE_SQUARE } from '@/plugins/constants'
import TraitIcon from '@/components/icons/TraitIcon.vue'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    TraitIcon
  },
  props: {
    traits: {
      type: Array,
      default: () => []
    }
  },
  data: function () {
    return {
      CANVAS_SHAPE_SQUARE
    }
  },
  computed: {
    ...mapGetters([
      'storeHiddenTraits',
      'storeCanvasShape'
    ]),
    traitsByGroup: function () {
      if (this.traits) {
        const result = {}

        this.traits.forEach((t, i) => {
          const group = t.group ? t.group.name : this.$t('dropdownOptionTraitNoGroup')
          const traitDef = {
            id: t.id,
            name: t.name,
            color: t.color,
            allowRepeats: t.allowRepeats,
            progress: t.progress,
            visible: !this.storeHiddenTraits.includes(t.id)
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
    }
  },
  methods: {
    updateHiddenTraits: function (group) {
      const isHide = group.allMarked

      const distinct = new Set(this.storeHiddenTraits)

      group.traits.forEach(t => {
        if (isHide) {
          distinct.add(t.id)
        } else {
          distinct.delete(t.id)
        }
      })

      this.$store.dispatch('setHiddenTraits', [...distinct])
      emitter.emit('plausible-event', { key: 'toggle-traits', props: { type: 'group' } })
    },
    toggleTraitVisibility: function (trait) {
      const isHide = !this.storeHiddenTraits.includes(trait.id)

      const distinct = new Set(this.storeHiddenTraits)

      if (isHide) {
        distinct.add(trait.id)
      } else {
        distinct.delete(trait.id)
      }

      this.$store.dispatch('setHiddenTraits', [...distinct])
      emitter.emit('plausible-event', { key: 'toggle-traits', props: { type: 'individual' } })
    },
    toggleVisibilityAll: function (select) {
      if (select) {
        this.$store.dispatch('setHiddenTraits', [])
      } else {
        this.$store.dispatch('setHiddenTraits', this.traits.map(t => t.id))
      }
      emitter.emit('plausible-event', { key: 'toggle-traits', props: { type: 'all' } })
    },
    show: function () {
      this.$refs.dropdown.show()
    },
    hide: function () {
      this.$refs.dropdown.hide()
    }
  }
}
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
