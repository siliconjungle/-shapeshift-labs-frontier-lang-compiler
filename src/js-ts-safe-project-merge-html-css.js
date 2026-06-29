import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { safeMergeCssSource } from '@shapeshift-labs/frontier-lang-css';
import { safeMergeHtmlSource } from '@shapeshift-labs/frontier-lang-html';
import { compactRecord } from './js-ts-safe-merge-context.js';
import { hashText, safeId, uniqueStrings } from './js-ts-safe-project-merge-core.js';
import { blockCssCascadeRuntimeProofBroadClaims, cssCascadeRuntimeProofGuardedMergeOptions } from './js-ts-safe-project-merge-css-cascade-runtime-proof-guard.js';
import { projectCssDependencyProofOptionsForBlockedMerge } from './js-ts-safe-project-merge-css-dependency-proofs.js';
import { projectCssModuleMergeOptionsForFile, projectCssModuleProofOptionsForBlockedMerge } from './js-ts-safe-project-merge-css-module-proofs.js';
import { cssModuleSourceMapIdentityMergeOptions } from './js-ts-safe-project-merge-css-module-source-map.js';
import { blockCssScopedParserEvidenceGap, blockCssSelectorFunctionalPseudoSpecificityGap, normalizeHtmlCssParserEvidenceSides } from './js-ts-safe-project-merge-html-css-parser-gaps.js';
import { htmlProofGapNextProof, htmlProofGapSummary } from './js-ts-safe-project-merge-html-proof-gap-text.js';
import { htmlRuntimeBoundaryBroadClaimProofForChange, htmlRuntimeBoundaryChanges, htmlRuntimeBoundaryProofForChange, htmlRuntimeBoundaryProofRecord, htmlRuntimeBoundaryProvenResult } from './js-ts-safe-project-merge-html-runtime-boundaries.js';
import { packageManagementLanguageForPath } from './js-ts-safe-project-merge-package-management.js';
import { FRONTIER_SOURCE_BOUND_RUNTIME_PROOF_KIND, runtimeEvidenceMetadataFromProof, runtimeProofBroadClaimFields } from './js-ts-safe-project-merge-runtime-proof-capsule.js';
import { attachSvgMergeEvidence } from './js-ts-safe-project-merge-svg-runtime-proof.js';

function projectFileLanguage(file, input) {
  return file.language ?? inferLanguageFromPath(file.sourcePath) ?? input.language ?? 'typescript';
}

