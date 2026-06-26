import { normalizeNamespaces, typeNamespace, uniqueStrings, valueNamespace } from '../../js-ts-semantic-scope-use-def-utils.js';

function structuralScopeEvidenceForImport(imported) {
  const candidates = [
    imported?.metadata?.scopeUseDefEvidence,
    imported?.metadata?.estreeScopeEvidence,
    imported?.metadata?.estreeScopeManager,
    imported?.metadata?.scopeManager,
    imported?.nativeAst?.metadata?.scopeUseDefEvidence,
    imported?.nativeAst?.metadata?.estreeScopeEvidence,
    imported?.nativeAst?.metadata?.estreeScopeManager,
    imported?.nativeAst?.metadata?.scopeManager,
    imported?.universalAst?.metadata?.scopeUseDefEvidence,
    imported?.universalAst?.metadata?.estreeScopeEvidence,
    imported?.universalAst?.metadata?.estreeScopeManager,
    imported?.universalAst?.metadata?.scopeManager
  ];
  for (const candidate of candidates) {
    const evidence = unwrapStructuralScopeEvidence(candidate);
    if (evidence) return evidence;
  }
  return undefined;
}

function unwrapStructuralScopeEvidence(candidate) {
  if (!candidate || typeof candidate !== 'object') return undefined;
  if (Array.isArray(candidate.scopes) || Array.isArray(candidate.bindings) || Array.isArray(candidate.references) || Array.isArray(candidate.variables)) return candidate;
  return unwrapStructuralScopeEvidence(candidate.scopeManager)
    ?? unwrapStructuralScopeEvidence(candidate.manager)
    ?? unwrapStructuralScopeEvidence(candidate.scopeUseDefEvidence);
}

function normalizeStructuralScopeEvidence(evidence) {
  const evidenceContext = {
    source: firstString(evidence.source, evidence.format, evidence.adapterId, evidence.parser, 'external-scope-manager'),
    kind: evidenceKind(evidence),
    evidenceIds: uniqueStrings([...(evidence.evidenceIds ?? []), evidence.evidenceId])
  };
  const bindingInputs = [];
  const referenceInputs = [];
  for (const binding of evidence.bindings ?? []) {
    const normalized = normalizeStructuralBindingInput(binding, evidenceContext, bindingInputs.length);
    if (normalized) bindingInputs.push(normalized);
  }
  for (const reference of evidence.references ?? []) {
    const normalized = normalizeStructuralReferenceInput(reference, evidenceContext, referenceInputs.length);
    if (normalized) referenceInputs.push(normalized);
  }
  for (const variable of evidence.variables ?? []) {
    const normalized = normalizeScopeVariableBinding(variable, {}, evidenceContext, bindingInputs.length, undefined);
    if (normalized) bindingInputs.push(normalized);
  }
  normalizeScopes(evidence, evidenceContext, bindingInputs, referenceInputs);
  return { bindingInputs: uniqueStructuralBindings(bindingInputs), referenceInputs };
}

function normalizeScopes(evidence, evidenceContext, bindingInputs, referenceInputs) {
  const scopes = Array.isArray(evidence.scopes) ? evidence.scopes : [];
  const variableExternalIds = new Map();
  for (let scopeIndex = 0; scopeIndex < scopes.length; scopeIndex += 1) {
    const scope = scopes[scopeIndex];
    const variables = Array.isArray(scope?.variables) ? scope.variables : [];
    for (let variableIndex = 0; variableIndex < variables.length; variableIndex += 1) {
      const variable = variables[variableIndex];
      const normalized = normalizeScopeVariableBinding(variable, scope, evidenceContext, bindingInputs.length, `${scopeIndex + 1}:${variableIndex + 1}`);
      if (!normalized) continue;
      bindingInputs.push(normalized);
      variableExternalIds.set(variable, normalized.externalBindingId);
    }
  }
  for (let scopeIndex = 0; scopeIndex < scopes.length; scopeIndex += 1) {
    const scope = scopes[scopeIndex];
    for (const reference of [...(scope?.references ?? []), ...(scope?.through ?? [])]) {
      const normalized = normalizeScopeManagerReference(reference, scope, evidenceContext, referenceInputs.length, variableExternalIds);
      if (normalized) referenceInputs.push(normalized);
    }
  }
}

