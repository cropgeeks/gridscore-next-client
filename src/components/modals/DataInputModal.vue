<template>
  <b-modal :cancel-title="$t('buttonCancel')"
           :ok-title="$t(isEditable ? 'buttonSave' : 'buttonClose')"
           no-close-on-backdrop
           no-close-on-esc
           @ok.prevent="validate"
           @hidden="reset"
           @shown="autofocusFirst"
           no-fade
           size="xl"
           header-class="align-items-center"
           ref="dataInputModal">
    <template v-slot:modal-header="{ close }">
      <h5 class="modal-title text-truncate">{{ displayName }}</h5>

      <b-button-group id="data-entry-header">
        <b-button @click="$refs.commentModal.show()"><BIconChatRightTextFill /> <span class="d-none d-xl-inline-block">{{ $tc('buttonCommentCount', cell.comments ? cell.comments.length : 0) }}</span></b-button>
        <b-button :pressed="cell.isMarked" @click="toggleMarked" :disabled="!trial.editable">
          <template v-if="cell.isMarked">
            <BIconBookmarkCheckFill /> <span class="d-none d-xl-inline-block"> {{ $t('buttonUnbookmarkCell') }}</span>
          </template>
          <template v-else>
            <BIconBookmark /> <span class="d-none d-xl-inline-block"> {{ $t('buttonBookmarkCell') }}</span>
          </template>
        </b-button>
        <b-button @click="onShowPhotoModal(null)"><BIconCameraFill /> <span class="d-none d-xl-inline-block"> {{ $t('buttonTagPhoto') }}</span></b-button>
        <b-button @click="$refs.guidedWalkModal.show()"><BIconSignpostSplitFill /> <span class="d-none d-xl-inline-block"> {{ $t('buttonStartGuidedWalk') }}</span></b-button>
      </b-button-group>

      <button class="close ml-0" @click="close()">×</button>
    </template>
    <div v-if="cell && trial">
      <b-tabs v-model="traitGroupTabIndex">
        <b-tab v-for="(group, groupIndex) in traitsByGroup" :key="`trait-group-tab-${groupIndex}`" @click="autofocusFirst"
          :title-item-class="(tabStates && tabStates[groupIndex] === false) ? 'bg-danger' : null"
          :title-link-class="(tabStates && tabStates[groupIndex] === false) ? 'text-white bg-danger' : null">
          <template #title>
            {{ group.name }} ({{ group.traits.length }})

            <BIconCheck class="text-success" v-if="tabStates && tabStates[groupIndex] === true" />
            <BIconX class="text-white" v-else-if="tabStates && tabStates[groupIndex] === false" />
          </template>

          <div class="mt-3 trait-group-tab-content">
            <TraitInputSection :editable="trial.editable" :trait="trait" v-for="trait in group.traits" :key="`trait-section-${trait.id}`" :ref="`trait-section-${trait.id}`" @traverse="onTraverse(trait)" @photo-clicked="onShowPhotoModal(trait)" />
          </div>
        </b-tab>
      </b-tabs>

      <PlotCommentModal :editable="trial.editable" :cell="cell" ref="commentModal" />
      <ImageModal :row="cell.row" :column="cell.column" :trial="trial" :displayName="cell.displayName" :preferredTraitId="selectedTrait ? selectedTrait.id : null" ref="imageModal" />
      <GuidedWalkSelectorModal :cell="cell" :trialLayout="trial.layout" ref="guidedWalkModal" />
    </div>
  </b-modal>
</template>

