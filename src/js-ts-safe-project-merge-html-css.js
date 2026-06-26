import { safeMergeCssSource } from '@shapeshift-labs/frontier-lang-css';
import { safeMergeHtmlSource } from '@shapeshift-labs/frontier-lang-html';
import { compactRecord } from './js-ts-safe-merge-context.js';
import { hashText, safeId } from './js-ts-safe-project-merge-core.js';

function projectFileLanguage(file, input) {
  return file.language ?? inferLanguageFromPath(file.sourcePath) ?? input.language ?? 'typescript';
}

function maybeMergeHtmlCssProjectFile(options) {
  const { file, input, projectId, context, base, worker, head, sourceInput } = options;
  const language = String(context.language ?? '').toLowerCase();
  const merge = language === 'html' ? safeMergeHtmlSource : language === 'css' ? safeMergeCssSource : undefined;
  if (!merge) return undefined;
  const result = merge({ ...sourceInput, ...htmlCssMergeOptionsForProjectFile(input, file.sourcePath, language), ...context, id: `${projectId}_${safeId(file.sourcePath)}`, baseSourceText: base, workerSourceText: worker, headSourceText: head });
  return result.status === 'merged' ? mergedHtmlCssFile(file, context, result, language) : blockedHtmlCssFile(file, context, result);
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
