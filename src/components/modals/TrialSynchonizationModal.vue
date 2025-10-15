<template>
  <v-dialog v-model="dialog" max-width="min(75vw, 720px)" scrollable>
    <UseOnline v-slot="{ isOnline }">
      <v-card :title="$t('modalTitleTrialSynchronization')">
        <template #text>
          <v-alert
            v-if="isOnline === false"
            color="error"
            icon="mdi-lan-disconnect"
            density="compact"
            :text="$t('modalTextNetworkUnavailableWarning')"
            variant="tonal"
            border="start"
          />

          <div v-if="trial">
            <p>{{ $t('modalTextTrialSynchronization') }}</p>

            <v-card v-if="transaction" :title="$t('modalTextTrialSynchronizationCount', trial.transactionCount || 0)">
              <v-list>
                <!-- TRIAL EDIT -->
                <v-list-item v-if="transaction.trialEditTransaction" prepend-icon="mdi-notebook-edit" :title="$t('transactionTypeTrialModified')">
                  <template #subtitle><span class="text-wrap">{{ $t('transactionTypeTrialModifiedText') }}</span></template>
                </v-list-item>
                <!-- TRAITS ADDED -->
                <v-list-item v-if="transaction.trialTraitAddedTransactions && transaction.trialTraitAddedTransactions.length > 0" prepend-icon="mdi-tag-plus" :title="$t('transactionTypeTraitsAdded')">
                  <template #subtitle>
                    <TraitSection :trait="trait" v-for="trait in transaction.trialTraitAddedTransactions" :key="`trait-${trait.id}`" />
                  </template>
                </v-list-item>
                <!-- PERSON ADDED -->
                <v-list-item v-if="transaction.trialPersonAddedTransactions && transaction.trialPersonAddedTransactions.length > 0" prepend-icon="mdi-account-plus" :title="$t('transactionTypePeopleAdded')">
                  <template #subtitle><span class="text-wrap">{{ $t('transactionTypePeopleAddedCount', Object.keys(transaction.trialPersonAddedTransactions).length) }}</span></template>
                </v-list-item>
                <!-- TRAIT DETAILS CHANGED -->
                <v-list-item v-if="transaction.traitChangeTransactions && transaction.traitChangeTransactions.length > 0" prepend-icon="mdi-tag-edit" :title="$t('transactionTypeTraitsModified')">
                  <template #subtitle><span class="text-wrap">{{ $t('transactionTypeTraitsModifiedCount', Object.keys(transaction.traitChangeTransactions).length) }}</span></template>
                </v-list-item>
                <!-- BRAPI IDS CHANGED -->
                <v-list-item v-if="transaction.brapiIdChangeTransaction && ((transaction.brapiIdChangeTransaction.germplasmBrapiIds && Object.keys(transaction.brapiIdChangeTransaction.germplasmBrapiIds).length > 0) || (transaction.brapiIdChangeTransaction.traitBrapiIds && Object.keys(transaction.brapiIdChangeTransaction.traitBrapiIds).length > 0))" prepend-icon="$brapi" :title="$t('transactionTypeBrapiIdsChanged')">
                  <template #subtitle>
                    <div class="text-wrap" v-if="transaction.brapiIdChangeTransaction.germplasmBrapiIds && Object.keys(transaction.brapiIdChangeTransaction.germplasmBrapiIds).length > 0">{{ $t('transactionTypeBrapiIdsChangedGermplasmCount', Object.keys(transaction.brapiIdChangeTransaction.germplasmBrapiIds).length) }}</div>
                    <div class="text-wrap" v-if="transaction.brapiIdChangeTransaction.traitBrapiIds && Object.keys(transaction.brapiIdChangeTransaction.traitBrapiIds).length > 0">{{ $t('transactionTypeBrapiIdsChangedTraitCount', Object.keys(transaction.brapiIdChangeTransaction.traitBrapiIds).length) }}</div>
                  </template>
                </v-list-item>
                <!-- BRAPI CONFIG CHANGED -->
                <v-list-item v-if="transaction.brapiConfigChangeTransaction && transaction.brapiConfigChangeTransaction.url !== undefined && transaction.brapiConfigChangeTransaction.url !== null && transaction.brapiConfigChangeTransaction.url !== ''" prepend-icon="$brapi" :title="$t('transactionTypeBrapiConfigChanged')" />
                <!-- PLOT DETAILS CHANGED -->
                <v-list-item v-if="transaction.plotDetailsChangeTransaction && Object.keys(transaction.plotDetailsChangeTransaction).length > 0" prepend-icon="mdi-table-edit" :title="$t('transactionTypePlotDetailsChanged')">
                  <template #subtitle><span class="text-wrap">{{ $t('transactionTypePlotDetailsChangedCount', Object.keys(transaction.plotDetailsChangeTransaction).length) }}</span></template>
                </v-list-item>
                <!-- GERMPLASM ADDED -->
                <v-list-item v-if="transaction.trialGermplasmAddedTransactions && transaction.trialGermplasmAddedTransactions.length > 0" prepend-icon="mdi-table-row-plus-after" :title="$t('transactionTypeGermplasmAdded')">
                  <template #subtitle><span class="text-wrap">{{ transaction.trialGermplasmAddedTransactions.join(', ') }}</span></template>
                </v-list-item>
                <!-- PLOT COMMENT ADDED -->
                <v-list-item v-if="transaction.plotCommentAddedTransactions && Object.keys(transaction.plotCommentAddedTransactions).length > 0" prepend-icon="mdi-comment-plus" :title="$t('transactionTypePlotCommentAdded')">
                  <template #subtitle><span class="text-wrap">{{ $t('transactionTypePlotCommentAddedCount', Object.keys(transaction.plotCommentAddedTransactions).length) }}</span></template>
                </v-list-item>
                <!-- PLOT COMMENT DELETED -->
                <v-list-item v-if="transaction.plotCommentDeletedTransactions && Object.keys(transaction.plotCommentDeletedTransactions).length > 0" prepend-icon="mdi-comment-minus" :title="$t('transactionTypePlotCommentDeleted')">
                  <template #subtitle><span class="text-wrap">{{ $t('transactionTypePlotCommentDeletedCount', Object.keys(transaction.plotCommentAddedTransactions).length) }}</span></template>
                </v-list-item>
                <!-- PLOT TRAIT DATA CHANGED -->
                <v-list-item v-if="transaction.plotTraitDataChangeTransactions && Object.keys(transaction.plotTraitDataChangeTransactions).length > 0" prepend-icon="mdi-text-box-edit" :title="$t('transactionTypeTraitDataChanged')">
                  <template #subtitle><span class="text-wrap">{{ $t('transactionTypeTraitDataChangedCount', Object.keys(transaction.plotTraitDataChangeTransactions).length) }}</span></template>
                </v-list-item>
                <!-- PLOT GEOGRAPHY CHANGED -->
                <v-list-item v-if="transaction.plotGeographyChangeTransactions && Object.keys(transaction.plotGeographyChangeTransactions).length > 0" prepend-icon="mdi-vector-polyline-edit" :title="$t('transactionTypePlotGeographyChanged')">
                  <template #subtitle><span class="text-wrap">{{ $t('transactionTypePlotGeographyChangedCount', Object.keys(transaction.plotGeographyChangeTransactions).length) }}</span></template>
                </v-list-item>
                <!-- PLOT MARKED CHANGED -->
                <v-list-item v-if="transaction.plotMarkedTransactions && Object.keys(transaction.plotMarkedTransactions).length > 0" prepend-icon="mdi-bookmark" :title="$t('transactionTypePlotMarkedChanged')">
                  <template #subtitle><span class="text-wrap">{{ $t('transactionTypePlotMarkedChangedCount', Object.keys(transaction.plotMarkedTransactions).length) }}</span></template>
                </v-list-item>
                <!-- TRIAL COMMENT ADDED -->
                <v-list-item v-if="transaction.trialCommentAddedTransactions && Object.keys(transaction.trialCommentAddedTransactions).length > 0" prepend-icon="mdi-comment-plus" :title="$t('transactionTypeTrialCommentAdded')">
                  <template #subtitle><span class="text-wrap">{{ $t('transactionTypeTrialCommentAddedCount', Object.keys(transaction.trialCommentAddedTransactions).length) }}</span></template>
                </v-list-item>
                <!-- TRIAL COMMENT DELETED -->
                <v-list-item v-if="transaction.trialCommentDeletedTransactions && Object.keys(transaction.trialCommentDeletedTransactions).length > 0" prepend-icon="mdi-comment-minus" :title="$t('transactionTypeTrialCommentDeleted')">
                  <template #subtitle><span class="text-wrap">{{ $t('transactionTypeTrialCommentDeletedCount', Object.keys(transaction.trialCommentDeletedTransactions).length) }}</span></template>
                </v-list-item>
                <!-- TRIAL EVENT ADDED -->
                <v-list-item v-if="transaction.trialEventAddedTransactions && transaction.trialEventAddedTransactions.length > 0" prepend-icon="mdi-flag-plus" :title="$t('transactionTypeTrialEventAdded')">
                  <template #subtitle><span class="text-wrap">{{ $t('transactionTypeTrialEventAddedCount', Object.keys(transaction.trialEventAddedTransactions).length) }}</span></template>
                </v-list-item>
                <!-- TRIAL EVENT DELETED -->
                <v-list-item v-if="transaction.trialEventDeletedTransactions && transaction.trialEventDeletedTransactions.length > 0" prepend-icon="mdi-flag-minus" :title="$t('transactionTypeTrialEventDeleted')">
                  <template #subtitle><span class="text-wrap">{{ $t('transactionTypeTrialEventDeletedCount', Object.keys(transaction.trialEventDeletedTransactions).length) }}</span></template>
                </v-list-item>
              </v-list>

              <template #actions v-if="(trial.transactionCount || 0) > 0">
                <v-btn color="error" @click="deleteLocalChanges" variant="tonal" prepend-icon="mdi-delete" :text="$t('buttonDeleteLocalChanges')" />
              </template>
            </v-card>

            <div v-else>
              <p v-html="$t('modalTextTrialSynchronizationNoData')" :class="trial.hasRemoteUpdate ? null : 'text-warning'" />

              <v-alert
                v-if="trial.hasRemoteUpdate"
                color="info"
                icon="mdi-cloud-download"
                density="compact"
                :text="$t('modalTextTrialSynchronizationRemoteChanges')"
                variant="tonal"
                border="start"
              />
            </div>

            <p class="text-error mt-3 mb-0" v-if="serverError"><span v-html="serverError" /></p>
          </div>
        </template>

        <v-card-actions>
          <v-spacer />
          <v-btn :text="$t('buttonCancel')" prepend-icon="mdi-cancel" @click="hide" />
          <v-btn :text="$t('buttonSynchronize')" prepend-icon="mdi-database-sync" @click="askToSynchronize" :disabled="isOnline === false" color="primary" variant="tonal" />
        </v-card-actions>
      </v-card>
    </UseOnline>
  </v-dialog>