function normalizeStructuralBindingInput(binding, evidenceContext, index) {
  if (!binding || typeof binding !== 'object') return undefined;
  const range = sourceRange(binding);
  const name = firstString(binding.name, binding.localName, binding.identifier?.name, binding.id);
  if (!name || !range) return undefined;
  const kind = bindingKindForExternal(binding.bindingKind, binding.kind, binding.definitionType, binding.defType);
  return {
    kind,
    name,
    start: range.start,
    end: range.end,
    depth: numberOr(binding.depth, 0),
    namespaces: namespacesForExternal(binding, kind),
    scopeEvidenceSource: firstString(binding.scopeEvidenceSource, evidenceContext.source),
    scopeEvidenceKind: firstString(binding.scopeEvidenceKind, evidenceContext.kind),
    scopeType: firstString(binding.scopeType, binding.variableScopeType),
    definitionType: firstString(binding.definitionType, binding.defType, binding.kind),
    externalBindingId: firstString(binding.externalBindingId, binding.bindingId, binding.id, `external:${index + 1}:${name}:${range.start}:${range.end}`),
    evidenceIds: uniqueStrings([...(binding.evidenceIds ?? []), binding.evidenceId, ...evidenceContext.evidenceIds])
  };
}

function normalizeScopeVariableBinding(variable, scope, evidenceContext, index, fallbackId) {
  if (!variable || typeof variable !== 'object') return undefined;
  const definition = Array.isArray(variable.defs) ? variable.defs.find((def) => sourceRange(def?.name ?? def?.node ?? def)) : undefined;
  const identifier = definition?.name ?? (Array.isArray(variable.identifiers) ? variable.identifiers.find(sourceRange) : undefined) ?? variable.identifier ?? variable;
  const range = sourceRange(identifier);
  const name = firstString(variable.name, identifier?.name);
  if (!name || !range) return undefined;
  const definitionType = firstString(definition?.type, variable.definitionType, variable.kind);
  const kind = bindingKindForExternal(variable.bindingKind, variable.kind, definitionType, variable.defType);
  return {
    kind,
    name,
    start: range.start,
    end: range.end,
    depth: numberOr(variable.depth, numberOr(scope?.depth, 0)),
    namespaces: namespacesForExternal(variable, kind, definitionType),
    scopeEvidenceSource: firstString(variable.scopeEvidenceSource, evidenceContext.source),
    scopeEvidenceKind: firstString(variable.scopeEvidenceKind, evidenceContext.kind),
    scopeType: firstString(variable.scopeType, scope?.type),
    definitionType,
    externalBindingId: firstString(variable.externalBindingId, variable.bindingId, variable.id, fallbackId ? `scope-manager:${fallbackId}:${name}:${range.start}:${range.end}` : undefined, `external:${index + 1}:${name}:${range.start}:${range.end}`),
    evidenceIds: uniqueStrings([...(variable.evidenceIds ?? []), variable.evidenceId, ...evidenceContext.evidenceIds])
  };
}

function normalizeStructuralReferenceInput(reference, evidenceContext, index) {
  if (!reference || typeof reference !== 'object') return undefined;
  const identifier = reference.identifier ?? reference.node ?? reference;
  const range = sourceRange(reference) ?? sourceRange(identifier);
  const name = firstString(reference.name, identifier?.name);
  if (!name || !range) return undefined;
  const namespace = referenceNamespace(reference);
  const resolvedRange = sourceRange(reference.resolvedRange)
    ?? sourceRange(reference.resolved?.defs?.[0]?.name)
    ?? sourceRange(reference.resolved?.identifiers?.[0]);
  return {
    name,
    namespace,
    namespaces: [namespace],
    start: range.start,
    end: range.end,
    depth: numberOr(reference.depth, 0),
    externalBindingId: firstString(reference.externalBindingId, reference.bindingId, reference.resolvedBindingId, reference.resolved?.externalBindingId, reference.resolved?.id),
    resolvedName: firstString(reference.bindingName, reference.resolvedName, reference.resolved?.name),
    resolvedStart: resolvedRange?.start,
    resolvedEnd: resolvedRange?.end,
    scopeEvidenceSource: firstString(reference.scopeEvidenceSource, evidenceContext.source),
    scopeEvidenceKind: firstString(reference.scopeEvidenceKind, evidenceContext.kind),
    scopeType: firstString(reference.scopeType),
    referenceKind: firstString(reference.referenceKind, reference.writeExpr ? 'write' : 'read'),
    evidenceIds: uniqueStrings([...(reference.evidenceIds ?? []), reference.evidenceId, ...evidenceContext.evidenceIds]),
    ordinal: index + 1
  };
}

