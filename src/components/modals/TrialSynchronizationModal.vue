<template>
  <b-modal :title="$t('modalTitleTrialSynchronization')"
           :ok-title="$t('Synchronize')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent="askToSynchronize"
           :ok-disabled="storeIsOffline"
           no-fade
           size="lg"
           ref="trialSynchronizationModal">
    <div v-if="storeIsOffline" class="modal-banner bg-danger text-white text-center mb-3 p-2">
      {{ $t('modalTextNetworkUnavailableWarning') }}
    </div>
    <div v-if="trial">
      <p>{{ $t('modalTextTrialSynchronization') }}</p>
      <div v-if="transaction">
        <h4><strong>{{ $tc('modalTextTrialSynchronizationCount', trial.transactionCount) }}</strong></h4>

        <b-list-group>
          <!-- TRIAL EDIT -->
          <b-list-group-item v-if="transaction.trialEditTransaction">
            <h5 class="mb-1"><BIconPencilSquare /> {{ $t('transactionTypeTrialModified') }}</h5>

            <p class="mb-1">{{ $t('transactionTypeTrialModifiedText') }}</p>
          </b-list-group-item>
          <!-- TRAITS ADDED -->
          <b-list-group-item v-if="transaction.trialTraitAddedTransactions && transaction.trialTraitAddedTransactions.length > 0">
            <h5 class="mb-1"><BIconTags /> {{ $t('transactionTypeTraitsAdded') }}</h5>

            <p class="mb-1">
              <TraitHeading :trait="trait" v-for="trait in transaction.trialTraitAddedTransactions" :key="`trait-${trait.id}`" />
            </p>
          </b-list-group-item>

          <!-- TRAIT DETAILS CHANGED -->
          <b-list-group-item v-if="transaction.traitChangeTransactions && transaction.traitChangeTransactions.length > 0">
            <h5 class="mb-1">
              <BIconstack>
                <BIconTag stacked />
                <BIconPencilFill stacked :scale="0.3" :rotate="-90" />
              </BIconstack> {{ $t('transactionTypeTraitsModified') }}
            </h5>

            <p class="mb-1">
              {{ $tc('transactionTypeTraitsModifiedCount', Object.keys(transaction.traitChangeTransactions).length) }}
            </p>
          </b-list-group-item>

          <!-- BRAPI IDS CHANGED -->
          <b-list-group-item v-if="transaction.brapiIdChangeTransaction && ((transaction.brapiIdChangeTransaction.germplasmBrapiIds && Object.keys(transaction.brapiIdChangeTransaction.germplasmBrapiIds).length > 0) || (transaction.brapiIdChangeTransaction.traitBrapiIds && Object.keys(transaction.brapiIdChangeTransaction.traitBrapiIds).length > 0))">
            <h5 class="mb-1">
              <IconBrapi /> {{ $t('transactionTypeBrapiIdsChanged') }}
            </h5>

            <p class="mb-1" v-if="transaction.brapiIdChangeTransaction.germplasmBrapiIds && Object.keys(transaction.brapiIdChangeTransaction.germplasmBrapiIds).length > 0">
              {{ $tc('transactionTypeBrapiIdsChangedGermplasmCount', Object.keys(transaction.brapiIdChangeTransaction.germplasmBrapiIds).length) }}
            </p>
            <p class="mb-1" v-if="transaction.brapiIdChangeTransaction.traitBrapiIds && Object.keys(transaction.brapiIdChangeTransaction.traitBrapiIds).length > 0">
              {{ $tc('transactionTypeBrapiIdsChangedTraitCount', Object.keys(transaction.brapiIdChangeTransaction.traitBrapiIds).length) }}
            </p>
          </b-list-group-item>

          <!-- BRAPI CONFIG CHANGED -->
          <b-list-group-item v-if="transaction.brapiConfigChangeTransaction && transaction.brapiConfigChangeTransaction.url !== undefined && transaction.brapiConfigChangeTransaction.url !== null && transaction.brapiConfigChangeTransaction.url !== ''">
            <h5 class="mb-1">
              <IconBrapi /> {{ $t('transactionTypeBrapiConfigChanged') }}
            </h5>
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
        <p v-html="$t('modalTextTrialSynchronizationNoData')" :class="trial.hasRemoteUpdate ? null : 'text-warning'" />

        <p v-if="trial.hasRemoteUpdate" class="bg-info p-3">{{ $t('modalTextTrialSynchronizationRemoteChanges') }}</p>
      </div>
    </div>
  </b-modal>
</template>

<script>
import TraitHeading from '@/components/TraitHeading'

import { mapGetters } from 'vuex'
import { addTrial, deleteTrial, getTransactionForTrial } from '@/plugins/idb'
import { synchronizeTrial } from '@/plugins/api'

import { BIconChatLeft, BIconstack, BIconPlus, BIconDash, BIconPencilSquare, BIconTags, BIconTag, BIconPencilFill, BIconNodePlus, BIconBookmarkStar, BIconUiChecksGrid } from 'bootstrap-vue'

import IconBrapi from '@/components/icons/IconBrapi'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconChatLeft,
    BIconUiChecksGrid,
    BIconstack,
    BIconPlus,
    BIconDash,
    BIconPencilSquare,
    BIconTags,
    BIconTag,
    BIconPencilFill,
    BIconNodePlus,
    BIconBookmarkStar,
    TraitHeading,
    IconBrapi
  },
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  computed: {
    ...mapGetters([
      'storeIsOffline'
    ])
  },
  data: function () {
    return {
      transaction: null
    }
  },
  methods: {
    askToSynchronize: function () {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextSynchronizeTrial'), {
        title: this.$t('modalTitleSynchronizeTrial'),
        okTitle: this.$t('buttonYes'),
        okVariant: 'success',
        cancelTitle: this.$t('buttonNo')
      })
        .then(value => {
          if (value) {
            this.synchronize()
          }
        })
    },
    synchronize: function () {
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
        .catch(err => {
          console.log(err)
          if (err && err.status === 404) {
            // TODO: Handle missing trials
          }
        })
        .finally(() => {
          emitter.emit('show-loading', false)
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
