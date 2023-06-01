<template>
  <b-modal :title="$t('modalTitleTrialSynchronization')"
           :ok-title="$t('Synchronize')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent="synchronize"
           no-fade
           size="lg"
           ref="trialSynchronizationModal">
    <div v-if="trial">
      <p>{{ $t('modalTextTrialSynchronization') }}</p>
      <div v-if="transaction">
        <h4><strong>{{ $tc('modalTextTrialSynchronizationCount', trial.transactionCount) }}</strong></h4>

        <b-list-group>
          <!-- TRAITS ADDED -->
          <b-list-group-item v-if="transaction.trialTraitAddedTransactions && transaction.trialTraitAddedTransactions.length > 0">
            <h5 class="mb-1"><BIconTags /> {{ $t('transactionTypeTraitsAdded') }}</h5>

            <p class="mb-1">
              <TraitHeading :trait="trait" v-for="trait in transaction.trialTraitAddedTransactions" :key="`trait-${trait.id}`" />
            </p>
          </b-list-group-item>

          <!-- GERMPLASM ADDED -->
          <b-list-group-item v-if="transaction.trialGermplasmAddedTransactions && transaction.trialGermplasmAddedTransactions.length > 0">
            <h5 class="mb-1"><BIconNodePlus :rotate="270" /> {{ $t('transactionTypeGermplasmAdded') }}</h5>

            <p class="mb-1">
              {{ transaction.trialGermplasmAddedTransactions.join(', ') }}
            </p>
          </b-list-group-item>

          <!-- PLOT COMMENT ADDED -->
          <b-list-group-item v-if="transaction.plotCommentAddedTransactions && Object.keys(transaction.plotCommentAddedTransactions).length > 0">
            <h5 class="mb-1">
              <BIconstack>
                <BIconChatLeft stacked />
                <BIconPlus stacked :scale="0.7" :shift-v="2" />
              </BIconstack> {{ $t('transactionTypePlotCommentAdded') }}
            </h5>

            <p class="mb-1">
              {{ $tc('transactionTypePlotCommentAddedCount', Object.keys(transaction.plotCommentAddedTransactions).length) }}
            </p>
          </b-list-group-item>

          <!-- PLOT COMMENT DELETED -->
          <b-list-group-item v-if="transaction.plotCommentDeletedTransactions && Object.keys(transaction.plotCommentDeletedTransactions).length > 0">
            <h5 class="mb-1">
              <BIconstack>
                <BIconChatLeft stacked />
                <BIconDash stacked :scale="0.7" :shift-v="2" />
              </BIconstack> {{ $t('transactionTypePlotCommentDeleted') }}
            </h5>

            <p class="mb-1">
              {{ $tc('transactionTypePlotCommentDeletedCount', Object.keys(transaction.plotCommentDeletedTransactions).length) }}
            </p>
          </b-list-group-item>

          <!-- PLOT TRAIT DATA CHANGED -->
          <b-list-group-item v-if="transaction.plotTraitDataChangeTransactions && Object.keys(transaction.plotTraitDataChangeTransactions).length > 0">
            <h5 class="mb-1">
              <BIconUiChecksGrid /> {{ $t('transactionTypeTraitDataChanged') }}
            </h5>

            <p class="mb-1">
              {{ $tc('transactionTypeTraitDataChangedCount', Object.keys(transaction.plotTraitDataChangeTransactions).length) }}
            </p>
          </b-list-group-item>

          <!-- PLOT MARKED CHANGED -->
          <b-list-group-item v-if="transaction.plotMarkedTransactions && Object.keys(transaction.plotMarkedTransactions).length > 0">
            <h5 class="mb-1">
              <BIconBookmarkStar /> {{ $t('transactionTypePlotMarkedChanged') }}
            </h5>

            <p class="mb-1">
              {{ $tc('transactionTypePlotMarkedChangedCount', Object.keys(transaction.plotMarkedTransactions).length) }}
            </p>
          </b-list-group-item>

          <!-- TRIAL COMMENT ADDED -->
          <b-list-group-item v-if="transaction.trialCommentAddedTransactions && transaction.trialCommentAddedTransactions.length > 0">
            <h5 class="mb-1">
              <BIconstack>
                <BIconChatLeft stacked />
                <BIconPlus stacked :scale="0.7" :shift-v="2" />
              </BIconstack> {{ $t('transactionTypeTrialCommentAdded') }}
            </h5>

            <p class="mb-1">
              {{ $tc('transactionTypeTrialCommentAddedCount', Object.keys(transaction.trialCommentAddedTransactions).length) }}
            </p>
          </b-list-group-item>

          <!-- TRIAL COMMENT DELETED -->
          <b-list-group-item v-if="transaction.trialCommentDeletedTransactions && transaction.trialCommentDeletedTransactions.length > 0">
            <h5 class="mb-1">
              <BIconstack>
                <BIconChatLeft stacked />
                <BIconDash stacked :scale="0.7" :shift-v="2" />
              </BIconstack> {{ $t('transactionTypeTrialCommentDeleted') }}
            </h5>

            <p class="mb-1">
              {{ $tc('transactionTypeTrialCommentDeletedCount', Object.keys(transaction.trialCommentDeletedTransactions).length) }}
            </p>
          </b-list-group-item>
        </b-list-group>
      </div>
      <div v-else>
        <p v-html="$t('modalTextTrialSynchronizationNoData')" />
      </div>
    </div>
  </b-modal>
</template>

<script>
import TraitHeading from '@/components/TraitHeading'

import { addTrial, deleteTrial, getTransactionForTrial } from '@/plugins/idb'
import { synchronizeTrial } from '@/plugins/api'

import { BIconChatLeft, BIconstack, BIconPlus, BIconDash, BIconTags, BIconNodePlus, BIconBookmarkStar, BIconUiChecksGrid } from 'bootstrap-vue'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconChatLeft,
    BIconUiChecksGrid,
    BIconstack,
    BIconPlus,
    BIconDash,
    BIconTags,
    BIconNodePlus,
    BIconBookmarkStar,
    TraitHeading
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      transaction: null
    }
  },
  methods: {
    synchronize: function () {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextSynchronizeTrial'), {
        title: this.$t('modalTitleSynchronizeTrial'),
        okTitle: this.$t('buttonYes'),
        okVariant: 'success',
        cancelTitle: this.$t('buttonNo')
      })
        .then(value => {
          if (value) {
            emitter.emit('show-loading', true)
            synchronizeTrial(this.trial.shareCodes.ownerCode || this.trial.shareCodes.editorCode, this.transaction)
              .then(result => {
                result.localId = this.trial.localId

                return deleteTrial(this.trial.localId)
                  .then(() => {
                    return addTrial(result)
                  })
                  .then(localId => {
                    this.$store.dispatch('setSelectedTrial', localId)
                    emitter.emit('trials-updated')
                    emitter.emit('show-loading', false)
                    emitter.emit('plausible-event', { key: 'trial-synchronized', props: { count: this.trial.transactionCount } })
                  })
                  .finally(() => {
                    emitter.emit('show-loading', false)
                  })
              })
              .finally(() => {
                emitter.emit('show-loading', false)
              })
          }
        })
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      getTransactionForTrial(this.trial.localId)
        .then(transaction => {
          this.transaction = transaction
        })

      this.$refs.trialSynchronizationModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.transaction = null
      this.$nextTick(() => this.$refs.trialSynchronizationModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
