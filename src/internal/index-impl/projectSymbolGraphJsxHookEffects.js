import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { staticOptionalMemberReference } from './staticOptionalMemberReference.js';

function hookEffectCallback(hookName, ordinal, callbackText) {
  if (!isEffectHookName(hookName)) return undefined;
  const callback = normalizedHookEffectText(callbackText);
  if (!callback) return undefined;
  const callbackEvidence = hookEffectExpressionEvidence(callback, 'callback');
  const cleanupReturn = hookEffectCleanupReturnText(callback);
  const cleanupEvidence = cleanupReturn ? hookEffectExpressionEvidence(cleanupReturn, 'cleanup') : undefined;
  return {
    proofStatus: callbackEvidence.proofStatus,
    callbackKind: callbackEvidence.expressionKind,
    callbackText: callbackEvidence.static ? callback : undefined,
    dynamicCallbackText: callbackEvidence.static ? undefined : callback,
    callbackHash: hashSemanticValue({ kind: 'frontier.lang.projectJsxHookEffectCallback', hookName, ordinal, callback, callbackEvidence }),
    callbackReferenceRoot: callbackEvidence.referenceRoot,
    callbackReferencePath: callbackEvidence.referencePath,
    callbackReferenceMemberPath: callbackEvidence.referenceMemberPath,
    callbackOptionalReference: callbackEvidence.optionalReference,
    callbackOptionalReferenceSegments: callbackEvidence.optionalReferenceSegments,
    callbackOptionalReferenceSegmentIndexes: callbackEvidence.optionalReferenceSegmentIndexes,
    callbackOptionalNullishBoundaryCount: callbackEvidence.optionalNullishBoundaryCount,
    dynamicCallbackKind: callbackEvidence.dynamicExpressionKind,
    dynamicCallbackBlockerReasonCode: callbackEvidence.dynamicBlockerReasonCode,
    cleanupProofStatus: cleanupEvidence?.cleanupProofStatus,
    cleanupReturnKind: cleanupEvidence?.expressionKind,
    cleanupReturnText: cleanupEvidence?.static ? cleanupReturn : undefined,
    dynamicCleanupReturnText: cleanupEvidence && !cleanupEvidence.static ? cleanupReturn : undefined,
    cleanupReturnHash: cleanupReturn ? hashSemanticValue({ kind: 'frontier.lang.projectJsxHookEffectCleanupReturn', hookName, ordinal, cleanupReturn, cleanupEvidence }) : undefined,
    cleanupReturnReferenceRoot: cleanupEvidence?.referenceRoot,
    cleanupReturnReferencePath: cleanupEvidence?.referencePath,
    cleanupReturnReferenceMemberPath: cleanupEvidence?.referenceMemberPath,
    cleanupReturnOptionalReference: cleanupEvidence?.optionalReference,
    cleanupReturnOptionalReferenceSegments: cleanupEvidence?.optionalReferenceSegments,
    cleanupReturnOptionalReferenceSegmentIndexes: cleanupEvidence?.optionalReferenceSegmentIndexes,
    cleanupReturnOptionalNullishBoundaryCount: cleanupEvidence?.optionalNullishBoundaryCount,
    dynamicCleanupReturnKind: cleanupEvidence?.dynamicExpressionKind,
    dynamicCleanupReturnBlockerReasonCode: cleanupEvidence?.dynamicBlockerReasonCode,
    cleanupReturnPresent: cleanupReturn ? true : undefined,
    runtimeEquivalenceClaim: false,
    signatureHash: hashSemanticValue({
      kind: 'frontier.lang.projectJsxHookEffect',
      hookName,
      ordinal,
      callback,
      callbackEvidence,
      cleanupReturn,
      cleanupEvidence,
      runtimeEquivalenceClaim: false
    })
  };
}

function hookEffectExpressionEvidence(text, role) {
  const value = normalizedHookEffectText(text);
  const staticKind = staticHookEffectExpressionKind(value);
  if (staticKind) return { static: true, proofStatus: 'static-effect-callback-source-evidence', cleanupProofStatus: 'static-effect-cleanup-source-evidence', expressionKind: staticKind };
  const optionalReference = staticOptionalMemberReference(value);
  if (optionalReference) return staticOptionalReferenceEvidence(optionalReference);
  const reference = staticHookEffectReference(value);
  if (reference) return { static: true, proofStatus: 'static-effect-callback-source-evidence', cleanupProofStatus: 'static-effect-cleanup-source-evidence', expressionKind: 'reference', ...reference };
  const dynamicExpressionKind = dynamicHookEffectExpressionKind(value);
  return {
    static: false,
    proofStatus: 'dynamic-effect-callback-unsupported',
    cleanupProofStatus: 'dynamic-effect-cleanup-unsupported',
    dynamicExpressionKind,
    dynamicBlockerReasonCode: `jsx-render-hook-effect-${role}-${dynamicExpressionKind}-unsupported`
  };
}

function staticOptionalReferenceEvidence(reference) {
  return {
    static: true,
    proofStatus: 'static-effect-callback-source-evidence',
    cleanupProofStatus: 'static-effect-cleanup-source-evidence',
    expressionKind: 'optional-reference',
    referenceRoot: reference.root,
    referencePath: reference.path,
    referenceMemberPath: reference.memberPath,
    optionalReference: true,
    optionalReferenceSegments: reference.optionalSegments,
    optionalReferenceSegmentIndexes: reference.optionalSegmentIndexes,
    optionalNullishBoundaryCount: reference.optionalSegmentIndexes.length
  };
}

function staticHookEffectExpressionKind(text) {
  const value = normalizedHookEffectText(text);
  if (!value) return undefined;
  if (/^(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>[\s\S]+$/.test(value)) return 'arrow-function';
  if (/^(?:async\s+)?function(?:\s+[A-Za-z_$][\w$]*)?\s*\([^)]*\)\s*\{[\s\S]*\}$/.test(value)) return 'function-expression';
  return undefined;
}

function staticHookEffectReference(text) {
  const value = normalizedHookEffectText(text);
  if (!/^(?:this|[A-Za-z_$][\w$]*)(?:\s*\.\s*[A-Za-z_$][\w$]*)*$/.test(value)) return undefined;
  const normalized = value.replace(/\s+/g, '');
  const path = normalized.split('.');
  return { referenceRoot: path[0], referencePath: path, referenceMemberPath: path.slice(1) };
}

function dynamicHookEffectExpressionKind(text) {
  const value = normalizedHookEffectText(text);
  if (/\[[\s\S]*\]/.test(value)) return 'computed-reference';
  if (/\?\.\s*\(/.test(value) || /\b[A-Za-z_$][\w$]*(?:\s*(?:\.|\?\.)\s*[A-Za-z_$][\w$]*)*\s*\(/.test(value)) return 'call-expression';
  if (/\?\./.test(value)) return 'optional-reference';
  return 'dynamic-expression';
}

function hookEffectCleanupReturnText(callbackText) {
  const match = /\breturn\s+([\s\S]*?)(?:;|$)/.exec(callbackText);
  return match ? normalizedHookEffectText(match[1]) : undefined;
}

function isEffectHookName(name) {
  return name === 'useEffect' || name === 'useLayoutEffect' || name === 'useInsertionEffect';
}

function normalizedHookEffectText(text) { return String(text ?? '').trim().replace(/\s+/g, ' '); }

export { hookEffectCallback };
