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
              <h5 class="mb-1"><BIconCalendarDate /> {{ new Date(comment.timestamp).toLocaleDateString() }}</h5>
              <b-button size="sm" variant="danger" @click="deleteComment(comment)" v-if="trial.editable"><BIconTrash /> {{ $t('buttonDelete') }}</b-button>
            </div>

            <p class="mb-1">
              {{ comment.content }}
            </p>
          </b-list-group-item>
        </b-list-group>
        <b-pagination :per-page="perPage" :total-rows="totalCount" v-model="page" v-if="totalCount > perPage" />
      </div>
      <p v-else class="text-warning">{{ $t('modalTextTrialCommentNoData') }}</p>

      <b-button class="mt-2" @click="commentFormVisible = !commentFormVisible" v-if="trial.editable"><BIconChatRightQuoteFill /> {{ $t('buttonCreateComment') }}</b-button>

      <b-collapse v-model="commentFormVisible" class="mt-2">
        <b-form-group :label="$t('formLabelCommentContent')" :description="$t('formDescriptionCommentContent')" label-for="comment-content">
          <b-form-textarea id="comment-content" v-model="newCommentContent" :rows="5" />
        </b-form-group>

        <b-button :disabled="!newCommentContent || (newCommentContent === '')" variant="primary" @click="createComment"><BIconPlusSquare /> {{ $t('buttonAdd') }}</b-button>
      </b-collapse>
    </div>
  </b-modal>
</template>

<script>
import { BIconCalendarDate, BIconTrash, BIconChatRightQuoteFill, BIconPlusSquare } from 'bootstrap-vue'
import { getTrialById, deleteTrialComment, addTrialComment } from '@/plugins/idb'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconCalendarDate,
    BIconTrash,
    BIconChatRightQuoteFill,
    BIconPlusSquare
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
      this.update().then(() => this.$refs.trialCommentModal.show())
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.trialCommentModal.hide())
    },
    deleteComment: function (comment) {
      deleteTrialComment(this.trial.localId, comment)
        .then(() => {
          emitter.emit('trial-properties-changed', this.trial.localId)
          this.update()
        })
    },
    createComment: function () {
      addTrialComment(this.trial.localId, this.newCommentContent)
        .then(() => {
          this.newCommentContent = null
          this.commentFormVisible = false
          emitter.emit('trial-properties-changed', this.trial.localId)
          this.update()
        })
    }
  }
}
</script>

<style scoped>
</style>
