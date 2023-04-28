<template>
  <b-modal :cancel-title="$t('buttonCancel')"
           :ok-title="$t('buttonSave')"
           no-close-on-backdrop
           no-close-on-esc
           @ok.prevent="loadInput"
           @hidden="reset"
           no-fade
           size="xl"
           ref="dataInputModal">
    <template v-slot:modal-header="{ close }">
      <h5 class="modal-title text-truncate">{{ displayName }}</h5>

      <b-button-group id="data-entry-header">
        <b-button @click="$refs.commentModal.show()"><BIconChatRightTextFill /> <span class="d-none d-lg-inline-block">{{ $tc('buttonCommentCount', cell.comments ? cell.comments.length : 0) }}</span></b-button>
        <b-button :pressed="cell.isMarked" @click="toggleMarked">
          <template v-if="cell.isMarked">
            <BIconBookmarkCheckFill /> {{ $t('buttonUnbookmarkCell') }}
          </template>
          <template v-else>
            <BIconBookmark /> {{ $t('buttonBookmarkCell') }}
          </template>
        </b-button>
      </b-button-group>

      <button class="close ml-0" @click="close()">×</button>
    </template>
    <div v-if="cell && trial">
      <b-tabs v-model="traitGroupTabIndex">
        <b-tab v-for="(group, groupIndex) in traitsByGroup" :key="`trait-group-tab-${groupIndex}`">
          <template #title>
            {{ group.name }} ({{ group.traits.length }})
          </template>

          <div class="mt-3">
            <TraitInputSection :trait="trait" v-for="trait in group.traits" :key="`trait-section-${trait.id}`" />
          </div>
        </b-tab>
      </b-tabs>
      {{ cell }}
    </div>
    <PlotCommentModal :cell="cell" ref="commentModal" />
  </b-modal>
</template>

<script>
import Vue from 'vue'
import TraitInputSection from '@/components/TraitInputSection'
import PlotCommentModal from '@/components/modals/PlotCommentModal'
import { getCell, setPlotMarked } from '@/plugins/idb'
import { mapGetters } from 'vuex'
import { BIconBookmarkCheckFill, BIconBookmark, BIconChatRightTextFill } from 'bootstrap-vue'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    TraitInputSection,
    PlotCommentModal,
    BIconChatRightTextFill,
    BIconBookmarkCheckFill,
    BIconBookmark
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
      traitGroupTabIndex: 0
    }
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial',
      'storeHiddenTraits'
    ]),
    traitsByGroup: function () {
      if (this.trial && this.trial.traits) {
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

        return Object.keys(result).map(k => {
          return {
            name: k,
            traits: result[k]
          }
        })
      } else {
        return []
      }
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
    watch: function () {
      this.update()
    }
  },
  methods: {
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
        // TODO: Others?
      }
    },
    update: function () {
      // TODO
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

</style>
