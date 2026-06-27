import { safeMergeCssSource } from '@shapeshift-labs/frontier-lang-css';
import { safeMergeHtmlSource } from '@shapeshift-labs/frontier-lang-html';
import { compactRecord } from './js-ts-safe-merge-context.js';
import { hashText, safeId, uniqueStrings } from './js-ts-safe-project-merge-core.js';
import { projectCssDependencyProofOptionsForBlockedMerge } from './js-ts-safe-project-merge-css-dependency-proofs.js';
import { projectCssModuleMergeOptionsForFile, projectCssModuleProofOptionsForBlockedMerge } from './js-ts-safe-project-merge-css-module-proofs.js';
import { htmlRuntimeBoundaryChanges, htmlRuntimeBoundaryProofForChange, htmlRuntimeBoundaryProofRecord, htmlRuntimeBoundaryProvenResult } from './js-ts-safe-project-merge-html-runtime-boundaries.js';

function projectFileLanguage(file, input) {
  return file.language ?? inferLanguageFromPath(file.sourcePath) ?? input.language ?? 'typescript';
}

function maybeMergeHtmlCssProjectFile(options) {
  const { file, input, projectId, context, base, worker, head, sourceInput, projectCssModuleMergeEvidence } = options;
  const language = String(context.language ?? '').toLowerCase();
  const merge = language === 'html' ? safeMergeHtmlSource : language === 'css' ? safeMergeCssSource : undefined;
  if (!merge) return undefined;
  const resultId = `${projectId}_${safeId(file.sourcePath)}`;
  const mergeOptions = {
    ...htmlCssMergeOptionsForProjectFile(input, file.sourcePath, language),
    ...(language === 'css' ? projectCssModuleMergeOptionsForFile(projectCssModuleMergeEvidence, file.sourcePath) : {})
  };
  const runtimeBoundaryProofs = language === 'html' ? htmlRuntimeBoundaryProofCandidates(input, file.sourcePath, mergeOptions) : [];
  const runtimeBoundaryMergeOptions = runtimeBoundaryProofs.length ? { htmlRuntimeBoundaryProofs: runtimeBoundaryProofs, htmlSourceBoundRuntimeBoundaryProofs: runtimeBoundaryProofs } : {};
  let result = merge({ ...sourceInput, ...mergeOptions, ...context, ...runtimeBoundaryMergeOptions, id: resultId, baseSourceText: base, workerSourceText: worker, headSourceText: head, includeBlockedMergeCandidate: language === 'css' || sourceInput.includeBlockedMergeCandidate === true });
  if (language === 'css' && result.status === 'blocked') {
    const proofOptions = projectCssDependencyProofOptionsForBlockedMerge({ projectInput: input, sourcePath: file.sourcePath, firstResult: result, base, worker, head });
    if (proofOptions?.mergeOptions) {
      result = merge({ ...sourceInput, ...mergeOptions, ...proofOptions.mergeOptions, ...context, id: resultId, baseSourceText: base, workerSourceText: worker, headSourceText: head, includeBlockedMergeCandidate: true });
    }
  }
  if (language === 'css' && result.status === 'blocked') {
    const proofOptions = projectCssModuleProofOptionsForBlockedMerge({ evidence: projectCssModuleMergeEvidence, sourcePath: file.sourcePath, mergeOptions, firstResult: result, base, worker, head });
    if (proofOptions?.mergeOptions) {
      result = merge({ ...sourceInput, ...mergeOptions, ...proofOptions.mergeOptions, ...context, id: resultId, baseSourceText: base, workerSourceText: worker, headSourceText: head, includeBlockedMergeCandidate: true });
    } else if (proofOptions?.result) {
      result = proofOptions.result;
    }
  }
  const admittedResult = language === 'html' && result.status === 'merged'
    ? blockHtmlProofGapChanges({ result, id: resultId, sourcePath: file.sourcePath, base, worker, head, runtimeBoundaryProofs }) ?? result
    : result;
  return admittedResult.status === 'merged' ? mergedHtmlCssFile(file, context, admittedResult, language) : blockedHtmlCssFile(file, context, admittedResult);
}

