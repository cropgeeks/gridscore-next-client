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
            <v-pagination v-model="page" :length="pageCount" />
          </template>

          <template #default="{ items }">
            <template
              v-for="(comment, i) in items"
              :key="`changelog-entry-${i}`"
            >
              <v-card prepend-icon="mdi-calendar" :title="new Date(comment.raw.timestamp).toLocaleDateString()" class="mb-4">
                <template #append>
                  <v-btn color="error" :disabled="!editable" icon="mdi-delete" v-tooltip:top="$t('buttonDelete')" />
                </template>
                <template #text>{{ comment.raw.content }}</template>
              </v-card>
            </template>
          </template>

          <template #footer="{ pageCount }">
            <v-btn color="primary" :text="$t('buttonCreateComment')" v-if="editable" prepend-icon="mdi-comment-plus" @click="showAddSection = !showAddSection" />

            <v-expand-transition>
              <div v-show="showAddSection">
                <v-divider />

                <SpeechRecognitionTextarea v-model="newComment" />
              </div>
            </v-expand-transition>

            <v-pagination v-model="page" :length="pageCount" />
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

  const dialog = ref(false)
  const perPage = ref(5)
  const page = ref(1)
  const showAddSection = ref(false)

  const newComment = ref<string>()

  defineProps<{
    comments: Comment[]
    type: 'trial' | 'plot'
    editable: boolean
  }>()

  function show () {
    dialog.value = true
  }
  function hide () {
    dialog.value = false
  }

  defineExpose({
    show,
    hide,
  })
</script>
