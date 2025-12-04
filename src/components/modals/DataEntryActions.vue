<template>
  <OverflowMenu
    :items="items"
    :breakpoint="lgAndUp"
  />

  <CommentModal
    type="plot"
    :comments="cell.comments"
    :editable="trial.editable || false"
    @comment-added="addNewComment"
    @comment-deleted="deleteComment"
    ref="commentModal"
  />

  <v-dialog
    v-model="dateDialog"
    width="unset"
  >
    <v-card :title="$t('buttonPickRecordingDate')">
      <template #text>
        <v-date-picker
          v-model="tempRecordingDate"
          hide-title
          hide-header
          color="primary"
        />
      </template>
      <template #actions>
        <v-btn @click="dateDialog = false" :text="$t('buttonCancel')" />
        <v-spacer />
        <v-btn v-if="recordingDate" :text="$t('buttonReset')" @click="setDate(undefined)" />
        <v-btn :text="$t('buttonSelect')" color="primary" variant="tonal" :disabled="!tempRecordingDate" @click="setDate(tempRecordingDate)" />
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { addPlotComment, deletePlotComment, setPlotMarked } from '@/plugins/idb'
  import type { CellPlus, TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'

  import emitter from 'tiny-emitter/instance'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import CommentModal from '@/components/modals/CommentModal.vue'
  import type { Comment } from '@/plugins/types/gridscore'
  import OverflowMenu, { type MenuItem } from '@/components/util/OverflowMenu.vue'
  import { mdiBookmark, mdiBookmarkOutline, mdiCalendar, mdiCamera, mdiCommentText, mdiDirectionsFork } from '@mdi/js'

  const store = coreStore()
  const router = useRouter()
  const { t } = useI18n()
  const { lgAndUp } = useDisplay()
  const dateDialog = ref(false)

  const recordingDate = defineModel<Date>('recordingDate')
  const tempRecordingDate = ref<Date | undefined>(new Date())

  const commentModal = useTemplateRef('commentModal')

  const compProps = defineProps<{
    cell: CellPlus
    trial: TrialPlus
    isGuidedWalk: boolean
  }>()

  const items: ComputedRef<MenuItem[]> = computed(() => {
    return [{
      text: t('buttonPickRecordingDate'),
      size: 'small',
      variant: 'tonal',
      prependIcon: mdiCalendar,
      disabled: !compProps.trial.editable,
      click: () => {
        dateDialog.value = true
      },
    }, {
      text: compProps.cell.isMarked ? t('buttonUnbookmarkCell') : t('buttonBookmarkCell'),
      size: 'small',
      variant: 'tonal',
      color: compProps.cell.isMarked ? 'primary' : undefined,
      prependIcon: compProps.cell.isMarked ? mdiBookmark : mdiBookmarkOutline,
      click: toggleMarked,
      disabled: !compProps.trial.editable,
    }, {
      text: t('buttonTagPhoto'),
      prependIcon: mdiCamera,
      variant: 'tonal',
      size: 'small',
      click: () => emitter.emit('tag-media', compProps.cell.row || 0, compProps.cell.column || 0, 'image'),
    }, {
      text: t('buttonCommentCount', (compProps.cell.comments || []).length),
      prependIcon: mdiCommentText,
      variant: 'tonal',
      size: 'small',
      click: showComments,
    }, {
      text: t('buttonStartGuidedWalk'),
      prependIcon: mdiDirectionsFork,
      variant: 'tonal',
      size: 'small',
      click: onGuidedWalk,
      visible: !compProps.isGuidedWalk,
    }]
  })

  function setDate (date: Date | undefined) {
    if (date) {
      recordingDate.value = date
      dateDialog.value = false
    } else {
      recordingDate.value = undefined
      tempRecordingDate.value = undefined
    }
  }

  function toggleMarked () {
    const c = compProps.cell
    if (!c) {
      return
    }

    if (c.isMarked) {
      // Remove it reactively from the cell
      c.isMarked = false
      setPlotMarked(store.storeSelectedTrial || '', c.row || 0, c.column || 0, false)
        .then(() => emitter.emit('plot-marked-changed', c.row, c.column, store.storeSelectedTrial))
      emitter.emit('plausible-event', { key: 'plot-marked', props: { marked: false } })
    } else {
      // Add it this way, because the cell may not have it
      c.isMarked = true
      setPlotMarked(store.storeSelectedTrial || '', c.row || 0, c.column || 0, true)
        .then(() => emitter.emit('plot-marked-changed', c.row, c.column, store.storeSelectedTrial))
      emitter.emit('plausible-event', { key: 'plot-marked', props: { marked: true } })
    }
  }

  function showComments () {
    commentModal.value?.show()
  }

  function onGuidedWalk () {
    emitter.emit('show-confirm', {
      title: t('modalTitleGuidedWalk'),
      message: t('modalTextGuidedWalkQuestion'),
      okTitle: t('buttonYes'),
      cancelTitle: t('buttonNo'),
      okVariant: 'success',
      callback: (result: boolean) => {
        if (result) {
          router.push(`/collect/walk?row=${compProps.cell?.row}&column=${compProps.cell?.column}`)
        }
      },
    })
  }

  function addNewComment (content: string) {
    addPlotComment(compProps.trial.localId || '', compProps.cell.row || 0, compProps.cell.column || 0, content)
      .then(() => {
        emitter.emit('plot-comments-changed', compProps.cell.row || 0, compProps.cell.column || 0, compProps.cell.trialId || 0)
        emitter.emit('plausible-event', { key: 'plot-comment', props: { type: 'added' } })
        // this.$emit('comments-changed')
      })
  }

  function deleteComment (comment: Comment) {
    deletePlotComment(compProps.trial.localId || '', compProps.cell.row || 0, compProps.cell.column || 0, comment)
      .then(() => {
        emitter.emit('plot-comments-changed', compProps.cell.row || 0, compProps.cell.column || 0, compProps.cell.trialId || 0)
        emitter.emit('plausible-event', { key: 'plot-comment', props: { type: 'deleted' } })
        // this.$emit('comments-changed')
      })
  }
</script>