function inferLanguageFromPath(sourcePath) {
  const path = String(sourcePath ?? '').toLowerCase().replace(/[?#].*$/, '');
  if (path.endsWith('.html') || path.endsWith('.htm')) return 'html';
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.tsx')) return 'tsx';
  if (path.endsWith('.jsx')) return 'jsx';
  if (path.endsWith('.ts') || path.endsWith('.mts') || path.endsWith('.cts')) return 'typescript';
  if (path.endsWith('.js') || path.endsWith('.mjs') || path.endsWith('.cjs')) return 'javascript';
  return undefined;
}

function htmlCssMergeOptionsForProjectFile(input, sourcePath, language) {
  const byPath = language === 'html' ? input.htmlMergeOptionsByPath ?? input.markupMergeOptionsByPath : input.cssMergeOptionsByPath ?? input.styleMergeOptionsByPath;
  return compactRecord({ ...(language === 'css' ? input.cssMergeOptions ?? input.styleMergeOptions : input.htmlMergeOptions ?? input.markupMergeOptions), ...(byPath?.[sourcePath] ?? {}) });
}

function blockHtmlProofGapChanges({ result, id, sourcePath, base, worker, head, runtimeBoundaryProofs = [] }) {
  const binding = { sourcePath, base, worker, head, output: result.mergedSourceText };
  const runtimeBoundaryProofRecords = [];
  const runtimeBoundaryConflicts = [];
  for (const change of htmlRuntimeBoundaryChanges(base, worker, head)) {
    const proof = htmlRuntimeBoundaryProofForChange(runtimeBoundaryProofs, change, binding);
    if (proof) runtimeBoundaryProofRecords.push(htmlRuntimeBoundaryProofRecord(proof, change, binding));
    else runtimeBoundaryConflicts.push(htmlProofGapConflict(id, sourcePath, change.reasonCode, change));
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
    input.htmlRuntimeBoundaryProof,
    input.htmlRuntimeBoundaryProofs,
    input.htmlRuntimeBoundaryProofsByPath?.[sourcePath],
    input.htmlSourceBoundRuntimeBoundaryProof,
    input.htmlSourceBoundRuntimeBoundaryProofs,
    input.htmlSourceBoundRuntimeBoundaryProofsByPath?.[sourcePath],
    mergeOptions.htmlRuntimeBoundaryProof,
    mergeOptions.htmlRuntimeBoundaryProofs,
    mergeOptions.sourceBoundRuntimeBoundaryProof,
    mergeOptions.sourceBoundRuntimeBoundaryProofs,
    mergeOptions.runtimeBoundaryProof,
    mergeOptions.runtimeBoundaryProofs
  ].flatMap(asArray).filter(Boolean);
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

function htmlProofGapSummary(reasonCode) {
  if (reasonCode === 'html-duplicate-explicit-identity') return 'Duplicate explicit HTML identity keys make structural target admission ambiguous.';
  if (reasonCode === 'script-runtime-boundary') return 'HTML script execution can mutate document, module, network, and global runtime behavior and requires source-bound runtime evidence.';
  if (reasonCode === 'style-runtime-boundary') return 'HTML style blocks affect browser cascade and rendering and require source-bound runtime evidence.';
  if (reasonCode === 'template-runtime-boundary') return 'HTML template content can be cloned, stamped, or consumed by host code and requires source-bound runtime evidence.';
  if (reasonCode === 'slot-runtime-boundary') return 'HTML slots participate in shadow-DOM distribution and require source-bound runtime evidence.';
  if (reasonCode === 'custom-element-runtime-boundary') return 'Custom element upgrade, lifecycle, attributes, and shadow behavior require source-bound runtime evidence.';
  if (reasonCode === 'framework-directive-boundary') return 'Framework directive attributes are interpreted by framework runtimes and require source-bound runtime evidence.';
  if (reasonCode === 'event-handler-runtime-boundary') return 'HTML event handler attributes execute in the browser runtime and require source-bound runtime evidence.';
  if (reasonCode === 'inline-style-runtime-boundary') return 'HTML inline style attributes affect browser cascade and rendering and require source-bound runtime evidence.';
  if (reasonCode === 'iframe-runtime-boundary' || reasonCode === 'iframe-srcdoc-runtime-boundary') return reasonCode === 'iframe-runtime-boundary' ? 'HTML iframe runtime attributes affect nested browsing-context execution and require source-bound runtime evidence.' : 'HTML iframe srcdoc attributes define nested browsing-context content and require source-bound runtime evidence.';
  if (reasonCode === 'form-runtime-boundary') return 'HTML form runtime attributes affect submission, navigation, encoding, or validation and require source-bound runtime evidence.';
  if (reasonCode === 'form-submitter-runtime-boundary') return 'HTML submitter attributes affect form submission behavior and require source-bound runtime evidence.';
  if (reasonCode === 'form-control-runtime-boundary') return 'HTML form-control attributes affect user input, validation, state, or submission data and require source-bound runtime evidence.';
  if (reasonCode === 'document-base-runtime-boundary') return 'HTML base attributes affect URL resolution or navigation targets and require source-bound runtime evidence.';
  if (reasonCode === 'document-metadata-runtime-boundary') return 'HTML metadata attributes can affect document loading, policy, refresh, viewport, or discovery behavior and require source-bound runtime evidence.';
  if (reasonCode === 'resource-loading-runtime-boundary') return 'HTML resource-loading attributes affect fetched resources, selection, privacy, media behavior, or layout and require source-bound runtime evidence.';
  return 'HTML proof gap requires source-bound runtime evidence before structural merge admission.';
}

function htmlProofGapNextProof(reasonCode) {
  if (reasonCode === 'html-duplicate-explicit-identity') return 'Rename duplicate explicit HTML identity keys or supply parser-backed identity evidence with unique explicitIdentityKeys on every side.';
  if (reasonCode === 'script-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary "html-script-runtime"');
  if (reasonCode === 'style-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary "html-style-runtime"');
  if (reasonCode === 'template-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary "html-template-runtime"');
  if (reasonCode === 'slot-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary "html-slot-runtime"');
  if (reasonCode === 'custom-element-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary "html-custom-element-runtime"');
  if (reasonCode === 'framework-directive-boundary') return htmlRuntimeBoundaryProofInstruction('boundary "html-framework-directive" and boundaryAttributes for the changed directive attributes');
  if (reasonCode === 'event-handler-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary and boundaryAttributes');
  if (reasonCode === 'inline-style-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary "html-inline-style-attribute" and boundaryAttributes ["style"]');
  if (reasonCode === 'iframe-runtime-boundary' || reasonCode === 'iframe-srcdoc-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary and boundaryAttributes');
  if (reasonCode === 'form-runtime-boundary' || reasonCode === 'form-submitter-runtime-boundary' || reasonCode === 'form-control-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary and boundaryAttributes');
  if (reasonCode === 'document-base-runtime-boundary' || reasonCode === 'document-metadata-runtime-boundary' || reasonCode === 'resource-loading-runtime-boundary') return htmlRuntimeBoundaryProofInstruction('boundary and boundaryAttributes');
  return 'Attach source-bound HTML parser, identity, and runtime-boundary evidence for the changed file before structural admission.';
}

function htmlRuntimeBoundaryProofInstruction(boundaryClause) {
  return `Attach htmlRuntimeBoundaryProofsByPath[sourcePath] with kind html-source-bound-runtime-boundary-proof, status passed, sourcePath, reasonCode, side, ${boundaryClause}, exact base/worker/head/output source text or hashes, runtime command, runtime probe id, runtime evidence hash, required runtime signals, and no broad browser/semantic/auto-merge self-claims.`;
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

function mergedHtmlCssFile(file, context, result, language) {
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile', version: 1, sourcePath: file.sourcePath, language: context.language, status: 'merged', operation: `merged-${language}-source`,
    outputSourceText: result.mergedSourceText, outputHash: hashText(result.mergedSourceText), baseHash: hashText(file.baseSourceText), workerHash: hashText(file.workerSourceText), headHash: hashText(file.headSourceText),
    result, semanticArtifacts: result.semanticArtifacts, conflicts: [], admission: result.admission, summary: result.summary, conflictKeys: [`source#${file.sourcePath}`]
  });
}

function blockedHtmlCssFile(file, context, result) {
  const conflicts = normalizeHtmlCssConflicts(result.conflicts ?? [], context.language);
  const admission = blockedHtmlCssAdmission(result.admission, context.language);
  const normalizedResult = compactRecord({ ...result, conflicts, admission });
  return compactRecord({ kind: 'frontier.lang.jsTsProjectSafeMergeFile', version: 1, sourcePath: file.sourcePath, language: context.language, status: 'blocked', operation: 'blocked-merge', result: normalizedResult, conflicts, admission, summary: result.summary, conflictKeys: [`source#${file.sourcePath}`] });
}

function blockedHtmlCssAdmission(admission = {}, language) {
  return compactRecord({ ...admission, browserRuntimeEquivalenceClaim: language === 'html' ? false : admission.browserRuntimeEquivalenceClaim, browserCascadeEquivalenceClaim: language === 'css' ? false : admission.browserCascadeEquivalenceClaim, browserRenderEquivalenceClaim: language === 'css' ? false : admission.browserRenderEquivalenceClaim });
}

function normalizeHtmlCssConflicts(conflicts, language) {
  if (language !== 'html') return conflicts;
  return conflicts.map((conflict) => {
    const reasonCode = conflict.details?.reasonCode;
    if (conflict.code !== 'html-proof-gap-blocked' || !reasonCode) return conflict;
    const proofGap = { ...(conflict.details?.proofGap ?? {}), summary: conflict.details?.proofGap?.summary ?? htmlProofGapSummary(reasonCode), nextProof: conflict.details?.proofGap?.nextProof ?? htmlProofGapNextProof(reasonCode) };
    return { ...conflict, details: { ...(conflict.details ?? {}), proofGap } };
  });
}

export { maybeMergeHtmlCssProjectFile, projectFileLanguage };
