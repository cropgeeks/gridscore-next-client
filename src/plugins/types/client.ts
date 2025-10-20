import { Cell, Trait, Trial } from '@/plugins/types/gridscore'

export interface TraitPlus extends Trait {
  color?: string
  progress?: number
  editable?: boolean
  visible?: boolean
}

export interface TrialGroup {
  name: string
}

export interface Geolocation {
  lat?: number
  lng?: number
  elevation?: number
  heading?: number
}

export interface TrialPlus extends Trial {
  localId: string
  traits: TraitPlus[]
  editable?: boolean
  shareStatus?: ShareStatus
  transactionCount?: number
  group?: TrialGroup
  expiresOn?: string
}

export interface CellPlus extends Cell {
  trialId?: string
  row?: number
  column?: number
  displayName?: string
  displayColumn?: string
  displayRow?: string
}

export const enum ShareStatus {
  TRIAL_STATE_NOT_SHARED = 'NOT_SHARED',
  TRIAL_STATE_OWNER = 'OWNER',
  TRIAL_STATE_EDITOR = 'EDITOR',
  TRIAL_STATE_VIEWER = 'VIEWER',
}