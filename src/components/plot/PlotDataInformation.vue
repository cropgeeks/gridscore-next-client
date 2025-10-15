<template>
  <v-list density="compact">
    <v-list-item>
      <template #subtitle>
        <PlotInformation :cell="cell" />
      </template>
    </v-list-item>

    <div v-if="cell.measurements">
      <section v-for="(trait, traitIndex) in trial.traits" :key="`trait-section-${trait.id}`">
        <v-divider v-if="traitIndex > 0" />

        <TraitSection :trait="trait" :show-details="false" />

        <v-list density="compact" v-if="cell.measurements[trait.id || ''] && (cell.measurements[trait.id || ''] || []).length > 0">
          <template v-for="(measure, index) in cell.measurements[trait.id || '']" :key="`selected-measure-${trait.id}-${index}`">
            <v-divider v-if="index > 0" />
            <v-list-item>
              <template #title>
                <span v-tooltip:top="new Date(measure.timestamp).toLocaleString()">{{ getDaysAgoIn(measure.timestamp) }}</span>
              </template>
              <template #subtitle>
                <template v-if="trait.dataType === 'categorical'">
                  {{ measure.values.filter(v => v !== undefined).map((v: string) => (trait.restrictions?.categories || [])[+v]).join(', ') }}
                </template>
                <template v-else>
                  {{ measure.values.join(', ') }}
                </template>
              </template>
            </v-list-item>
          </template>
        </v-list>
      </section>
    </div>
  </v-list>
</template>

<script setup lang="ts">
  import type { CellPlus, TrialPlus } from '@/plugins/types/client'
  import PlotInformation from '@/components/plot/PlotInformation.vue'
  import { useI18n } from 'vue-i18n'

  const compProps = defineProps<{
    cell: CellPlus
    trial: TrialPlus
  }>()

  const { t } = useI18n()

  function getDaysAgoIn (timestamp: string) {
    const diffDays = Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > -14 && diffDays < 0) {
      return t('ttsDaysIn', Math.abs(diffDays))
    } else if (diffDays < 14) {
      return t('ttsDaysAgo', Math.abs(diffDays))
    } else {
      return new Date(timestamp).toLocaleDateString()
    }
  }
</script>
