/* tslint:disable */
/* eslint-disable */

import type { Cell, Trait, Trial } from '@/plugins/types/gridscore'

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
  localId: string | undefined
  traits: TraitPlus[]
  editable?: boolean
  shareStatus?: ShareStatus
  transactionCount?: number
  group?: TrialGroup
  hasRemoteUpdate?: boolean
  hasLocalUpdate?: boolean
  showExpiryWarning?: boolean
  expiresOn?: string
}

export interface CellPlus extends Cell {
  artificialId?: string
  trialId?: string
  row?: number
  column?: number
  displayName?: string
  displayColumn?: number
  displayRow?: number
}

export interface MiniCell {
  row: number
  column: number
  germplasm: string
  displayName?: string
  rep?: string
  displayRow?: number
  displayColumn?: number
}

export interface RemoteConfig {
  remoteUrl?: string
  token?: string
}

export const enum ShareStatus {
  NOT_SHARED = 'NOT_SHARED',
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export const enum NavigationMode {
  DRAG = 'DRAG',
  JUMP = 'JUMP',
}

export const enum PlotDisplayField {
  DISPLAY_NAME = 'displayName',
  GERMPLASM = 'germplasm',
  REP = 'rep',
  NOTHING = '',
}

export const enum CanvasDensity {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export const enum CanvasSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export const enum CanvasShape {
  CIRCLE = 'circle',
  SQUARE = 'square',
}

export const enum TrialListMode {
  TABBED = 'tabbed',
  ALL = 'all',
}

export const enum TrialListType {
  GRID = 'grid',
  LIST = 'list',
}

export const enum MainDisplayMode {
  AUTO = 'auto',
  CANVAS_ONLY = 'canvas-only',
}
