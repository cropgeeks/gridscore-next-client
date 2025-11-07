/* tslint:disable */
/* eslint-disable */
// Generated using typescript-generator version 3.2.1263 on 2025-10-29 08:36:57.

export interface ServerInfo {
    calls: BrapiCall[];
    contactEmail?: string;
    documentationURL?: string;
    location?: string;
    organizationName?: string;
    organizationURL?: string;
    serverDescription: string;
    serverName: string;
}

export interface BrapiCall {
    contentTypes?: ContentType[];
    dataTypes?: DataType[];
    methods: BrapiCallMethod[];
    service: string;
    versions: Version[];
}

export interface StudyParams {
  studyType?: string;
  locationDbId?: string;
  seasonDbId?: string;
  studyCode?: string;
  studyPUI?: string;
  observationVariableDbId?: string;
  active?: string;
  sortBy?: string;
  sortOrder?: string;
  commonCropName?: string;
  programDbId?: string;
  trialDbId?: string;
  studyDbId?: string;
  studyName?: string;
  germplasmDbId?: string;
  externalReferenceId?: string;
  externalReferenceSource?: string;
}

export interface TrialParams {
    active?: boolean;
    contactDbId?: string;
    locationDbId?: string;
    searchDateRangeStart?: string;
    searchDateRangeEnd?: string;
    trialPUI?: string;
    sortBy?: string;
    sortOrder?: string;
    commonCropName?: string;
    programDbId?: string;
    trialDbId?: string;
    trialName?: string;
    studyDbId?: string;
    externalReferenceId?: string;
    externalReferenceSource?: string;
}

export interface ProgramParams {
    abbreviation?: string;
    commonCropName?: string;
    programDbId?: string;
    programName?: string;
    programType?: string;
    externalReferenceId?: string;
    externalReferenceSource?: string;
}

export interface GermplasmSearch {
    accessionNumbers?: string[];
    binomialNames?: string[];
    collections?: string[];
    commonCropNames?: string[];
    externalReferenceIds?: string[];
    externalReferenceSources?: string[];
    familyCodes?: string[];
    genus?: string[];
    germplasmDbIds?: string[];
    germplasmNames?: string[];
    germplasmPUIs?: string[];
    instituteCodes?: string[];
    parentDbIds?: string[];
    progenyDbIds?: string[];
    programDbIds?: string[];
    programNames?: string[];
    species?: string[];
    studyDbIds?: string[];
    studyNames?: string[];
    synonyms?: string[];
    trialDbIds?: string[];
    trialNames?: string[];
}

export interface Program extends BrapiObject {
    abbreviation: string;
    commonCropName: string;
    documentationURL: string;
    externalReferences: Reference[];
    fundingInformation: string;
    leadPersonDbId: string;
    leadPersonName: string;
    objective: string;
    programDbId: string;
    programName: string;
    programType: string;
}

export interface Study extends BrapiObject {
    active: boolean;
    commonCropName: string;
    contacts: Contact[];
    culturalPractices: string;
    dataLinks: DataLink[];
    documentationURL: string;
    endDate: string;
    environmentParameters: EnvironmentalParameter[];
    experimentalDesign: PuiDescription;
    externalReference: Reference[];
    growthFacility: PuiDescription;
    lastUpdate: LastUpdate;
    license: string;
    locationDbId: string;
    locationName: string;
    observationLevels: ObservationLevel[];
    observationUnitsDescription: string;
    observationVariableDbIds: string[];
    seasons: string[];
    startDate: string;
    studyCode: string;
    studyDbId: string;
    studyDescription: string;
    studyName: string;
    studyPUI: string;
    studyType: string;
    trialDbId: string;
    trialName: string;
}

