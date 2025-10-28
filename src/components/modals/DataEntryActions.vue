<template>
  <OverflowMenu
    :items="items"
    :breakpoint="mdAndUp"
  />

  <CommentModal
    type="plot"
    :comments="cell.comments"
    :editable="trial.editable || false"
    @comment-added="addNewComment"
    @comment-deleted="deleteComment"
    ref="commentModal"
  />
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
  import { mdiBookmark, mdiBookmarkOutline, mdiCamera, mdiCommentText, mdiDirectionsFork } from '@mdi/js'

  const store = coreStore()
  const router = useRouter()
  const { t } = useI18n()
  const { mdAndUp } = useDisplay()

  const commentModal = useTemplateRef('commentModal')

  const compProps = defineProps<{
    cell: CellPlus
    trial: TrialPlus
    isGuidedWalk: boolean
  }>()

  const items: ComputedRef<MenuItem[]> = computed(() => {
    return [{
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
