<template>
  <b-modal :cancel-title="$t(isGuidedWalk ? 'buttonPrevious' : 'buttonCancel')"
           :ok-title="okTitle"
           ok-variant="primary"
           :cancel-variant="isGuidedWalk ? 'primary' : null"
           :cancel-disabled="cancelDisabled"
           no-close-on-backdrop
           no-close-on-esc
           @cancel.prevent="onCancel"
           @ok.prevent="validate"
           @hidden="reset"
           @shown="autofocusFirst"
           no-fade
           size="xl"
           header-class="align-items-center"
           ref="dataInputModal">
    <template v-slot:modal-header>
      <h5 class="modal-title text-truncate">{{ displayName }}</h5>

      <b-button-group id="data-entry-header" v-if="cell">
        <b-button size="sm" @click="$refs.commentModal.show()"><BIconChatRightTextFill /> <span class="d-none d-xl-inline-block">{{ $tc('buttonCommentCount', cell.comments ? cell.comments.length : 0) }}</span></b-button>
        <b-button size="sm" :pressed="cell.isMarked" @click="toggleMarked" :disabled="!trial.editable">
          <template v-if="cell.isMarked">
            <BIconBookmarkCheckFill /> <span class="d-none d-xl-inline-block"> {{ $t('buttonUnbookmarkCell') }}</span>
          </template>
          <template v-else>
            <BIconBookmark /> <span class="d-none d-xl-inline-block"> {{ $t('buttonBookmarkCell') }}</span>
          </template>
        </b-button>
        <b-button size="sm" @click="onShowPhotoModal(null)"><BIconCameraFill /> <span class="d-none d-xl-inline-block"> {{ $t('buttonTagPhoto') }}</span></b-button>
        <b-button size="sm" @click="onGuidedWalkClicked" :disabled="!trial.editable" :variant="guidedWalk !== null ? 'success' : null" :pressed="guidedWalk !== null"><BIconSignpostSplitFill /> <span class="d-none d-xl-inline-block"> {{ $t('buttonStartGuidedWalk') }}</span></b-button>
      </b-button-group>

      <button class="close ml-0" @click="onXClicked">×</button>
    </template>
    <div v-if="cell && trial">
      <b-row v-if="guidedWalk" class="mb-3">
        <b-col cols=4>
          <b-card class="text-center h-100" :title="guidedWalk.prev.displayName" :sub-title="$t('widgetGuidedWalkPreviewColumnRow', { column: storeDisplayColumnOrder === DISPLAY_ORDER_RIGHT_TO_LEFT ? (trial.layout.columns - guidedWalk.prev.column) : (guidedWalk.prev.column + 1), row: storeDisplayRowOrder === DISPLAY_ORDER_BOTTOM_TO_TOP ? (trial.layout.rows - guidedWalk.prev.row) : (guidedWalk.prev.row + 1) })" v-if="guidedWalk.prev" />
        </b-col>
        <b-col cols=4>
          <b-card class="text-center h-100">
            <b-card-title>
              <BIconChevronDoubleRight :class="guidedWalk.prev ? null : 'text-muted'" /> <BIconGeoAltFill class="mx-2" /> <BIconChevronDoubleRight :class="guidedWalk.next ? null : 'text-muted'" />
            </b-card-title>
            <b-card-sub-title>
              {{ $t('widgetGuidedWalkPreviewColumnRow', { column: storeDisplayColumnOrder === DISPLAY_ORDER_RIGHT_TO_LEFT ? (trial.layout.columns - cell.column) : (cell.column + 1), row: storeDisplayRowOrder === DISPLAY_ORDER_BOTTOM_TO_TOP ? (trial.layout.rows - cell.row) : (cell.row + 1) }) }}
            </b-card-sub-title>
          </b-card>
        </b-col>
        <b-col cols=4>
          <b-card class="text-center h-100" :title="guidedWalk.next.displayName" :sub-title="$t('widgetGuidedWalkPreviewColumnRow', { column: storeDisplayColumnOrder === DISPLAY_ORDER_RIGHT_TO_LEFT ? (trial.layout.columns - guidedWalk.next.column) : (guidedWalk.next.column + 1), row: storeDisplayRowOrder === DISPLAY_ORDER_BOTTOM_TO_TOP ? (trial.layout.rows - guidedWalk.next.row) : (guidedWalk.next.row + 1) })" v-if="guidedWalk.next" />
        </b-col>
      </b-row>
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
            <TraitInputSection :trial="trial" :editable="trial.editable" :cell="cell" :trait="trait" v-for="trait in group.traits" :key="`trait-section-${trait.id}`" :ref="`trait-section-${trait.id}`" @traverse="onTraverse(trait)" @photo-clicked="onShowPhotoModal(trait)" />
          </div>
        </b-tab>
      </b-tabs>

      <PlotCommentModal :editable="trial.editable" :cell="cell" ref="commentModal" />
      <ImageModal :row="cell.row" :column="cell.column" :trial="trial" :displayName="cell.displayName" :preferredTraitId="selectedTrait ? selectedTrait.id : null" ref="imageModal" />
      <GuidedWalkSelectorModal :cell="cell" :trialLayout="trial.layout" ref="guidedWalkModal" @change="onSelectGuidedWalk" />
    </div>
  </b-modal>
