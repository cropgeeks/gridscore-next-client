<template>
  <b-modal :title="$t('modalTitleTrialComment')"
           :ok-title="$t('buttonClose')"
           ok-only
           no-fade
           @hidden="$emit('hidden')"
           size="md"
           ref="trialCommentModal">
    <div v-if="trial">
      <p>{{ $t('modalTextTrialComment') }}</p>

      <div v-if="totalCount > 0">
        <b-pagination :per-page="perPage" :total-rows="totalCount" v-model="page" v-if="totalCount > perPage" />
        <b-list-group>
          <b-list-group-item class="flex-column align-items-start" v-for="comment in visibleComments" :key="`trial-comment-${comment.timestamp}`">
            <div class="d-flex w-100 justify-content-between align-items-center">
              <h5 class="mb-1"><IBiCalendarDate /> {{ new Date(comment.timestamp).toLocaleDateString() }}</h5>
              <b-button size="sm" variant="danger" @click="deleteComment(comment)" v-if="trial.editable"><IBiTrash /> {{ $t('buttonDelete') }}</b-button>
            </div>

            <p class="mb-1">
              {{ comment.content }}
            </p>
          </b-list-group-item>
        </b-list-group>
        <b-pagination :per-page="perPage" :total-rows="totalCount" v-model="page" v-if="totalCount > perPage" />
      </div>
      <p v-else class="text-warning">{{ $t('modalTextTrialCommentNoData') }}</p>

      <b-button class="mt-2" @click="commentFormVisible = !commentFormVisible" v-if="trial.editable"><IBiChatRightQuoteFill /> {{ $t('buttonCreateComment') }}</b-button>

      <b-collapse v-model="commentFormVisible" class="mt-2" @shown="$refs.input.focus()">
        <b-form-group :label="$t('formLabelCommentContent')" :description="$t('formDescriptionCommentContent')" label-for="comment-content">
          <SpeechRecognitionTextarea id="comment-content" :rows="5" :tooltip="$t('tooltipDataEntryCommentMicrophone')" ref="input" @content-changed="updateComment" />
        </b-form-group>

        <b-button :disabled="!newCommentContent || (newCommentContent === '')" variant="primary" @click="createComment"><IBiPlusSquare /> {{ $t('buttonAdd') }}</b-button>
      </b-collapse>
    </div>
  </b-modal>
</template>

<script>
import SpeechRecognitionTextarea from '@/components/SpeechRecognitionTextarea.vue'
import { getTrialById, deleteTrialComment, addTrialComment } from '@/plugins/idb'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    SpeechRecognitionTextarea
  },
  props: {
    trialId: {
      type: String,
      default: null
    }
  },
  data: function () {
    return {
      page: 1,
      perPage: 5,
      trial: null,
      newCommentContent: null,
      commentFormVisible: false
    }
  },
  computed: {
    totalCount: function () {
      if (this.trial && this.trial.comments) {
        return this.trial.comments.length
      } else {
        return 0
      }
    },
    visibleComments: function () {
      if (this.trial && this.trial.comments) {
        return this.trial.comments.slice((this.page - 1) * this.perPage, this.page * this.perPage)
      } else {
        return []
      }
    }
  },
  methods: {
    updateComment: function (newValue) {
      this.newCommentContent = newValue
    },
    update: function () {
      return getTrialById(this.trialId)
        .then(trial => {
          this.trial = trial
        })
    },
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.commentFormVisible = false
      this.update().then(() => this.$refs.trialCommentModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.commentFormVisible = false
      this.$nextTick(() => this.$refs.trialCommentModal.hide())
    },
    deleteComment: function (comment) {
      deleteTrialComment(this.trial.localId, comment)
        .then(() => {
          emitter.emit('trial-properties-changed', this.trial.localId)
          emitter.emit('plausible-event', { key: 'trial-comment', props: { type: 'deleted' } })
          this.update()
        })
    },
    createComment: function () {
      addTrialComment(this.trial.localId, this.newCommentContent)
        .then(() => {
          this.$refs.input.reset()
          this.newCommentContent = null
          this.commentFormVisible = false
          emitter.emit('trial-properties-changed', this.trial.localId)
          emitter.emit('plausible-event', { key: 'trial-comment', props: { type: 'added' } })
          this.update()
        })
    }
  }
}
</script>

<style scoped>
</style>
