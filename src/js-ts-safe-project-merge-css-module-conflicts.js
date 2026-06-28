import { compactRecord } from './js-ts-safe-merge-context.js';

function cssModuleUseSiteBlockerConflicts(blockers = []) {
  return blockers.map(cssModuleUseSiteBlockerConflict);
}

function cssModuleUseSiteBlockerConflict(blocker) {
  const reasonCode = blocker.reasonCode ?? 'css-module-use-site-proof-blocked';
  const proofBoundary = blocker.proofBoundary ?? cssModuleProofBoundaryForReason(reasonCode);
  const requiredProof = cssModuleRequiredProofForReason(reasonCode, proofBoundary);
  return {
    code: 'project-css-module-use-site-proof-blocked',
    gateId: 'project-css-module-use-site-graph',
    message: `Output project graph has unproved CSS Module use-site evidence: ${reasonCode}.`,
    sourcePath: blocker.sourcePath,
    details: compactRecord({
      reasonCode,
      conflictKey: cssModuleUseSiteBlockerConflictKey(blocker),
      sourcePath: blocker.sourcePath,
      sourceSpan: blocker.sourceSpan,
      moduleSpecifier: blocker.moduleSpecifier,
      localName: blocker.localName,
      cssModuleImportBindingId: blocker.cssModuleImportBindingId,
      cssModuleSourcePath: blocker.cssModuleSourcePath,
      expressionText: blocker.expressionText,
      proofBoundary,
      requiredProof,
      writeOperation: blocker.writeOperation,
      jsxPropRecordId: blocker.jsxPropRecordId,
      failClosed: true,
      semanticEquivalenceClaim: false,
      proofGap: cssModuleUseSiteProofGap(blocker, reasonCode, proofBoundary, requiredProof)
    })
  };
}

function cssModuleUseSiteBlockerConflictKey(blocker) {
  return [
    'css-module-use-site',
    blocker.cssModuleSourcePath ?? blocker.moduleSpecifier ?? 'unknown-module',
    blocker.sourcePath ?? 'unknown-source',
    blocker.localName ?? 'unknown-local',
    blocker.proofBoundary ?? 'unknown-boundary',
    blocker.reasonCode ?? 'unknown-reason',
    spanKey(blocker.sourceSpan),
    blocker.expressionText
  ].map((part) => String(part ?? '')).join('#');
}

function isResolvedCssModuleImportEdge(edge) {
  return isCssModulePath(edge?.resolvedModulePath ?? edge?.moduleSpecifier)
    && Boolean(edge?.targetDocumentId)
    && typeof edge?.resolutionKind === 'string'
    && edge.resolutionKind.endsWith('-source');
}

