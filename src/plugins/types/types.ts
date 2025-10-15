import { PersonType } from '@/plugins/types/gridscore'
import { ShareStatus } from './client'

export interface PersonTypeConfig {
  icon: string
  colorIndex: number
  text: string
}

const personTypes: { [key: string]: PersonTypeConfig } = {}
personTypes[PersonType.CORRESPONDING_AUTHOR] = {
  icon: 'mdi-account-tag',
  colorIndex: 0,
  text: 'personTypeCorrespondingAuthor',
}
personTypes[PersonType.DATA_COLLECTOR] = {
  icon: 'mdi-account-edit',
  colorIndex: 1,
  text: 'personTypeDataCollector',
}
personTypes[PersonType.QUALITY_CHECKER] = {
  icon: 'mdi-account-search',
  colorIndex: 2,
  text: 'personTypeQualityChecker',
}
personTypes[PersonType.DATA_SUBMITTER] = {
  icon: 'mdi-account-arrow-right',
  colorIndex: 3,
  text: 'personTypeDataSubmitter',
}

const shareStatusTypes: { [key: string]: PersonTypeConfig } = {}
shareStatusTypes[ShareStatus.OWNER] = {
  icon: 'mdi-account-key',
  colorIndex: 0,
  text: 'trialShareOwnerTitle',
}
shareStatusTypes[ShareStatus.EDITOR] = {
  icon: 'mdi-account-edit',
  colorIndex: 1,
  text: 'trialShareEditorTitle',
}
shareStatusTypes[ShareStatus.VIEWER] = {
  icon: 'mdi-account-search',
  colorIndex: 2,
  text: 'trialShareViewerTitle',
}
shareStatusTypes[ShareStatus.NOT_SHARED] = {
  icon: 'mdi-sync-off',
  colorIndex: 3,
  text: 'trialShareNoneTitle',
}

export {
  personTypes,
  shareStatusTypes,
}
