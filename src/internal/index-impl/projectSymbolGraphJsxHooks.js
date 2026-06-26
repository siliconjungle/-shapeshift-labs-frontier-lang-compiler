import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { jsxContextTargetClassification } from './projectSymbolGraphJsxContextTargets.js';
import { hookEffectCallback } from './projectSymbolGraphJsxHookEffects.js';
import { staticOptionalMemberReference } from './staticOptionalMemberReference.js';

function jsxHookCalls(sourceText) {
  const hookCalls = [];
  for (const match of String(sourceText ?? '').matchAll(/\b(?:React\s*\.\s*)?(use[A-Z0-9][A-Za-z0-9_$]*)\s*\(/g)) {
    const openParen = match.index + match[0].lastIndexOf('(');
    const closeParen = findMatchingDelimiter(sourceText, openParen, '(', ')');
    const argsText = closeParen === undefined ? undefined : sourceText.slice(openParen + 1, closeParen);
    const args = typeof argsText === 'string' ? splitTopLevel(argsText, ',') : [];
    const ordinal = hookCalls.length + 1;
    const dependencyArray = hookDependencyArray(args);
    const effectCallback = hookEffectCallback(match[1], ordinal, args[0]);
    const contextConsumer = hookContextConsumer(match[1], ordinal, args[0]);
    hookCalls.push(compactRecord({
      name: match[1],
      ordinal,
      offset: match.index,
      dependencyTexts: dependencyArray?.items,
      dependencyCount: dependencyArray?.items.length,
      dependencyRecords: dependencyArray?.records,
      dependencyProofStatus: dependencyArray?.proofStatus,
      dynamicDependencyTexts: dependencyArray?.dynamicItems,
      dynamicDependencyReasonCodes: dependencyArray?.dynamicReasonCodes,
      dependencyArrayHash: dependencyArray?.arrayHash,
      dependencySignatureHash: dependencyArray ? hashSemanticValue({
        kind: 'frontier.lang.projectJsxHookDependencyArray',
        hookName: match[1],
        ordinal,
        dependencyTexts: dependencyArray.items,
        dependencyRecords: dependencyArray.records,
        dependencyProofStatus: dependencyArray.proofStatus,
        dynamicDependencyTexts: dependencyArray.dynamicItems,
        dynamicDependencyReasonCodes: dependencyArray.dynamicReasonCodes,
        dependencyArrayHash: dependencyArray.arrayHash
      }) : undefined,
      effectProofStatus: effectCallback?.proofStatus,
      effectCallbackKind: effectCallback?.callbackKind,
      effectCallbackText: effectCallback?.callbackText,
      effectDynamicCallbackText: effectCallback?.dynamicCallbackText,
      effectCallbackHash: effectCallback?.callbackHash,
      effectCallbackReferenceRoot: effectCallback?.callbackReferenceRoot,
      effectCallbackReferencePath: effectCallback?.callbackReferencePath,
      effectCallbackReferenceMemberPath: effectCallback?.callbackReferenceMemberPath,
      effectCallbackOptionalReference: effectCallback?.callbackOptionalReference,
      effectCallbackOptionalReferenceSegments: effectCallback?.callbackOptionalReferenceSegments,
      effectCallbackOptionalReferenceSegmentIndexes: effectCallback?.callbackOptionalReferenceSegmentIndexes,
      effectCallbackOptionalNullishBoundaryCount: effectCallback?.callbackOptionalNullishBoundaryCount,
      effectDynamicCallbackKind: effectCallback?.dynamicCallbackKind,
      effectDynamicCallbackBlockerReasonCode: effectCallback?.dynamicCallbackBlockerReasonCode,
      effectCleanupProofStatus: effectCallback?.cleanupProofStatus,
      effectCleanupReturnKind: effectCallback?.cleanupReturnKind,
      effectCleanupReturnText: effectCallback?.cleanupReturnText,
      effectDynamicCleanupReturnText: effectCallback?.dynamicCleanupReturnText,
      effectCleanupReturnHash: effectCallback?.cleanupReturnHash,
      effectCleanupReturnReferenceRoot: effectCallback?.cleanupReturnReferenceRoot,
      effectCleanupReturnReferencePath: effectCallback?.cleanupReturnReferencePath,
      effectCleanupReturnReferenceMemberPath: effectCallback?.cleanupReturnReferenceMemberPath,
      effectCleanupReturnOptionalReference: effectCallback?.cleanupReturnOptionalReference,
      effectCleanupReturnOptionalReferenceSegments: effectCallback?.cleanupReturnOptionalReferenceSegments,
      effectCleanupReturnOptionalReferenceSegmentIndexes: effectCallback?.cleanupReturnOptionalReferenceSegmentIndexes,
      effectCleanupReturnOptionalNullishBoundaryCount: effectCallback?.cleanupReturnOptionalNullishBoundaryCount,
      effectDynamicCleanupReturnKind: effectCallback?.dynamicCleanupReturnKind,
      effectDynamicCleanupReturnBlockerReasonCode: effectCallback?.dynamicCleanupReturnBlockerReasonCode,
      effectCleanupReturnPresent: effectCallback?.cleanupReturnPresent,
      effectRuntimeEquivalenceClaim: effectCallback?.runtimeEquivalenceClaim,
      effectSignatureHash: effectCallback?.signatureHash,
      contextName: contextConsumer?.contextName,
      contextExpressionText: contextConsumer?.expressionText,
      contextExpressionHash: contextConsumer?.expressionHash,
      contextConsumerProofStatus: contextConsumer?.proofStatus,
      contextTargetKind: contextConsumer?.contextTargetKind,
      contextTargetReasonCode: contextConsumer?.reasonCode,
      contextTargetReferenceRoot: contextConsumer?.contextTargetReferenceRoot,
      contextTargetReferencePath: contextConsumer?.contextTargetReferencePath,
      contextTargetReferenceMemberPath: contextConsumer?.contextTargetReferenceMemberPath,
      contextTargetOptionalReference: contextConsumer?.optionalReference,
      contextTargetOptionalReferenceSegments: contextConsumer?.optionalReferenceSegments,
      contextTargetOptionalReferenceSegmentIndexes: contextConsumer?.optionalReferenceSegmentIndexes,
      contextTargetOptionalNullishBoundaryCount: contextConsumer?.optionalNullishBoundaryCount,
      contextTargetDynamicKind: contextConsumer?.dynamicTargetKind,
      contextTargetDynamicBlockerReasonCode: contextConsumer?.dynamicBlockerReasonCode,
      contextConsumerSignatureHash: contextConsumer?.signatureHash,
      contextConsumerDynamicTarget: contextConsumer?.dynamicTarget
    }));
  }
  return hookCalls;
}

function hookDependencyArray(args) {
  const candidate = [...args].reverse().find((arg) => String(arg ?? '').trim().startsWith('['));
  const trimmed = String(candidate ?? '').trim();
  if (!trimmed.startsWith('[')) return undefined;
  const close = findMatchingDelimiter(trimmed, 0, '[', ']');
  if (close !== trimmed.length - 1) return undefined;
  const items = splitTopLevel(trimmed.slice(1, -1), ',').map(normalizedHookDependencyText).filter(Boolean);
  const records = items.map((item, index) => hookDependencyItemRecord(item, index + 1));
  const dynamicRecords = records.filter((record) => record.proofStatus === 'dynamic-hook-dependency-unsupported');
  const dynamicItems = dynamicRecords.map((record) => record.dependencyText);
  return {
    items,
    records,
    proofStatus: dynamicItems.length ? 'dynamic-dependency-array-unsupported' : 'static-dependency-array-evidence',
    dynamicItems: dynamicItems.length ? dynamicItems : undefined,
    dynamicReasonCodes: dynamicRecords.length ? uniqueStrings(dynamicRecords.map((record) => record.dynamicBlockerReasonCode)) : undefined,
    arrayHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxHookDependencyArrayText',
      items,
      records,
      dynamicItems,
      text: normalizedHookDependencyText(trimmed)
    })
  };
}

