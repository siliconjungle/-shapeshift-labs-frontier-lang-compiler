type RS = readonly string[];
type QS = string | RS;

export interface UniversalConversionArtifactSourceMapIndex {
  readonly sourceMapIds: RS;
  readonly sourceMapMappingIds: RS;
  readonly sourceMapLinkIds: RS;
  readonly routeSourceMapIds: RS;
  readonly routeSourceMapMappingIds: RS;
  readonly routeSourceMapLinkIds: RS;
  readonly admissionRecordSourceMapIds: RS;
  readonly admissionRecordSourceMapMappingIds: RS;
  readonly admissionRecordSourceMapLinkIds: RS;
  readonly evidenceReceiptSourceMapIds: RS;
  readonly evidenceReceiptSourceMapMappingIds: RS;
  readonly evidenceReceiptSourceMapLinkIds: RS;
}

export interface UniversalConversionArtifactSourceMapQuery {
  readonly sourceMapId?: QS;
  readonly sourceMapIds?: RS;
  readonly sourceMapMappingId?: QS;
  readonly sourceMapMappingIds?: RS;
  readonly sourceMapLinkId?: QS;
  readonly sourceMapLinkIds?: RS;
  readonly routeSourceMapId?: QS;
  readonly routeSourceMapIds?: RS;
  readonly routeSourceMapMappingId?: QS;
  readonly routeSourceMapMappingIds?: RS;
  readonly routeSourceMapLinkId?: QS;
  readonly routeSourceMapLinkIds?: RS;
  readonly admissionRecordSourceMapId?: QS;
  readonly admissionRecordSourceMapIds?: RS;
  readonly admissionRecordSourceMapMappingId?: QS;
  readonly admissionRecordSourceMapMappingIds?: RS;
  readonly admissionRecordSourceMapLinkId?: QS;
  readonly admissionRecordSourceMapLinkIds?: RS;
  readonly evidenceReceiptSourceMapId?: QS;
  readonly evidenceReceiptSourceMapIds?: RS;
  readonly evidenceReceiptSourceMapMappingId?: QS;
  readonly evidenceReceiptSourceMapMappingIds?: RS;
  readonly evidenceReceiptSourceMapLinkId?: QS;
  readonly evidenceReceiptSourceMapLinkIds?: RS;
}

export interface UniversalConversionArtifactSourceMapCompactCounts {
  readonly routeArtifacts: number;
  readonly admissionRecords: number;
  readonly ids: Readonly<Record<string, number>>;
  readonly mappingIds: Readonly<Record<string, number>>;
  readonly linkIds: Readonly<Record<string, number>>;
}
