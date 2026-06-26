import { collectBindings } from './js-ts-semantic-scope-use-def-bindings.js';
import {
  createBraceDepthIndex,
  isPropertyAccess,
  likelyTypeReference,
  maskNonCode,
  tokenize
} from './js-ts-semantic-scope-use-def-scan.js';
import {
  LexicalUseDefReasonCodes,
  compactRecord,
  identifierRegExp,
  lineNumber,
  namespaceOverlap,
  namespacesForDeclarationKind,
  namespacesForImportRemoval,
  normalizeNamespaces,
  normalizeRanges,
  rangeAllowed,
  rangeKey,
  spanRange,
  uniqueStrings
} from './js-ts-semantic-scope-use-def-utils.js';

function analyzeTopLevelRenameUseDefEvidence(input) {
  const namespaces = namespacesForDeclarationKind(input.declarationKind);
  return lexicalEvidenceRecord({
    operation: 'top-level-rename',
    sourcePath: input.sourcePath,
    bindingName: input.fromName,
    targetName: input.toName,
    namespaces,
    checks: [
      check(input.baseSourceText, input, 'base-from-binding', input.fromName, namespaces, [spanRange(input.fromEntry)]),
      check(input.headSourceText, input, 'head-from-binding', input.fromName, namespaces, [spanRange(input.headEntry ?? input.fromEntry)]),
      check(input.workerSourceText, input, 'worker-old-binding', input.fromName, namespaces),
      check(input.baseSourceText, input, 'base-target-name', input.toName, namespaces),
      check(input.headSourceText, input, 'head-target-name', input.toName, namespaces),
      check(input.workerSourceText, input, 'worker-target-binding', input.toName, namespaces, [spanRange(input.toEntry)])
    ]
  });
}

function analyzeImportRemovalUseDefEvidence(input) {
  const namespaces = namespacesForImportRemoval(input);
  return lexicalEvidenceRecord({
    operation: 'import-specifier-removal',
    sourcePath: input.sourcePath,
    bindingName: input.localName,
    importedName: input.importedName,
    removedSpecifier: input.removedSpecifier,
    moduleSpecifier: input.moduleSpecifier,
    namespaces,
    checks: [check(input.sourceText, input, 'worker-import-removal', input.localName, namespaces)]
  });
}

function check(sourceText, input, phase, bindingName, namespaces, allowedBindingRanges) {
  return analyzeJsTsLexicalBindingReferences(sourceText, {
    sourcePath: input.sourcePath,
    phase,
    bindingName,
    namespaces,
    allowedBindingRanges
  });
}

function analyzeJsTsLexicalBindingReferences(sourceText, input = {}) {
  const bindingName = String(input.bindingName ?? input.name ?? '');
  const namespaces = normalizeNamespaces(input.namespaces ?? input.namespace);
  if (!identifierRegExp.test(bindingName)) return blockedCheck(input, bindingName, namespaces, [LexicalUseDefReasonCodes.invalidIdentifier]);

  const masked = maskNonCode(sourceText);
  const tokens = tokenize(masked.code);
  const depthAt = createBraceDepthIndex(masked.code);
  const bindings = collectBindings(masked.code, tokens, depthAt);
  const bindingKeys = new Set(bindings.map((binding) => rangeKey(binding)));
  const allowedRanges = normalizeRanges(input.allowedBindingRanges);
  const matchingBindings = bindings.filter((binding) => binding.name === bindingName && namespaceOverlap(binding.namespaces, namespaces));
  const nonAllowedBindings = matchingBindings.filter((binding) => !rangeAllowed(binding, allowedRanges));
  const namespaceConflicts = bindings.filter((binding) => binding.name === bindingName
    && !namespaceOverlap(binding.namespaces, namespaces)
    && !rangeAllowed(binding, allowedRanges));
  const references = tokens
    .map((token, index) => ({ ...token, index, depth: depthAt[token.start] ?? 0 }))
    .filter((token) => token.value === bindingName)
    .filter((token) => !bindingKeys.has(rangeKey(token)))
    .filter((token) => !isPropertyAccess(masked.code, token.start))
    .map((token) => referenceRecord(sourceText, masked, tokens, token, namespaces));

  const reasonCodes = uniqueStrings([
    ...(masked.unsupportedTemplateLiteral ? [LexicalUseDefReasonCodes.templateLiteralUnsupported] : []),
    ...(references.length ? [LexicalUseDefReasonCodes.liveReference] : []),
    ...(references.some((reference) => reference.closure) ? [LexicalUseDefReasonCodes.closureReference] : []),
    ...(nonAllowedBindings.some((binding) => binding.depth > 0 || binding.kind === 'param') ? [LexicalUseDefReasonCodes.shadowedBinding] : []),
    ...(nonAllowedBindings.some((binding) => binding.depth === 0 && binding.kind !== 'param') ? [LexicalUseDefReasonCodes.bindingConflict] : []),
    ...(namespaceConflicts.length ? [LexicalUseDefReasonCodes.typeValueNamespaceConflict] : [])
  ]);
  const status = reasonCodes.length ? 'blocked' : 'no-live-references';
  return compactRecord({
    kind: 'frontier.lang.jsTsLexicalUseDefCheck',
    version: 1,
    status,
    phase: input.phase,
    sourcePath: input.sourcePath,
    bindingName,
    namespaces,
    reasonCodes: status === 'blocked' ? reasonCodes : [LexicalUseDefReasonCodes.noLiveReferences],
    summary: checkSummary(references, nonAllowedBindings, namespaceConflicts),
    references: references.slice(0, 12),
    shadowedBindings: filteredBindings(nonAllowedBindings, true).map(bindingRecord),
    bindingConflicts: filteredBindings(nonAllowedBindings, false).map(bindingRecord),
    namespaceConflicts: namespaceConflicts.slice(0, 12).map(bindingRecord)
  });
}

