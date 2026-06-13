import { uniqueStrings } from '../../native-import-utils.js';

function summarizeSemanticSidecarQuality(sources) {
  const records = uniqueSemanticSidecarQualityRecords(array(sources).flatMap(semanticSidecarQualityRecords));
  const warningCodes = uniqueStrings(records.flatMap(sidecarQualityWarningCodes));
  const zeroRecordWarningCodes = uniqueStrings(records.flatMap(sidecarQualityZeroRecordWarningCodes));
  return {
    records: records.length,
    symbols: records.reduce((sum, record) => sum + sidecarQualityCount(record, 'symbolCount', 'symbols'), 0),
    ownershipRegions: records.reduce((sum, record) => sum + sidecarQualityCount(record, 'ownershipRegionCount', 'ownershipRegions'), 0),
    patchHints: records.reduce((sum, record) => sum + sidecarQualityCount(record, 'patchHintCount', 'patchHints'), 0),
    warnings: records.reduce((sum, record) => sum + sidecarQualityWarningCount(record), 0),
    zeroRecordWarnings: zeroRecordWarningCodes.length,
    warningCodes,
    zeroRecordWarningCodes
  };
}

function semanticSidecarQualityRecords(source) {
  if (!source || typeof source !== 'object') return [];
  return [
    source.semanticSidecarQuality,
    source.sidecarQuality,
    source.semanticSidecar?.quality,
    source.sidecar?.quality,
    source.semanticSidecarAdmission,
    source.sidecarAdmission,
    source.semanticSidecar?.admission,
    source.sidecar?.admission,
    source.metadata?.semanticSidecarQuality,
    source.metadata?.sidecarQuality,
    source.metadata?.semanticSidecarAdmission,
    source.metadata?.sidecarAdmission
  ].filter(looksLikeSemanticSidecarQuality);
}

function looksLikeSemanticSidecarQuality(value) {
  return value && typeof value === 'object' && (
    value.schema === 'frontier.lang.semanticSidecarQuality.v1' ||
    value.schema === 'frontier.lang.semanticSidecarAdmission.v1' ||
    value.imported !== undefined ||
    value.eligible !== undefined ||
    value.expectedSatisfied !== undefined ||
    value.warningCount !== undefined ||
    value.emptyEvidenceWarnings !== undefined ||
    value.proofSummary !== undefined ||
    value.counts !== undefined
  );
}

function uniqueSemanticSidecarQualityRecords(records) {
  const seen = new Set();
  const result = [];
  for (const record of records) {
    const key = record.id ?? JSON.stringify({
      schema: record.schema,
      symbols: sidecarQualityCount(record, 'symbolCount', 'symbols'),
      ownershipRegions: sidecarQualityCount(record, 'ownershipRegionCount', 'ownershipRegions'),
      patchHints: sidecarQualityCount(record, 'patchHintCount', 'patchHints'),
      warningCodes: sidecarQualityWarningCodes(record)
    });
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(record);
  }
  return result;
}

function sidecarQualityCount(record, field, countsField) {
  for (const value of [record?.[field], record?.counts?.[countsField]]) {
    const count = Number(value ?? 0);
    if (Number.isFinite(count) && count > 0) return count;
  }
  return 0;
}

function sidecarQualityWarningCount(record) {
  const count = Number(record?.warningCount ?? 0);
  if (Number.isFinite(count) && count > 0) return count;
  return sidecarQualityWarningCodes(record).length;
}

function sidecarQualityWarningCodes(record) {
  return uniqueStrings([
    ...array(record?.warnings).map((warning) => warning?.code ?? warning?.reasonCode),
    ...array(record?.emptyEvidenceWarnings).map((warning) => warning?.code ?? warning?.reasonCode),
    ...strings(record?.expectedMissingReasonCodes),
    ...strings(record?.reasonCodes)
  ].filter(Boolean));
}

function sidecarQualityZeroRecordWarningCodes(record) {
  return sidecarQualityWarningCodes(record).filter(isZeroRecordWarningCode);
}

function isZeroRecordWarningCode(code) {
  return [
    'empty-evidence',
    'empty-semantic-index',
    'expected-semantic-import-empty',
    'expected-semantic-import-missing',
    'missing-imports',
    'missing-ownership-regions',
    'missing-patch-hints'
  ].includes(code);
}

function array(value) { if (value === undefined || value === null) return []; return Array.isArray(value) ? value : [value]; }
function strings(value) { return array(value).map((entry) => String(entry ?? '')).filter(Boolean); }

export { summarizeSemanticSidecarQuality };
