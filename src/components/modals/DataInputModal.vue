<template>
  <b-modal :cancel-title="$t(isGuidedWalk ? 'buttonPrevious' : 'buttonCancel')"
           :ok-title="okTitle"
           ok-variant="primary"
           :cancel-variant="isGuidedWalk ? 'primary' : 'secondary'"
           :cancel-disabled="cancelDisabled"
           scrollable
           no-close-on-backdrop
           no-close-on-esc
           @cancel.prevent="onCancel"
           @ok.prevent="validate"
           @hidden="reset"
           @shown="shown"
           id="data-input-modal"
           no-fade
           :modal-class="fullscreen ? 'modal-fullscreen' : null"
           size="xl"
           header-class="align-items-center"
           ref="dataInputModal">
    <template v-slot:header>
      <h5 class="modal-title text-truncate">{{ displayName }}</h5>

      <b-button-group id="data-entry-header" v-if="cell">
        <VueDatePicker v-model="recordingDate" :locale="storeLocale" :dark="storeDarkMode" :week-start="1" :disabled="!trial.editable" :enable-time-picker="false" clearable :action-row="{ showPreview: false, showNow: true }" class="btn btn-sm btn-secondary w-auto">
          <template #trigger>
            <span><IBiCalendarEvent /> <span class="d-none d-xl-inline-block"> {{ $t('buttonPickRecordingDate') }}</span></span>
          </template>
        </VueDatePicker>
        <b-button id="toolbar-button-comments" size="sm" @click="onShowCommentModal">
          <IBiChatRightTextFill v-if="(cell.comments || []).length > 0" /><IBiChatRightText v-else /> <span class="d-none d-xl-inline-block">{{ $t('buttonCommentCount', cell.comments ? cell.comments.length : 0) }}</span>
        </b-button>
        <b-button id="toolbar-button-marking" size="sm" :pressed="cell.isMarked" @click="toggleMarked" :disabled="!trial.editable">
          <template v-if="cell.isMarked">
            <IBiBookmarkCheckFill /> <span class="d-none d-xl-inline-block"> {{ $t('buttonUnbookmarkCell') }}</span>
          </template>
          <template v-else>
            <IBiBookmark /> <span class="d-none d-xl-inline-block"> {{ $t('buttonBookmarkCell') }}</span>
          </template>
        </b-button>
        <b-button id="toolbar-button-camera" size="sm" @click="onShowPhotoModal(null)" :disabled="!trial.editable"><IBiCameraFill /> <span class="d-none d-xl-inline-block"> {{ $t('buttonTagPhoto') }}</span></b-button>
        <b-button id="toolbar-button-guided-walk" size="sm" @click="onGuidedWalkClicked" :disabled="!trial.editable" :variant="guidedWalk !== null ? 'success' : 'secondary'" :pressed="guidedWalk !== null"><IBiSignpostSplitFill /> <span class="d-none d-xl-inline-block"> {{ $t('buttonStartGuidedWalk') }}</span></b-button>
        <b-button size="sm" @click="navigateToPerformancePage"><IBiGraphUpArrow /> <span class="d-none d-xl-inline-block"> {{ $t('buttonGermplasmPerformance') }}</span></b-button>
        <b-button size="sm" @click="startTour"><IBiQuestionCircle /> <span class="d-none d-xl-inline-block"> {{ $t('toolbarHelp') }}</span></b-button>
      </b-button-group>

      <b-button class="btn-close" aria-label="Close" @click.prevent="onXClicked"></b-button>
    </template>
    <div v-if="!isRecordingDateToday" class="modal-banner bg-warning text-dark text-center mb-3 p-2">
      {{ $t('modalTextNotTodayWarning', { date: recordingDate.toLocaleDateString() }) }}
    </div>
    <div v-if="trial && !trial.editable" class="modal-banner bg-warning text-dark text-center mb-3 p-2">
      {{ $t('modalTextDataInputReadOnly') }}
    </div>
    <div v-if="cell && trial">
      <b-row v-if="guidedWalk" class="mb-3">
        <b-col cols=4>
          <b-card class="text-center h-100" :title="guidedWalk.prev.displayName" :subtitle="$t('widgetGuidedWalkPreviewColumnRow', { column: $n(guidedWalk.prev.displayColumn), row: $n(guidedWalk.prev.displayRow) })" v-if="guidedWalk.prev" />
        </b-col>
        <b-col cols=4>
          <b-card class="text-center h-100">
            <b-card-title>
              <IBiChevronDoubleRight :class="guidedWalk.prev ? null : 'text-muted'" /> <a href="#" @click.prevent><IBiGeoAltFill id="guided-walk-current" class="mx-2" /></a> <IBiChevronDoubleRight :class="guidedWalk.next ? null : 'text-muted'" />
            </b-card-title>

            <b-popover target="guided-walk-current" container="body" triggers="focus" placement="bottom" custom-class="popover-unset-width">
              <TrialPreviewCanvas :trial="trial" :column="cell.column" :row="cell.row" />
            </b-popover>

            <b-card-subtitle>
              {{ $t('widgetGuidedWalkPreviewColumnRow', { column: $n(cell.displayColumn), row: $n(cell.displayRow) }) }}
            </b-card-subtitle>
          </b-card>
        </b-col>
        <b-col cols=4>
          <b-card class="text-center h-100" :title="guidedWalk.next.displayName" :subtitle="$t('widgetGuidedWalkPreviewColumnRow', { column: $n(guidedWalk.next.displayColumn), row: $n(guidedWalk.next.displayRow) })" v-if="guidedWalk.next" />
        </b-col>
      </b-row>
      <p>
        <b-badge class="me-2" v-b-tooltip="$t('tooltipChartHeatmapGermplasm')"><IBiFlower1 /> {{ cell.germplasm }}</b-badge>
        <b-badge class="me-2" v-b-tooltip="$t('tooltipChartHeatmapRep')" v-if="cell.rep"><IBiListOl /> {{ cell.rep }}</b-badge>
        <b-badge class="me-2" v-b-tooltip="$t('tooltipChartHeatmapRow')"><IBiLayoutThreeColumns :style="{ transform: 'rotate(90deg)' }" /> {{ $n(cell.displayRow) }}</b-badge>
        <b-badge class="me-2" v-b-tooltip="$t('tooltipChartHeatmapColumn')"><IBiLayoutThreeColumns /> {{ $n(cell.displayColumn) }}</b-badge>
        <template v-if="cell && cell.categories">
          <b-badge class="me-2" v-for="cat in cell.categories" :key="`cell-category-${cell.row}-${cell.column}-${cat}`" :variant="CELL_CATEGORIES[cat].variant">
            <component :is="CELL_CATEGORIES[cat].icon" /> {{ $t(CELL_CATEGORIES[cat].title) }}
          </b-badge>
        </template>
      </p>
      <b-tabs no-fade v-model="traitGroupTabIndex" id="trait-group-tabs">
        <b-tab v-for="(group, groupIndex) in traitsByGroup" :key="`trait-group-tab-${groupIndex}`" @click="autofocusFirst"
          :title-item-class="(tabStates && tabStates[groupIndex] === false) ? 'bg-danger' : null"
          :title-link-class="(tabStates && tabStates[groupIndex] === false) ? 'text-white bg-danger' : null">
          <template #title>
            {{ group.name }} ({{ group.traits.length }})

            <IBiCheck class="text-success" v-if="tabStates && tabStates[groupIndex] === true" />
            <IBiX class="text-white" v-else-if="tabStates && tabStates[groupIndex] === false" />
          </template>

          <div class="mt-3 trait-group-tab-content">
            <b-form @submit.prevent>
              <TraitInputSection @data-changed="$emit('data-changed')" :trial="trial" :editable="trial.editable && trait.editable" :cell="cell" :trait="trait" v-for="trait in group.traits" :key="`trait-section-${trait.id}`" :ref="`trait-section-${trait.id}`" @traverse="onTraverse(trait)" @photo-clicked="onShowPhotoModal(trait)" />
            </b-form>
          </div>
        </b-tab>
      </b-tabs>

      <PlotCommentModal :editable="trial.editable" :cell="cell" ref="commentModal" v-if="showModal === 'comment'" />
      <ImageModal :row="cell.row" :column="cell.column" :trial="trial" :displayName="cell.displayName" :preferredTraitId="selectedTrait ? selectedTrait.id : null" ref="imageModal" v-if="showModal === 'image'" />
      <GuidedWalkSelectorModal :cell="cell" :trialLayout="trial.layout" ref="guidedWalkModal" @change="onSelectGuidedWalk" v-if="showModal === 'guided-walk'" />

      <DataInputCloseModal ref="closeModal" @close="hide" @save="validate" v-if="showModal === 'close'" />

      <Tour :steps="tourSteps" :resetOnRouterNav="true" :hideBackButton="false" ref="dataInputTour" />
    </div>
  </b-modal>
