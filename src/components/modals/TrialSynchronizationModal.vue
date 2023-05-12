<template>
  <b-modal :title="$t('modalTitleTrialSynchronization')"
           :ok-title="$t('Synchronize')"
           :cancel-title="$t('buttonCancel')"
           @ok.prevent="synchronize"
           no-fade
           size="lg"
           ref="trialSynchronizationModal">
    <div v-if="trial">
      <div v-if="transactions && transactions.length > 0">
        <h4><strong>{{ $tc('modalTextTrialSynchronizationCount', transactions.length) }}</strong></h4>

        <b-list-group>
          <b-list-group-item v-for="tr in visibleTransactions" :key="`transaction-${tr.timestamp}`">
            <template v-if="tr.operation === 'TRIAL_TRAITS_ADDED'">
              <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">{{ $t(TRANSACTION_TYPES[tr.operation]) }}</h5>
                <small>{{ new Date(tr.timestamp).toLocaleString() }}</small>
              </div>

              <p class="mb-1">
                <TraitHeading :trait="trait" v-for="trait in tr.content" :key="`trait-${trait.id}`" />
              </p>
            </template>
            <template v-if="tr.operation === 'TRAIT_DATA_CHANGED'">
              <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">{{ $t(TRANSACTION_TYPES[tr.operation]) }}</h5>
                <small>{{ new Date(tr.timestamp).toLocaleString() }}</small>
              </div>

              <p class="mb-1">
                {{ $tc('modalTextTrialSynchronizationMeasurementCount', tr.content.measurements.length) }}
              </p>
            </template>
            <template v-if="tr.operation === 'PLOT_COMMENT_ADDED' || tr.operation === 'PLOT_COMMENT_DELETED' || tr.operation === 'TRIAL_COMMENT_ADDED' || tr.operation === 'TRIAL_COMMENT_DELETED' || tr.operation === 'PLOT_MARKED_CHANGED'">
              <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">{{ $t(TRANSACTION_TYPES[tr.operation]) }}</h5>
                <small>{{ new Date(tr.timestamp).toLocaleString() }}</small>
              </div>
            </template>
          </b-list-group-item>
        </b-list-group>

        <b-pagination :per-page="perPage" :total-rows="totalCount" v-model="page" v-if="totalCount > perPage" />
      </div>
      <div v-else>
        <p v-html="$t('modalTextTrialSynchronizationNoData')" />
      </div>
    </div>
  </b-modal>
</template>

<script>
import TraitHeading from '@/components/TraitHeading'

import { addTrial, deleteTrial, getTransactionsForTrial } from '@/plugins/idb'
import { TRANSACTION_TYPES } from '@/plugins/constants'
import { synchronizeTrial } from '@/plugins/api'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
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
      TRANSACTION_TYPES,
      transactions: [],
      page: 1,
      perPage: 5
    }
  },
  computed: {
    totalCount: function () {
      if (this.transactions) {
        return this.transactions.length
      } else {
        return 0
      }
    },
    visibleTransactions: function () {
      return this.transactions.slice((this.page - 1) * this.perPage, this.page * this.perPage)
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
            synchronizeTrial(this.trial.shareCodes.ownerCode || this.trial.shareCodes.editorCode, this.transactions)
              .then(result => {
                result.localId = this.trial.localId

                deleteTrial(this.trial.localId)
                  .then(() => {
                    return addTrial(result)
                  })
                  .then(localId => {
                    this.$store.dispatch('setSelectedTrial', localId)
                    emitter.emit('trials-updated')
                    emitter.emit('show-loading', false)
                    emitter.emit('plausible-event', { key: 'trial-synchronized', props: { count: this.transactions.length } })
                  })
                  .catch(() => {
                    emitter.emit('show-loading', false)
                  })
              })
              .catch(() => {
                emitter.emit('show-loading', false)
              })
          }
        })
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      getTransactionsForTrial(this.trial.localId)
        .then(transactions => {
          transactions.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
          this.transactions = transactions
        })

      this.$refs.trialSynchronizationModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.transactions = []
      this.$nextTick(() => this.$refs.trialSynchronizationModal.hide())
    }
  }
}
</script>

<style scoped>
</style>
