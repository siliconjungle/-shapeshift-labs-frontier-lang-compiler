import { isJsxSpreadAttribute } from '../../js-ts-safe-merge-jsx-attribute-parser.js';
import { parseStaticObjectLiteralExpression } from './projectSymbolGraphJsxStaticLiterals.js';

function jsxSpreadPropValueEvidence(tag, attribute, context = {}) {
  const expressionText = jsxSpreadExpressionText(attribute);
  const source = staticObjectSpreadSource(expressionText, attribute, context);
  if (!source?.status) return dynamicSpreadPropValueEvidence(expressionText, source?.reasonCode);
  const precedence = staticSpreadPrecedenceEvidence(tag, attribute, source.entries);
  const propNames = uniqueStrings(source.entries.map((entry) => entry.propName));
  return compactRecord({
    proofStatus: 'static-object-spread-jsx-prop-value-evidence',
    reasonCode: 'jsx-render-prop-spread-static-object-evidence',
    valueKind: 'object-spread',
    valueText: source.valueText,
    expressionText,
    staticSpreadSourceKind: source.sourceKind,
    staticSpreadSourceName: source.sourceName,
    staticSpreadPropEntries: source.entries,
    staticSpreadPropNames: propNames,
    staticSpreadPropCount: propNames.length,
    staticSpreadEffectivePropEntries: precedence.effectiveEntries,
    staticSpreadEffectivePropNames: uniqueStrings(precedence.effectiveEntries.map((entry) => entry.propName)),
    staticSpreadExplicitOverridePropNames: precedence.explicitOverridePropNames,
    staticSpreadOverridesExplicitPropNames: precedence.overridesExplicitPropNames,
    staticSpreadDuplicatePropNames: duplicatePropNames(source.entries),
    staticSpreadPrecedenceStatus: precedence.status,
    claimScope: 'static-object-spread-props-only',
    renderEquivalenceClaim: false
  });
}

function dynamicSpreadPropValueEvidence(expressionText, reasonCode) {
  return {
    proofStatus: 'dynamic-jsx-prop-spread-unsupported',
    reasonCode: 'jsx-render-prop-spread-unsupported',
    valueKind: 'spread-expression',
    expressionText,
    dynamicText: expressionText,
    dynamicBlockerReasonCode: reasonCode ?? jsxPropSpreadDynamicBlockerReasonCode(expressionText),
    claimScope: 'static-object-spread-props-only',
    renderEquivalenceClaim: false
  };
}

function staticObjectSpreadSource(expressionText, attribute, context = {}) {
  const text = normalizedText(expressionText);
  if (!text) return { reasonCode: 'jsx-render-prop-spread-expression-unsupported' };
  if (text.startsWith('{')) {
    const parsed = parseStaticObjectLiteralExpression(text);
    return parsed.value
      ? { status: 'static', sourceKind: 'inline-object-literal', valueText: text, entries: parsed.value.entries }
      : { reasonCode: parsed.reasonCode ?? jsxPropSpreadDynamicBlockerReasonCode(text) };
  }
  if (simpleIdentifierExpression(text)) {
    const resolved = sameFileConstObjectSpreadSource(text, attribute, context);
    return resolved.status ? resolved : { reasonCode: resolved.reasonCode ?? 'jsx-render-prop-spread-reference-unsupported' };
  }
  return { reasonCode: jsxPropSpreadDynamicBlockerReasonCode(text) };
}

function sameFileConstObjectSpreadSource(name, attribute, context = {}) {
  const sourceText = String(context.sourceText ?? '');
  if (!sourceText) return { reasonCode: 'jsx-render-prop-spread-reference-unsupported' };
  const beforeOffset = Number.isFinite(attribute?.start) ? attribute.start : sourceText.length;
  const declarations = constObjectInitializers(sourceText, name).filter((declaration) => declaration.start < beforeOffset);
  if (declarations.length !== 1) return {
    reasonCode: declarations.length > 1 ? 'jsx-render-prop-spread-ambiguous-const-object-unsupported' : 'jsx-render-prop-spread-reference-unsupported'
  };
  const parsed = parseStaticObjectLiteralExpression(declarations[0].initializerText);
  return parsed.value
    ? {
      status: 'static',
      sourceKind: 'same-file-const-object',
      sourceName: name,
      valueText: normalizedText(declarations[0].initializerText),
      entries: parsed.value.entries
    }
    : { reasonCode: parsed.reasonCode ?? 'jsx-render-prop-spread-const-object-dynamic-unsupported' };
}

function constObjectInitializers(sourceText, name) {
  const result = [];
  const pattern = new RegExp(`\\bconst\\s+${escapeRegExp(name)}\\s*=\\s*`, 'g');
  let match;
  while ((match = pattern.exec(sourceText))) {
    const start = match.index;
    const initializerText = readConstInitializerText(sourceText, pattern.lastIndex);
    if (initializerText) result.push({ start, initializerText });
  }
  return result;
}

