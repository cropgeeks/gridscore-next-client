<template>
  <UseOnline v-slot="{ isOnline }">
    <b-modal :title="$t('modalTitleTrialSynchronization')"
            :ok-title="$t('Synchronize')"
            :cancel-title="$t('buttonCancel')"
            @ok.prevent="askToSynchronize"
            :ok-disabled="isOnline === false"
            no-fade
            size="lg"
            ref="trialSynchronizationModal">
      <div v-if="isOnline === false" class="modal-banner bg-danger text-white text-center mb-3 p-2">
        {{ $t('modalTextNetworkUnavailableWarning') }}
      </div>
      <div v-if="trial">
        <p>{{ $t('modalTextTrialSynchronization') }}</p>
        <div v-if="transaction">
          <h4><strong>{{ $t('modalTextTrialSynchronizationCount', trial.transactionCount) }}</strong></h4>

          <b-list-group>
            <!-- TRIAL EDIT -->
            <b-list-group-item v-if="transaction.trialEditTransaction">
              <h5 class="mb-1"><IBiPencilSquare /> {{ $t('transactionTypeTrialModified') }}</h5>

              <p class="mb-1">{{ $t('transactionTypeTrialModifiedText') }}</p>
            </b-list-group-item>
            <!-- TRAITS ADDED -->
            <b-list-group-item v-if="transaction.trialTraitAddedTransactions && transaction.trialTraitAddedTransactions.length > 0">
              <h5 class="mb-1"><IBiTags /> {{ $t('transactionTypeTraitsAdded') }}</h5>

              <p class="mb-1">
                <TraitHeading :trait="trait" v-for="trait in transaction.trialTraitAddedTransactions" :key="`trait-${trait.id}`" />
              </p>
            </b-list-group-item>

            <!-- PERSON ADDED -->
            <b-list-group-item v-if="transaction.trialPersonAddedTransactions && transaction.trialPersonAddedTransactions.length > 0">
              <h5 class="mb-1"><IBiPersonPlus /> {{ $t('transactionTypePeopleAdded') }}</h5>

              <p class="mb-1">
                {{ $t('transactionTypePeopleAddedCount', Object.keys(transaction.trialPersonAddedTransactions).length) }}
              </p>
            </b-list-group-item>

            <!-- TRAIT DETAILS CHANGED -->
            <b-list-group-item v-if="transaction.traitChangeTransactions && transaction.traitChangeTransactions.length > 0">
              <h5 class="mb-1">
                <IBiTags /> {{ $t('transactionTypeTraitsModified') }}
              </h5>

              <p class="mb-1">
                {{ $t('transactionTypeTraitsModifiedCount', Object.keys(transaction.traitChangeTransactions).length) }}
              </p>
            </b-list-group-item>

            <!-- BRAPI IDS CHANGED -->
            <b-list-group-item v-if="transaction.brapiIdChangeTransaction && ((transaction.brapiIdChangeTransaction.germplasmBrapiIds && Object.keys(transaction.brapiIdChangeTransaction.germplasmBrapiIds).length > 0) || (transaction.brapiIdChangeTransaction.traitBrapiIds && Object.keys(transaction.brapiIdChangeTransaction.traitBrapiIds).length > 0))">
              <h5 class="mb-1">
                <IconBrapi /> {{ $t('transactionTypeBrapiIdsChanged') }}
              </h5>

              <p class="mb-1" v-if="transaction.brapiIdChangeTransaction.germplasmBrapiIds && Object.keys(transaction.brapiIdChangeTransaction.germplasmBrapiIds).length > 0">
                {{ $t('transactionTypeBrapiIdsChangedGermplasmCount', Object.keys(transaction.brapiIdChangeTransaction.germplasmBrapiIds).length) }}
              </p>
              <p class="mb-1" v-if="transaction.brapiIdChangeTransaction.traitBrapiIds && Object.keys(transaction.brapiIdChangeTransaction.traitBrapiIds).length > 0">
                {{ $t('transactionTypeBrapiIdsChangedTraitCount', Object.keys(transaction.brapiIdChangeTransaction.traitBrapiIds).length) }}
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
              <h5 class="mb-1"><IBiNodePlus :style="{ transform: 'rotate(270deg)' }" /> {{ $t('transactionTypeGermplasmAdded') }}</h5>

              <p class="mb-1">
                {{ transaction.trialGermplasmAddedTransactions.join(', ') }}
              </p>
            </b-list-group-item>

            <!-- PLOT COMMENT ADDED -->
            <b-list-group-item v-if="transaction.plotCommentAddedTransactions && Object.keys(transaction.plotCommentAddedTransactions).length > 0">
              <h5 class="mb-1">
                <IBiChatLeftTextFill /> {{ $t('transactionTypePlotCommentAdded') }}
              </h5>

              <p class="mb-1">
                {{ $t('transactionTypePlotCommentAddedCount', Object.keys(transaction.plotCommentAddedTransactions).length) }}
              </p>
            </b-list-group-item>

            <!-- PLOT COMMENT DELETED -->
            <b-list-group-item v-if="transaction.plotCommentDeletedTransactions && Object.keys(transaction.plotCommentDeletedTransactions).length > 0">
              <h5 class="mb-1">
                <IBiChatLeft /> {{ $t('transactionTypePlotCommentDeleted') }}
              </h5>

              <p class="mb-1">
                {{ $t('transactionTypePlotCommentDeletedCount', Object.keys(transaction.plotCommentDeletedTransactions).length) }}
              </p>
            </b-list-group-item>

            <!-- PLOT TRAIT DATA CHANGED -->
            <b-list-group-item v-if="transaction.plotTraitDataChangeTransactions && Object.keys(transaction.plotTraitDataChangeTransactions).length > 0">
              <h5 class="mb-1">
                <IBiUiChecksGrid /> {{ $t('transactionTypeTraitDataChanged') }}
              </h5>

              <p class="mb-1">
                {{ $t('transactionTypeTraitDataChangedCount', Object.keys(transaction.plotTraitDataChangeTransactions).length) }}
              </p>
            </b-list-group-item>

            <!-- PLOT GEOGRAPHY CHANGED -->
            <b-list-group-item v-if="transaction.plotGeographyChangeTransactions && Object.keys(transaction.plotGeographyChangeTransactions).length > 0">
              <h5 class="mb-1">
                <IBiGeo /> {{ $t('transactionTypePlotGeographyChanged') }}
              </h5>

              <p class="mb-1">
                {{ $t('transactionTypePlotGeographyChangedCount', Object.keys(transaction.plotGeographyChangeTransactions).length) }}
              </p>
            </b-list-group-item>

            <!-- PLOT MARKED CHANGED -->
            <b-list-group-item v-if="transaction.plotMarkedTransactions && Object.keys(transaction.plotMarkedTransactions).length > 0">
              <h5 class="mb-1">
                <IBiBookmarkStar /> {{ $t('transactionTypePlotMarkedChanged') }}
              </h5>

              <p class="mb-1">
                {{ $t('transactionTypePlotMarkedChangedCount', Object.keys(transaction.plotMarkedTransactions).length) }}
              </p>
            </b-list-group-item>

            <!-- TRIAL COMMENT ADDED -->
            <b-list-group-item v-if="transaction.trialCommentAddedTransactions && transaction.trialCommentAddedTransactions.length > 0">
              <h5 class="mb-1">
                <IBiChatLeftTextFill /> {{ $t('transactionTypeTrialCommentAdded') }}
              </h5>

              <p class="mb-1">
                {{ $t('transactionTypeTrialCommentAddedCount', Object.keys(transaction.trialCommentAddedTransactions).length) }}
              </p>
            </b-list-group-item>

            <!-- TRIAL COMMENT DELETED -->
            <b-list-group-item v-if="transaction.trialCommentDeletedTransactions && transaction.trialCommentDeletedTransactions.length > 0">
              <h5 class="mb-1">
                <IBiChatLeft /> {{ $t('transactionTypeTrialCommentDeleted') }}
              </h5>

              <p class="mb-1">
                {{ $t('transactionTypeTrialCommentDeletedCount', Object.keys(transaction.trialCommentDeletedTransactions).length) }}
              </p>
            </b-list-group-item>

            <!-- TRIAL EVENT ADDED -->
            <b-list-group-item v-if="transaction.trialEventAddedTransactions && transaction.trialEventAddedTransactions.length > 0">
              <h5 class="mb-1">
                <IBiFlagFill /> {{ $t('transactionTypeTrialEventAdded') }}
              </h5>

              <p class="mb-1">
                {{ $t('transactionTypeTrialEventAddedCount', Object.keys(transaction.trialEventAddedTransactions).length) }}
              </p>
            </b-list-group-item>

            <!-- TRIAL EVENT DELETED -->
            <b-list-group-item v-if="transaction.trialEventDeletedTransactions && transaction.trialEventDeletedTransactions.length > 0">
              <h5 class="mb-1">
                <IBiFlag /> {{ $t('transactionTypeTrialEventDeleted') }}
              </h5>

              <p class="mb-1">
                {{ $t('transactionTypeTrialEventDeletedCount', Object.keys(transaction.trialEventDeletedTransactions).length) }}
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
  </UseOnline>