function maybeMergeHtmlCssProjectFile(options) {
  const { file, input, projectId, context, base, worker, head, sourceInput, projectCssModuleMergeEvidence } = options;
  const language = String(context.language ?? '').toLowerCase();
  const merge = isMarkupLanguage(language) ? safeMergeHtmlSource : language === 'css' ? safeMergeCssSource : undefined;
  if (!merge) return undefined;
  const resultId = `${projectId}_${safeId(file.sourcePath)}`;
  const mergeOptions = {
    ...htmlCssMergeOptionsForProjectFile(input, file.sourcePath, language),
    ...(language === 'css' ? projectCssModuleMergeOptionsForFile(projectCssModuleMergeEvidence, file.sourcePath) : {})
  };
  const sourceMapMergeOptions = language === 'css' ? cssModuleSourceMapIdentityMergeOptions(mergeOptions, cssModuleSourceMapProofContext(mergeOptions, file.sourcePath)) : {};
  const effectiveMergeOptions = { ...mergeOptions, ...sourceMapMergeOptions };
  const cssRuntimeProofGuard = language === 'css' ? cssCascadeRuntimeProofGuardedMergeOptions(effectiveMergeOptions, file.sourcePath) : undefined;
  const guardedMergeOptions = cssRuntimeProofGuard?.mergeOptions ?? effectiveMergeOptions;
  const runtimeBoundaryProofs = isMarkupLanguage(language) ? htmlRuntimeBoundaryProofCandidates(input, file.sourcePath, mergeOptions) : [];
  const runtimeBoundaryMergeOptions = runtimeBoundaryProofs.length ? { htmlRuntimeBoundaryProofs: runtimeBoundaryProofs, htmlSourceBoundRuntimeBoundaryProofs: runtimeBoundaryProofs } : {};
  let result = merge({ ...sourceInput, ...guardedMergeOptions, ...context, ...runtimeBoundaryMergeOptions, id: resultId, baseSourceText: base, workerSourceText: worker, headSourceText: head, includeBlockedMergeCandidate: language === 'css' || sourceInput.includeBlockedMergeCandidate === true });
  if (language === 'css' && result.status === 'blocked') {
    const proofOptions = projectCssDependencyProofOptionsForBlockedMerge({ projectInput: input, sourcePath: file.sourcePath, firstResult: result, base, worker, head });
    if (proofOptions?.mergeOptions) {
      result = merge({ ...sourceInput, ...guardedMergeOptions, ...proofOptions.mergeOptions, ...context, id: resultId, baseSourceText: base, workerSourceText: worker, headSourceText: head, includeBlockedMergeCandidate: true });
    } else if (proofOptions?.result) {
      result = proofOptions.result;
    }
  }
  if (language === 'css' && result.status === 'blocked') {
    const proofOptions = projectCssModuleProofOptionsForBlockedMerge({ evidence: projectCssModuleMergeEvidence, sourcePath: file.sourcePath, mergeOptions: guardedMergeOptions, firstResult: result, base, worker, head });
    if (proofOptions?.mergeOptions) {
      result = merge({ ...sourceInput, ...guardedMergeOptions, ...proofOptions.mergeOptions, ...context, id: resultId, baseSourceText: base, workerSourceText: worker, headSourceText: head, includeBlockedMergeCandidate: true });
    } else if (proofOptions?.result) {
      result = proofOptions.result;
    }
  }
  if (language === 'css' && cssRuntimeProofGuard?.invalidProofs?.length) {
    result = blockCssCascadeRuntimeProofBroadClaims({ result, id: resultId, sourcePath: file.sourcePath, invalidProofs: cssRuntimeProofGuard?.invalidProofs }) ?? result;
  }
  result = normalizeHtmlCssParserEvidenceSides({ result, base, worker, head });
  if (language === 'svg') {
    result = attachSvgMergeEvidence({ result, input, mergeOptions, id: resultId, sourcePath: file.sourcePath, base, worker, head });
  }
  if (language === 'css' && result.status === 'merged') {
    result = blockCssScopedParserEvidenceGap({ result, id: resultId, sourcePath: file.sourcePath }) ?? result;
    if (result.status === 'merged') result = blockCssSelectorFunctionalPseudoSpecificityGap({ result, id: resultId, sourcePath: file.sourcePath }) ?? result;
  }
  const admittedResult = isMarkupLanguage(language) && result.status === 'merged'
    ? blockHtmlProofGapChanges({ result, id: resultId, sourcePath: file.sourcePath, base, worker, head, runtimeBoundaryProofs }) ?? result
    : result;
  const sourceBinding = { base, worker, head };
  return admittedResult.status === 'merged' ? mergedHtmlCssFile(file, context, admittedResult, language, sourceBinding) : blockedHtmlCssFile(file, context, admittedResult, language, sourceBinding);
}

