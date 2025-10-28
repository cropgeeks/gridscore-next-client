import { PersonType } from '@/plugins/types/gridscore'
import { ShareStatus } from './client'
import { mdiAccountArrowRight, mdiAccountEdit, mdiAccountKey, mdiAccountSearch, mdiAccountTag, mdiSyncOff } from '@mdi/js'

export interface PersonTypeConfig {
  icon: string
  colorIndex: number
  text: string
}

const personTypes: { [key: string]: PersonTypeConfig } = {}
personTypes[PersonType.CORRESPONDING_AUTHOR] = {
  icon: mdiAccountTag,
  colorIndex: 0,
  text: 'personTypeCorrespondingAuthor',
}
personTypes[PersonType.DATA_COLLECTOR] = {
  icon: mdiAccountEdit,
  colorIndex: 1,
  text: 'personTypeDataCollector',
}
personTypes[PersonType.QUALITY_CHECKER] = {
  icon: mdiAccountSearch,
  colorIndex: 2,
  text: 'personTypeQualityChecker',
}
personTypes[PersonType.DATA_SUBMITTER] = {
  icon: mdiAccountArrowRight,
  colorIndex: 3,
  text: 'personTypeDataSubmitter',
}

const shareStatusTypes: { [key: string]: PersonTypeConfig } = {}
shareStatusTypes[ShareStatus.OWNER] = {
  icon: mdiAccountKey,
  colorIndex: 0,
  text: 'trialShareOwnerTitle',
}
shareStatusTypes[ShareStatus.EDITOR] = {
  icon: mdiAccountEdit,
  colorIndex: 1,
  text: 'trialShareEditorTitle',
}
shareStatusTypes[ShareStatus.VIEWER] = {
  icon: mdiAccountSearch,
  colorIndex: 2,
  text: 'trialShareViewerTitle',
}
shareStatusTypes[ShareStatus.NOT_SHARED] = {
  icon: mdiSyncOff,
  colorIndex: 3,
  text: 'trialShareNoneTitle',
}

export {
  personTypes,
  shareStatusTypes,
}
