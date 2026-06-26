function effectTargetOrderEvidence(line, lineNumber, group, start = 0, end = String(line ?? '').length, lines = []) {
  if (group?.regionKind !== 'effect') return [];
  const expression = String(line ?? '').slice(Math.max(0, start), Math.max(start, end));
  const context = { literalBindings: sameScopeLiteralBindings(lines, lineNumber, line, start) };
  const record = effectTargetRecord(expression, context) ?? effectTokenRecord(expression, context);
  return record ? [compactRecord({
    kind: 'effect-target',
    effectKind: effectFactKind(group),
    line: lineNumber,
    ...record,
    staticEffectTargetEvidence: true,
    runtimeEquivalenceClaim: false,
    semanticEquivalenceClaim: false
  })] : [];
}

function effectTargetSignatureEvidence(record) {
  return compactRecord({
    effectKind: record?.effectKind,
    targetText: record?.targetText,
    targetRoot: record?.targetRoot,
    receiverText: record?.receiverText,
    taggedTemplate: record?.taggedTemplate,
    calleeName: record?.calleeName,
    constructorCall: record?.constructorCall,
    optionalCall: record?.optionalCall,
    computedProperty: record?.computedProperty,
    computedPropertyKeys: record?.computedPropertyKeys,
    computedPropertyStatic: record?.computedPropertyStatic,
    computedPropertyDynamic: record?.computedPropertyDynamic,
    computedPropertyBoundLiteral: record?.computedPropertyBoundLiteral,
    computedPropertyBindingNames: record?.computedPropertyBindingNames,
    computedPropertyBindingKinds: record?.computedPropertyBindingKinds
  });
}

function effectTargetContextReasonCodes(record) {
  return uniqueStrings([
    'runtime-order-effect-target-merge-requires-effect-target-evidence',
    record?.calleeName ? 'runtime-order-effect-target-merge-requires-callee-evidence' : undefined,
    record?.taggedTemplate ? 'runtime-order-effect-target-merge-requires-tagged-template-target-evidence' : undefined,
    record?.receiverText ? 'runtime-order-effect-target-merge-requires-receiver-evidence' : undefined,
    record?.constructorCall ? 'runtime-order-effect-target-merge-requires-constructor-evidence' : undefined,
    record?.computedPropertyBoundLiteral ? 'runtime-order-effect-target-merge-requires-bound-computed-literal-key-evidence' : undefined,
    record?.computedPropertyStatic ? 'runtime-order-effect-target-merge-requires-computed-literal-key-evidence' : undefined,
    record?.computedPropertyDynamic ? 'runtime-order-effect-target-merge-requires-dynamic-computed-key-evidence' : undefined,
    record?.computedProperty ? 'runtime-order-effect-target-merge-requires-computed-key-evidence' : undefined,
    record?.optionalCall ? 'runtime-order-effect-target-merge-requires-nullish-boundary-evidence' : undefined
  ]);
}

function effectFactKind(group) { return (group?.factKinds ?? []).find(Boolean) ?? 'effect'; }

function effectTargetRecord(expression, context = {}) {
  const text = String(expression ?? '');
  const tagged = taggedTemplateTarget(text, context);
  if (tagged) return tagged;
  const call = /\b(new\s+)?([A-Za-z_$][\w$]*(?:(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)|\s*(?:\?\.)?\[[^\]]+\])*)\s*(\?\.)?\s*\(/.exec(text);
  if (!call) return undefined;
  const targetText = normalizeTargetText(call[2]);
  const parts = targetParts(targetText, context.literalBindings);
  return targetRecord(statementText(text, call.index), targetText, {
    calleeName: parts.calleeName,
    receiverText: parts.receiverText,
    constructorCall: Boolean(call[1]),
    optionalCall: Boolean(call[3]) || /\?\./.test(targetText)
  }, context);
}

function effectTokenRecord(expression, context = {}) {
  const match = /\b(import\s*\.\s*meta|localStorage|sessionStorage|indexedDB|caches|cookie|console|process|Deno|Bun|document|window|navigator|location|history)(?:(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)|\s*(?:\?\.)?\[[^\]]+\])*/.exec(String(expression ?? ''));
  return match ? targetRecord(statementText(expression, match.index), normalizeTargetText(match[0]), {}, context) : undefined;
}

