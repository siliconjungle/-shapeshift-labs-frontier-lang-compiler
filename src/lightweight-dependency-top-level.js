import { idFragment } from './native-import-utils.js';
import { lightweightEffectKinds } from './lightweight-dependency-effects.js';
import { maskDependencyLine } from './lightweight-dependency-language.js';

function lightweightTopLevelRuntimeFacts(input, documentId, lines) {
  if (!isJavaScriptLike(input)) return [];
  const records = [];
  const state = { inBlockComment: false };
  let braceDepth = 0;
  for (const { line, number } of lines ?? []) {
    const scanLine = maskDependencyLine(input, line, state);
    const text = scanLine.trim();
    if (braceDepth === 0 && hasTopLevelAwait(text)) {
      for (const kind of ['async', ...lightweightEffectKinds(line).filter((item) => item !== 'async')]) {
        records.push(topLevelFact(input, documentId, 'effect', kind, number));
      }
      records.push(topLevelFact(input, documentId, 'controlFlow', 'async', number));
    }
    braceDepth = Math.max(0, braceDepth + braceDelta(scanLine));
  }
  return records;
}

function topLevelFact(input, documentId, predicate, kind, lineNumber) {
  const subjectId = `symbol:${input.language ?? 'javascript'}:module:${idFragment(documentId)}`;
  return {
    id: `fact_${idFragment(subjectId)}_${predicate}_${idFragment(kind)}_${lineNumber}`,
    predicate,
    subjectId,
    value: {
      kind,
      line: lineNumber,
      sourcePath: input.sourcePath,
      documentId,
      confidence: 'lexical-source-scan',
      runtimeScope: 'module',
      subjectName: '<module>',
      topLevelAwait: true
    }
  };
}

function hasTopLevelAwait(text) {
  const index = String(text ?? '').search(/\bawait\b/);
  if (index < 0) return false;
  const before = text.slice(0, index);
  return !/\bfunction\b|=>/.test(before) && braceDelta(before) === 0;
}

function braceDelta(text) {
  let delta = 0;
  for (const char of String(text ?? '')) {
    if (char === '{') delta += 1;
    else if (char === '}') delta -= 1;
  }
  return delta;
}

function isJavaScriptLike(input) {
  return ['javascript', 'typescript'].includes(String(input?.language ?? '').toLowerCase());
}

export { lightweightTopLevelRuntimeFacts };