</template>

<script>
import Vue from 'vue'
import TraitInputSection from '@/components/TraitInputSection'
import ImageModal from '@/components/modals/ImageModal'
import PlotCommentModal from '@/components/modals/PlotCommentModal'
import GuidedWalkSelectorModal from '@/components/modals/GuidedWalkSelectorModal'
import { changeTrialsData, getCell, getTrialValidPlots, setPlotMarked } from '@/plugins/idb'
import { mapGetters } from 'vuex'
import { BIconBookmarkCheckFill, BIconBookmark, BIconChatRightTextFill, BIconCameraFill, BIconSignpostSplitFill, BIconCheck, BIconX, BIconGeoAltFill, BIconChevronDoubleRight } from 'bootstrap-vue'
import { guideOrderTypes } from '@/plugins/guidedwalk'
import { DISPLAY_ORDER_BOTTOM_TO_TOP, DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_RIGHT_TO_LEFT, DISPLAY_ORDER_TOP_TO_BOTTOM } from '@/plugins/constants'

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
    BIconSignpostSplitFill,
    BIconGeoAltFill,
    BIconChevronDoubleRight
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      DISPLAY_ORDER_BOTTOM_TO_TOP,
      DISPLAY_ORDER_LEFT_TO_RIGHT,
      DISPLAY_ORDER_RIGHT_TO_LEFT,
      DISPLAY_ORDER_TOP_TO_BOTTOM,
      cell: null,
      traitGroupTabIndex: 0,
      selectedTrait: null,
      tabStates: null,
      guidedWalk: null
    }
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial',
      'storeHiddenTraits',
      'storeDisplayRowOrder',
      'storeDisplayColumnOrder'
    ]),
    okTitle: function () {
      if (this.isEditable) {
        if (this.isGuidedWalk) {
          if (this.guidedWalk.index < this.guidedWalk.order.length - 1) {
            return this.$t('buttonNext')
          } else {
            return this.$t('buttonFinish')
          }
        } else {
          return this.$t('buttonSave')
        }
      } else {
        return this.$t('buttonClose')
      }
    },
    cancelDisabled: function () {
      if (this.isGuidedWalk) {
        return this.guidedWalk.index === 0
      } else {
        return false
      }
    },
    isGuidedWalk: function () {
      return this.guidedWalk !== undefined && this.guidedWalk !== null
    },
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
    },
    'guidedWalk.index': function (newValue) {
      if (this.guidedWalk) {
        const nextCoords = newValue < this.guidedWalk.order.length - 1 ? this.guidedWalk.order[newValue + 1] : null
        const prevCoords = newValue > 0 ? this.guidedWalk.order[newValue - 1] : null
        if (nextCoords !== null) {
          getCell(this.trial.localId, nextCoords.y, nextCoords.x)
            .then(next => {
              this.guidedWalk.next = next
            })
        } else {
          this.guidedWalk.next = null
        }
        if (prevCoords !== null) {
          getCell(this.trial.localId, prevCoords.y, prevCoords.x)
            .then(prev => {
              this.guidedWalk.prev = prev
            })
        } else {
          this.guidedWalk.prev = null
        }
      }
    }
  },
  methods: {
    onSelectGuidedWalk: function (typeName) {
      const match = guideOrderTypes.find(g => g.name === typeName)

      getTrialValidPlots(this.trial.localId).then(validCells => {
        const order = match.cellSequence({ x: this.cell.column, y: this.cell.row, direction: match.initialDirection }, this.trial.layout).filter(c => validCells.includes(`${c.y}|${c.x}`))

        this.guidedWalk = {
          order: order,
          index: 0,
          prev: null,
          next: null
        }
      })
    },
    onXClicked: function () {
      if (this.guidedWalk) {
        this.$bvModal.msgBoxConfirm(this.$t('modalTextStopGuidedWalk'), {
          title: this.$t('modalTitleStopGuidedWalk'),
          okTitle: this.$t('buttonYes'),
          okVariant: 'danger',
          cancelTitle: this.$t('buttonNo')
        })
          .then(value => {
            if (value) {
              this.hide()
            }
          })
      } else {
        this.hide()
      }
    },
    onGuidedWalkClicked: function () {
      if (this.guidedWalk) {
        this.$bvModal.msgBoxConfirm(this.$t('modalTextStopGuidedWalk'), {
          title: this.$t('modalTitleStopGuidedWalk'),
          okTitle: this.$t('buttonYes'),
          okVariant: 'danger',
          cancelTitle: this.$t('buttonNo')
        })
          .then(value => {
            if (value) {
              this.guidedWalk = null
            }
          })
      } else {
        this.$refs.guidedWalkModal.show()
      }
    },
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
        emitter.emit('plausible-event', { key: 'plot-marked', props: { marked: false } })
      } else {
        // Add it this way, because the cell may not have it
        Vue.set(this.cell, 'isMarked', true)
        setPlotMarked(this.storeSelectedTrial, this.cell.row, this.cell.column, true)
          .then(() => emitter.emit('plot-marked-changed', this.cell.row, this.cell.column, this.storeSelectedTrial))
        emitter.emit('plausible-event', { key: 'plot-marked', props: { marked: true } })
      }
    },
    updateCell: function (row, column) {
      if (this.trial) {
        getCell(this.storeSelectedTrial, row, column)
          .then(cell => {
            this.cell = cell
            this.show()

            this.$nextTick(() => {
              this.tabStates = null
              this.traitGroupTabIndex = 0

              this.trial.traits.forEach(t => {
                if (this.storeHiddenTraits.includes(t.id)) {
                  return
                }

                this.$refs[`trait-section-${t.id}`][0].reset()
              })
            })
          })
      }
    },
    updateCellComments: function (row, column, trialId, cell) {
      if (this.trial && this.cell && this.storeSelectedTrial === trialId && this.cell.row === row && this.cell.column === column) {
        Vue.set(this.cell, 'comments', cell.comments)
      }
    },
    onCancel: function () {
      if (this.isGuidedWalk) {
        this.validate(false)
      } else {
        this.hide()
      }
    },
    validate: function (forward = true) {
      this.tabStates = this.traitsByGroup.map(g => {
        const traitStates = g.traits.map(t => this.$refs[`trait-section-${t.id}`][0].validate())
        return traitStates.every(t => t)
      })

      if (this.tabStates.every(t => t)) {
        // All valid!
        const mapping = []
        this.trial.traits.forEach(t => {
          if (this.storeHiddenTraits.includes(t.id)) {
            return
          }

          const values = this.$refs[`trait-section-${t.id}`][0].getValues()

          if (!values.every(v => v === undefined || v === null || v === '')) {
            mapping.push({
              traitId: t.id,
              values: values,
              timestamp: new Date().toISOString()
            })
          }
        })

        const delta = forward ? 1 : -1

        if (mapping.length > 0) {
          changeTrialsData(this.trial.localId, this.cell.row, this.cell.column, mapping)
            .then(() => {
              // Take copies for the emitter later
              const row = this.cell.row
              const column = this.cell.column
              const trialId = this.trial.localId

              if (this.isGuidedWalk) {
                if (this.guidedWalk.next) {
                  this.guidedWalk.index = Math.max(0, Math.min(this.guidedWalk.order.length - 1, this.guidedWalk.index + delta))
                  const next = this.guidedWalk.order[this.guidedWalk.index]
                  this.updateCell(next.y, next.x)
                } else {
                  this.hide()
                }
              } else {
                this.hide()
              }

              this.$nextTick(() => emitter.emit('plot-data-changed', row, column, trialId))
            })
        } else {
          if (this.isGuidedWalk) {
            if (this.guidedWalk.next) {
              this.guidedWalk.index = Math.max(0, Math.min(this.guidedWalk.order.length - 1, this.guidedWalk.index + delta))
              const next = this.guidedWalk.order[this.guidedWalk.index]
              this.updateCell(next.y, next.x)
            } else {
              this.hide()
            }
          } else {
            this.hide()
          }
        }
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
      this.reset()
      this.$nextTick(() => this.$refs.dataInputModal.hide())
    },
    reset: function () {
      this.traitGroupTabIndex = 0
      this.cell = null
      this.guidedWalk = null
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
