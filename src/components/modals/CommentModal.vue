<template>
  <v-dialog v-model="dialog" max-width="min(90vw, 1024px)">
    <v-card :title="$t(type === 'trial' ? 'modalTitleTrialComment' : 'modalTitlePlotComment')">
      <template #text>
        <p>{{ $t(type === 'trial' ? 'modalTextTrialComment' : 'modalTextPlotComment') }}</p>

        <v-data-iterator
          :items="comments"
          item-value="timestamp"
          :items-per-page="perPage"
          :page="page"
        >
          <template #header="{ pageCount }">
            <v-pagination v-model="page" :length="pageCount" v-if="pageCount > 1" />
          </template>

          <template #default="{ items }">
            <template
              v-for="(comment, i) in items"
              :key="`changelog-entry-${i}`"
            >
              <v-card :prepend-icon="mdiCalendar" :title="new Date(comment.raw.timestamp).toLocaleDateString()" class="mb-4">
                <template #append>
                  <v-btn color="error" :disabled="!editable" :icon="mdiDelete" v-tooltip:top="$t('buttonDelete')" @click="deleteComment(comment.raw)" />
                </template>
                <template #text>{{ comment.raw.content }}</template>
              </v-card>
            </template>
          </template>

          <template #footer="{ pageCount }">
            <template v-if="editable">
              <SpeechRecognitionTextarea
                :label="$t('formLabelCommentContent')"
                :hint="$t('formDescriptionCommentContent')"
                v-model="newComment"
              />

              <v-btn class="mt-3" color="primary" :prepend-icon="mdiCommentPlus" :text="$t('buttonCreateComment')" :disabled="!newComment || newComment.trim().length === 0" @click="addComment" />
            </template>

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
  import type { Comment } from '@/plugins/types/gridscore'
  import SpeechRecognitionTextarea from '@/components/inputs/SpeechRecognitionTextarea.vue'
  import { mdiCalendar, mdiCommentPlus, mdiDelete } from '@mdi/js'

  import emitter from 'tiny-emitter/instance'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()
  const dialog = ref(false)
  const perPage = ref(5)
  const page = ref(1)

  const newComment = ref<string>()

  const compProps = defineProps<{
    comments: Comment[]
    type: 'trial' | 'plot'
    editable: boolean
  }>()

  function addComment () {
    emit('comment-added', newComment.value)
    newComment.value = undefined
  }

  function deleteComment (comment: Comment) {
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

          emit('comment-deleted', comment)
        }
      },
    })
  }

  function show () {
    dialog.value = true
  }
  function hide () {
    dialog.value = false
  }

  const emit = defineEmits(['comment-added', 'comment-deleted'])

  defineExpose({
    show,
    hide,
  })
</script>
