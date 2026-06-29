function hasHtmlClassTokenMergeEvidence(file) {
  const records = htmlClassTokenMergeEvidenceRecords(file);
  return records.length > 0 && records.every((record) => record?.kind === 'frontier.lang.htmlClassTokenMergeEvidence' &&
    record.parserBackedClassList === true &&
    record.tokenSetSemantics === 'html-class-space-separated-tokens' &&
    record.autoMergeClaim === false &&
    record.semanticEquivalenceClaim === false &&
    record.browserRuntimeEquivalenceClaim === false &&
    record.browserRenderEquivalenceClaim === false &&
    typeof record.evidenceHash === 'string');
}

function hasHtmlTokenListMergeEvidence(file) {
  const records = htmlTokenListMergeEvidenceRecords(file);
  return records.length > 0 && records.every((record) => HtmlTokenListEvidenceKinds.has(record?.kind) &&
    HtmlTokenListAttributes.has(String(record.attributeName ?? '').toLowerCase()) &&
    record.parserBackedTokenList === true &&
    typeof record.tokenSetSemantics === 'string' &&
    record.autoMergeClaim === false &&
    record.semanticEquivalenceClaim === false &&
    record.browserRuntimeEquivalenceClaim === false &&
    record.browserRenderEquivalenceClaim === false &&
    typeof record.evidenceHash === 'string');
}

function htmlClassTokenMergeEvidenceRecords(file) {
  return [
    ...(Array.isArray(file?.result?.htmlClassTokenMergeEvidence) ? file.result.htmlClassTokenMergeEvidence : []),
    ...(Array.isArray(file?.result?.classTokenMergeEvidence) ? file.result.classTokenMergeEvidence : [])
  ];
}

function htmlTokenListMergeEvidenceRecords(file) {
  const records = [
    ...(Array.isArray(file?.result?.htmlTokenListMergeEvidence) ? file.result.htmlTokenListMergeEvidence : []),
    ...(Array.isArray(file?.result?.tokenListMergeEvidence) ? file.result.tokenListMergeEvidence : [])
  ];
  return records.length ? records : htmlClassTokenMergeEvidenceRecords(file);
}

function htmlStructuralMergeEvidenceSummary(htmlFiles) {
  return {
    htmlClassTokenMergeFiles: htmlFiles.filter(hasHtmlClassTokenMergeEvidence).length,
    htmlClassTokenMergeEvidenceRecords: htmlFiles.reduce((sum, file) => sum + htmlClassTokenMergeEvidenceRecords(file).length, 0),
    htmlTokenListMergeFiles: htmlFiles.filter(hasHtmlTokenListMergeEvidence).length,
    htmlTokenListMergeEvidenceRecords: htmlFiles.reduce((sum, file) => sum + htmlTokenListMergeEvidenceRecords(file).length, 0),
    htmlUnkeyedStructuralAddFiles: htmlFiles.filter(hasHtmlUnkeyedStructuralAddEvidence).length,
    htmlUnkeyedStructuralAddEvidenceRecords: htmlFiles.reduce((sum, file) => sum + htmlUnkeyedStructuralAddEvidenceRecords(file).length, 0),
    htmlUnkeyedStructuralDeleteFiles: htmlFiles.filter(hasHtmlUnkeyedStructuralDeleteEvidence).length,
    htmlUnkeyedStructuralDeleteEvidenceRecords: htmlFiles.reduce((sum, file) => sum + htmlUnkeyedStructuralDeleteEvidenceRecords(file).length, 0),
    htmlUnkeyedStructuralMoveFiles: htmlFiles.filter(hasHtmlUnkeyedStructuralMoveEvidence).length,
    htmlUnkeyedStructuralMoveEvidenceRecords: htmlFiles.reduce((sum, file) => sum + htmlUnkeyedStructuralMoveEvidenceRecords(file).length, 0)
  };
}

function hasHtmlUnkeyedStructuralAddEvidence(file) {
  return htmlUnkeyedStructuralAddEvidenceRecords(file).length > 0;
}

