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

const HtmlTokenListEvidenceKinds = new Set([
  'frontier.lang.htmlClassTokenMergeEvidence',
  'frontier.lang.htmlTokenListMergeEvidence'
]);

const HtmlTokenListAttributes = new Set(['class', 'part', 'itemprop']);

export { hasHtmlClassTokenMergeEvidence, hasHtmlTokenListMergeEvidence, htmlClassTokenMergeEvidenceRecords, htmlTokenListMergeEvidenceRecords };
