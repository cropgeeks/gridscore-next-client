<template>
  <b-modal :title="$t('modalTitlePlotComments')"
           :ok-title="$t('buttonClose')"
           ok-only
           no-fade
           scrollable
           @hidden="$emit('hidden')"
           size="lg"
           ref="plotCommentsModal">
    <div v-if="trial">
      <p>{{ $t('modalTextPlotComments') }}</p>

      <b-form @submit.prevent v-if="totalCount > 0">
        <b-row>
          <b-col cols=6>
            <b-form-group :label="$t('formLabelPlotCommentsOrderBy')" label-for="order-by">
              <b-form-select id="order-by" v-model="orderBy" :options="orderByOptions" />
            </b-form-group>
          </b-col>
          <b-col cols=6>
            <b-form-group :label="$t('formLabelPlotCommentsSortOrder')" label-for="sort-order">
              <b-button-group class="d-flex flex-wrap">
                <b-button @click="sortOrder = 'asc'" :pressed="sortOrder === 'desc'">
                  <IBiSortDownAlt /> {{ $t('formCheckboxSortOrderAscending') }}
                </b-button>
                <b-button @click="sortOrder = 'desc'" :pressed="sortOrder === 'asc'">
                  <IBiSortDown /> {{ $t('formCheckboxSortOrderDescending') }}
                </b-button>
              </b-button-group>
            </b-form-group>
          </b-col>
          <b-col cols=6>
            <b-form-group :label="$t('formLabelPlotCommentsSearch')" label-for="search">
              <b-input-group>
                <b-form-input trim id="search" ref="searchInput" type="search" v-model.trim="searchTerm" />
              </b-input-group>
            </b-form-group>
          </b-col>
        </b-row>

        <b-pagination class="my-3" :per-page="perPage" :total-rows="totalCount" v-model="page" v-if="totalCount > perPage" />
        <b-list-group>
          <b-list-group-item class="flex-column align-items-start" v-for="comment in visibleComments" :key="`cell-comment-${comment.row}-${comment.column}-${comment.comment.timestamp}`">
            <div class="d-flex w-100 justify-content-between align-items-center">
              <h5 class="mb-1"><IBiCalendarDate /> {{ new Date(comment.comment.timestamp).toLocaleDateString() }}</h5>
              <b-button size="sm" variant="danger" v-if="trial.editable" @click="deleteComment(comment)"><IBiTrash /> {{ $t('buttonDelete') }}</b-button>
            </div>

            <b-row>
              <b-col cols=6 class="mb-1">
                <IBiFlower1 /> <span>{{ $t('widgetPlotCommentGermplasm', { germplasm: comment.germplasm }) }}</span>
              </b-col>
              <b-col cols=6 class="mb-1">
                <IBiBorderStyle /> <span>{{ $t('widgetPlotCommentRep', { rep: comment.rep || 'N/A' }) }}</span>
              </b-col>
              <b-col cols=6 class="mb-1">
                <IBiLayoutThreeColumns :style="{ transform: 'rotate(90deg)' }" /> <span>{{ $t('widgetPlotCommentRow', { row: comment.displayRow }) }}</span>
              </b-col>
              <b-col cols=6 class="mb-1">
                <IBiLayoutThreeColumns /> <span>{{ $t('widgetPlotCommentColumn', { column: comment.displayColumn }) }}</span>
              </b-col>
            </b-row>

            <p class="mb-1">
              {{ comment.comment.content }}
            </p>
          </b-list-group-item>
        </b-list-group>
        <b-pagination class="my-3" :per-page="perPage" :total-rows="totalCount" v-model="page" v-if="totalCount > perPage" />
      </b-form>
      <p v-else class="text-warning">{{ $t('modalTextPlotCommentNoData') }}</p>
    </div>
  </b-modal>
</template>

<script>
import { deletePlotComment } from '@/plugins/idb'
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'

import emitter from 'tiny-emitter/instance'

import { getTrialDataCached } from '@/plugins/datastore'

export default {
  props: {
    trial: {
      type: Object,
      default: () => null
    }
  },
  data: function () {
    return {
      page: 1,
      perPage: 5,
      allComments: [],
      orderBy: 'timestamp',
      sortOrder: 'desc',
      searchTerm: null
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeSelectedTrial'
    ]),
    orderByOptions: function () {
      return [{
        value: 'timestamp',
        text: this.$t('widgetPlotCommentOrderByTimestamp')
      }, {
        value: 'germplasm',
        text: this.$t('widgetPlotCommentOrderByGermplasm')
      }, {
        value: 'row',
        text: this.$t('widgetPlotCommentOrderByRow')
      }, {
        value: 'column',
        text: this.$t('widgetPlotCommentOrderByColumn')
      }]
    },
    totalCount: function () {
      if (this.allComments) {
        return this.allComments.length
      } else {
        return 0
      }
    },
    visibleComments: function () {
      if (this.allComments) {
        let copy = this.allComments.concat()
        copy.sort((a, b) => {
          let result = 0
          switch (this.orderBy) {
            case 'timestamp':
              result = a.comment.timestamp.localeCompare(b.comment.timestamp)
              break
            case 'germplasm':
              result = a.germplasm.localeCompare(b.germplasm)
              break
            case 'row':
              result = a.displayRow - b.displayRow
              break
            case 'column':
              result = a.displayColumn - b.displayColumn
              break
          }

          if (this.sortOrder !== 'asc') {
            result = -result
          }

          return result
        })
        copy = copy.filter(c => {
          if (this.searchTerm && (this.searchTerm !== '')) {
            const lower = this.searchTerm.toLowerCase()
            // Check if the display name matches
            if (c.displayName.toLowerCase().includes(lower)) {
              return true
            }
            // Check if the comment content
            if (c.comment.content.toLowerCase().includes(lower)) {
              return true
            }

            return false
          } else {
            return true
          }
        })
        return copy.slice((this.page - 1) * this.perPage, this.page * this.perPage)
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
      this.update()

      this.$refs.plotCommentsModal.show()
    },
    update: function () {
      this.page = 1
      this.searchTerm = null
      const data = getTrialDataCached()

      if (data) {
        const allComments = []
        Object.values(data).forEach(c => {
          if (c.comments) {
            c.comments.forEach(com => {
              allComments.push({
                trialId: this.storeSelectedTrial,
                germplasm: c.germplasm,
                rep: c.rep,
                displayName: c.displayName,
                row: c.row,
                column: c.column,
                displayRow: c.displayRow,
                displayColumn: c.displayColumn,
                comment: com
              })
            })
          }
        })

        this.allComments = allComments
      }
    },
    /**
     * Hides the modal dialog
     */
    hide: function () {
      this.allComments = []
      this.$nextTick(() => this.$refs.plotCommentsModal.hide())
    },
    deleteComment: function (comment) {
      this.allComments = this.allComments.filter(c => c.row !== comment.row || c.column !== comment.column || c.comment.timestamp !== comment.comment.timestamp)
      // Make sure to jump back a page when we hit the threshold
      if ((this.page - 1) * this.perPage >= this.allComments.length) {
        this.page = Math.max(1, this.page - 1)
      }

      deletePlotComment(comment.trialId, comment.row, comment.column, comment.comment)
        .then(() => {
          emitter.emit('plot-comments-changed', comment.row, comment.column, comment.trialId)
          emitter.emit('plausible-event', { key: 'plot-comment', props: { type: 'deleted' } })
        })
    }
  }
}
</script>

<style scoped>
</style>