</template>

<script>
import TraitInputSection from '@/components/TraitInputSection.vue'
import ImageModal from '@/components/modals/ImageModal.vue'
import PlotCommentModal from '@/components/modals/PlotCommentModal.vue'
import GuidedWalkSelectorModal from '@/components/modals/GuidedWalkSelectorModal.vue'
import DataInputCloseModal from '@/components/modals/DataInputCloseModal.vue'
import TrialPreviewCanvas from '@/components/canvas/TrialPreviewCanvas.vue'
import Tour from '@/components/Tour.vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { changeTrialsData, getCell, getTrialValidPlots, setPlotMarked } from '@/plugins/idb'
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import { guideOrderTypes } from '@/plugins/guidedwalk'
import { CELL_CATEGORIES } from '@/plugins/constants'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    ImageModal,
    TraitInputSection,
    PlotCommentModal,
    GuidedWalkSelectorModal,
    DataInputCloseModal,
    Tour,
    TrialPreviewCanvas,
    VueDatePicker
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    },
    geolocation: {
      type: Object,
      default: () => null
    },
    fullscreen: {
      type: Boolean,
      default: false
    }
  },
  data: function () {
    return {
      CELL_CATEGORIES,
      cell: null,
      traitGroupTabIndex: 0,
      selectedTrait: null,
      tabStates: null,
      guidedWalk: null,
      recordingDate: new Date(),
      showModal: null
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeSelectedTrial',
      'storeHiddenTraits',
      'storeCalendarLocale',
      'storeDarkMode',
      'storeSelectedTrialPerson',
      'storeLocale'
    ]),
    tourSteps: function () {
      return [{
        title: () => this.$t('tourTitleDataInputStart'),
        text: () => this.$t('tourTextDataInputStart'),
        target: () => '#data-input-modal .modal-header',
        position: 'bottom',
        beforeShow: () => {
          return new Promise(resolve => {
            this.traitGroupTabIndex = 0

            this.$nextTick(() => resolve())
          })
        }
      }, {
        title: () => this.$t('tourTitleDataInputTraitGroups'),
        text: () => this.$t('tourTextDataInputTraitGroups'),
        target: () => '#trait-group-tabs ul li:first-of-type',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataInputTraits'),
        text: () => this.$t('tourTextDataInputTraits'),
        target: () => '.trait-group-tab-content'
      }, {
        title: () => this.$t('tourTitleDataInputTraitDetails'),
        text: () => this.$t('tourTextDataInputTraitDetails'),
        target: () => '.trait-group-tab-content .trait-section',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataInputTraitName'),
        text: () => this.$t('tourTextDataInputTraitName'),
        target: () => '.trait-group-tab-content .trait-section .trait-name',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataInputTraitDataType'),
        text: () => this.$t('tourTextDataInputTraitDataType'),
        target: () => '.trait-group-tab-content .trait-section .trait-data-type',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataInputTraitAllowRepeats'),
        text: () => this.$t('tourTextDataInputTraitAllowRepeats'),
        target: () => '.trait-group-tab-content .trait-section .trait-allow-repeats',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataInputTraitSetSize'),
        text: () => this.$t('tourTextDataInputTraitSetSize'),
        target: () => '.trait-group-tab-content .trait-section .trait-set-size',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataInputTraitHistory'),
        text: () => this.$t('tourTextDataInputTraitHistory'),
        target: () => '.trait-group-tab-content .trait-section .trait-history',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataInputTraitCamera'),
        text: () => this.$t('tourTextDataInputTraitCamera'),
        target: () => '.trait-group-tab-content .trait-section .trait-camera',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataInputTraitDataInput'),
        text: () => this.$t('tourTextDataInputTraitDataInput'),
        target: () => '.trait-group-tab-content .trait-section .trait-data-input',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataInputPickDate'),
        text: () => this.$t('tourTextDataInputPickDate'),
        target: () => '#data-input-modal .modal-header #toolbar-button-pick-date',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataInputComments'),
        text: () => this.$t('tourTextDataInputComments'),
        target: () => '#data-input-modal .modal-header #toolbar-button-comments',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataInputMarking'),
        text: () => this.$t('tourTextDataInputMarking'),
        target: () => '#data-input-modal .modal-header #toolbar-button-marking',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataInputCamera'),
        text: () => this.$t('tourTextDataInputCamera'),
        target: () => '#data-input-modal .modal-header #toolbar-button-camera',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataInputGuidedWalk'),
        text: () => this.$t('tourTextDataInputGuidedWalk'),
        target: () => '#data-input-modal .modal-header #toolbar-button-guided-walk',
        position: 'bottom'
      }, {
        title: () => this.$t('tourTitleDataInputSave'),
        text: () => this.$t('tourTextDataInputSave'),
        target: () => '#data-input-modal .modal-footer button:last-of-type',
        position: 'top'
      }]
    },
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

        this.trial.traits.forEach(t => {
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
    },
    isRecordingDateToday: function () {
      const now = new Date()
      return now.getFullYear() === this.recordingDate.getFullYear() &&
        now.getMonth() === this.recordingDate.getMonth() &&
        now.getDate() === this.recordingDate.getDate()
    }
  },
  watch: {
    traitsByGroup: function (newValue) {
      if (newValue) {
        this.tabStates = newValue.map(() => null)
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
    },
    cell: function (newValue, oldValue) {
      if (newValue !== undefined && newValue !== null) {
        if (oldValue === undefined || oldValue === null || oldValue.displayName !== newValue.displayName) {
          emitter.emit('tts', newValue.displayName)
        }
      }
    }
  },
  methods: {
    navigateToPerformancePage: function () {
      emitter.emit('show-confirm', {
        title: 'modalTitleLeaveDataInput',
        message: 'modalTextLeaveDataInput',
        okTitle: 'buttonYes',
        cancelTitle: 'buttonNo',
        okVariant: 'danger',
        callback: (result) => {
          if (result) {
            this.$router.push({ name: 'germplasm-performance', query: { trialId: this.storeSelectedTrial, germplasmIdentifier: this.cell.germplasm } })
          }
        }
      })
    },
    startTour: function () {
      this.$refs.dataInputTour.start()
    },
    forceGuidedWalk: function (config) {
      this.onSelectGuidedWalk(config.walkName)
    },
    onSelectGuidedWalk: function (typeName) {
      const match = guideOrderTypes.find(g => g.name === typeName)

      if (match) {
        getTrialValidPlots(this.trial.localId).then(validCells => {
          const order = match.cellSequence({ x: this.cell.column, y: this.cell.row, direction: match.initialDirection }, this.trial.layout).filter(c => validCells.includes(`${c.y}|${c.x}`))

          this.guidedWalk = {
            order,
            index: 0,
            prev: null,
            next: null
          }
        })
      }
    },
    closeConfirmed: function () {
      if (this.showModal === 'confirm-guided-walk-stop') {
        this.guidedWalk = null
        this.$router.push({ name: 'data-entry' })
      } else if (this.showModal === 'confirm-close') {
        this.hide()
      }
    },
    onXClicked: function () {
      if (!this.trial.editable) {
        this.hide()
      } else {
        if (this.guidedWalk) {
          this.showModal = 'confirm-guided-walk-stop'
          emitter.emit('show-confirm', {
            title: 'modalTitleStopGuidedWalk',
            message: 'modalTextStopGuidedWalk',
            okTitle: 'buttonYes',
            cancelTitle: 'buttonNo',
            okVariant: 'danger',
            callback: (result) => {
              if (result) {
                this.closeConfirmed()
              }
            }
          })
        } else {
          this.showModal = 'close'
          this.$nextTick(() => this.$refs.closeModal.show())
        }
      }
    },
    onGuidedWalkClicked: function () {
      if (this.guidedWalk) {
        this.showModal = 'confirm-guided-walk-stop'
        this.$nextTick(() => this.$refs.guidedWalkModal.show())
      } else {
        this.showModal = 'guided-walk'
        this.$nextTick(() => this.$refs.guidedWalkModal.show())
      }
    },
    onShowPhotoModal: function (selectedTrait) {
      this.selectedTrait = selectedTrait
      this.showModal = 'image'

      this.$nextTick(() => this.$refs.imageModal.show())
    },
    onShowCommentModal: function () {
      this.showModal = 'comment'

      this.$nextTick(() => this.$refs.commentModal.show())
    },
    shown: function () {
      this.$emit('shown')
      this.autofocusFirst()
    },
    autofocusFirst: function () {
      this.$nextTick(() => {
        if (this.traitsByGroup && this.traitsByGroup.length > 0) {
          if (this.traitsByGroup[this.traitGroupTabIndex].traits && this.traitsByGroup[this.traitGroupTabIndex].traits.length > 0) {
            const traitId = this.traitsByGroup[this.traitGroupTabIndex].traits[0].id

            this.$refs[`trait-section-${traitId}`][0].handleTraverse(0)
            emitter.emit('tts', this.traitsByGroup[this.traitGroupTabIndex].traits[0].name, false)
          }
        }
      })
    },
    onTraverse: function (currentTrait) {
      const group = this.traitsByGroup.find(g => g.traits.map(t => t.id).includes(currentTrait.id))

      if (group) {
        const traitIndex = group.traits.findIndex(t => t.id === currentTrait.id)

        if (traitIndex !== -1) {
          if (traitIndex < group.traits.length - 1) {
            this.$refs[`trait-section-${group.traits[traitIndex + 1].id}`][0].handleTraverse(0)
            emitter.emit('tts', group.traits[traitIndex + 1].name, false)
          } else if (this.traitsByGroup.length === 1) {
            // This is the last trait in this tab/group and there's only one tab
            this.validate()
          }
        }
      }
    },
    toggleMarked: function () {
      if (this.cell.isMarked) {
        // Remove it reactively from the cell
        delete this.cell.isMarked
        setPlotMarked(this.storeSelectedTrial, this.cell.row, this.cell.column, false)
          .then(() => emitter.emit('plot-marked-changed', this.cell.row, this.cell.column, this.storeSelectedTrial))
        emitter.emit('plausible-event', { key: 'plot-marked', props: { marked: false } })
      } else {
        // Add it this way, because the cell may not have it
        this.cell.isMarked = true
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

              if (this.isGuidedWalk) {
                this.autofocusFirst()
              }
            })
          })
      }
    },
    updateCellComments: function (row, column, trialId, cell) {
      if (this.trial && this.cell && this.storeSelectedTrial === trialId && this.cell.row === row && this.cell.column === column) {
        this.cell.comments = cell.comments
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
      if (!this.trial.editable) {
        this.hide()
      }

      const traitStates = []
      this.tabStates = this.traitsByGroup.map(g => {
        const ts = g.traits.map(t => this.$refs[`trait-section-${t.id}`][0].validate())
        traitStates.push(ts)
        return ts.every(t => t)
      })

      if (!this.tabStates.every(t => t)) {
        const errorTabIndex = this.tabStates.findIndex(t => !t)

        this.traitGroupTabIndex = errorTabIndex

        this.$nextTick(() => {
          let traitToScrollIntoView = null
          this.traitsByGroup[this.traitGroupTabIndex].traits.forEach((et, eti) => {
            if (!traitStates[this.traitGroupTabIndex][eti]) {
              traitToScrollIntoView = et
            }
          })

          this.$nextTick(() => {
            this.$refs[`trait-section-${traitToScrollIntoView.id}`][0].$el.scrollIntoView()
            this.$refs[`trait-section-${traitToScrollIntoView.id}`][0].focus()
          })
        })
      } else {
        const now = new Date()
        const date = now

        // If we're not using today as the recording date, then adjust to this time of day
        if (!this.isRecordingDateToday) {
          date.setDate(this.recordingDate.getDate())
          date.setMonth(this.recordingDate.getMonth())
          date.setFullYear(this.recordingDate.getFullYear())
          date.setUTCHours(now.getUTCHours())
          date.setUTCMinutes(now.getUTCMinutes())
          date.setUTCSeconds(now.getUTCSeconds())
          date.setUTCMilliseconds(now.getUTCMilliseconds())
        }

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
              personId: this.storeSelectedTrialPerson,
              values,
              timestamp: date.toISOString()
            })
          }
        })

        const delta = forward ? 1 : -1

        if (mapping.length > 0) {
          const payload = {}
          payload[`${this.cell.row}|${this.cell.column}`] = mapping
          changeTrialsData(this.trial.localId, payload, this.geolocation)
            .then(() => {
              // Take copies for the emitter later
              const row = this.cell.row
              const column = this.cell.column
              const trialId = this.trial.localId

              if (this.isGuidedWalk) {
                const index = this.guidedWalk.index + delta
                if (index > -1 && index < this.guidedWalk.order.length) {
                  this.guidedWalk.index = index
                  const next = this.guidedWalk.order[this.guidedWalk.index]
                  this.updateCell(next.y, next.x)
                } else {
                  this.hide()
                }
              } else {
                this.hide()
              }

              this.$nextTick(() => {
                emitter.emit('plot-data-changed', row, column, trialId)
                this.$emit('data-changed')
              })
            })
        } else {
          if (this.isGuidedWalk) {
            const index = this.guidedWalk.index + delta
            if (index > -1 && index < this.guidedWalk.order.length) {
              this.guidedWalk.index = index
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
      this.$nextTick(() => {
        this.$refs.dataInputModal.hide()
        this.$emit('hidden')
      })
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
    emitter.on('force-guided-walk', this.forceGuidedWalk)
  },
  beforeUnmount: function () {
    emitter.off('plot-clicked', this.updateCell)
    emitter.off('plot-cache-changed', this.updateCellComments)
    emitter.off('force-guided-walk', this.forceGuidedWalk)
  }
}
</script>

<style>
#data-input-modal .modal-header {
  justify-content: space-between;
}
#data-input-modal .modal-header .btn-close {
  margin-left: inherit;
}
.trait-group-tab-content section:first-child hr {
  display: none;
}
.popover-unset-width {
  max-width: 100%;
}
#data-input-modal .modal-dialog-scrollable .modal-content {
  height: 100%;
}
</style>
