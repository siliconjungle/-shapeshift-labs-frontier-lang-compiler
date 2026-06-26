import { uniqueStrings } from './native-import-utils.js';

function importMetaHostContextEvidence(expressionText, evidence = {}) {
  const importMetaHostContext = importMetaHostContextRecords(expressionText);
  if (!importMetaHostContext.length) return evidence;
  return compactRecord({
    ...evidence,
    hostContext: 'import.meta',
    importMetaHostContext,
    importMetaMemberNames: uniqueStrings(importMetaHostContext.map((record) => record.memberName))
  });
}

function importMetaHostContextRecords(expressionText) {
  return [...String(expressionText ?? '').matchAll(/\bimport\s*\.\s*meta((?:\s*\.\s*[A-Za-z_$][\w$]*)*)/g)]
    .map((match, ordinal) => {
      const memberPath = uniqueStrings([...String(match[1] ?? '').matchAll(/\.\s*([A-Za-z_$][\w$]*)/g)]
        .map((item) => item[1]));
      return compactRecord({
        kind: 'import-meta',
        ordinal: ordinal + 1,
        text: match[0].replace(/\s+/g, ' ').trim(),
        memberName: memberPath[0],
        memberPath
      });
    });
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0)));
}

export { importMetaHostContextEvidence, importMetaHostContextRecords };
