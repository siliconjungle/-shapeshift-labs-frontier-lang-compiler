import { compactRecord } from './js-ts-safe-merge-context.js';
import { describeJsTsProjectCompilerInputs, sourceMapMatch } from './js-ts-safe-project-merge-ts-program.js';

const projectReferenceDiagnosticCodes = new Set([6053, 6305, 6306, 6310, 6311]);

export function optionDiagnosticSource(diagnostic, metadata = {}) {
  return metadata.projectReferenceCount && projectReferenceDiagnosticCodes.has(diagnostic.code)
    ? 'typescript-project-references'
    : 'typescript-compiler-options';
}

export function keepDiagnostic(diagnostic, sourceMap, projectRoot) {
  if (!diagnostic.sourcePath) return true;
  if (diagnostic.source === 'typescript-compiler-options' || diagnostic.source === 'typescript-project-references') return true;
  return Boolean(sourceMapMatch(sourceMap, diagnostic.sourcePath, projectRoot));
}

export function uniqueDiagnostics(diagnostics) {
  const seen = new Set();
  return diagnostics.filter((diagnostic) => {
    const key = `${diagnostic.source ?? ''}:${diagnostic.code}:${diagnostic.sourcePath ?? ''}:${diagnostic.start ?? ''}:${diagnostic.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function diagnosticsMetadata(compilerMetadata, rootNames, sourceMap, diagnosticSource) {
  return compactRecord({
    ...compilerMetadata,
    diagnosticSource,
    rootNames,
    sourceFiles: sourceMap.size
  });
}

export function diagnosticsGateMetadata(input, diagnosticsResult) {
  return compactRecord({
    ...(diagnosticsResult?.metadata ?? describeJsTsProjectCompilerInputs(input)),
    diagnosticSource: diagnosticsResult?.metadata?.diagnosticSource ?? 'missing'
  });
}
