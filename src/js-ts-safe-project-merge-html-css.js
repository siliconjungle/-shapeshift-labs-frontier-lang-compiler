import { safeMergeCssSource } from '@shapeshift-labs/frontier-lang-css';
import { safeMergeHtmlSource } from '@shapeshift-labs/frontier-lang-html';
import { compactRecord } from './js-ts-safe-merge-context.js';
import { hashText, safeId, uniqueStrings } from './js-ts-safe-project-merge-core.js';

function projectFileLanguage(file, input) {
  return file.language ?? inferLanguageFromPath(file.sourcePath) ?? input.language ?? 'typescript';
}

function maybeMergeHtmlCssProjectFile(options) {
  const { file, input, projectId, context, base, worker, head, sourceInput } = options;
  const language = String(context.language ?? '').toLowerCase();
  const merge = language === 'html' ? safeMergeHtmlSource : language === 'css' ? safeMergeCssSource : undefined;
  if (!merge) return undefined;
  const resultId = `${projectId}_${safeId(file.sourcePath)}`;
  const mergeOptions = htmlCssMergeOptionsForProjectFile(input, file.sourcePath, language);
  const runtimeBoundaryProofs = language === 'html' ? htmlRuntimeBoundaryProofCandidates(input, file.sourcePath, mergeOptions) : [];
  const runtimeBoundaryMergeOptions = runtimeBoundaryProofs.length ? { htmlRuntimeBoundaryProofs: runtimeBoundaryProofs, htmlSourceBoundRuntimeBoundaryProofs: runtimeBoundaryProofs } : {};
  const result = merge({ ...sourceInput, ...mergeOptions, ...context, ...runtimeBoundaryMergeOptions, id: resultId, baseSourceText: base, workerSourceText: worker, headSourceText: head });
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

function htmlRuntimeBoundaryChanges(base, worker, head) {
  const baseEventHandlers = htmlEventHandlerBoundaryFingerprint(base);
  return [
    htmlRuntimeBoundaryChange('worker', base, worker, baseEventHandlers),
    htmlRuntimeBoundaryChange('head', base, head, baseEventHandlers)
  ].filter(Boolean);
}

function htmlRuntimeBoundaryChange(side, base, sourceText, baseEventHandlers) {
  if (sourceText === base) return undefined;
  const eventHandlers = htmlEventHandlerBoundaryFingerprint(sourceText);
  if (eventHandlers === baseEventHandlers) return undefined;
  return {
    side,
    reasonCode: 'event-handler-runtime-boundary',
    boundary: 'html-event-handler-attribute',
    boundaryAttributes: htmlEventHandlerBoundaryAttributeNames(sourceText)
  };
}

function htmlRuntimeBoundaryProofForChange(proofs, change, binding) {
  return proofs.find((proof) => isHtmlRuntimeBoundaryProofForChange(proof, change, binding));
}

function isHtmlRuntimeBoundaryProofForChange(proof, change, binding) {
  return Boolean(proof && typeof proof === 'object') &&
    HtmlRuntimeBoundaryProofKinds.has(proof.kind) &&
    proof.status === 'passed' &&
    proof.sourcePath === binding.sourcePath &&
    htmlProofCoversValue(proof.reasonCode, proof.reasonCodes, change.reasonCode) &&
    htmlProofCoversValue(proof.side, proof.sides, change.side) &&
    proof.boundary === change.boundary &&
    sameStringSet(proof.boundaryAttributes ?? proof.changedBoundaryAttributes, change.boundaryAttributes) &&
    htmlRuntimeBoundaryProofSourceBound(proof, binding);
}

function htmlRuntimeBoundaryProofSourceBound(proof, binding) {
  return htmlRuntimeBoundaryProofSourceMatches(proof, 'base', binding.base) &&
    htmlRuntimeBoundaryProofSourceMatches(proof, 'worker', binding.worker) &&
    htmlRuntimeBoundaryProofSourceMatches(proof, 'head', binding.head) &&
    htmlRuntimeBoundaryProofSourceMatches(proof, 'output', binding.output);
}

function htmlRuntimeBoundaryProofSourceMatches(proof, role, sourceText) {
  if (typeof sourceText !== 'string') return false;
  const hash = hashText(sourceText);
  const textFields = role === 'output' ? ['outputSourceText', 'mergedSourceText'] : [`${role}SourceText`];
  const hashFields = role === 'output' ? ['outputSourceHash', 'mergedSourceHash'] : [`${role}SourceHash`];
  const aliases = role === 'output' ? ['output', 'merged'] : [role];
  return textFields.some((field) => proof[field] === sourceText) ||
    aliases.some((alias) => proof.sourceTexts?.[alias] === sourceText || proof.sources?.[alias] === sourceText) ||
    hashFields.some((field) => proof[field] === hash) ||
    aliases.some((alias) => proof.sourceHashes?.[alias] === hash || proof.hashes?.[alias] === hash);
}

function htmlRuntimeBoundaryProofRecord(proof, change, binding) {
  return compactRecord({
    id: proof.id,
    kind: proof.kind,
    status: 'passed',
    proofLevel: proof.proofLevel ?? 'html-runtime-boundary-source-bound',
    reasonCode: change.reasonCode,
    side: change.side,
    boundary: change.boundary,
    boundaryAttributes: change.boundaryAttributes,
    sourcePath: binding.sourcePath,
    baseSourceHash: hashText(binding.base),
    workerSourceHash: hashText(binding.worker),
    headSourceHash: hashText(binding.head),
    outputSourceHash: hashText(binding.output)
  });
}

function htmlRuntimeBoundaryProvenResult(result, runtimeBoundaryProofs) {
  return compactRecord({
    ...result,
    runtimeBoundaryProofs,
    browserRuntimeEquivalenceClaim: true,
    admission: compactRecord({
      ...(result.admission ?? {}),
      browserRuntimeEquivalenceClaim: true,
      htmlRuntimeBoundaryProofs: runtimeBoundaryProofs,
      reasonCodes: uniqueStrings([...(result.admission?.reasonCodes ?? []), 'html-runtime-boundary-source-bound'])
    })
  });
}

function htmlEventHandlerBoundaryFingerprint(sourceText) {
  return htmlEventHandlerBoundaryAttributes(sourceText)
    .map((attribute) => `${attribute.tagName}:${attribute.name}=${String(attribute.value)}`)
    .sort()
    .join('\n');
}

function htmlEventHandlerBoundaryAttributeNames(sourceText) {
  return uniqueStrings(htmlEventHandlerBoundaryAttributes(sourceText).map((attribute) => attribute.name));
}

function htmlEventHandlerBoundaryAttributes(sourceText) {
  const attributes = [];
  for (const tag of String(sourceText ?? '').matchAll(/<[A-Za-z][\w:-]*(?:\s+[^<>]*?)?\/?>/g)) {
    const parsed = /^<([A-Za-z][\w:-]*)([\s\S]*?)\/?>$/.exec(tag[0]);
    if (!parsed) continue;
    const tagName = parsed[1].toLowerCase();
    for (const attribute of parseHtmlAttributes(parsed[2] ?? '')) {
      if (/^on[\w:.-]+$/i.test(attribute.name)) attributes.push({ ...attribute, name: attribute.name.toLowerCase(), tagName });
    }
  }
  return attributes;
}

function parseHtmlAttributes(text) {
  const attributes = [];
  const pattern = /([:@A-Za-z_][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of text.matchAll(pattern)) attributes.push({ name: match[1], value: match[2] ?? match[3] ?? match[4] ?? true });
  return attributes;
}

function htmlProofCoversValue(value, values, expected) {
  return value === expected || (Array.isArray(values) && values.includes(expected));
}

function sameStringSet(actual, expected) {
  const actualSet = uniqueStrings(asArray(actual).map((value) => String(value)));
  const expectedSet = uniqueStrings(asArray(expected).map((value) => String(value)));
  return actualSet.length === expectedSet.length && expectedSet.every((value) => actualSet.includes(value));
}

function asArray(value) {
  return Array.isArray(value) ? value : value === undefined ? [] : [value];
}

const HtmlRuntimeBoundaryProofKinds = new Set(['html-runtime-boundary-proof', 'html-source-bound-runtime-boundary-proof']);

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
  if (reasonCode === 'event-handler-runtime-boundary') return 'HTML event handler attributes execute in the browser runtime and require source-bound host evidence.';
  if (reasonCode === 'inline-style-runtime-boundary') return 'HTML inline style attributes affect browser cascade and rendering and require source-bound host evidence.';
  if (reasonCode === 'iframe-runtime-boundary' || reasonCode === 'iframe-srcdoc-runtime-boundary') return reasonCode === 'iframe-runtime-boundary' ? 'HTML iframe runtime attributes affect nested browsing-context execution and require source-bound host evidence.' : 'HTML iframe srcdoc attributes define nested browsing-context content and require source-bound host evidence.';
  return 'HTML proof gap requires source-bound evidence before structural merge admission.';
}

function htmlProofGapNextProof(reasonCode) {
  if (reasonCode === 'html-duplicate-explicit-identity') return 'Rename duplicate explicit HTML identity keys or supply parser-backed identity evidence with unique explicitIdentityKeys on every side.';
  if (reasonCode === 'event-handler-runtime-boundary') return 'Attach htmlRuntimeBoundaryProofsByPath[sourcePath] with kind html-source-bound-runtime-boundary-proof, status passed, sourcePath, reasonCode, side, boundary, boundaryAttributes, and exact base/worker/head/output source text or hashes.';
  if (reasonCode === 'inline-style-runtime-boundary') return 'Attach htmlRuntimeBoundaryProofsByPath[sourcePath] with kind html-source-bound-runtime-boundary-proof, status passed, sourcePath, reasonCode, side, boundary "html-inline-style-attribute", boundaryAttributes ["style"], and exact base/worker/head/output source text or hashes.';
  if (reasonCode === 'iframe-runtime-boundary' || reasonCode === 'iframe-srcdoc-runtime-boundary') return 'Attach htmlRuntimeBoundaryProofsByPath[sourcePath] with kind html-source-bound-runtime-boundary-proof, status passed, sourcePath, reasonCode, side, boundary, boundaryAttributes, and exact base/worker/head/output source text or hashes.';
  return 'Attach source-bound HTML parser, identity, and runtime-boundary evidence for the changed file before structural admission.';
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
