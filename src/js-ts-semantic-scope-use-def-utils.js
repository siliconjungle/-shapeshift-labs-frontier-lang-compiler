const identifierRegExp = /^[A-Za-z_$][\w$]*$/;
const identifierTokenRegExp = /[A-Za-z_$][\w$]*/g;
const valueNamespace = 'value';
const typeNamespace = 'type';

const LexicalUseDefReasonCodes = Object.freeze({
  noLiveReferences: 'lexical-use-def-no-live-references',
  invalidIdentifier: 'lexical-scope-invalid-identifier',
  templateLiteralUnsupported: 'lexical-scope-template-literal-unsupported',
  liveReference: 'lexical-scope-live-reference',
  closureReference: 'lexical-scope-closure-reference',
  shadowedBinding: 'lexical-scope-shadowed-binding',
  bindingConflict: 'lexical-scope-binding-conflict',
  typeValueNamespaceConflict: 'lexical-scope-type-value-namespace-conflict',
  namespaceComputedMemberUnsupported: 'lexical-scope-namespace-computed-member-unsupported',
  namespaceMemberWriteUnsupported: 'lexical-scope-namespace-member-write-unsupported',
  importAliasTargetUnresolved: 'lexical-scope-import-alias-target-unresolved'
});

const declarationNamespaceByKind = Object.freeze({
  function: [valueNamespace],
  variable: [valueNamespace],
  class: [valueNamespace, typeNamespace],
  enum: [valueNamespace, typeNamespace],
  type: [typeNamespace],
  interface: [typeNamespace],
  module: [valueNamespace, typeNamespace],
  namespace: [valueNamespace, typeNamespace]
});

function namespacesForDeclarationKind(kind) {
  return declarationNamespaceByKind[kind] ?? [valueNamespace];
}

function namespacesForImportRemoval(input) {
  return input.typeOnly ? [typeNamespace] : [valueNamespace, typeNamespace];
}

function normalizeNamespaces(value) {
  const raw = Array.isArray(value) ? value : [value ?? valueNamespace];
  const namespaces = uniqueStrings(raw
    .map((item) => String(item))
    .filter((item) => item === valueNamespace || item === typeNamespace));
  return namespaces.length ? namespaces : [valueNamespace];
}

function namespaceOverlap(left, right) {
  return left.some((namespace) => right.includes(namespace));
}

function normalizeRanges(ranges) {
  return (ranges ?? []).filter((range) => Number.isInteger(range?.start) && Number.isInteger(range?.end));
}

function spanRange(entry) {
  return Number.isInteger(entry?.start) && Number.isInteger(entry?.end)
    ? { start: entry.start, end: entry.end }
    : undefined;
}

function rangeAllowed(record, ranges) {
  return ranges.some((range) => record.start >= range.start && record.end <= range.end);
}

function rangeKey(record) {
  return `${record.start}:${record.end}`;
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record ?? {}).filter(([, value]) => value !== undefined));
}

function uniqueStrings(values) {
  return [...new Set((values ?? []).filter((value) => typeof value === 'string' && value.length > 0))];
}

function uniqueBindings(bindings) {
  const seen = new Set();
  const result = [];
  for (const binding of bindings) {
    const key = `${binding.kind}:${binding.name}:${binding.start}:${binding.end}:${binding.namespaces.join('|')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(binding);
  }
  return result;
}

function lineNumber(sourceText, offset) {
  return String(sourceText ?? '').slice(0, offset).split('\n').length;
}

function nextSignificantCharIndex(code, start) {
  for (let index = start; index < code.length; index += 1) {
    if (!/\s/.test(code[index])) return index;
  }
  return -1;
}

function findMatchingParen(code, open) {
  let depth = 0;
  for (let index = open; index < code.length; index += 1) {
    if (code[index] === '(') depth += 1;
    else if (code[index] === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

export {
  LexicalUseDefReasonCodes,
  compactRecord,
  findMatchingParen,
  identifierRegExp,
  identifierTokenRegExp,
  lineNumber,
  namespaceOverlap,
  namespacesForDeclarationKind,
  namespacesForImportRemoval,
  nextSignificantCharIndex,
  normalizeNamespaces,
  normalizeRanges,
  rangeAllowed,
  rangeKey,
  spanRange,
  typeNamespace,
  uniqueBindings,
  uniqueStrings,
  valueNamespace
};
