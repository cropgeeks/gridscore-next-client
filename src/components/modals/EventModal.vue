<template>
  <v-dialog v-model="dialog" scrollable max-width="min(90vw, 1024px)">
    <v-card :title="$t('modalTitleTrialEvent')">
      <template #text>
        <p>{{ $t('modalTextTrialEvent') }}</p>

        <v-data-iterator
          :items="events"
          item-value="timestamp"
          :items-per-page="perPage"
          :page="page"
        >
          <template #header="{ pageCount }">
            <v-pagination v-model="page" :length="pageCount" v-if="pageCount > 1" />
          </template>

          <template #default="{ items }">
            <template
              v-for="(event, i) in items"
              :key="`changelog-entry-${i}`"
            >
              <v-card :prepend-icon="mdiCalendar" :title="new Date(event.raw.timestamp || new Date()).toLocaleDateString()" class="mb-4">
                <template #append>
                  <v-btn color="error" :disabled="!editable" :icon="mdiDelete" v-tooltip:top="$t('buttonDelete')" @click="deleteEvent(event.raw)" />
                </template>
                <template #text>
                  <v-row>
                    <v-col cols="6">
                      <h4 class="mt-3">{{ $t('formLabelEventType') }}</h4>
                      <template v-if="event.raw.type === EventType.WEATHER"><v-icon :icon="mdiWeatherPartlySnowyRainy" /> {{ $t('formSelectOptionEventTypeWeather') }}</template>
                      <template v-else-if="event.raw.type === EventType.MANAGEMENT"><v-icon :icon="mdiTractor" /> {{ $t('formSelectOptionEventTypeManagement') }}</template>
                      <template v-else-if="event.raw.type === EventType.OTHER"><v-icon :icon="mdiDotsHorizontal" /> {{ $t('formSelectOptionEventTypeOther') }}</template>
                    </v-col>
                    <v-col cols="6">
                      <h4 class="mt-3">{{ $t('formLabelEventImpact') }}</h4>
                      <v-rating
                        :model-value="event.raw.impact"
                        :empty-icon="mdiCircleOutline"
                        :full-icon="mdiCircle"
                        :length="5"
                        hide-details
                        hover
                        density="compact"
                        readonly
                      />
                    </v-col>
                  </v-row>

                  <div>
                    <h4 class="mt-3">{{ $t('formLabelEventContent') }}</h4>
                    {{ event.raw.content }}
                  </div>
                </template>
              </v-card>
            </template>
          </template>

          <template #footer="{ pageCount }">
            <v-card v-if="editable" :title="$t('modalTitleTrialEventCreate')">
              <template #text>
                <h4 class="mt-3">{{ $t('formLabelEventType') }}</h4>
                <p>{{ $t('formDescriptionEventType') }}</p>
                <v-btn-toggle color="primary" variant="tonal" v-model="newEvent.type">
                  <v-btn :value="EventType.WEATHER" :prepend-icon="mdiWeatherPartlySnowyRainy" :text="$t('formSelectOptionEventTypeWeather')" :append-icon="newEvent.type === EventType.WEATHER ? mdiCheck : undefined" />
                  <v-btn :value="EventType.MANAGEMENT" :prepend-icon="mdiTractor" :text="$t('formSelectOptionEventTypeManagement')" :append-icon="newEvent.type === EventType.MANAGEMENT ? mdiCheck : undefined" />
                  <v-btn :value="EventType.OTHER" :prepend-icon="mdiDotsHorizontal" :text="$t('formSelectOptionEventTypeOther')" :append-icon="newEvent.type === EventType.OTHER ? mdiCheck : undefined" />
                </v-btn-toggle>

                <h4 class="mt-3">{{ $t('formLabelEventImpact') }}</h4>
                <p>{{ $t('formDescriptionEventImpact') }}</p>
                <v-rating
                  v-model="newEvent.impact"
                  :empty-icon="mdiCircleOutline"
                  :full-icon="mdiCircle"
                  :length="5"
                  :item-labels="[$t('formDescriptionEventImpactLow'), '', '', '', $t('formDescriptionEventImpactHigh')]"
                  item-label-position="bottom"
                  hide-details
                  hover
                />

                <v-date-input
                  class="my-3"
                  :label="$t('formLabelEventDate')"
                  :display-format="(d: any) => d ? d.toLocaleDateString() : ''"
                  :hint="$t('formDescriptionEventDate')"
                  persistent-hint
                  prepend-icon=""
                  prepend-inner-icon="$calendar"
                  :model-value="newEvent.timestamp ? date.toJsDate(newEvent.timestamp) : undefined"
                  @update:model-value="v => { newEvent.timestamp = date.toISO(v) }"
                />

                <SpeechRecognitionTextarea
                  v-model="newEvent.content"
                  :label="$t('formLabelEventContent')"
                  :hint="$t('formDescriptionEventContent')"
                />
              </template>
              <template #actions>
                <v-spacer />
                <v-btn class="mt-3" color="primary" :prepend-icon="mdiFlagPlus" :text="$t('buttonCreateEvent')" :disabled="!newEvent || !newEvent.content || newEvent.content.trim().length === 0" @click="addEvent" />
              </template>
            </v-card>

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
  import { EventType, type Event } from '@/plugins/types/gridscore'
  import SpeechRecognitionTextarea from '@/components/inputs/SpeechRecognitionTextarea.vue'
  import { mdiCalendar, mdiFlagPlus, mdiDelete, mdiCheck, mdiCircleOutline, mdiCircle, mdiTractor, mdiWeatherPartlySnowyRainy, mdiDotsHorizontal } from '@mdi/js'
  import { useDate } from 'vuetify'

  import emitter from 'tiny-emitter/instance'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()
  const dialog = ref(false)
  const perPage = ref(5)
  const page = ref(1)
  const date = useDate()

  const newEvent = ref<Event>({
    content: '',
    type: EventType.WEATHER,
    impact: 1,
    timestamp: new Date().toISOString(),
  })

  const compProps = defineProps<{
    events: Event[]
    editable: boolean
  }>()

  function addEvent () {
    emit('event-added', newEvent.value)
    newEvent.value = {
      content: '',
      type: EventType.WEATHER,
      impact: 1,
      timestamp: new Date().toISOString(),
    }
  }

  function deleteEvent (event: Event) {
    emitter.emit('show-confirm', {
      title: t('modalTitleDeleteItem'),
      message: t('modalTextDeleteItem'),
      okTitle: t('genericYes'),
      cancelTitle: t('genericNo'),
      okVariant: 'error',
      callback: (result: boolean) => {
        if (result === true) {
          if (isProxy(event)) {
            event = toRaw(event)
          }

          emit('event-deleted', event)
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

  const emit = defineEmits(['event-added', 'event-deleted'])

  defineExpose({
    show,
    hide,
  })
</script>
