<template>
  <v-dialog v-model="dialog" max-width="min(90vw, 1024px)" scrollable>
    <v-card :title="$t('modalTitlePlotComments')">
      <template #text>
        <p>{{ $t('modalTextPlotComments') }}</p>

        <v-data-iterator
          :items="comments"
          item-value="timestamp"
          :items-per-page="perPage"
          :page="page"
          :search="searchTerm"
          :sort-by="sortBy"
          :custom-filter="filter"
        >
          <template #header="{ pageCount }">
            <v-row>
              <v-col cols="12" lg="6">
                <v-text-field
                  v-model="searchTerm"
                  type="search"
                  autocomplete="off"
                  :prepend-inner-icon="mdiMagnify"
                  :placeholder="$t('formLabelPlotCommentsSearch')"
                  clearable
                  hide-details
                />
              </v-col>
              <v-col cols="12" lg="6">
                <v-select v-model="sortField" :items="sortOptions" class="mb-3" :label="$t('formLabelTrialSelectorOrderBy')" hide-details />

                <v-btn-toggle v-model="sortDescending" variant="tonal" color="primary" class="d-flex">
                  <v-btn class="flex-grow-1" :prepend-icon="mdiSortAscending" :value="false" :text="$t('formCheckboxSortOrderAscending')">
                    <template #append><v-icon :icon="mdiCheck" v-if="sortDescending === false" /></template>
                  </v-btn>
                  <v-btn class="flex-grow-1" :value="true" :text="$t('formCheckboxSortOrderDescending')">
                    <template #prepend><v-icon :icon="mdiSortDescending" style="transform: scaleY(-1);" /></template>
                    <template #append><v-icon :icon="mdiCheck" v-if="sortDescending === true" /></template>
                  </v-btn>
                </v-btn-toggle>
              </v-col>
            </v-row>

            <v-pagination v-model="page" :length="pageCount" v-if="pageCount > 1" />
          </template>

          <template #default="{ items }">
            <template
              v-for="(comment, i) in items"
              :key="`comment-list-entry-${i}`"
            >
              <v-card
                :prepend-icon="mdiCalendar"
                :title="new Date(comment.raw.comment.timestamp).toLocaleDateString()"
                class="plot-comment mb-3"
              >
                <template #append>
                  <v-btn size="small" :icon="mdiDelete" color="error" v-if="trial.editable" @click="deleteComment(comment.raw)" />
                </template>

                <template #text>
                  <PlotInformation :cell="comment.raw.cell" :i18n-params="i18nParams" />
                </template>

                <v-list>
                  <v-list-item :title="$t('formLabelCommentContent')" :subtitle="comment.raw.comment.content" />
                </v-list>
              </v-card>
            </template>
          </template>

          <template #footer="{ pageCount }">
            <v-pagination v-model="page" :length="pageCount" v-if="pageCount > 1" />
          </template>
        </v-data-iterator>
      </template>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('buttonClose')" @click="hide" color="primary" variant="tonal" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { getTrialDataCached } from '@/plugins/datastore'
  import { deletePlotComment } from '@/plugins/idb'
  import type { MiniCell, TrialPlus } from '@/plugins/types/client'
  import type { Comment } from '@/plugins/types/gridscore'
  import { mdiCalendar, mdiCheck, mdiDelete, mdiMagnify, mdiSortAscending, mdiSortDescending } from '@mdi/js'
  import { useI18n } from 'vue-i18n'
  import type { FilterMatch, InternalItem } from 'vuetify'
  import type { SortItem } from 'vuetify/lib/components/VDataTable/composables/sort.mjs'

  import emitter from 'tiny-emitter/instance'
  import { getI18nParams } from '@/plugins/formatting'

  const comments = ref<PlotComment[]>([])
  const dialog = ref(false)
  const perPage = ref(5)
  const page = ref(1)

  const { t } = useI18n()

  const searchTerm = ref<string>()
  const sortField = ref('timestamp')
  const sortDescending = ref(true)

  const compProps = defineProps<{
    trial: TrialPlus
  }>()

  interface PlotComment {
    cell: MiniCell
    comment: Comment
    timestamp: string
    displayName: string
  }

  const i18nParams = computed(() => getI18nParams(compProps.trial.dimensionNames))

  const sortBy: ComputedRef<SortItem[]> = computed(() => {
    return [{
      key: sortField.value,
      order: sortDescending.value ? 'desc' : 'asc',
    }]
  })

  const sortOptions = computed(() => {
    return [{
      title: t('widgetPlotCommentOrderByTimestamp'),
      value: 'timestamp',
    }, {
      title: t('widgetPlotCommentOrderByGermplasm'),
      value: 'displayName',
    }]
  })

  function filter (value: string, query: string, item?: InternalItem<PlotComment>): FilterMatch {
    const trimmed = query.trim()
    if (item && trimmed !== '') {
      const lower = trimmed.toLowerCase()
      const cell = item.raw.cell
      const comment = item.raw.comment
      // Check if the name matches
      if ((cell.displayName || cell.germplasm).toLowerCase().includes(lower)) {
        return true
      }
      // Check if comment content
      if (comment.content.toLowerCase().includes(lower)) {
        return true
      }

      return false
    } else {
      return true
    }
  }

  function update () {
    const data = getTrialDataCached()

    if (data) {
      const allComments: PlotComment[] = []
      Object.values(data).forEach(c => {
        if (c.comments) {
          c.comments.forEach(com => {
            allComments.push({
              cell: {
                germplasm: c.germplasm,
                rep: c.rep,
                displayName: c.displayName || c.germplasm,
                row: c.row || 0,
                column: c.column || 0,
                displayRow: c.displayRow || 1,
                displayColumn: c.displayColumn || 1,
                categories: c.categories,
              },
              comment: com,
              timestamp: com.timestamp,
              displayName: c.displayName || c.germplasm,
            })
          })
        }
      })

      comments.value = allComments
    }
  }

  function deleteComment (comment: PlotComment) {
    emitter.emit('show-confirm', {
      title: t('modalTitleDeleteItem'),
      message: t('modalTextDeleteItem'),
      okTitle: t('genericYes'),
      cancelTitle: t('genericNo'),
      okVariant: 'error',
      callback: (result: boolean) => {
        if (result === true) {
          if (isProxy(comment)) {
            comment = toRaw(comment)
          }

          comments.value = comments.value.filter(c => c.cell.row !== comment.cell.row || c.cell.column !== comment.cell.column || c.comment.timestamp !== comment.comment.timestamp)

          deletePlotComment(compProps.trial.localId || '', comment.cell.row, comment.cell.column, comment.comment)
            .then(() => {
              emitter.emit('plot-comments-changed', comment.cell.row, comment.cell.column, compProps.trial.localId)
              emitter.emit('plausible-event', { key: 'plot-comment', props: { type: 'deleted' } })
            })
        }
      },
    })
  }

  function show () {
    searchTerm.value = undefined
    sortField.value = 'timestamp'
    sortDescending.value = true
    dialog.value = true

    update()
  }
  function hide () {
    dialog.value = false
  }

  defineExpose({
    show,
    hide,
  })
</script>

<style>
.plot-comment .v-list-item-subtitle {
  text-wrap: wrap;
  line-clamp: unset;
  -webkit-line-clamp: unset;
}
</style>
