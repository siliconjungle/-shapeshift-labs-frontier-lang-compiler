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
  const result = merge({ ...sourceInput, ...htmlCssMergeOptionsForProjectFile(input, file.sourcePath, language), ...context, id: resultId, baseSourceText: base, workerSourceText: worker, headSourceText: head });
  const admittedResult = language === 'html' && result.status === 'merged'
    ? blockHtmlProofGapChanges({ result, id: resultId, sourcePath: file.sourcePath, base, worker, head }) ?? result
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

function blockHtmlProofGapChanges({ result, id, sourcePath, base, worker, head }) {
  const conflicts = [
    htmlDuplicateIdentityConflict(result),
    ...htmlRuntimeBoundaryChanges(base, worker, head).map((change) => htmlProofGapConflict(id, sourcePath, change.reasonCode, change))
  ].filter(Boolean);
  if (!conflicts.length) return undefined;
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

function htmlDuplicateIdentityConflict(result) {
  const duplicates = duplicateHtmlExplicitIdentityKeys(result?.identityEvidence);
  if (!duplicates.length) return undefined;
  return htmlProofGapConflict(result.id, result.sourcePath, 'html-duplicate-explicit-identity', {
    boundary: 'html-explicit-identity',
    duplicateIdentityKeys: duplicates
  }, 'html-duplicate-identity-blocked');
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
  return 'HTML proof gap requires source-bound evidence before structural merge admission.';
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
  return compactRecord({
    kind: 'frontier.lang.jsTsProjectSafeMergeFile', version: 1, sourcePath: file.sourcePath, language: context.language, status: 'blocked', operation: 'blocked-merge',
    result, conflicts: result.conflicts ?? [], admission: result.admission, summary: result.summary, conflictKeys: [`source#${file.sourcePath}`]
  });
}

export { maybeMergeHtmlCssProjectFile, projectFileLanguage };
