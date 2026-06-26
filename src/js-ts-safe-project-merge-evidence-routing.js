function failedEvidenceMissingItems(evidence = []) {
  return evidence
    .filter((record) => record?.status === 'failed' && isPlainObject(record.metadata?.nextMissingEvidence))
    .map((record) => {
      const nextMissingEvidence = record.metadata.nextMissingEvidence;
      const route = nextMissingEvidence.route;
      return compactRecord({
        ...nextMissingEvidence,
        status: nextMissingEvidence.status ?? 'missing-or-failed',
        evidenceId: record.id,
        routeId: nextMissingEvidence.routeId ?? route?.id,
        routeLane: nextMissingEvidence.routeLane ?? route?.lane,
        routeNext: nextMissingEvidence.routeNext ?? route?.next,
        autoMergeClaim: false,
        semanticEquivalenceClaim: false
      });
    });
}

function fileAdmissionEvidenceRecords(files = []) {
  return files.flatMap((file) => [
    ...recordArraysWithSuffix(file.summary, 'AdmissionEvidence'),
    ...recordArraysWithSuffix(file.metadata, 'Admissions')
  ]);
}

function recordArraysWithSuffix(record, suffix) {
  if (!isPlainObject(record)) return [];
  return Object.entries(record)
    .filter(([key, value]) => key.endsWith(suffix) && Array.isArray(value))
    .flatMap(([, value]) => value)
    .filter((value) => value?.kind && value?.id);
}

function isPlainObject(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { failedEvidenceMissingItems, fileAdmissionEvidenceRecords };
