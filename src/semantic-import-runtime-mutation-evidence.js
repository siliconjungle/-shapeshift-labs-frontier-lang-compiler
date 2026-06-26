function mutationTargetOrderEvidence(line, lineNumber, group, start = 0, end = String(line ?? '').length) {
  if (group?.regionKind !== 'mutation') return [];
  const mutationKind = mutationFactKind(group);
  const record = mutationTargetRecord(String(line ?? '').slice(Math.max(0, start), Math.max(start, end)), mutationKind);
  return record ? [compactRecord({
    kind: 'mutation-target',
    mutationKind,
    line: lineNumber,
    ...record,
    staticMutationTargetEvidence: true,
    runtimeEquivalenceClaim: false,
    semanticEquivalenceClaim: false
  })] : [];
}

function mutationTargetSignatureEvidence(record) {
  return compactRecord({
    mutationKind: record?.mutationKind,
    targetText: record?.targetText,
    targetRoot: record?.targetRoot,
    operator: record?.operator,
    methodName: record?.methodName,
    optionalCall: record?.optionalCall,
    methodComputed: record?.methodComputed,
    computedMethodName: record?.computedMethodName,
    computedMethodStatic: record?.computedMethodStatic,
    computedMethodDynamic: record?.computedMethodDynamic,
    computedProperty: record?.computedProperty,
    computedPropertyKeys: record?.computedPropertyKeys,
    computedPropertyStatic: record?.computedPropertyStatic,
    computedPropertyDynamic: record?.computedPropertyDynamic
  });
}

function mutationTargetContextReasonCodes(record) {
  return uniqueStrings([
    'runtime-order-mutation-target-merge-requires-write-target-evidence',
    record?.operator ? 'runtime-order-mutation-target-merge-requires-operator-evidence' : undefined,
    record?.methodName ? 'runtime-order-mutation-target-merge-requires-mutator-method-evidence' : undefined,
    record?.computedMethodStatic ? 'runtime-order-mutation-target-merge-requires-computed-mutator-method-evidence' : undefined,
    record?.computedMethodDynamic ? 'runtime-order-mutation-target-merge-requires-dynamic-mutator-method-evidence' : undefined,
    record?.computedPropertyStatic ? 'runtime-order-mutation-target-merge-requires-computed-literal-key-evidence' : undefined,
    record?.computedProperty ? 'runtime-order-mutation-target-merge-requires-computed-key-evidence' : undefined,
    record?.optionalCall ? 'runtime-order-mutation-target-merge-requires-nullish-boundary-evidence' : undefined
  ]);
}

function mutationFactKind(group) {
  return ['mutating-call', 'assignment', 'update', 'delete']
    .find((kind) => (group?.factKinds ?? []).includes(kind)) ?? 'mutation';
}

function mutationTargetRecord(line, mutationKind) {
  if (mutationKind === 'mutating-call') return mutatingCallTarget(line);
  if (mutationKind === 'delete') return deleteTarget(line);
  if (mutationKind === 'assignment') return assignmentTarget(line);
  if (mutationKind === 'update') return updateTarget(line) ?? assignmentTarget(line);
  return undefined;
}