function hookDependencyItemRecord(item, ordinal) {
  const literalKind = hookDependencyLiteralKind(item);
  if (literalKind) return staticHookDependencyRecord(item, ordinal, literalKind);
  const optionalReference = staticOptionalMemberReference(item);
  if (optionalReference) return staticHookOptionalDependencyRecord(item, ordinal, optionalReference);
  const reference = staticHookDependencyReference(item);
  if (reference) return staticHookDependencyRecord(item, ordinal, 'reference', reference);
  return dynamicHookDependencyRecord(item, ordinal);
}

function staticHookDependencyRecord(item, ordinal, valueKind, reference) {
  return compactRecord({
    ordinal,
    proofStatus: 'static-hook-dependency-evidence',
    reasonCode: 'jsx-render-hook-dependency-static-evidence',
    valueKind,
    dependencyText: reference?.text ?? normalizedHookDependencyText(item),
    referenceRoot: reference?.root,
    referencePath: reference?.path,
    signatureHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxHookDependencyItem', ordinal, valueKind, dependencyText: reference?.text ?? normalizedHookDependencyText(item), referencePath: reference?.path })
  });
}

function staticHookOptionalDependencyRecord(item, ordinal, reference) {
  return {
    ordinal,
    proofStatus: 'static-hook-dependency-evidence',
    reasonCode: 'jsx-render-hook-dependency-static-optional-reference-evidence',
    valueKind: 'optional-reference',
    dependencyText: reference.text,
    referenceRoot: reference.root,
    referencePath: reference.path,
    optionalReference: true,
    optionalReferenceSegments: reference.optionalSegments,
    optionalReferenceSegmentIndexes: reference.optionalSegmentIndexes,
    optionalNullishBoundaryCount: reference.optionalSegmentIndexes.length,
    signatureHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxHookDependencyItem', ordinal, valueKind: 'optional-reference', dependencyText: reference.text, referencePath: reference.path, optionalReferenceSegmentIndexes: reference.optionalSegmentIndexes })
  };
}

