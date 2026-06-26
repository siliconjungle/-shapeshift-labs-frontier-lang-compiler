import { uniqueStrings } from './js-ts-safe-merge-context.js';
import {
  createCompilerOptionState,
  describeJsTsProjectCompilerInputs,
  normalizeProjectReferences
} from './js-ts-safe-project-merge-ts-options.js';

function createJsTsVirtualTypeScriptProgram(input = {}, outputFiles = [], options = {}) {
  const ts = input.typescript ?? input.ts ?? input.typescriptModule;
  if (!ts?.createProgram || !ts?.createSourceFile) return undefined;
  const sourceFiles = outputFiles.filter((file) => isJsTsSourcePath(file.sourcePath) && typeof file.sourceText === 'string');
  const projectRoot = normalizePath(input.projectRoot ?? '');
  const compilerState = createCompilerOptionState(ts, input, options, projectRoot, normalizeTypeScriptDiagnostic);
  if (!sourceFiles.length) {
    return {
      ts,
      sourceFiles,
      sourceMap: new Map(),
      rootNames: [],
      program: undefined,
      compilerOptions: compilerState.compilerOptions,
      compilerOptionDiagnostics: compilerState.diagnostics,
      compilerMetadata: compilerState.metadata,
      projectReferences: compilerState.projectReferences
    };
  }
  const sourceMap = new Map(sourceFiles.map((file) => [normalizePath(file.sourcePath), String(file.sourceText)]));
  const rootNames = [...sourceMap.keys()];
  const host = createVirtualCompilerHost(ts, compilerState.compilerOptions, sourceMap, projectRoot, options);
  const program = createVirtualProgram(ts, rootNames, compilerState.compilerOptions, host, compilerState.projectReferences);
  return {
    ts,
    sourceFiles,
    sourceMap,
    rootNames,
    host,
    program,
    compilerOptions: compilerState.compilerOptions,
    compilerOptionDiagnostics: compilerState.diagnostics,
    compilerMetadata: compilerState.metadata,
    projectReferences: compilerState.projectReferences
  };
}

function createVirtualProgram(ts, rootNames, compilerOptions, host, projectReferences) {
  if (!projectReferences.length) return ts.createProgram(rootNames, compilerOptions, host);
  try {
    return ts.createProgram({ rootNames, options: compilerOptions, host, projectReferences });
  } catch {
    return ts.createProgram(rootNames, compilerOptions, host, undefined, undefined, projectReferences);
  }
}

function createVirtualCompilerHost(ts, compilerOptions, sourceMap, projectRoot, options = {}) {
  const defaultHost = ts.createCompilerHost?.(compilerOptions, true);
  return {
    ...defaultHost,
    getCurrentDirectory: () => projectRoot,
    getCanonicalFileName: (fileName) => normalizePath(defaultHost?.getCanonicalFileName?.(fileName) ?? fileName),
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    fileExists(fileName) {
      return Boolean(sourceMapMatch(sourceMap, fileName, projectRoot)) || defaultHost?.fileExists?.(fileName) === true;
    },
    readFile(fileName) {
      const match = sourceMapMatch(sourceMap, fileName, projectRoot);
      return match ? match.sourceText : defaultHost?.readFile?.(fileName);
    },
    getSourceFile(fileName, languageVersion) {
      const match = sourceMapMatch(sourceMap, fileName, projectRoot);
      if (match) {
        return ts.createSourceFile(match.sourcePath, match.sourceText, languageVersion, true, scriptKindForPath(ts, match.sourcePath));
      }
      return defaultHost?.getSourceFile?.(fileName, languageVersion);
    },
    writeFile(fileName, text, writeByteOrderMark, onError, sourceFiles, data) {
      if (options.writeFile) return options.writeFile(fileName, text, writeByteOrderMark, onError, sourceFiles, data);
      return defaultHost?.writeFile?.(fileName, text, writeByteOrderMark, onError, sourceFiles, data);
    },
    resolveModuleNames(moduleNames, containingFile) {
      return moduleNames.map((moduleName) => resolveVirtualModule(ts, sourceMap, moduleName, containingFile, projectRoot));
    },
    resolveModuleNameLiterals(moduleLiterals, containingFile) {
      return moduleLiterals.map((moduleLiteral) => ({
        resolvedModule: resolveVirtualModule(ts, sourceMap, moduleLiteral?.text ?? moduleLiteral, containingFile, projectRoot)
      }));
    }
  };
}

