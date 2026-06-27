import { hashText } from './js-ts-safe-project-merge-core.js';

const CssModulePathPattern = /\.module\.css(?:[?#].*)?$/i;

function projectCssModuleProofFiles(files, input) {
  return files.flatMap((file) => {
    const sourceText = isCssModulePath(file.sourcePath)
      ? cssModuleProofSourceText(file)
      : stableJsTsSourceText(file, input);
    if (typeof sourceText !== 'string') return [];
    return [{
      sourcePath: file.sourcePath,
      language: file.language ?? languageForPath(file.sourcePath, input),
      sourceText,
      sourceHash: hashText(sourceText)
    }];
  });
}

function projectJsTsSourcesStable(files, input) {
  return files
    .filter((file) => isJsTsLanguage(file.language ?? languageForPath(file.sourcePath, input)))
    .every((file) => typeof stableJsTsSourceText(file, input) === 'string');
}

function cssModuleProofSourceText(file) {
  return firstString(file.workerSourceText, file.headSourceText, file.baseSourceText);
}

function stableJsTsSourceText(file, input) {
  if (!isJsTsLanguage(file.language ?? languageForPath(file.sourcePath, input))) return undefined;
  const base = file.baseSourceText;
  const worker = file.workerDeleted ? undefined : file.workerSourceText ?? base;
  const head = file.headDeleted ? undefined : file.headSourceText ?? base;
  if (typeof worker === 'string' && worker === head) return worker;
  if (typeof base === 'string' && base === worker && base === head) return base;
  return undefined;
}

function isCssModulePath(path) {
  return CssModulePathPattern.test(String(path ?? ''));
}

function languageForPath(sourcePath, input) {
  const path = String(sourcePath ?? '').toLowerCase();
  if (path.endsWith('.css')) return 'css';
  if (path.endsWith('.tsx')) return 'tsx';
  if (path.endsWith('.jsx')) return 'jsx';
  if (path.endsWith('.ts') || path.endsWith('.mts') || path.endsWith('.cts')) return 'typescript';
  if (path.endsWith('.js') || path.endsWith('.mjs') || path.endsWith('.cjs')) return 'javascript';
  return input.language;
}

function isJsTsLanguage(language) {
  return ['javascript', 'typescript', 'jsx', 'tsx', 'js', 'ts'].includes(String(language ?? '').toLowerCase());
}

function firstString(...values) {
  for (const value of values) if (value !== undefined && value !== null && String(value)) return String(value);
  return undefined;
}

export { isCssModulePath, projectCssModuleProofFiles, projectJsTsSourcesStable };
