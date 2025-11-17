<template>
  <v-dialog v-model="dialog" scrollable max-width="min(90vw, 1024px)">
    <v-card :title="$t('modalTitleAddGermplasm')">
      <template #text>
        <p>{{ $t('modalTextAddGermplasm') }}</p>

        <v-card :title="$t('formGroupSetupShowFields')" class="mb-3">
          <template #text>
            <div class="d-flex flex-wrap ga-2">
              <v-btn-toggle v-model="visibleFields" color="primary" variant="tonal" multiple direction="vertical">
                <v-btn value="treatment" :text="$t('formCheckboxSetupShowTreatment')" :prepend-icon="mdiSprinklerFire" />
                <v-btn value="friendlyName" :text="$t('formCheckboxSetupShowFriendlyName')" :prepend-icon="mdiEyeCheck" />
                <v-btn value="barcode" :text="$t('formCheckboxSetupShowBarcode')" :prepend-icon="mdiBarcode" />
                <v-btn value="pedigree" :text="$t('formCheckboxSetupShowPedigree')" :prepend-icon="mdiFamilyTree" />
              </v-btn-toggle>

              <QRScanInput
                v-model="areaInput"
                textarea
                :label="$t('formLabelAddGermplasmName')"
                :hint="$t('formDescriptionAddGermplasm')"
                :tooltip="$t('tooltipScanQRCodeAddGermplasm')"
                :formats="['qr_code', 'code_128', 'code_39', 'ean_8', 'ean_13']"
              />
            </div>

            <v-btn :prepend-icon="mdiPlus" color="primary" :disabled="areaInput === undefined || areaInput.trim().length === 0" class="mt-2" :text="$t('buttonAdd')" @click="addFromInput" />
          </template>
        </v-card>

        <v-virtual-scroll
          :items="newGermplasm"
          max-height="75vh"
        >
          <template #default="{ index }">
            <v-card class="mb-3">
              <template #text>
                <GermplasmMetadataInputSection :visible-fields="visibleFields" v-model="newGermplasm[index]" />
              </template>
            </v-card>
          </template>
        </v-virtual-scroll>

        <div class="">
          <v-btn v-if="hasErrors || hasWarnings" @click="bottomSheetVisible = true" :text="$t('formFeedbackLayout', feedback?.length || 0)" :prepend-icon="hasErrors ? mdiAlertCircle : mdiAlert" :color="hasErrors ? 'error' : 'warning'" />
        </div>
      </template>

      <v-card-actions>
        <v-spacer />
        <v-btn :text="$t('buttonCancel')" @click="hide" />
        <v-btn :text="$t('buttonCheck')" @click="check" :disabled="!canCheck" color="warning" variant="tonal" />
        <v-btn :text="$t('buttonAdd')" @click="save" :disabled="!canContinue" color="primary" variant="tonal" />
      </v-card-actions>
    </v-card>

    <v-bottom-sheet v-model="bottomSheetVisible" inset>
      <v-card :title="$t('modalTitleLayoutFeedback')">
        <template #text>
          <p>{{ $t('modalTextLayoutFeedback') }}</p>

          <v-list>
            <v-list-item
              v-for="(item, itemIndex) in feedback"
              :key="`feedback-item-${itemIndex}`"
              :prepend-icon="item.type === 'error' ? mdiAlertCircle : mdiAlert"
              :base-color="item.type === 'error' ? 'error' : 'warning'"
              :title="item.message"
            />
          </v-list>
        </template>
      </v-card>
    </v-bottom-sheet>
  </v-dialog>
</template>

<script setup lang="ts">
  import { addTrialGermplasm, getTrialData } from '@/plugins/idb'
  import type { TrialPlus } from '@/plugins/types/client'
  import type { CellMetadata } from '@/plugins/types/gridscore'
  import { mdiAlert, mdiAlertCircle, mdiBarcode, mdiEyeCheck, mdiFamilyTree, mdiPlus, mdiSprinklerFire } from '@mdi/js'
  import emitter from 'tiny-emitter/instance'
  import type { LayoutFeedback } from '@/components/setup/GermplasmLayoutTable.vue'
  import { useI18n } from 'vue-i18n'
  import QRScanInput from '@/components/inputs/QRScanInput.vue'

  const compProps = defineProps<{
    trial: TrialPlus
  }>()

  const { t } = useI18n()

  const dialog = ref(false)
  const newGermplasm = ref<CellMetadata[]>([])
  const visibleFields = ref<('treatment' | 'friendlyName' | 'pedigree' | 'barcode')[]>([])
  const areaInput = ref<string>()
  const feedback = ref<LayoutFeedback[] | undefined>()
  const bottomSheetVisible = ref(false)

  let uniqueNames = new Set<string>()
  let uniqueBarcodes = new Set<string>()

  const hasErrors = computed(() => feedback.value && feedback.value.some(f => f.type === 'error'))
  const hasWarnings = computed(() => feedback.value && feedback.value.some(f => f.type === 'warning'))
  const canContinue = computed(() => canCheck.value && feedback.value && hasErrors.value === false)
  const canCheck = computed(() => newGermplasm.value.length > 0)

  function show () {
    dialog.value = true
    areaInput.value = undefined
    feedback.value = undefined

    getTrialData(compProps.trial.localId || '')
      .then(data => {
        uniqueNames = new Set<string>()
        uniqueBarcodes = new Set<string>()
        Object.values(data).forEach(c => {
          uniqueNames.add(`${c.germplasm}|${c.rep}`)

          if (c.barcode) {
            uniqueBarcodes.add(c.barcode)
          }
        })

        newGermplasm.value = []
      })
  }
  function hide () {
    newGermplasm.value = []
    areaInput.value = undefined
    feedback.value = undefined
    dialog.value = false
  }
  function check () {
    feedback.value = []
    const barcodeSet = new Set<string>(uniqueBarcodes)
    const germplasmSet = new Set<string>(uniqueNames)
    newGermplasm.value.forEach((cell, index) => {
      const barcode = cell.barcode
      if (barcode) {
        if (barcodeSet.has(barcode)) {
          feedback.value?.push({
            type: 'error',
            message: t('formFeedbackSetupDuplicateBarcode', { columnIndex: 1, rowIndex: index + 1, germplasm: cell.germplasm, rep: cell.rep, barcode: barcode }),
          })
        }
        barcodeSet.add(barcode)
      }

      const displayName = `${cell.germplasm}|${cell.rep}`
      if (germplasmSet.has(displayName)) {
        feedback.value?.push({
          type: 'warning',
          message: t('formFeedbackSetupDuplicateGermplasmRep', { columnIndex: 1, rowIndex: index + 1, germplasm: cell.germplasm, rep: cell.rep || 'N/A' }),
        })
      } else {
        germplasmSet.add(displayName)
      }
    })
  }
  function save () {
    if (!feedback.value?.some(f => f.type === 'error')) {
      addTrialGermplasm(compProps.trial.localId || '', newGermplasm.value)
        .then(() => {
          emitter.emit('trials-updated')
          hide()
        })
        .catch(e => {
          console.error('nay!', e)
        })
    }
  }
  function addFromInput () {
    const lines = (areaInput.value || '').split(/\r?\n/).map(p => p.trim()).filter(p => p.length > 0)

    lines.forEach(l => {
      newGermplasm.value.push({
        germplasm: l,
        rep: '',
        barcode: '',
        treatment: '',
        friendlyName: '',
        pedigree: '',
      })
    })

    areaInput.value = undefined
  }

  defineExpose({
    show,
    hide,
  })
</script>