function resolveVirtualModule(ts, sourceMap, moduleName, containingFile, projectRoot) {
  const specifier = String(moduleName ?? '');
  if (!specifier.startsWith('.') && !specifier.startsWith('/')) return undefined;
  const baseDir = dirname(normalizePath(containingFile));
  const target = normalizePath(specifier.startsWith('/') ? specifier.slice(1) : `${baseDir}/${specifier}`);
  for (const candidate of moduleCandidates(target)) {
    const match = sourceMapMatch(sourceMap, candidate, projectRoot);
    if (!match) continue;
    return {
      resolvedFileName: match.sourcePath,
      extension: extensionKind(ts, match.sourcePath),
      isExternalLibraryImport: false
    };
  }
  return undefined;
}

function moduleCandidates(target) {
  const withoutExtension = target.replace(/\.(?:mjs|cjs|jsx?|tsx?)$/, '');
  return uniqueStrings([
    target,
    `${target}.ts`,
    `${target}.tsx`,
    `${target}.js`,
    `${target}.jsx`,
    `${withoutExtension}.ts`,
    `${withoutExtension}.tsx`,
    `${withoutExtension}.js`,
    `${withoutExtension}.jsx`,
    `${target}/index.ts`,
    `${target}/index.tsx`,
    `${target}/index.js`,
    `${target}/index.jsx`
  ].map(normalizePath));
}

function normalizeSuppliedDiagnostics(value) {
  const values = Array.isArray(value) ? value : [value].filter(Boolean);
  return values.map((diagnostic, index) => compactRecord({
    id: diagnostic.id ?? `diagnostic_${index + 1}`,
    source: diagnostic.source ?? diagnostic.tool ?? 'supplied',
    code: String(diagnostic.code ?? diagnostic.diagnosticCode ?? 'diagnostic'),
    severity: normalizeSeverity(diagnostic.severity ?? diagnostic.category),
    message: String(diagnostic.message ?? diagnostic.messageText ?? ''),
    sourcePath: normalizeOptionalPath(diagnostic.sourcePath ?? diagnostic.fileName ?? diagnostic.file?.fileName),
    start: numberOrUndefined(diagnostic.start),
    end: numberOrUndefined(diagnostic.end),
    line: numberOrUndefined(diagnostic.line),
    column: numberOrUndefined(diagnostic.column)
  }));
}

function normalizeTypeScriptDiagnostic(ts, diagnostic, source = 'typescript-compiler-api') {
  const sourcePath = diagnostic.file?.fileName ? normalizePath(diagnostic.file.fileName) : undefined;
  const lineInfo = diagnostic.file && Number.isFinite(diagnostic.start)
    ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
    : undefined;
  return compactRecord({
    id: `ts_${diagnostic.code}_${sourcePath ?? 'global'}_${diagnostic.start ?? 0}`,
    source,
    code: `TS${diagnostic.code}`,
    severity: diagnostic.category === (ts.DiagnosticCategory?.Error ?? 1) ? 'error' : normalizeSeverity(diagnostic.category),
    message: flattenDiagnosticMessage(ts, diagnostic.messageText),
    sourcePath,
    start: numberOrUndefined(diagnostic.start),
    end: Number.isFinite(diagnostic.start) && Number.isFinite(diagnostic.length)
      ? diagnostic.start + diagnostic.length
      : undefined,
    line: lineInfo ? lineInfo.line + 1 : undefined,
    column: lineInfo ? lineInfo.character + 1 : undefined
  });
}