<script>
import Vue from 'vue'
import TraitInputSection from '@/components/TraitInputSection'
import ImageModal from '@/components/modals/ImageModal'
import PlotCommentModal from '@/components/modals/PlotCommentModal'
import GuidedWalkSelectorModal from '@/components/modals/GuidedWalkSelectorModal'
import { getCell, setPlotMarked } from '@/plugins/idb'
import { mapGetters } from 'vuex'
import { BIconBookmarkCheckFill, BIconBookmark, BIconChatRightTextFill, BIconCameraFill, BIconSignpostSplitFill, BIconCheck, BIconX } from 'bootstrap-vue'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    ImageModal,
    TraitInputSection,
    PlotCommentModal,
    GuidedWalkSelectorModal,
    BIconChatRightTextFill,
    BIconBookmarkCheckFill,
    BIconBookmark,
    BIconCameraFill,
    BIconCheck,
    BIconX,
    BIconSignpostSplitFill
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      cell: null,
      traitGroupTabIndex: 0,
      selectedTrait: null,
      tabStates: null
    }
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial',
      'storeHiddenTraits'
    ]),
    isEditable: function () {
      if (this.trial) {
        return this.trial.editable
      } else {
        return true
      }
    },
    traitsByGroup: function () {
      let groups = []

      if (this.trial && this.trial.traits && this.cell) {
        const result = {}

        this.trial.traits.forEach((t, i) => {
          if (this.storeHiddenTraits.includes(t.id)) {
            return
          }

          const group = t.group ? t.group.name : this.$t('dropdownOptionTraitNoGroup')

          const copy = JSON.parse(JSON.stringify(t))
          copy.measurements = this.cell.measurements[t.id] || []

          let groupTraits = result[group]
          if (!groupTraits) {
            groupTraits = [copy]
          } else {
            groupTraits.push(copy)
          }
          result[group] = groupTraits
        })

        groups = Object.keys(result).map(k => {
          return {
            name: k,
            traits: result[k]
          }
        })
      }

      return groups
    },
    displayName: function () {
      if (this.cell) {
        return this.cell.displayName
      } else {
        return null
      }
    }
  },
  watch: {
    traitsByGroup: function (newValue) {
      if (newValue) {
        this.tabStates = newValue.map(t => null)
      } else {
        this.tabStates = null
      }
    }
  },
  methods: {
    onShowPhotoModal: function (selectedTrait) {
      this.selectedTrait = selectedTrait

      this.$nextTick(() => this.$refs.imageModal.show())
    },
    autofocusFirst: function () {
      this.$nextTick(() => {
        if (this.traitsByGroup && this.traitsByGroup.length > 0) {
          if (this.traitsByGroup[this.traitGroupTabIndex].traits && this.traitsByGroup[this.traitGroupTabIndex].traits.length > 0) {
            const traitId = this.traitsByGroup[this.traitGroupTabIndex].traits[0].id

            this.$refs[`trait-section-${traitId}`][0].handleTraverse(0)
          }
        }
      })
    },
    onTraverse: function (currentTrait) {
      const group = this.traitsByGroup.find(g => g.traits.map(t => t.id).includes(currentTrait.id))

      if (group) {
        const traitIndex = group.traits.findIndex(t => t.id === currentTrait.id)

        if (traitIndex !== -1 && traitIndex < group.traits.length - 1) {
          this.$refs[`trait-section-${group.traits[traitIndex + 1].id}`][0].handleTraverse(0)
        }
      }
    },
    toggleMarked: function () {
      if (this.cell.isMarked) {
        // Remove it reactively from the cell
        Vue.delete(this.cell, 'isMarked')
        setPlotMarked(this.storeSelectedTrial, this.cell.row, this.cell.column, false)
          .then(() => emitter.emit('plot-marked-changed', this.cell.row, this.cell.column, this.storeSelectedTrial))
      } else {
        // Add it this way, because the cell may not have it
        Vue.set(this.cell, 'isMarked', true)
        setPlotMarked(this.storeSelectedTrial, this.cell.row, this.cell.column, true)
          .then(() => emitter.emit('plot-marked-changed', this.cell.row, this.cell.column, this.storeSelectedTrial))
      }
    },
    updateCell: function (row, column) {
      getCell(this.storeSelectedTrial, row, column)
        .then(cell => {
          this.cell = cell
          this.show()
        })
    },
    updateCellComments: function (row, column, trialId, cell) {
      if (this.trial && this.cell && this.storeSelectedTrial === trialId && this.cell.row === row && this.cell.column === column) {
        Vue.set(this.cell, 'comments', cell.comments)
      }
    },
    update: function () {
      // TODO
    },
    validate: function () {
      this.tabStates = this.traitsByGroup.map(g => {
        const traitStates = g.traits.map(t => this.$refs[`trait-section-${t.id}`][0].validate())
        console.log(g, traitStates)
        return traitStates.every(t => t)
      })

      if (this.tabStates.every(t => t)) {
        // All valid!
        // TODO
      }
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.$refs.dataInputModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.dataInputModal.hide())
    },
    reset: function () {
      this.traitGroupTabIndex = 0
      this.cell = null
    }
  },
  created: function () {
    emitter.on('plot-clicked', this.updateCell)
    emitter.on('plot-cache-changed', this.updateCellComments)
  },
  beforeDestroy: function () {
    emitter.off('plot-clicked', this.updateCell)
    emitter.off('plot-cache-changed', this.updateCellComments)
  }
}
</script>

<style>
.trait-group-tab-content section:first-child hr {
  display: none;
}
</style>