</template>

<script>
import { mapStores } from 'pinia'
import { coreStore } from '@/store'

import TraitHeading from '@/components/TraitHeading.vue'

import { addTrial, deleteTrial, getTransactionForTrial } from '@/plugins/idb'
import { getTrialByCode, synchronizeTrial } from '@/plugins/api'

import IconBrapi from '@/components/icons/IconBrapi.vue'
import { UseOnline } from '@vueuse/components'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    TraitHeading,
    IconBrapi,
    UseOnline
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
  computed: {
    ...mapStores(coreStore)
  },
  methods: {
    askToSynchronize: function () {
      if (!this.trial.shareCodes.ownerCode && !this.trial.shareCodes.editorCode) {
        emitter.emit('show-loading', true)
        getTrialByCode((this.trial && this.trial.remoteUrl) ? this.trial.remoteUrl : null, this.trial.shareCodes.viewerCode)
          .then(result => {
            return deleteTrial(this.trial.localId)
              .then(() => {
                return addTrial(result)
              })
              .then(localId => {
                this.coreStore.setSelectedTrial(localId)
                emitter.emit('trials-updated')
                emitter.emit('show-loading', false)
                emitter.emit('plausible-event', { key: 'trial-synchronized', props: { count: this.trial.transactionCount } })
              })
              .finally(() => {
                emitter.emit('show-loading', false)
              })
          })
          .catch(error => {
            if (error.status === 404) {
              this.serverError = this.$t('apiErrorTrialNotFound')
            } else {
              this.serverError = this.$t('modalTextApiError', { error: JSON.stringify(error, Object.getOwnPropertyNames(error)) })
            }
          })
      } else {
        emitter.emit('show-confirm', {
          title: 'modalTitleSynchronizeTrial',
          message: 'modalTextSynchronizeTrial',
          okTitle: 'buttonYes',
          cancelTitle: 'buttonNo',
          okVariant: 'success',
          callback: (result) => {
            if (result) {
              this.synchronize()
            }
          }
        })
      }
    },
    synchronize: function () {
      emitter.emit('show-loading', true)
      synchronizeTrial((this.trial && this.trial.remoteUrl) ? this.trial.remoteUrl : null, this.trial.shareCodes.ownerCode || this.trial.shareCodes.editorCode, this.transaction)
        .then(result => {
          if (this.trial.group && this.trial.group.name) {
            result.group = {
              name: this.trial.group.name
            }
          }

          result.localId = this.trial.localId

          return deleteTrial(this.trial.localId)
            .then(() => {
              return addTrial(result)
            })
            .then(localId => {
              this.coreStore.setSelectedTrial(localId)
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
            // Handle missing trials
            emitter.emit('show-missing-trial', this.trial)
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
