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

function htmlClassTokenMergeEvidenceRecords(file) {
  return [
    ...(Array.isArray(file?.result?.htmlClassTokenMergeEvidence) ? file.result.htmlClassTokenMergeEvidence : []),
    ...(Array.isArray(file?.result?.classTokenMergeEvidence) ? file.result.classTokenMergeEvidence : [])
  ];
}

export { hasHtmlClassTokenMergeEvidence, htmlClassTokenMergeEvidenceRecords };
