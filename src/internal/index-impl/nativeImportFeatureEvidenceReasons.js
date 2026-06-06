import{uniqueStrings}from'../../native-import-utils.js';
export function nativeImportFeatureEvidenceReasons(issues) {
  return uniqueStrings((issues ?? []).flatMap((issue) => {
    const missing = issue.missingRequiredEvidence ?? [];
    if (!missing.length) return [];
    return [`${issue.kind} loss ${issue.lossId} is missing required evidence: ${missing.join(', ')}.`];
  }));
}