function normalizeScopeManagerReference(reference, scope, evidenceContext, index, variableExternalIds) {
  const normalized = normalizeStructuralReferenceInput({
    ...reference,
    depth: numberOr(reference?.depth, numberOr(scope?.depth, 0)),
    scopeType: firstString(reference?.scopeType, scope?.type),
    externalBindingId: variableExternalIds.get(reference?.resolved) ?? reference?.externalBindingId ?? reference?.bindingId ?? reference?.resolvedBindingId
  }, evidenceContext, index);
  if (!normalized) return undefined;
  const resolvedRange = sourceRange(reference?.resolved?.defs?.[0]?.name) ?? sourceRange(reference?.resolved?.identifiers?.[0]);
  return {
    ...normalized,
    externalBindingId: normalized.externalBindingId ?? variableExternalIds.get(reference?.resolved),
    resolvedName: normalized.resolvedName ?? firstString(reference?.resolved?.name),
    resolvedStart: normalized.resolvedStart ?? resolvedRange?.start,
    resolvedEnd: normalized.resolvedEnd ?? resolvedRange?.end
  };
}

function uniqueStructuralBindings(bindings) {
  const seen = new Set();
  return bindings.filter((binding) => {
    const key = nameRangeKey(binding.name, binding.start, binding.end);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function evidenceKind(evidence) {
  if (firstString(evidence.kind)) return firstString(evidence.kind);
  if (Array.isArray(evidence.scopes)) return 'estree-scope-manager';
  return 'scope-use-def-records';
}

function bindingKindForExternal(...values) {
  const raw = firstString(...values);
  if (!raw) return 'binding';
  const normalized = raw.replace(/Name$/, '').toLowerCase();
  if (normalized === 'function' || normalized === 'functionname') return 'function';
  if (normalized === 'classname' || normalized === 'class') return 'class';
  if (normalized === 'interfacename' || normalized === 'interface') return 'interface';
  if (normalized === 'type' || normalized === 'typeparameter') return normalized === 'typeparameter' ? 'type-parameter' : 'type';
  if (normalized === 'tsenum' || normalized === 'tsenumname' || normalized === 'enum') return 'enum';
  if (normalized === 'tsmodule' || normalized === 'tsmodulename' || normalized === 'namespace' || normalized === 'module') return 'namespace';
  if (normalized === 'importbinding' || normalized === 'import') return 'import';
  if (normalized === 'parameter' || normalized === 'param') return 'param';
  if (normalized === 'catchclause' || normalized === 'catch') return 'catch';
  if (normalized === 'variable' || normalized === 'const' || normalized === 'let' || normalized === 'var') return raw;
  return raw;
}

function namespacesForExternal(record, kind, definitionType) {
  const explicit = normalizeNamespaces(record.namespaces ?? record.namespace);
  if (record.namespaces || record.namespace) return explicit;
  if (record.isTypeVariable === true && record.isValueVariable !== true) return [typeNamespace];
  if (record.isValueVariable === true && record.isTypeVariable !== true) return [valueNamespace];
  if (record.isTypeVariable === true && record.isValueVariable === true) return [valueNamespace, typeNamespace];
  if (record.typeOnly === true || record.isTypeOnly === true) return [typeNamespace];
  const normalized = firstString(definitionType, kind)?.toLowerCase();
  if (normalized === 'type' || normalized === 'interface' || normalized === 'interfacename' || normalized === 'typeparameter') return [typeNamespace];
  if (normalized === 'class' || normalized === 'classname' || normalized === 'enum' || normalized === 'tsenumname' || normalized === 'namespace' || normalized === 'module' || normalized === 'tsmodulename') return [valueNamespace, typeNamespace];
  return [valueNamespace];
}

function referenceNamespace(reference) {
  if (reference.namespace === typeNamespace || (reference.isTypeReference === true && reference.isValueReference !== true) || reference.typeOnly === true) return typeNamespace;
  return valueNamespace;
}

function sourceRange(value) {
  if (!value) return undefined;
  if (Array.isArray(value) && Number.isInteger(value[0]) && Number.isInteger(value[1])) return { start: value[0], end: value[1] };
  if (Array.isArray(value.range) && Number.isInteger(value.range[0]) && Number.isInteger(value.range[1])) return { start: value.range[0], end: value.range[1] };
  if (Number.isInteger(value.start) && Number.isInteger(value.end)) return { start: value.start, end: value.end };
  if (Number.isInteger(value.sourceSpan?.start) && Number.isInteger(value.sourceSpan?.end)) return { start: value.sourceSpan.start, end: value.sourceSpan.end };
  return undefined;
}

function numberOr(value, fallback) { return Number.isInteger(value) ? value : fallback; }
function nameRangeKey(name, start, end) { return name && Number.isInteger(start) && Number.isInteger(end) ? `${name}:${start}:${end}` : undefined; }
function firstString(...values) {
  for (const value of values) if (value !== undefined && value !== null && String(value)) return String(value);
  return undefined;
}

export { normalizeStructuralScopeEvidence, structuralScopeEvidenceForImport };
