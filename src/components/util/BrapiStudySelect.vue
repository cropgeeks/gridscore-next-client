<template>
  <div>
    <v-row>
      <v-col cols="12" md="6" lg="3">
        <v-autocomplete
          v-model="program"
          :label="$t('formLabelExportBrapiProgram')"
          return-object
          auto-select-first
          item-value="programDbId"
          item-title="programName"
          :items="programs"
          autocomplete="off"
        />
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-autocomplete
          v-model="trial"
          :label="$t('formLabelExportBrapiTrial')"
          return-object
          auto-select-first
          item-value="trialDbId"
          item-title="trialName"
          :items="trials"
          autocomplete="off"
        />
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-autocomplete
          v-model="studyType"
          :label="$t('formLabelExportBrapiStudyType')"
          return-object
          auto-select-first
          :items="studyTypes"
          autocomplete="off"
        />
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-autocomplete
          v-model="study"
          :label="$t('formLabelExportBrapiStudy')"
          return-object
          auto-select-first
          item-value="studyDbId"
          item-title="studyName"
          :items="studies"
          autocomplete="off"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
  import { brapiDefaultCatchHandler, brapiGetPrograms, brapiGetStudies, brapiGetStudyTypes, brapiGetTrials } from '@/plugins/brapi'
  import type { Study, Trial, Program } from '@/plugins/types/brapi'

  const programs = ref<Program[]>([])
  const program = defineModel<Program>('program')
  const trials = ref<Trial[]>([])
  const trial = defineModel<Trial>('trial')
  const studyTypes = ref<string[]>([])
  const studyType = defineModel<string>('studyType')
  const studies = ref<Study[]>([])
  const study = defineModel<Study>('study')

  function updatePrograms () {
    brapiGetPrograms()
      .then(pr => {
        programs.value = pr || []

        if (programs.value.length > 0) {
          program.value = programs.value[0]
        }
      })
      .catch(brapiDefaultCatchHandler)
  }

  function updateTrials () {
    brapiGetTrials({
      programDbId: program.value?.programDbId,
    })
      .then(tr => {
        trials.value = tr || []

        if (trials.value.length > 0) {
          trial.value = trials.value[0]
        }
      })
      .catch(brapiDefaultCatchHandler)
  }

  function updateStudyTypes () {
    brapiGetStudyTypes()
      .then(result => {
        studyTypes.value = result || []

        if (result && result.length > 0) {
          if (result.includes('trials')) {
            studyType.value = 'trials'
          } else {
            studyType.value = result[0]
          }
        } else {
          studyType.value = undefined
        }
      })
      .catch(brapiDefaultCatchHandler)
  }

  function updateStudies () {
    brapiGetStudies({
      studyType: studyType.value,
      trialDbId: trial.value?.trialDbId,
    })
      .then(result => {
        studies.value = result

        if (result && result.length > 0) {
          // Preselect a study (Germinate import)
          const index = result.findIndex(r => study.value && (r.studyDbId === study.value.studyDbId))
          if (index !== -1) {
            study.value = result[index]
          } else {
            study.value = result[0]
          }
        } else {
          study.value = undefined
        }
      })
      .catch(brapiDefaultCatchHandler)
  }

  watch(program, async () => updateTrials(), { immediate: true })
  watch(trial, async () => updateStudyTypes(), { immediate: true })
  watch(studyType, async () => updateStudies(), { immediate: true })

  onMounted(() => {
    updatePrograms()
  })

  defineExpose({
    updatePrograms,
  })
</script>
