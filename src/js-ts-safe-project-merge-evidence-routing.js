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
  ].map(admissionEvidenceRecordWithOutcome));
}

function recordArraysWithSuffix(record, suffix) {
  if (!isPlainObject(record)) return [];
  return Object.entries(record)
    .filter(([key, value]) => key.endsWith(suffix) && Array.isArray(value))
    .flatMap(([, value]) => value)
    .filter((value) => value?.kind && value?.id);
}

function admissionEvidenceRecordWithOutcome(record) {
  const admissionOutcome = admissionEvidenceOutcome(record);
  return compactRecord({
    ...record,
    admissionOutcome,
    admissionOutcomeReasonCode: admissionEvidenceOutcomeReasonCode(record, admissionOutcome)
  });
}

function admissionEvidenceOutcome(record) {
  if (['safe', 'review', 'blocked'].includes(record?.admissionOutcome)) return record.admissionOutcome;
  const routeStatus = record?.admissionRoute?.status;
  if (record?.status === 'passed' && (!routeStatus || routeStatus === 'passed')) return 'safe';
  if (record?.status === 'failed' || routeStatus === 'failed' || routeStatus === 'blocked') return 'blocked';
  return 'review';
}

function admissionEvidenceOutcomeReasonCode(record, admissionOutcome) {
  if (typeof record?.admissionOutcomeReasonCode === 'string' && record.admissionOutcomeReasonCode.length > 0) return record.admissionOutcomeReasonCode;
  const routeReasonCode = record?.admissionRoute?.reasonCodes?.[0];
  if (typeof record?.details?.reasonCode === 'string' && record.details.reasonCode.length > 0) return record.details.reasonCode;
  if (typeof routeReasonCode === 'string' && routeReasonCode.length > 0) return routeReasonCode;
  if (admissionOutcome === 'safe' && record?.details?.exactBranchOutput === true) return 'passed-exact-branch-output';
  if (admissionOutcome === 'safe') return 'passed-admission-evidence';
  if (admissionOutcome === 'blocked') return 'failed-admission-evidence';
  return 'review-admission-evidence';
}

function isPlainObject(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { admissionEvidenceOutcome, failedEvidenceMissingItems, fileAdmissionEvidenceRecords };