function inferLanguageFromPath(sourcePath) {
  const path = String(sourcePath ?? '').toLowerCase().replace(/[?#].*$/, '');
  const packageLanguage = packageManagementLanguageForPath(path);
  if (packageLanguage) return packageLanguage;
  if (path.endsWith('.html') || path.endsWith('.htm')) return 'html';
  if (path.endsWith('.svg')) return 'svg';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.tsx')) return 'tsx';
  if (path.endsWith('.jsx')) return 'jsx';
  if (path.endsWith('.ts') || path.endsWith('.mts') || path.endsWith('.cts')) return 'typescript';
  if (path.endsWith('.js') || path.endsWith('.mjs') || path.endsWith('.cjs')) return 'javascript';
  return undefined;
}

function cssModuleSourceMapProofContext(mergeOptions, sourcePath) {
  return {
    sourcePath,
    generatedClassNameMapHash: firstString(mergeOptions.generatedClassNameMapHash, mergeOptions.cssModuleGeneratedClassNameMapHash),
    bundlerTransformHash: firstString(mergeOptions.bundlerTransformHash, mergeOptions.cssModuleBundlerTransformHash),
    generatedSourceHash: firstString(mergeOptions.generatedSourceHash, mergeOptions.cssModuleGeneratedSourceHash),
    loaderRequestHash: firstString(mergeOptions.loaderRequestHash, mergeOptions.cssModuleLoaderRequestHash),
    loaderQueryHash: firstString(mergeOptions.loaderQueryHash, mergeOptions.cssModuleLoaderQueryHash),
    sourceMapArtifactHash: firstString(mergeOptions.sourceMapArtifactHash, mergeOptions.cssModuleSourceMapArtifactHash, mergeOptions.cssModuleSourceMapHash),
    sourcesContentHash: firstString(mergeOptions.sourcesContentHash, mergeOptions.sourceMapSourcesContentHash, mergeOptions.cssModuleSourceMapSourcesContentHash)
  };
}

function firstString(...values) {
  for (const value of values) if (value !== undefined && value !== null && String(value)) return String(value);
  return undefined;
}

function htmlCssMergeOptionsForProjectFile(input, sourcePath, language) {
  const byPath = isMarkupLanguage(language)
    ? input[`${language}MergeOptionsByPath`] ?? input.htmlMergeOptionsByPath ?? input.markupMergeOptionsByPath
    : input.cssMergeOptionsByPath ?? input.styleMergeOptionsByPath;
  return compactRecord({
    ...(language === 'css' ? input.cssMergeOptions ?? input.styleMergeOptions : input[`${language}MergeOptions`] ?? input.htmlMergeOptions ?? input.markupMergeOptions),
    ...(byPath?.[sourcePath] ?? {})
  });
}

function isMarkupLanguage(language) {
  return language === 'html' || language === 'svg';
}

function blockHtmlProofGapChanges({ result, id, sourcePath, base, worker, head, runtimeBoundaryProofs = [] }) {
  const binding = { sourcePath, base, worker, head, output: result.mergedSourceText };
  const runtimeBoundaryProofRecords = [];
  const runtimeBoundaryConflicts = [];
  for (const change of htmlRuntimeBoundaryChanges(base, worker, head)) {
    const proof = htmlRuntimeBoundaryProofForChange(runtimeBoundaryProofs, change, binding);
    if (proof) runtimeBoundaryProofRecords.push(htmlRuntimeBoundaryProofRecord(proof, change, binding));
    else {
      const broadClaimProof = htmlRuntimeBoundaryBroadClaimProofForChange(runtimeBoundaryProofs, change, binding);
      runtimeBoundaryConflicts.push(broadClaimProof ? htmlRuntimeBoundaryBroadClaimConflict(id, sourcePath, broadClaimProof, change) : htmlProofGapConflict(id, sourcePath, change.reasonCode, change));
    }
  }
  const conflicts = [
    htmlDuplicateIdentityConflict(result, sourcePath),
    ...runtimeBoundaryConflicts
  ].filter(Boolean);
  if (!conflicts.length) return runtimeBoundaryProofRecords.length ? htmlRuntimeBoundaryProvenResult(result, runtimeBoundaryProofRecords) : undefined;
  const allConflicts = [...(result.conflicts ?? []), ...conflicts];
  const { mergedSourceText, mergedSourceHash, ...rest } = result;
  return compactRecord({
    ...rest,
    status: 'blocked',
    operation: 'blocked',
    conflicts: allConflicts,
    admission: blockedHtmlProofGapAdmission(result.admission, allConflicts),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserRuntimeEquivalenceClaim: false
  });
}

function htmlDuplicateIdentityConflict(result, sourcePath) {
  const duplicates = duplicateHtmlExplicitIdentityKeys(result?.identityEvidence);
  if (!duplicates.length) return undefined;
  return htmlProofGapConflict(result.id, result.sourcePath ?? sourcePath, 'html-duplicate-explicit-identity', {
    boundary: 'html-explicit-identity',
    duplicateIdentityKeys: duplicates
  }, 'html-duplicate-identity-blocked');
}

function htmlRuntimeBoundaryProofCandidates(input, sourcePath, mergeOptions) {
  return [
    input.htmlBrowserRuntimeProof,
    input.htmlBrowserRuntimeProofs,
    input.htmlBrowserRuntimeProofsByPath?.[sourcePath],
    input.htmlSourceBoundRuntimeProof,
    input.htmlSourceBoundRuntimeProofs,
    input.htmlSourceBoundRuntimeProofsByPath?.[sourcePath],
    input.htmlRuntimeBoundaryProof,
    input.htmlRuntimeBoundaryProofs,
    input.htmlRuntimeBoundaryProofsByPath?.[sourcePath],
    input.htmlSourceBoundRuntimeBoundaryProof,
    input.htmlSourceBoundRuntimeBoundaryProofs,
    input.htmlSourceBoundRuntimeBoundaryProofsByPath?.[sourcePath],
    input.browserRuntimeProof,
    input.browserRuntimeProofs,
    input.browserRuntimeProofsByPath?.[sourcePath],
    input.sourceBoundRuntimeProof,
    input.sourceBoundRuntimeProofs,
    input.sourceBoundRuntimeProofsByPath?.[sourcePath],
    mergeOptions.htmlBrowserRuntimeProof,
    mergeOptions.htmlBrowserRuntimeProofs,
    mergeOptions.htmlSourceBoundRuntimeProof,
    mergeOptions.htmlSourceBoundRuntimeProofs,
    mergeOptions.htmlRuntimeBoundaryProof,
    mergeOptions.htmlRuntimeBoundaryProofs,
    mergeOptions.sourceBoundRuntimeBoundaryProof,
    mergeOptions.sourceBoundRuntimeBoundaryProofs,
    mergeOptions.runtimeBoundaryProof,
    mergeOptions.runtimeBoundaryProofs,
    mergeOptions.browserRuntimeProof,
    mergeOptions.browserRuntimeProofs,
    mergeOptions.sourceBoundRuntimeProof,
    mergeOptions.sourceBoundRuntimeProofs
  ].flatMap(asArray).filter(Boolean).map(htmlRuntimeBoundaryProofCandidateForRuntimePackage);
}

function htmlRuntimeBoundaryProofCandidateForRuntimePackage(proof) {
  const metadata = runtimeEvidenceMetadataFromProof(proof);
  if (!metadata) return proof;
  const canonicalRuntimeProof = proof.kind === FRONTIER_SOURCE_BOUND_RUNTIME_PROOF_KIND;
  return compactRecord({
    ...proof,
    kind: canonicalRuntimeProof ? 'html-source-bound-runtime-boundary-proof' : proof.kind,
    sourceBoundRuntimeProofKind: canonicalRuntimeProof ? proof.kind : proof.sourceBoundRuntimeProofKind,
    boundary: proof.boundary ?? proof.boundaryKey ?? proof.recordKey,
    boundaries: proof.boundaries ?? proof.boundaryKeys ?? proof.recordKeys,
    attributeName: proof.attributeName ?? singleString(proof.boundaryAttributes ?? proof.changedBoundaryAttributes ?? proof.attributeNames ?? proof.changedAttributeNames),
    attributeNames: proof.attributeNames ?? proof.boundaryAttributes ?? proof.changedBoundaryAttributes ?? proof.changedAttributeNames,
    changedBoundaryAttributes: proof.changedBoundaryAttributes ?? proof.boundaryAttributes ?? proof.attributeNames ?? proof.changedAttributeNames,
    runtimeCommand: proof.runtimeCommand ?? metadata.command,
    runtimeProbeId: proof.runtimeProbeId ?? metadata.probeId,
    runtimeEvidenceHash: proof.runtimeEvidenceHash ?? metadata.evidenceHash,
    runtimeSignals: proof.runtimeSignals ?? metadata.signals
  });
}

function duplicateHtmlExplicitIdentityKeys(identityEvidence) {
  return Object.entries(identityEvidence?.sides ?? {}).flatMap(([side, evidence]) => {
    const counts = new Map();
    for (const key of evidence?.explicitIdentityKeys ?? []) counts.set(key, (counts.get(key) ?? 0) + 1);
    return [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([key, count]) => ({ side, key, count }));
  });
}

function asArray(value) {
  return Array.isArray(value) ? value : value === undefined ? [] : [value];
}

function singleString(value) {
  const values = asArray(value).filter((item) => typeof item === 'string' && item.length > 0);
  return values.length === 1 ? values[0] : undefined;
}

function htmlProofGapConflict(id, sourcePath, reasonCode, details = {}, code = 'html-proof-gap-blocked') {
  return {
    code,
    gateId: 'html-semantic-merge',
    sourcePath,
    details: compactRecord({
      reasonCode,
      conflictKey: `html#${id}#${reasonCode}#${details.side ?? details.duplicateIdentityKeys?.[0]?.key ?? sourcePath ?? 'source'}`,
      proofGap: {
        code: reasonCode,
        status: 'not-claimed',
        summary: htmlProofGapSummary(reasonCode),
        nextProof: htmlProofGapNextProof(reasonCode),
        failClosed: true,
        semanticEquivalenceClaim: false
      },
      ...details
    })
  };
}

function htmlRuntimeBoundaryBroadClaimConflict(id, sourcePath, proof, change) {
  return htmlProofGapConflict(id, sourcePath, 'html-runtime-proof-broad-claim', {
    ...change,
    proofId: proof.id,
    proofGapCode: change.reasonCode,
    broadClaimFields: runtimeProofBroadClaimFields(proof),
    summary: 'HTML runtime proofs cannot self-assert broad browser, render, semantic, or auto-merge equivalence claims.'
  }, 'html-runtime-proof-broad-claim');
}

function blockedHtmlProofGapAdmission(admission = {}, conflicts = []) {
  return {
    ...admission,
    status: 'blocked',
    action: 'human-review',
    reviewRequired: true,
    autoApplyCandidate: false,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserRuntimeEquivalenceClaim: false,
    reasonCodes: uniqueStrings([...(admission.reasonCodes ?? []), ...conflicts.map((conflict) => conflict.details?.reasonCode ?? conflict.code)])
  };
}

function mergedHtmlCssFile(file, context, result, language, sourceBinding) {
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile', version: 1, sourcePath: file.sourcePath, language: context.language, status: 'merged', operation: `merged-${language}-source`,
    outputSourceText: result.mergedSourceText, outputHash: hashText(result.mergedSourceText), baseHash: hashText(file.baseSourceText), workerHash: hashText(file.workerSourceText), headHash: hashText(file.headSourceText),
    parserSourceHashes: parserSourceHashesForLanguage(language, sourceBinding),
    result, semanticArtifacts: result.semanticArtifacts, conflicts: [], admission: result.admission, summary: result.summary, conflictKeys: [`source#${file.sourcePath}`]
  });
}

