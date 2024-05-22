<template>
  <b-modal :title="$t('modalTitlePlotComment')"
           :ok-title="$t('buttonClose')"
           ok-only
           no-fade
           @hidden="$emit('hidden')"
           size="md"
           ref="plotCommentModal">
    <div v-if="cell">
      <p>{{ $t('modalTextPlotComment') }}</p>

      <div v-if="totalCount > 0">
        <b-pagination :per-page="perPage" :total-rows="totalCount" v-model="page" v-if="totalCount > perPage" />
        <b-list-group>
          <b-list-group-item class="flex-column align-items-start" v-for="comment in visibleComments" :key="`cell-comment-${comment.timestamp}`">
            <div class="d-flex w-100 justify-content-between align-items-center">
              <h5 class="mb-1"><IBiCalendarDate /> {{ new Date(comment.timestamp).toLocaleDateString() }}</h5>
              <b-button size="sm" variant="danger" v-if="editable" @click="deleteComment(comment)"><IBiTrash /> {{ $t('buttonDelete') }}</b-button>
            </div>

            <p class="mb-1">
              {{ comment.content }}
            </p>
          </b-list-group-item>
        </b-list-group>
        <b-pagination :per-page="perPage" :total-rows="totalCount" v-model="page" v-if="totalCount > perPage" />
      </div>
      <p v-else class="text-warning">{{ $t('modalTextPlotCommentNoData') }}</p>

      <b-button class="mt-2" @click="commentFormVisible = !commentFormVisible" v-if="editable"><IBiChatRightQuoteFill /> {{ $t('buttonCreateComment') }}</b-button>

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
import { deletePlotComment, addPlotComment } from '@/plugins/idb'

import emitter from 'tiny-emitter/instance'

export default {
  components: {
    SpeechRecognitionTextarea
  },
  props: {
    cell: {
      type: Object,
      default: () => null
    },
    editable: {
      type: Boolean,
      default: true
    }
  },
  data: function () {
    return {
      page: 1,
      perPage: 5,
      newCommentContent: null,
      commentFormVisible: false
    }
  },
  computed: {
    totalCount: function () {
      if (this.cell && this.cell.comments) {
        return this.cell.comments.length
      } else {
        return 0
      }
    },
    visibleComments: function () {
      if (this.cell && this.cell.comments) {
        return this.cell.comments.slice((this.page - 1) * this.perPage, this.page * this.perPage)
      } else {
        return []
      }
    }
  },
  methods: {
    /**
     * Shows and resets modal dialog
     */
    show: function () {
      this.commentFormVisible = false
      this.$refs.plotCommentModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.commentFormVisible = false
      this.$nextTick(() => this.$refs.plotCommentModal.hide())
    },
    updateComment: function (newValue) {
      this.newCommentContent = newValue
    },
    deleteComment: function (comment) {
      deletePlotComment(this.cell.trialId, this.cell.row, this.cell.column, comment)
        .then(() => {
          emitter.emit('plot-comments-changed', this.cell.row, this.cell.column, this.cell.trialId)
          emitter.emit('plausible-event', { key: 'plot-comment', props: { type: 'deleted' } })
        })
    },
    createComment: function () {
      addPlotComment(this.cell.trialId, this.cell.row, this.cell.column, this.newCommentContent)
        .then(() => {
          this.$refs.input.reset()
          this.newCommentContent = null
          this.commentFormVisible = false
          emitter.emit('plot-comments-changed', this.cell.row, this.cell.column, this.cell.trialId)
          emitter.emit('plausible-event', { key: 'plot-comment', props: { type: 'added' } })
        })
    }
  }
}
</script>

<style scoped>
</style>
