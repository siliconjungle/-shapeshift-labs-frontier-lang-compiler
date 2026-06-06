import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{sourcePreservationFromProjectionContext}from'./sourcePreservationFromProjectionContext.js';
export function nativeProjectionSourceCandidate(context, options) {
  const preservation = sourcePreservationFromProjectionContext(context);
  const explicitSourceText = options.sourceText ?? options.preservedSourceText ?? options.exactSourceText;
  const sourceText = explicitSourceText ?? preservation?.sourceText;
  if (typeof sourceText !== 'string') return undefined;
  const computedSourceHash = hashSemanticValue(sourceText);
  const declaredSourceHash = options.sourceHash ?? (explicitSourceText === undefined ? preservation?.sourceHash : undefined);
  const sourceHash = computedSourceHash;
  const hashVerified = Boolean(context.sourceHash);
  const exact = !context.sourceHash || sourceHash === context.sourceHash || options.verifySourceHash === false;
  return {
    sourceText,
    sourceHash,
    declaredSourceHash,
    hashVerified,
    exact,
    mismatch: hashVerified && sourceHash !== context.sourceHash && options.verifySourceHash !== false,
    sourcePreservationId: preservation?.id
  };
}