function lexicalEvidenceRecord(input) {
  const blockedReasonCodes = uniqueStrings(input.checks
    .filter((item) => item.status === 'blocked')
    .flatMap((item) => item.reasonCodes ?? [])
    .filter((code) => code !== LexicalUseDefReasonCodes.noLiveReferences));
  const status = blockedReasonCodes.length ? 'blocked' : 'no-live-references';
  return compactRecord({
    kind: 'frontier.lang.jsTsLexicalUseDefEvidence',
    version: 1,
    operation: input.operation,
    status,
    sourcePath: input.sourcePath,
    bindingName: input.bindingName,
    targetName: input.targetName,
    importedName: input.importedName,
    removedSpecifier: input.removedSpecifier,
    moduleSpecifier: input.moduleSpecifier,
    namespaces: input.namespaces,
    reasonCodes: status === 'blocked' ? blockedReasonCodes : [LexicalUseDefReasonCodes.noLiveReferences],
    summary: evidenceSummary(input.checks),
    checks: input.checks
  });
}

function checkSummary(references, bindings, namespaceConflicts) {
  return {
    references: references.length,
    closureReferences: references.filter((reference) => reference.closure).length,
    templateLiteralReferences: references.filter((reference) => reference.templateLiteralInterpolation).length,
    shadowedBindings: filteredBindings(bindings, true).length,
    bindingConflicts: filteredBindings(bindings, false).length,
    namespaceConflicts: namespaceConflicts.length
  };
}

function evidenceSummary(checks) {
  return {
    checks: checks.length,
    references: sum(checks, 'references'),
    closureReferences: sum(checks, 'closureReferences'),
    templateLiteralReferences: sum(checks, 'templateLiteralReferences'),
    shadowedBindings: sum(checks, 'shadowedBindings'),
    bindingConflicts: sum(checks, 'bindingConflicts'),
    namespaceConflicts: sum(checks, 'namespaceConflicts')
  };
}

function referenceRecord(sourceText, masked, tokens, token, namespaces) {
  const templateExpression = templateExpressionRangeForOffset(masked.templateExpressionRanges, token.start);
  return compactRecord({
    name: token.value,
    start: token.start,
    end: token.end,
    line: lineNumber(sourceText, token.start),
    namespace: likelyTypeReference(masked.code, tokens, token.index) ? 'type' : 'value',
    namespaces,
    referenceKind: templateExpression ? 'template-literal-interpolation' : undefined,
    templateLiteralInterpolation: templateExpression ? true : undefined,
    templateExpressionStart: templateExpression?.start,
    templateExpressionEnd: templateExpression?.end,
    closure: token.depth > 0,
    depth: token.depth
  });
}

function bindingRecord(binding) {
  return { kind: binding.kind, name: binding.name, start: binding.start, end: binding.end, depth: binding.depth, namespaces: binding.namespaces };
}

function filteredBindings(bindings, shadowed) {
  return bindings.filter((binding) => shadowed ? binding.depth > 0 || binding.kind === 'param' : binding.depth === 0 && binding.kind !== 'param').slice(0, 12);
}

function sum(checks, field) {
  return checks.reduce((total, item) => total + (item.summary?.[field] ?? 0), 0);
}

function blockedCheck(input, bindingName, namespaces, reasonCodes) {
  return {
    kind: 'frontier.lang.jsTsLexicalUseDefCheck',
    version: 1,
    status: 'blocked',
    phase: input.phase,
    sourcePath: input.sourcePath,
    bindingName,
    namespaces,
    reasonCodes,
    summary: { references: 0, closureReferences: 0, templateLiteralReferences: 0, shadowedBindings: 0, bindingConflicts: 0, namespaceConflicts: 0 }
  };
}

function templateExpressionRangeForOffset(ranges = [], offset) {
  return ranges.find((range) => offset >= range.start && offset < range.end);
}

export {
  LexicalUseDefReasonCodes,
  analyzeImportRemovalUseDefEvidence,
  analyzeJsTsLexicalBindingReferences,
  analyzeTopLevelRenameUseDefEvidence
};