function readConstInitializerText(sourceText, start) {
  let quote;
  let depth = 0;
  for (let index = start; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth = Math.max(0, depth - 1);
    else if (depth === 0 && (char === ';' || char === '\n')) return sourceText.slice(start, index).trim();
  }
  return sourceText.slice(start).trim();
}

function staticSpreadPrecedenceEvidence(tag, attribute, entries) {
  const index = attributeIndexInTag(tag, attribute);
  const before = namedAttributesBefore(tag, index);
  const after = namedAttributesAfter(tag, index);
  const lastEntries = lastStaticEntriesByProp(entries);
  const explicitOverridePropNames = uniqueStrings(lastEntries.filter((entry) => after.has(entry.propName)).map((entry) => entry.propName));
  const overridesExplicitPropNames = uniqueStrings(lastEntries.filter((entry) => before.has(entry.propName)).map((entry) => entry.propName));
  const effectiveEntries = lastEntries.filter((entry) => !after.has(entry.propName));
  return {
    effectiveEntries,
    explicitOverridePropNames,
    overridesExplicitPropNames,
    status: staticSpreadPrecedenceStatus(explicitOverridePropNames, overridesExplicitPropNames, duplicatePropNames(entries))
  };
}

function namedAttributesBefore(tag, index) {
  return new Set((tag.attributes ?? []).slice(0, Math.max(0, index)).filter((candidate) => !isJsxSpreadAttribute(candidate)).map((candidate) => candidate.name));
}

function namedAttributesAfter(tag, index) {
  return new Set((tag.attributes ?? []).slice(index + 1).filter((candidate) => !isJsxSpreadAttribute(candidate)).map((candidate) => candidate.name));
}

function staticSpreadPrecedenceStatus(explicitOverridePropNames, overridesExplicitPropNames, duplicateNames) {
  if (explicitOverridePropNames.length && overridesExplicitPropNames.length) return 'static-spread-between-explicit-props';
  if (explicitOverridePropNames.length) return 'static-spread-overridden-by-later-explicit-prop';
  if (overridesExplicitPropNames.length) return 'static-spread-overrides-earlier-explicit-prop';
  if (duplicateNames.length) return 'static-spread-duplicate-prop-last-write-wins';
  return 'static-spread-props-preserved';
}

function attributeIndexInTag(tag, attribute) {
  const attributes = tag.attributes ?? [];
  const direct = attributes.indexOf(attribute);
  if (direct >= 0) return direct;
  return attributes.findIndex((candidate) => candidate.start === attribute?.start && candidate.end === attribute?.end && candidate.name === attribute?.name);
}

function lastStaticEntriesByProp(entries) {
  const byProp = new Map();
  for (const entry of entries) byProp.set(entry.propName, entry);
  return [...byProp.values()].sort((left, right) => left.ordinal - right.ordinal);
}

function duplicatePropNames(entries) {
  const counts = new Map();
  for (const entry of entries) counts.set(entry.propName, (counts.get(entry.propName) ?? 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([name]) => name);
}

function jsxSpreadExpressionText(attribute) {
  const expressionText = normalizedText(attribute?.expressionText);
  if (expressionText) return expressionText;
  const text = String(attribute?.text ?? '').trim();
  const braced = /^\{\s*\.\.\.\s*([\s\S]*?)\s*\}$/.exec(text);
  if (braced) return normalizedText(braced[1]);
  const unbraced = /^\.\.\.\s*([\s\S]*)$/.exec(text);
  return unbraced ? normalizedText(unbraced[1]) : undefined;
}

function jsxPropSpreadDynamicBlockerReasonCode(text) {
  const value = normalizedText(text);
  if (/\[[\s\S]*\]/.test(value)) return 'jsx-render-prop-spread-computed-reference-unsupported';
  if (/^`[\s\S]*\$\{[\s\S]*`$/.test(value)) return 'jsx-render-prop-spread-template-interpolation-unsupported';
  if (/\?\.\s*\(/.test(value) || /\b[A-Za-z_$][\w$]*(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)*\s*\(/.test(value)) return 'jsx-render-prop-spread-call-expression-unsupported';
  if (/^\{/.test(value)) return 'jsx-render-prop-spread-dynamic-object-unsupported';
  if (staticPropReference(value)) return 'jsx-render-prop-spread-reference-unsupported';
  return 'jsx-render-prop-spread-expression-unsupported';
}

function staticPropReference(text) {
  const value = normalizedText(text);
  if (!/^(?:this|[A-Za-z_$][\w$]*)(?:\s*\.\s*[A-Za-z_$][\w$]*)*$/.test(value)) return undefined;
  const normalized = value.replace(/\s+/g, '');
  const path = normalized.split('.');
  return { text: normalized, root: path[0], path };
}

function simpleIdentifierExpression(text) { return /^[A-Za-z_$][\w$]*$/.test(String(text ?? '').trim()); }
function escapeRegExp(text) { return String(text ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }
function normalizedText(text) { return String(text ?? '').trim().replace(/\s+/g, ' '); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { jsxSpreadPropValueEvidence };