function blockedHtmlCssFile(file, context, result, language, sourceBinding) {
  const conflicts = normalizeHtmlCssConflicts(result.conflicts ?? [], context.language);
  const admission = blockedHtmlCssAdmission(result.admission, context.language);
  const normalizedResult = compactRecord({ ...result, conflicts, admission });
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile', version: 1, sourcePath: file.sourcePath, language: context.language, status: 'blocked', operation: 'blocked-merge',
    baseHash: hashText(file.baseSourceText), workerHash: hashText(file.workerSourceText), headHash: hashText(file.headSourceText),
    parserSourceHashes: parserSourceHashesForLanguage(language, sourceBinding),
    result: normalizedResult, conflicts, admission, summary: result.summary, conflictKeys: [`source#${file.sourcePath}`]
  });
}

function parserSourceHashesForLanguage(language, binding) {
  if (language === 'css') return compactRecord({ base: cssSourceHash(binding.base), worker: cssSourceHash(binding.worker), head: cssSourceHash(binding.head) });
  if (language === 'svg') return compactRecord({ base: svgSourceHash(binding.base), worker: svgSourceHash(binding.worker), head: svgSourceHash(binding.head) });
  return undefined;
}

function cssSourceHash(sourceText) { return typeof sourceText === 'string' ? hashSemanticValue({ kind: 'frontier.lang.css.source.v1', sourceText }) : undefined; }
function svgSourceHash(sourceText) { return typeof sourceText === 'string' ? hashSemanticValue({ kind: 'frontier.lang.svg.source.v1', sourceText }) : undefined; }

function blockedHtmlCssAdmission(admission = {}, language) { return compactRecord({ ...admission, browserRuntimeEquivalenceClaim: language === 'html' ? false : admission.browserRuntimeEquivalenceClaim, browserCascadeEquivalenceClaim: language === 'css' ? false : admission.browserCascadeEquivalenceClaim, browserRenderEquivalenceClaim: language === 'css' ? false : admission.browserRenderEquivalenceClaim }); }

function normalizeHtmlCssConflicts(conflicts, language) {
  return language !== 'html' ? conflicts : conflicts.map((conflict) => {
    const reasonCode = conflict.details?.reasonCode;
    if (conflict.code !== 'html-proof-gap-blocked' || !reasonCode) return conflict;
    const proofGap = { ...(conflict.details?.proofGap ?? {}), summary: conflict.details?.proofGap?.summary ?? htmlProofGapSummary(reasonCode), nextProof: conflict.details?.proofGap?.nextProof ?? htmlProofGapNextProof(reasonCode) };
    return { ...conflict, details: { ...(conflict.details ?? {}), proofGap } };
  });
}

export { maybeMergeHtmlCssProjectFile, projectFileLanguage };