function mutatingCallTarget(line) {
  const match = /([A-Za-z_$][\w$]*(?:(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)|\s*\[[^\]]+\])*)\s*(\.|\?\.)\s*(push|pop|shift|unshift|splice|sort|reverse|set|add|delete|clear)\s*(\?\.)?\s*\(/.exec(line);
  if (match) {
    const text = statementText(line, match.index);
    return targetRecord(text, match[1], { methodName: match[3], optionalCall: match[2] === '?.' || Boolean(match[4]) });
  }
  const computed = /([A-Za-z_$][\w$]*(?:(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)|\s*\[[^\]]+\])*)\s*(\?\.)?\s*\[\s*(['"`])(push|pop|shift|unshift|splice|sort|reverse|set|add|delete|clear)\3\s*\]\s*(\?\.)?\s*\(/.exec(line);
  if (!computed) return undefined;
  const text = statementText(line, computed.index);
  return targetRecord(text, computed[1], {
    methodName: computed[4],
    optionalCall: Boolean(computed[2] || computed[5]),
    methodComputed: true,
    computedMethodName: computed[4],
    computedMethodStatic: true,
    computedMethodRuntimeEquivalenceClaim: false
  });
}

function deleteTarget(line) {
  const match = /\bdelete\s+([^;]+)/.exec(line);
  return match ? targetRecord(statementText(line, match.index), match[1], { operator: 'delete' }) : undefined;
}

function assignmentTarget(line) {
  const match = /(^|[^\w$])([A-Za-z_$][\w$]*(?:(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)|\s*\[[^\]]+\])*)\s*(\|\|=|&&=|\?\?=|\+=|-=|\*=|\/=|%=|\*\*=|<<=|>>=|>>>=|&=|\^=|\|=|=(?!=|>))/.exec(line);
  return match ? targetRecord(statementText(line, match.index + match[1].length), match[2], { operator: match[3] }) : undefined;
}

function updateTarget(line) {
  const prefix = /(^|[^\w$])(\+\+|--)\s*([A-Za-z_$][\w$]*(?:(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)|\s*\[[^\]]+\])*)/.exec(line);
  if (prefix) return targetRecord(statementText(line, prefix.index + prefix[1].length), prefix[3], { operator: prefix[2], updatePosition: 'prefix' });
  const postfix = /(^|[^\w$])([A-Za-z_$][\w$]*(?:(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)|\s*\[[^\]]+\])*)\s*(\+\+|--)/.exec(line);
  return postfix ? targetRecord(statementText(line, postfix.index + postfix[1].length), postfix[2], { operator: postfix[3], updatePosition: 'postfix' }) : undefined;
}

function targetRecord(text, target, extra = {}) {
  const targetText = normalizeTargetText(target);
  if (!targetText) return undefined;
  const computedProperties = computedPropertySegments(targetText);
  const literalComputedProperties = computedProperties.filter((entry) => entry.static);
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
    computedPropertyRuntimeEquivalenceClaim: computedProperties.length > 0 ? false : undefined,
    ...extra
  });
}

function statementText(line, start) {
  const end = statementEnd(line, start);
  return String(line ?? '').slice(Math.max(0, start), end);
}

function statementEnd(line, start) {
  const semicolon = String(line ?? '').indexOf(';', start);
  return semicolon === -1 ? String(line ?? '').length : semicolon + 1;
}

function normalizeTargetText(value) {
  return normalizeOrderEvidenceText(String(value ?? '')
    .replace(/\s*(?:\.|\?\.)\s*/g, (match) => match.includes('?.') ? '?.' : '.')
    .replace(/\s*\[\s*/g, '[')
    .replace(/\s*\]\s*/g, ']'));
}

function targetRoot(targetText) {
  return /^[A-Za-z_$][\w$]*/.exec(targetText)?.[0];
}

function computedPropertySegments(targetText) {
  return [...String(targetText ?? '').matchAll(/\[([^\]]+)\]/g)].map((match) => {
    const expression = normalizeOrderEvidenceText(match[1]);
    const key = literalComputedPropertyKey(expression);
    return compactRecord({ expression, key, static: key !== undefined || undefined });
  });
}

function literalComputedPropertyKey(expression) {
  const quoted = /^(['\"`])((?:\\.|(?!\1)[\s\S])*)\1$/.exec(expression);
  if (quoted && !quoted[2].includes('${')) return quoted[2].replace(/\\([\\'\"`])/g, '$1');
  return /^(?:0|[1-9]\d*)$/.test(expression) ? expression : undefined;
}

function normalizeOrderEvidenceText(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function uniqueStrings(values) { return [...new Set((values ?? []).filter(Boolean).map(String))]; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length > 0))); }
export { mutationTargetContextReasonCodes, mutationTargetOrderEvidence, mutationTargetSignatureEvidence };
