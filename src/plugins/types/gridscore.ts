/* tslint:disable */
/* eslint-disable */
// Generated using typescript-generator version 3.2.1263 on 2025-01-07 10:52:16.

export interface Trial {
    name: string;
    description: string;
    traits: Trait[];
    comments: Comment[];
    events: Event[];
    people: Person[];
    remoteUrl: string;
    remoteToken: string;
    layout: Layout;
    data: { [index: string]: Cell } | undefined;
    brapiId: string;
    brapiConfig: BrapiConfig;
    socialShareConfig: SocialShareConfig;
    updatedOn: string;
    createdOn: string;
    lastSyncedOn: string;
    shareCodes: ShareCodes;
}

export interface Trait {
    id: string;
    brapiId: string;
    name: string;
    description: string;
    dataType: string;
    allowRepeats: boolean;
    setSize: number;
    group: Group;
    restrictions: Restrictions;
    timeframe: Timeframe;
    hasImage: boolean;
    imageUrl?: string | undefined;
}

export interface Comment {
    timestamp: string;
    content: string;
}

export interface Event {
    timestamp: string;
    content: string;
    type: EventType;
    impact: number;
}

export interface Person {
    id: string;
    name: string;
    email: string;
    types: PersonType[];
}

export interface Layout {
    rows: number;
    columns: number;
    corners: Corners;
    markers: Markers;
    columnOrder: string;
    rowOrder: string;
    columnLabels: number[];
    rowLabels: number[];
}

export interface Cell {
    brapiId: string;
    germplasm: string;
    pedigree?: string;
    friendlyName?: string;
    barcode?: string;
    rep: string;
    isMarked: boolean;
    geography: Geography;
    measurements: { [index: string]: Measurement[] };
    comments: Comment[];
    categories: string[];
}

export interface BrapiConfig {
    url?: string | null;
}

export interface SocialShareConfig {
    title: string;
    text: string;
    url: string;
}

export interface ShareCodes {
    ownerCode: string;
    editorCode: string;
    viewerCode: string;
}

export interface Group {
    name: string;
}

export interface Restrictions {
    min: number;
    max: number;
    categories: string[];
}

export interface Timeframe {
    start: string;
    end: string;
    type: TimeframeType;
}

export interface Corners {
    topLeft: LatLng;
    topRight: LatLng;
    bottomRight: LatLng;
    bottomLeft: LatLng;
    valid?: boolean;
}

export interface Markers {
    anchor: Anchor;
    everyRow: number;
    everyColumn: number;
}

export interface Geography {
    corners: Corners;
    center: LatLng;
}

export interface Measurement {
    personId?: string;
    timestamp: string;
    values: string[];
}

export interface LatLng {
    lat: number;
    lng: number;
    valid?: boolean;
}

export interface PlotContent {
    row: number;
    column: number;
}

export interface PlotDetailContent extends PlotContent {
    pedigree: string;
    friendlyName: string;
    barcode: string;
}

export interface MeasurementChange extends Measurement {
    delete?: boolean;
}

export interface PlotCommentContent extends PlotContent {
    content: string;
    timestamp: string;
}

export interface TraitMeasurement extends MeasurementChange {
    traitId: string;
}

export interface PlotGeographyContent extends PlotContent {
    center: LatLng;
}

export interface TrialCommentContent {
    content: string;
    timestamp: string;
}

export interface TrialEventContent {
    timestamp: string;
    content: string;
    type: EventType;
    impact: number;
}

export interface TraitEditContent {
    id: string;
    name: string;
    description: string;
    group?: string | null;
    hasImage: boolean;
    imageUrl?: string | undefined;
    timestamp: string;
}

export interface TrialContent {
    name: string;
    description: string;
    socialShareConfig: SocialShareConfig;
    markers: Markers;
    corners: Corners;
    plotCorners: { [index: string]: Corners };
}

export interface BrapiIdChangeContent {
    germplasmBrapiIds: { [index: string]: string };
    traitBrapiIds: { [index: string]: string };
}

export interface Transaction {
    trialId: string;
    plotCommentAddedTransactions: { [index: string]: PlotCommentContent[] };
    plotCommentDeletedTransactions: { [index: string]: PlotCommentContent[] };
    plotMarkedTransactions: { [index: string]: boolean };
    plotTraitDataChangeTransactions: { [index: string]: TraitMeasurement[] };
    plotGeographyChangeTransactions: { [index: string]: PlotGeographyContent };
    plotDetailsChangeTransaction: { [index: string]: PlotDetailContent };
    trialCommentAddedTransactions: TrialCommentContent[];
    trialCommentDeletedTransactions: TrialCommentContent[];
    trialEventAddedTransactions: TrialEventContent[];
    trialEventDeletedTransactions: TrialEventContent[];
    trialPersonAddedTransactions: Person[];
    trialGermplasmAddedTransactions: string[];
    trialTraitAddedTransactions: Trait[];
    trialTraitDeletedTransactions: Trait[];
    traitChangeTransactions: TraitEditContent[];
    trialEditTransaction?: TrialContent | null;
    brapiIdChangeTransaction: BrapiIdChangeContent;
    brapiConfigChangeTransaction: BrapiConfig;
}

export const enum EventType {
    WEATHER = 'WEATHER',
    MANAGEMENT = 'MANAGEMENT',
    OTHER = 'OTHER',
}

export const enum PersonType {
    DATA_COLLECTOR = 'DATA_COLLECTOR',
    DATA_SUBMITTER = 'DATA_SUBMITTER',
    AUTHOR = 'AUTHOR',
    CORRESPONDING_AUTHOR = 'CORRESPONDING_AUTHOR',
    QUALITY_CHECKER = 'QUALITY_CHECKER',
}

export const enum TimeframeType {
    SUGGEST = 'SUGGEST',
    ENFORCE = 'ENFORCE',
}

export const enum Anchor {
    topLeft = 'topLeft',
    topRight = 'topRight',
    bottomRight = 'bottomRight',
    bottomLeft = 'bottomLeft',
}