function flattenDiagnosticMessage(ts, messageText) {
  if (ts.flattenDiagnosticMessageText) return ts.flattenDiagnosticMessageText(messageText, '\n');
  if (typeof messageText === 'string') return messageText;
  return String(messageText?.messageText ?? messageText ?? '');
}

function normalizeSeverity(value) {
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (lowered.includes('error')) return 'error';
    if (lowered.includes('warn')) return 'warning';
    if (lowered.includes('suggest')) return 'suggestion';
    if (lowered.includes('message')) return 'message';
  }
  if (value === 1) return 'error';
  if (value === 0) return 'warning';
  if (value === 2) return 'suggestion';
  if (value === 3) return 'message';
  return 'error';
}

function scriptKindForPath(ts, sourcePath) {
  if (sourcePath.endsWith('.tsx')) return ts.ScriptKind?.TSX;
  if (sourcePath.endsWith('.ts')) return ts.ScriptKind?.TS;
  if (sourcePath.endsWith('.jsx')) return ts.ScriptKind?.JSX;
  if (sourcePath.endsWith('.js')) return ts.ScriptKind?.JS;
  return undefined;
}

function extensionKind(ts, sourcePath) {
  if (sourcePath.endsWith('.tsx')) return ts.Extension?.Tsx ?? '.tsx';
  if (sourcePath.endsWith('.ts')) return ts.Extension?.Ts ?? '.ts';
  if (sourcePath.endsWith('.jsx')) return ts.Extension?.Jsx ?? '.jsx';
  return ts.Extension?.Js ?? '.js';
}

function isJsTsSourcePath(sourcePath) {
  return /\.(?:mjs|cjs|jsx?|tsx?)$/.test(String(sourcePath ?? ''));
}

function normalizePath(value) {
  const raw = String(value ?? '').replace(/\\/g, '/').replace(/\/+/g, '/');
  const absolute = raw.startsWith('/');
  const parts = [];
  for (const part of raw.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (parts.length && parts[parts.length - 1] !== '..') parts.pop();
      else if (!absolute) parts.push(part);
      continue;
    }
    parts.push(part);
  }
  return `${absolute ? '/' : ''}${parts.join('/')}`;
}

function sourceMapMatch(sourceMap, fileName, projectRoot = '') {
  for (const candidate of sourcePathCandidates(fileName, projectRoot)) {
    if (sourceMap.has(candidate)) return { sourcePath: candidate, sourceText: sourceMap.get(candidate) };
  }
  return undefined;
}

function sourcePathCandidates(fileName, projectRoot) {
  const normalized = normalizePath(fileName);
  const trimmed = normalized.replace(/^\/+/, '');
  const candidates = [normalized, trimmed];
  if (projectRoot) {
    const root = normalizePath(projectRoot).replace(/\/+$/, '');
    const trimmedRoot = root.replace(/^\/+/, '');
    if (normalized.startsWith(`${root}/`)) candidates.push(normalized.slice(root.length + 1));
    if (trimmed.startsWith(`${trimmedRoot}/`)) candidates.push(trimmed.slice(trimmedRoot.length + 1));
    candidates.push(`${root}/${trimmed}`);
  }
  return uniqueStrings(candidates);
}

function normalizeOptionalPath(value) {
  return value === undefined || value === null ? undefined : normalizePath(value);
}

function dirname(sourcePath) {
  const normalized = normalizePath(sourcePath);
  const index = normalized.lastIndexOf('/');
  return index < 0 ? '' : normalized.slice(0, index);
}

function numberOrUndefined(value) {
  return Number.isFinite(value) ? value : undefined;
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined));
}

export {
  createJsTsVirtualTypeScriptProgram,
  describeJsTsProjectCompilerInputs,
  isJsTsSourcePath,
  normalizePath,
  normalizeProjectReferences,
  normalizeSuppliedDiagnostics,
  normalizeTypeScriptDiagnostic,
  sourceMapMatch
};