function isCssModulePath(path) {
  return /\.module\.css(?:[?#].*)?$/i.test(String(path ?? ''));
}

function cssModuleUseSiteProofGap(blocker, reasonCode, proofBoundary, requiredProof) {
  return compactRecord({
    code: reasonCode,
    status: 'not-claimed',
    proofBoundary,
    requiredProof,
    summary: cssModuleProofGapSummary(reasonCode),
    nextProof: cssModuleNextProof(reasonCode, requiredProof),
    sourcePath: blocker.sourcePath,
    sourceSpan: blocker.sourceSpan,
    expressionText: blocker.expressionText,
    failClosed: true,
    semanticEquivalenceClaim: false
  });
}

function cssModuleProofBoundaryForReason(reasonCode) {
  if (reasonCode === 'css-module-generated-class-map-hash-mismatch' || reasonCode === 'css-module-generated-class-map-unproved') return 'css-module-generated-class-name-map';
  if (reasonCode === 'css-module-bundler-transform-identity-unproved') return 'css-module-bundler-transform-identity';
  if (reasonCode === 'css-module-source-map-proof-unproved' || reasonCode === 'css-module-source-map-proof-hash-mismatch') return 'css-module-source-map-identity';
  return 'css-module-use-site-graph';
}

function cssModuleRequiredProofForReason(reasonCode, proofBoundary) {
  if (proofBoundary === 'css-module-generated-class-name-map') return 'css-module-source-bound-generated-class-name-map-proof';
  if (proofBoundary === 'css-module-bundler-transform-identity') return 'css-module-source-bound-bundler-transform-identity-proof';
  if (proofBoundary === 'css-module-source-map-identity') return 'css-module-source-bound-source-map-identity-proof';
  if (reasonCode === 'css-module-named-export-reference-unproved') return 'css-module-source-bound-named-export-reference-proof';
  if (reasonCode === 'css-module-dynamic-member-access-unproved') return 'css-module-source-bound-dynamic-use-site-proof';
  if (reasonCode === 'css-module-icss-graph-unproved') return 'css-module-source-bound-icss-graph-proof';
  if (reasonCode === 'css-module-composition-resolution-unproved') return 'css-module-source-bound-composition-graph-proof';
  return 'css-module-source-bound-use-site-graph-proof';
}

function cssModuleProofGapSummary(reasonCode) {
  if (reasonCode === 'css-module-dynamic-member-access-unproved') return 'Dynamic CSS Module member access can select different generated class or ICSS token names at runtime and requires source-bound use-site evidence.';
  if (reasonCode === 'css-module-member-write-unsupported') return 'CSS Module namespace mutation can change generated class-name or ICSS token lookup behavior and is not auto-admitted.';
  if (reasonCode === 'css-module-string-literal-classname-unproved') return 'Literal className strings are not bound to generated CSS Module class-name maps.';
  if (reasonCode === 'css-module-helper-call-unproved') return 'CSS Module class helper calls require source-bounded token graph evidence.';
  if (reasonCode === 'css-module-named-export-reference-unproved') return 'CSS Module named imports require source-bound scope/use-def references before named export use-sites can be admitted.';
  if (reasonCode === 'css-module-generated-class-map-unproved' || reasonCode === 'css-module-generated-class-map-hash-mismatch') return 'CSS Module generated class-name map identity is required before admission.';
  if (reasonCode === 'css-module-bundler-transform-identity-unproved') return 'CSS Module bundler transform identity is required before admission.';
  if (reasonCode === 'css-module-source-map-proof-unproved') return 'CSS Module source-map identity is required before admission.';
  if (reasonCode === 'css-module-source-map-proof-hash-mismatch') return 'CSS Module source-map identity proof is stale or does not match source, generated output, generated class-name map, bundler transform, or mappings.';
  if (reasonCode === 'css-module-icss-graph-unproved') return 'ICSS import/export graph identity is required before CSS Module use-site admission.';
  if (reasonCode === 'css-module-composition-resolution-unproved') return 'CSS Module composition graph identity is required before use-site admission.';
  return 'CSS Module use-site graph evidence is required before admission.';
}

function cssModuleNextProof(reasonCode, requiredProof) {
  if (reasonCode === 'css-module-dynamic-member-access-unproved') return `${requiredProof} with sourcePath, sourceHash, sourceSpan, expressionText, resolved export names, generated class-name map hash, ICSS graph hash when tokens are involved, and no semantic-equivalence self-claim.`;
  if (reasonCode === 'css-module-member-write-unsupported') return 'Remove the CSS Module namespace write or replace it with source-bound runtime evidence reviewed outside auto-admission.';
  if (reasonCode === 'css-module-string-literal-classname-unproved') return 'Replace the literal with a static CSS Module member read or attach source-bound generated class-name map evidence for the literal token.';
  if (reasonCode === 'css-module-named-export-reference-unproved') return `${requiredProof} with sourcePath, sourceHash, module specifier, imported/exported name, local binding name, and scope reference span bound to the CSS Module import.`;
  return `${requiredProof} with source-bound hashes for the CSS Module source, JS/TS use-site graph, generated class-name map, bundler transform, and source-map identity where applicable.`;
}

function spanKey(span) {
  if (!span) return '';
  return [span.path, span.start, span.end].map((part) => String(part ?? '')).join(':');
}

export { cssModuleUseSiteBlockerConflicts, isResolvedCssModuleImportEdge };