export interface Germplasm extends BrapiObject {
    accessionNumber: string;
    acquisitionDate: string;
    biologicalStatusOfAccessionCode: string;
    biologicalStatusOfAccessionDescription: string;
    breedingMethodDbId: string;
    breedingMethodName: string;
    collection: string;
    commonCropName: string;
    countryOfOriginCode: string;
    defaultDisplayName: string;
    documentationURL: string;
    donors: Donor[];
    externalReferences: Reference[];
    genus: string;
    germplasmDbId: string;
    germplasmName: string;
    germplasmOrigin: Origin[];
    germplasmPUI: string;
    germplasmPreprocessing: string;
    instituteCode: string;
    instituteName: string;
    pedigree: string;
    seedSource: string;
    seedSourceDescription: string;
    species: string;
    speciesAuthority: string;
    storageTypes: Storage[];
    subtaxa: string;
    subtaxaAuthority: string;
    synonyms: Synonym[];
    taxonIds: TaxonId[];
}

export interface Donor {
    donorAccessionNumber: string;
    donorInstituteCode: string;
    germplasmPUI: string;
}

export interface Origin {
    coordinateUncertainty: string;
    coordinates: CoordinatesPoint;
}

export interface Storage {
    code: string;
    description: string;
}

export interface Synonym {
    synonym: string;
    type: string;
}

export interface TaxonId {
    sourceName: string;
    taxonId: string;
}

export interface CoordinatesPoint extends CoordinateElement<GeometryPoint> {
    geometry: GeometryPoint;
}

export interface GeometryPoint extends GeometryElement<number[]> {
    coordinates: number[];
}

export interface DataLink {
    dataFormat: string;
    description: string;
    fileFormat: string;
    name: string;
    provenance: string;
    scientificType: string;
    url: string;
    version: string;
}

export interface EnvironmentalParameter {
    description: string;
    parameterName: string;
    parameterPUI: string;
    unit: string;
    unitPUI: string;
    value: string;
    valuePUI: string;
}

export interface PuiDescription {
    pui: string;
    description: string;
}

export interface LastUpdate {
    timestamp: string;
    version: string;
}

export interface Trial extends BrapiObject {
    active: boolean;
    commonCropName: string;
    contacts: Contact[];
    datasetAuthorships: Authorship[];
    documentationURL: string;
    endDate: string;
    externalReferences: Reference[];
    programDbId: string;
    programName: string;
    publications: Publication[];
    startDate: string;
    trialDbId: string;
    trialDescription: string;
    trialName: string;
    trialPUI: string;
}

export interface Contact {
    contactDbId: string;
    email: string;
    instituteName: string;
    name: string;
    orcid: string;
    type: string;
}

export interface Authorship {
    datasetPUI: string;
    license: string;
    publicReleaseDate: Date;
    submissionDate: Date;
}

export interface Publication {
    publicationPUI: string;
    publicationReference: string;
}

export interface ObservationVariableSearch {
    commonCropNames?: string[];
    dataTypes?: string[];
    externalReferenceIds?: string[];
    externalReferenceSources?: string[];
    methodDbIds?: string[];
    methodNames?: string[];
    methodPUIs?: string[];
    observationVariableDbIds?: string[];
    observationVariableNames?: string[];
    observationVariablePUIs?: string[];
    ontologyDbIds?: string[];
    programDbIds?: string[];
    programNames?: string[];
    scaleDbIds?: string[];
    scaleNames?: string[];
    scalePUIs?: string[];
    studyDbIds?: string[];
    studyNames?: string[];
    traitAttributePUIs?: string[];
    traitAttributes?: string[];
    traitClasses?: string[];
    traitDbIds?: string[];
    traitEntities?: string[];
    traitEntityPUIs?: string[];
    traitNames?: string[];
    traitPUIs?: string[];
    trialDbIds?: string[];
    trialNames?: string[];
}

export interface Observation extends BrapiObject {
    collector?: string;
    externalReferences?: Reference[];
    geoCoordinates?: CoordinateElement<GeometryElement<any>>;
    germplasmDbId: string;
    germplasmName?: string;
    observationDbId?: string;
    observationTimeStamp?: string;
    observationUnitDbId: string;
    observationUnitName?: string;
    observationVariableDbId: string;
    observationVariableName?: string;
    season?: Season;
    studyDbId: string;
    uploadedBy?: string;
    value: string;
}