function taggedTemplateTarget(expression, context = {}) {
  const match = /([A-Za-z_$][\w$]*(?:(?:\s*\.\s*[A-Za-z_$][\w$]*)|\s*\[[^\]]+\])*)\s*`/.exec(String(expression ?? ''));
  if (!match) return undefined;
  const targetText = normalizeTargetText(match[1]);
  const parts = targetParts(targetText, context.literalBindings);
  return targetRecord(statementText(expression, match.index), targetText, {
    taggedTemplate: true,
    calleeName: parts.calleeName,
    receiverText: parts.receiverText
  }, context);
}

function targetRecord(text, targetText, extra = {}, context = {}) {
  const computedProperties = computedPropertySegments(targetText, context.literalBindings);
  const literalComputedProperties = computedProperties.filter((entry) => entry.static);
  const boundLiteralComputedProperties = computedProperties.filter((entry) => entry.boundLiteral);
  return compactRecord({
    text: normalizeOrderEvidenceText(text),
    targetText,
    targetRoot: targetRoot(targetText),
    computedProperty: computedProperties.length > 0 || undefined,
    computedPropertyKeys: literalComputedProperties.map((entry) => entry.key),
    computedPropertyStatic: computedProperties.length > 0 && literalComputedProperties.length === computedProperties.length || undefined,
    computedPropertyDynamic: computedProperties.length > literalComputedProperties.length || undefined,
    computedPropertyCount: computedProperties.length || undefined,
    computedPropertyStaticCount: literalComputedProperties.length || undefined,
    computedPropertyBoundLiteral: boundLiteralComputedProperties.length > 0 || undefined,
    computedPropertyBindingNames: boundLiteralComputedProperties.map((entry) => entry.bindingName),
    computedPropertyBindingKinds: uniqueStrings(boundLiteralComputedProperties.map((entry) => entry.bindingKind)),
    computedPropertyRuntimeEquivalenceClaim: computedProperties.length > 0 ? false : undefined,
    ...extra
  });
}

function targetParts(targetText, literalBindings = new Map()) {
  const normalized = String(targetText ?? '');
  const computedTarget = /^(.*?)(?:\?\.)?\[([^\]]+)\]$/.exec(normalized);
  if (computedTarget) return { calleeName: computedPropertyKey(computedTarget[2], literalBindings)?.key, receiverText: computedTarget[1] || undefined };
  const memberTarget = /^(.*?)(?:\.|\?\.)?([A-Za-z_$][\w$]*)$/.exec(normalized);
  return memberTarget ? { calleeName: memberTarget[2], receiverText: memberTarget[1] || undefined } : {};
}

function statementText(line, start) { return String(line ?? '').slice(Math.max(0, start), statementEnd(line, start)); }
function statementEnd(line, start) { const semicolon = String(line ?? '').indexOf(';', start); return semicolon === -1 ? String(line ?? '').length : semicolon + 1; }
function normalizeTargetText(value) { return normalizeOrderEvidenceText(String(value ?? '').replace(/\s*(?:\.|\?\.)\s*/g, (match) => match.includes('?.') ? '?.' : '.').replace(/\s*\[\s*/g, '[').replace(/\s*\]\s*/g, ']')); }
function targetRoot(targetText) { return /^[A-Za-z_$][\w$]*/.exec(targetText)?.[0]; }
function computedPropertySegments(targetText, literalBindings = new Map()) { return [...String(targetText ?? '').matchAll(/\[([^\]]+)\]/g)].map((match) => { const expression = normalizeOrderEvidenceText(match[1]); const key = computedPropertyKey(expression, literalBindings); return compactRecord({ expression, key: key?.key, static: key?.key !== undefined || undefined, boundLiteral: key?.boundLiteral, bindingName: key?.bindingName, bindingKind: key?.bindingKind }); }); }
function computedPropertyKey(expression, literalBindings) { const literal = literalComputedPropertyKey(expression); if (literal !== undefined) return { key: literal }; const bound = literalBindings.get(expression); return bound ? { key: bound.value, boundLiteral: true, bindingName: expression, bindingKind: bound.kind } : undefined; }
function literalComputedPropertyKey(expression) { const quoted = /^(['"`])((?:\\.|(?!\1)[\s\S])*)\1$/.exec(String(expression ?? '')); if (quoted && !quoted[2].includes('${')) return quoted[2].replace(/\\([\\'"`])/g, '$1'); return /^(?:0|[1-9]\d*)$/.test(expression) ? expression : undefined; }
function sameScopeLiteralBindings(lines, lineNumber, line, start) {
  const before = Array.isArray(lines) ? sameBlockPrefix(lines, lineNumber, line, start) : String(line ?? '').slice(0, start);
  const bindings = new Map();
  for (const match of before.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(['"`])((?:\\.|(?!\2)[\s\S])*)\2\s*;?/g)) {
    if (!match[3].includes('${')) bindings.set(match[1], { value: match[3].replace(/\\([\\'"`])/g, '$1'), kind: 'same-scope-const-literal' });
  }
  return bindings;
}
function sameBlockPrefix(lines, lineNumber, line, start) {
  const prefix = [String(line ?? '').slice(0, start)];
  for (let index = lineNumber - 2; index >= 0 && prefix.length < 20; index -= 1) {
    const previous = String(lines[index] ?? '');
    if (/^\s*}/.test(previous)) break;
    prefix.unshift(previous);
    if (previous.includes('{')) break;
  }
  return prefix.join('\n');
}
function normalizeOrderEvidenceText(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function uniqueStrings(values) { return [...new Set((values ?? []).filter(Boolean).map(String))]; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))); }
export { effectTargetContextReasonCodes, effectTargetOrderEvidence, effectTargetSignatureEvidence };
