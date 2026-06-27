function cssDescriptorEvidenceCount(evidence) {
  return cssFontFaceDescriptorEvidenceCount(evidence) + cssPropertyDescriptorEvidenceCount(evidence) + cssPageDescriptorEvidenceCount(evidence);
}

function cssFontFaceDescriptorEvidenceCount(evidence) {
  const fontFaces = evidence?.records?.fontFaces;
  const srcDescriptors = fontFaceSrcDescriptorRecords(evidence);
  const sourceBoundFamilies = Array.isArray(fontFaces) ? fontFaces.filter(hasSourceBoundDescriptorRecord).length : 0;
  return sourceBoundFamilies > 0 && srcDescriptors.length > 0 ? sourceBoundFamilies + srcDescriptors.length : 0;
}

function cssPropertyDescriptorEvidenceCount(evidence) {
  const registrations = sourceBoundRecords(evidence?.records?.propertyRegistrations);
  const descriptors = sourceBoundRecords(evidence?.records?.propertyRegistrationDescriptors);
  return registrations.length > 0 && descriptors.length > 0 ? registrations.length + descriptors.length : 0;
}

function cssPageDescriptorEvidenceCount(evidence) {
  return sourceBoundRecords(evidence?.records?.pageDescriptors).length + sourceBoundRecords(evidence?.records?.pageMarginDescriptors).length;
}

function hasSourceBoundPropertyDescriptorEvidence(evidence) { return cssPropertyDescriptorEvidenceCount(evidence) > 0; }
function hasSourceBoundPageDescriptorEvidence(evidence) { return cssPageDescriptorEvidenceCount(evidence) > 0; }
function fontFaceSrcDescriptorRecords(evidence) { return (evidence?.records?.urlAssetReferences ?? []).filter((record) => record?.sourceKind === 'font-face-src' && hasSourceBoundDescriptorRecord(record)); }
function sourceBoundRecords(records) { return Array.isArray(records) ? records.filter(hasSourceBoundDescriptorRecord) : []; }
function hasSourceBoundDescriptorRecord(record) { return isPlainObject(record?.sourceSpan) && Number.isInteger(record.sourceSpan.startOffset) && typeof record.sourceHash === 'string'; }
function isPlainObject(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }

export { cssDescriptorEvidenceCount, cssFontFaceDescriptorEvidenceCount, cssPageDescriptorEvidenceCount, cssPropertyDescriptorEvidenceCount, hasSourceBoundPageDescriptorEvidence, hasSourceBoundPropertyDescriptorEvidence };