</template>

<script setup lang="ts">
  import { addTrial, deleteTrial, getTransactionForTrial } from '@/plugins/idb'
  import type { RemoteConfig, TrialPlus } from '@/plugins/types/client'
  import type { Transaction } from '@/plugins/types/gridscore'
  import { UseOnline } from '@vueuse/components'
  import emitter from 'tiny-emitter/instance'
  import TraitSection from '@/components/trait/TraitSection.vue'
  import { useI18n } from 'vue-i18n'
  import { getTrialByCode, synchronizeTrial } from '@/plugins/api'
  import { coreStore } from '@/stores/app'

  const { t } = useI18n()

  const store = coreStore()

  const trial = ref<TrialPlus>()
  const transaction = ref<Transaction>()
  const serverError = ref<string>()

  const dialog = ref(false)

  function show (t: TrialPlus) {
    trial.value = t
    serverError.value = undefined

    getTransactionForTrial(t.localId || '')
      .then(t => {
        transaction.value = t
      })

    nextTick(() => {
      dialog.value = true
    })
  }
  function hide () {
    dialog.value = false
  }

  function askToSynchronize () {
    if (trial.value && !trial.value.shareCodes?.ownerCode && !trial.value.shareCodes?.editorCode) {
      loadTrial(trial.value.shareCodes?.viewerCode || '')
    } else {
      emitter.emit('show-confirm', {
        title: t('modalTitleSynchronizeTrial'),
        message: t('modalTextSynchronizeTrial'),
        okTitle: t('genericYes'),
        cancelTitle: t('genericNo'),
        okVariant: 'success',
        callback: (result: boolean) => {
          if (result === true) {
            synchronize()
          }
        },
      })
    }
  }

  function synchronize () {
    let remoteConfig: RemoteConfig | undefined = undefined
    const tr = trial.value
    if (!tr) {
      return
    }

    emitter.emit('show-loading', true)

    if (tr.remoteUrl) {
      remoteConfig = {
        remoteUrl: tr.remoteUrl,
        token: tr.remoteToken || undefined,
      }
    }

    synchronizeTrial(remoteConfig, trial.value?.shareCodes ? (trial.value?.shareCodes.ownerCode || trial.value?.shareCodes.editorCode || trial.value?.shareCodes.viewerCode) : '', transaction.value)
      .then(result => {
        if (!result) {
          return
        }

        if (tr.group && tr.group.name) {
          result.group = {
            name: tr.group.name,
          }
        }

        if (remoteConfig) {
          result.remoteUrl = remoteConfig.remoteUrl || undefined
          result.remoteToken = remoteConfig.token || undefined
        }

        result.localId = tr.localId

        return deleteTrial(tr.localId || '')
          .then(() => {
            return addTrial(result)
          })
          .then(localId => {
            store.setSelectedTrial(localId)
            emitter.emit('trials-updated')
            emitter.emit('show-loading', false)
            emitter.emit('plausible-event', { key: 'trial-synchronized', props: { count: tr.transactionCount } })
          })
          .finally(() => {
            hide()
            emitter.emit('show-loading', false)
          })
      })
      .catch(err => {
        console.log(err)
        if (err && err.status === 404) {
          // Handle missing trials
          emitter.emit('show-missing-trial', tr)
        }
      })
      .finally(() => {
        emitter.emit('show-loading', false)
      })
  }

  function deleteLocalChanges () {
    emitter.emit('show-confirm', {
      title: t('modalTitleDeleteLocalChanges'),
      message: t('modalTextDeleteLocalChanges'),
      okTitle: t('genericYes'),
      cancelTitle: t('genericNo'),
      okVariant: 'error',
      callback: (result: boolean) => {
        if (result === true) {
          loadTrial(trial.value?.shareCodes ? (trial.value?.shareCodes.ownerCode || trial.value?.shareCodes.editorCode || trial.value?.shareCodes.viewerCode) : '')
        }
      },
    })
  }

  function loadTrial (shareCode: string) {
    let remoteConfig: RemoteConfig | undefined = undefined

    const tr = trial.value
    if (!tr) {
      return
    }

    emitter.emit('show-loading', true)

    if (tr.remoteUrl) {
      remoteConfig = {
        remoteUrl: tr.remoteUrl,
        token: tr.remoteToken || undefined,
      }
    }

    getTrialByCode(remoteConfig, shareCode)
      .then(result => {
        return deleteTrial(tr.localId || '')
          .then(() => {
            return addTrial(result)
          })
          .then(localId => {
            store.setSelectedTrial(localId)
            emitter.emit('trials-updated')
            emitter.emit('show-loading', false)
            emitter.emit('plausible-event', { key: 'trial-synchronized', props: { count: tr.transactionCount } })
          })
          .finally(() => {
            emitter.emit('show-loading', false)
            hide()
          })
      })
      .catch(error => {
        if (error.status === 404) {
          serverError.value = t('apiErrorTrialNotFound')
        } else {
          serverError.value = t('modalTextApiError', { error: JSON.stringify(error, Object.getOwnPropertyNames(error)) })
        }
      })
  }

  onMounted(() => {
    emitter.on('synchronize-trial', show)
  })

  onBeforeUnmount(() => {
    emitter.off('synchronize-trial', show)
  })

  defineExpose({
    show,
    hide,
  })
</script>