function dynamicHookDependencyRecord(item, ordinal) {
  const dependencyText = normalizedHookDependencyText(item);
  const dynamicDependencyKind = hookDependencyDynamicKind(dependencyText);
  return {
    ordinal,
    proofStatus: 'dynamic-hook-dependency-unsupported',
    reasonCode: 'jsx-render-hook-dependency-unsupported',
    dependencyText,
    dynamicDependencyKind,
    dynamicBlockerReasonCode: `jsx-render-hook-dependency-${dynamicDependencyKind}-unsupported`,
    signatureHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxHookDependencyItem', ordinal, dependencyText, dynamicDependencyKind })
  };
}

function isStaticHookDependencyText(text) {
  return hookDependencyItemRecord(text, 1).proofStatus === 'static-hook-dependency-evidence';
}

function hookDependencyLiteralKind(text) {
  const value = normalizedHookDependencyText(text);
  if (/^(?:true|false)$/.test(value)) return 'boolean';
  if (/^(?:null|undefined)$/.test(value)) return value;
  if (/^[-]?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return 'number';
  if (/^"(?:[^"\\]|\\.)*"$/.test(value) || /^'(?:[^'\\]|\\.)*'$/.test(value)) return 'string';
  return undefined;
}

function staticHookDependencyReference(text) {
  const value = normalizedHookDependencyText(text);
  if (!/^(?:this|[A-Za-z_$][\w$]*)(?:\s*\.\s*[A-Za-z_$][\w$]*)*$/.test(value)) return undefined;
  const normalized = value.replace(/\s+/g, '');
  const path = normalized.split('.');
  return { text: normalized, root: path[0], path };
}

function hookDependencyDynamicKind(text) {
  const value = normalizedHookDependencyText(text);
  if (/\[[\s\S]*\]/.test(value)) return 'computed-reference';
  if (/\?\.\s*\(/.test(value) || /\b[A-Za-z_$][\w$]*(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)*\s*\(/.test(value)) return 'call-expression';
  if (/\?\./.test(value)) return 'optional-reference';
  return 'dynamic-expression';
}

function hookContextConsumer(hookName, ordinal, contextText) {
  if (hookName !== 'useContext') return undefined;
  const expressionText = normalizedHookDependencyText(contextText);
  if (!expressionText) return undefined;
  const classification = jsxContextTargetClassification(expressionText);
  return compactRecord({
    ...classification,
    expressionText,
    expressionHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxContextConsumerExpression', expressionText }),
    signatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxContextConsumer',
      hookName,
      ordinal,
      expressionText,
      classification
    })
  });
}

function splitTopLevel(text, delimiter) {
  const result = [];
  let start = 0;
  let depth = 0;
  let quote;
  let escaped = false;
  const value = String(text ?? '');
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth = Math.max(0, depth - 1);
    else if (char === delimiter && depth === 0) {
      result.push(value.slice(start, index));
      start = index + 1;
    }
  }
  result.push(value.slice(start));
  return result;
}

function findMatchingDelimiter(text, openIndex, open, close) {
  const value = String(text ?? '');
  if (value[openIndex] !== open) return undefined;
  let depth = 0;
  let quote;
  let escaped = false;
  for (let index = openIndex; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === open) depth += 1;
    else if (char === close) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return undefined;
}

function normalizedHookDependencyText(text) { return String(text ?? '').trim().replace(/\s+/g, ' '); }
function uniqueStrings(values = []) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { jsxHookCalls };
