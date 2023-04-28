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
              <h5 class="mb-1"><BIconCalendarDate /> {{ new Date(comment.timestamp).toLocaleDateString() }}</h5>
              <b-button size="sm" variant="danger" @click="deleteComment(comment)"><BIconTrash /> {{ $t('buttonDelete') }}</b-button>
            </div>

            <p class="mb-1">
              {{ comment.content }}
            </p>
          </b-list-group-item>
        </b-list-group>
        <b-pagination :per-page="perPage" :total-rows="totalCount" v-model="page" v-if="totalCount > perPage" />
      </div>
      <p v-else class="text-warning">{{ $t('modalTextPlotCommentNoData') }}</p>

      <b-button class="mt-2" @click="commentFormVisible = !commentFormVisible"><BIconChatRightQuoteFill /> {{ $t('buttonCreateComment') }}</b-button>

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
import { deletePlotComment, addPlotComment } from '@/plugins/idb'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconCalendarDate,
    BIconTrash,
    BIconChatRightQuoteFill,
    BIconPlusSquare
  },
  props: {
    cell: {
      type: Object,
      default: () => null
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
      this.$refs.plotCommentModal.show()
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.$nextTick(() => this.$refs.plotCommentModal.hide())
    },
    deleteComment: function (comment) {
      deletePlotComment(this.cell.trialId, this.cell.row, this.cell.column, comment)
        .then(() => {
          emitter.emit('plot-comments-changed', this.cell.row, this.cell.column, this.cell.trialId)
        })
    },
    createComment: function () {
      addPlotComment(this.cell.trialId, this.cell.row, this.cell.column, this.newCommentContent)
        .then(() => {
          this.newCommentContent = null
          this.commentFormVisible = false
          emitter.emit('plot-comments-changed', this.cell.row, this.cell.column, this.cell.trialId)
        })
    }
  }
}
</script>

<style scoped>
</style>