function htmlUnkeyedStructuralAddEvidenceRecords(file) {
  return uniqueEvidence([
    ...(Array.isArray(file?.result?.htmlUnkeyedStructuralAddEvidence) ? file.result.htmlUnkeyedStructuralAddEvidence : []),
    ...(Array.isArray(file?.result?.admission?.htmlUnkeyedStructuralAddEvidence) ? file.result.admission.htmlUnkeyedStructuralAddEvidence : []),
    ...(Array.isArray(file?.admission?.htmlUnkeyedStructuralAddEvidence) ? file.admission.htmlUnkeyedStructuralAddEvidence : [])
  ].filter((record) => record?.kind === 'frontier.lang.htmlUnkeyedStructuralAddEvidence' && record.parentExplicitIdentity === true && record.addOnly === true && record.autoMergeClaim === false && record.semanticEquivalenceClaim === false && typeof record.evidenceHash === 'string'));
}

function hasHtmlUnkeyedStructuralDeleteEvidence(file) {
  return htmlUnkeyedStructuralDeleteEvidenceRecords(file).length > 0;
}

function htmlUnkeyedStructuralDeleteEvidenceRecords(file) {
  return uniqueEvidence([
    ...(Array.isArray(file?.result?.htmlUnkeyedStructuralDeleteEvidence) ? file.result.htmlUnkeyedStructuralDeleteEvidence : []),
    ...(Array.isArray(file?.result?.admission?.htmlUnkeyedStructuralDeleteEvidence) ? file.result.admission.htmlUnkeyedStructuralDeleteEvidence : []),
    ...(Array.isArray(file?.admission?.htmlUnkeyedStructuralDeleteEvidence) ? file.admission.htmlUnkeyedStructuralDeleteEvidence : [])
  ].filter((record) => record?.kind === 'frontier.lang.htmlUnkeyedStructuralDeleteEvidence' && record.parentExplicitIdentity === true && record.deleteOnly === true && record.autoMergeClaim === false && record.semanticEquivalenceClaim === false && typeof record.evidenceHash === 'string'));
}

function hasHtmlUnkeyedStructuralMoveEvidence(file) {
  return htmlUnkeyedStructuralMoveEvidenceRecords(file).length > 0;
}

function htmlUnkeyedStructuralMoveEvidenceRecords(file) {
  return uniqueEvidence([
    ...(Array.isArray(file?.result?.htmlUnkeyedStructuralMoveEvidence) ? file.result.htmlUnkeyedStructuralMoveEvidence : []),
    ...(Array.isArray(file?.result?.admission?.htmlUnkeyedStructuralMoveEvidence) ? file.result.admission.htmlUnkeyedStructuralMoveEvidence : []),
    ...(Array.isArray(file?.admission?.htmlUnkeyedStructuralMoveEvidence) ? file.admission.htmlUnkeyedStructuralMoveEvidence : [])
  ].filter((record) => record?.kind === 'frontier.lang.htmlUnkeyedStructuralMoveEvidence' && record.parentExplicitIdentity === true && record.moveOnly === true && record.exactSubtreeText === true && record.keyedSiblingAnchor === true && record.autoMergeClaim === false && record.semanticEquivalenceClaim === false && record.browserRenderEquivalenceClaim === false && typeof record.evidenceHash === 'string'));
}

function uniqueEvidence(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = record.evidenceHash ?? `${record.sourcePath ?? ''}#${record.recordKey ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const HtmlTokenListEvidenceKinds = new Set([
  'frontier.lang.htmlClassTokenMergeEvidence',
  'frontier.lang.htmlTokenListMergeEvidence'
]);

const HtmlTokenListAttributes = new Set(['class', 'part', 'itemprop']);

export { hasHtmlClassTokenMergeEvidence, hasHtmlTokenListMergeEvidence, htmlClassTokenMergeEvidenceRecords, htmlStructuralMergeEvidenceSummary, htmlTokenListMergeEvidenceRecords, htmlUnkeyedStructuralAddEvidenceRecords, htmlUnkeyedStructuralDeleteEvidenceRecords, htmlUnkeyedStructuralMoveEvidenceRecords };
