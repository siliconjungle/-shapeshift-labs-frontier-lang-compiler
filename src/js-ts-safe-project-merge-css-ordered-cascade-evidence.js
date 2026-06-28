function hasCssOrderedCascadeOccurrenceEvidence(file) {
  return cssOrderedCascadeOccurrenceEvidenceRecords(file).length > 0;
}

function cssOrderedCascadeOccurrenceEvidenceRecords(file) {
  const result = file?.result ?? {};
  return uniqueEvidence([
    ...asArray(result.orderedCascadeOccurrenceEvidence),
    ...asArray(result.cssOrderedCascadeOccurrenceEvidence),
    ...asArray(result.admission?.cssOrderedCascadeOccurrenceEvidence),
    ...asArray(file?.admission?.cssOrderedCascadeOccurrenceEvidence)
  ].filter(isOrderedCascadeOccurrenceEvidence));
}

function isOrderedCascadeOccurrenceEvidence(record) {
  return record?.kind === 'frontier.lang.cssOrderedCascadeOccurrenceEvidence' &&
    record.parserBackedDeclarationOrder === true &&
    record.sourceBound === true &&
    record.autoMergeClaim === false &&
    record.semanticEquivalenceClaim === false &&
    record.browserCascadeEquivalenceClaim === false &&
    record.browserRenderEquivalenceClaim === false &&
    typeof record.evidenceHash === 'string';
}

function uniqueEvidence(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = record.evidenceHash ?? `${record.sourcePath ?? ''}#${record.cascadeKey ?? ''}#${record.occurrenceCount ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export { cssOrderedCascadeOccurrenceEvidenceRecords, hasCssOrderedCascadeOccurrenceEvidence };
