<template>
  <template v-if="mdAndUp">
    <ResponsiveButton
      :text="cell.isMarked ? $t('buttonUnbookmarkCell') : $t('buttonBookmarkCell')"
      size="small"
      variant="tonal"
      :base-color="cell.isMarked ? 'primary' : undefined"
      :prepend-icon="cell.isMarked ? 'mdi-bookmark' : 'mdi-bookmark-outline'"
      @click="toggleMarked"
      :disabled="!trial.editable"
    />
    <ResponsiveButton
      :text="$t('buttonCommentCount', (cell.comments || []).length)"
      prepend-icon="mdi-comment-text"
      variant="tonal"
      size="small"
      @click="showComments"
    />
    <ResponsiveButton
      :text="$t('buttonStartGuidedWalk')"
      prepend-icon="mdi-directions-fork"
      variant="tonal"
      size="small"
      @click="onGuidedWalk"
      v-if="!isGuidedWalk"
    />
  </template>
  <v-menu v-else>
    <template #activator="{ props }">
      <v-btn v-bind="props" size="small" variant="tonal" icon="mdi-dots-vertical" />
    </template>

    <v-list color="primary">
      <v-list-item
        :title="cell.isMarked ? $t('buttonUnbookmarkCell') : $t('buttonBookmarkCell')"
        :active="cell.isMarked === true"
        :prepend-icon="cell.isMarked ? 'mdi-bookmark' : 'mdi-bookmark-outline'"
        @click="toggleMarked"
        :disabled="!trial.editable"
      />
      <v-list-item
        :title="$t('buttonCommentCount', (cell.comments || []).length)"
        prepend-icon="mdi-comment-text"
        @click="showComments"
      />
      <v-list-item
        :title="$t('buttonStartGuidedWalk')"
        prepend-icon="mdi-directions-fork"
        @click="onGuidedWalk"
        v-if="!isGuidedWalk"
      />
    </v-list>
  </v-menu>

  <CommentModal
    type="plot"
    :comments="cell.comments"
    :editable="trial.editable || false"
    ref="commentModal"
  />
</template>

<script setup lang="ts">
  import { setPlotMarked } from '@/plugins/idb'
  import type { CellPlus, TrialPlus } from '@/plugins/types/client'
  import { coreStore } from '@/stores/app'

  import emitter from 'tiny-emitter/instance'
  import { useI18n } from 'vue-i18n'
  import { useDisplay } from 'vuetify'
  import CommentModal from '@/components/modals/CommentModal.vue'

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
</script>