export interface ObservationUnit extends BrapiObject {
    crossDbId?: string;
    crossName?: string;
    externalReferences?: Reference[];
    germplasmDbId: string;
    germplasmName?: string;
    locationDbId?: string;
    locationName?: string;
    observationUnitDbId: string;
    observationUnitName?: string;
    observationUnitPUI?: string;
    observationUnitPosition?: ObservationUnitPosition;
    observations?: Observation[];
    programDbId: string;
    programName?: string;
    seedLotDbId?: string;
    seedLotName?: string;
    studyDbId: string;
    studyName?: string;
    treatments?: Treatment[];
    trialDbId: string;
    trialName?: string;
}

export interface ObservationUnitPosition {
    entryType?: string;
    geoCoordinates?: CoordinateElement<GeometryElement<any>>;
    observationLevel?: ObservationLevel;
    observationLevelRelationships?: ObservationLevel[];
    positionCoordinateX?: string;
    positionCoordinateXType?: string;
    positionCoordinateY?: string;
    positionCoordinateYType?: string;
}

export interface ObservationVariable extends BrapiObject {
    commonCropName?: string;
    contextOfUse?: string;
    defaultValue?: string;
    documentationURL?: string;
    externalReferences?: Reference[];
    growthStage?: string;
    institution?: string;
    language?: string;
    method?: AttributeMethod;
    observationVariableDbId?: string;
    observationVariableName?: string;
    ontologyReference?: OntologyReference;
    scale?: Scale;
    scientist?: string;
    status?: string;
    submissionTimestamp?: string;
    synonyms?: string[];
    trait?: Trait;
}

export interface AttributeMethod extends BrapiObject {
    bibliographicalReference: string;
    description: string;
    externalReferences: Reference[];
    formula: string;
    methodClass: string;
    methodDbId: string;
    methodName: string;
    methodPUI: string;
    ontologyReference: OntologyReference;
}

export interface OntologyReference {
    documentationLinks: Link[];
    ontologyDbId: string;
    ontologyName: string;
    version: string;
}

export interface Scale extends BrapiObject {
    dataType?: string;
    decimalPlaces?: number;
    externalReferences?: Reference[];
    ontologyReference?: OntologyReference;
    scaleDbId?: string;
    scaleName?: string;
    scalePUI?: string;
    units?: string;
    validValues?: ValidValues;
}

export interface Trait extends BrapiObject {
    alternativeAbbreviations?: string[];
    attribute?: string;
    attributePUI?: string;
    entity?: string;
    entityPUI?: string;
    externalReferences?: Reference[];
    mainAbbreviation?: string;
    ontologyReference?: OntologyReference;
    status?: string;
    synonyms?: string[];
    traitClass?: string;
    traitDbId?: string;
    traitDescription?: string;
    traitName?: string;
    traitPUI?: string;
}

export interface Link {
    type: string;
    url: string;
}

export interface ValidValues {
    categories?: Category[];
    maximumValue?: string;
    minimumValue?: string;
}

export interface Category {
    label?: string;
    value?: string;
}

export interface Treatment {
    factor?: string;
    modality?: string;
}

export interface ObservationLevel {
    levelCode: string;
    levelName?: string;
    levelOrder?: number;
}

export interface Reference {
    referenceId?: string;
    referenceSource?: string;
}

export interface Season {
    seasonDbId?: string;
    seasonName?: string;
    year?: number;
}

export interface CoordinateElement<T> {
    type?: string;
    geometry?: T;
}

export interface GeometryElement<T> {
    type?: string;
    coordinates?: T;
}

export interface BrapiObject {
    additionalInfo?: { [index: string]: string };
}

export const enum ContentType {
    json = 'json',
    tsv = 'tsv',
    flapjack = 'flapjack',
}

export const enum DataType {
    json = 'json',
    tsv = 'tsv',
    flapjack = 'flapjack',
}

export const enum BrapiCallMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
}

export const enum Version {
    ONE_ZERO = '1.0',
    ONE_ONE = '1.1',
    ONE_TWO = '1.2',
    ONE_THREE = '1.3',
    TWO_ZERO = '2.0',
    TWO_ONE = '2.1',
}
