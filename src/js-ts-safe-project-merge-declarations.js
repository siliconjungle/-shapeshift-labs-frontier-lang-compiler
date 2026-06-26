import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord, uniqueStrings } from './js-ts-safe-merge-context.js';
import {
  createJsTsVirtualTypeScriptProgram,
  normalizePath,
  normalizeSuppliedDiagnostics,
  normalizeTypeScriptDiagnostic,
  sourceMapMatch
} from './js-ts-safe-project-merge-ts-program.js';

function createJsTsProjectMergeDeclarationGate(input = {}, outputFiles = [], id = 'js_ts_project_safe_merge') {
  const declarationOutput = input.outputDeclarations || input.outputDeclarationFiles
    ? normalizeSuppliedDeclarationOutput(input.outputDeclarations ?? input.outputDeclarationFiles)
    : collectTypeScriptDeclarationOutput(input, outputFiles);
  if (!declarationOutput && shouldSkipDeclarationGate(input)) return undefined;
  if (!declarationOutput) return unavailableGate(input, id);
  const diagnostics = declarationOutput.diagnostics ?? [];
  const conflicts = diagnostics
    .filter((diagnostic) => diagnostic.severity === 'error')
    .map((diagnostic) => declarationConflict(input, diagnostic));
  const requireFiles = input.requireDeclarationOutput === true;
  if (requireFiles && declarationOutput.declarationFiles.length === 0) conflicts.push(missingDeclarationsConflict(input));
  const status = conflicts.length ? 'blocked' : 'passed';
  const core = {
    kind: 'frontier.lang.jsTsProjectMergeDeclarationGate',
    version: 1,
    schema: 'frontier.lang.jsTsProjectMergeDeclarationGate.v1',
    id: `${id}_declaration_output`,
    status,
    sourcePaths: outputFiles.map((file) => file.sourcePath).filter(Boolean),
    declarationFiles: declarationOutput.declarationFiles,
    diagnostics,
    conflicts,
    admission: {
      status: status === 'passed' ? 'auto-merge-candidate' : 'blocked',
      action: status === 'passed' ? 'accept-declarations' : 'human-review',
      reviewRequired: status !== 'passed',
      autoApplyCandidate: status === 'passed',
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: uniqueStrings(conflicts.map((conflict) => conflict.code))
    },
    summary: declarationSummary(declarationOutput.declarationFiles, diagnostics, conflicts),
    evidence: [declarationEvidence(id, status, declarationOutput, diagnostics, conflicts, input)]
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function shouldSkipDeclarationGate(input) {
  return input.includeDeclarationOutput !== true && input.requireDeclarationOutput !== true;
}

function collectTypeScriptDeclarationOutput(input, outputFiles) {
  const emitted = new Map();
  const created = createJsTsVirtualTypeScriptProgram(input, outputFiles, {
    compilerOptions: {
      noEmit: false,
      declaration: true,
      emitDeclarationOnly: true,
      outDir: input.declarationOutDir ?? '__frontier_declarations__',
      ...(input.declarationCompilerOptions ?? input.typescriptDeclarationCompilerOptions ?? {})
    },
    writeFile(fileName, text) {
      emitted.set(normalizePath(fileName), String(text));
    }
  });
  if (!created) return undefined;
  const { ts, program, sourceMap } = created;
  const projectRoot = normalizePath(input.projectRoot ?? '');
  if (!program) return { declarationFiles: [], diagnostics: [] };
  const preEmitDiagnostics = ts.getPreEmitDiagnostics
    ? ts.getPreEmitDiagnostics(program)
    : fallbackPreEmitDiagnostics(program);
  const emitResult = program.emit(undefined, undefined, undefined, true);
  const diagnostics = uniqueDiagnostics([...preEmitDiagnostics, ...(emitResult.diagnostics ?? [])]
    .map((diagnostic) => normalizeTypeScriptDiagnostic(ts, diagnostic))
    .filter((diagnostic) => diagnostic.sourcePath ? Boolean(sourceMapMatch(sourceMap, diagnostic.sourcePath, projectRoot)) : false));
  return {
    declarationFiles: [...emitted.entries()].map(([sourcePath, sourceText]) => declarationFile(sourcePath, sourceText, 'typescript-compiler-api')),
    diagnostics
  };
}

function fallbackPreEmitDiagnostics(program) {
  const diagnostics = [];
  for (const sourceFile of program.getSourceFiles()) {
    diagnostics.push(...(program.getSyntacticDiagnostics?.(sourceFile) ?? []));
    diagnostics.push(...(program.getSemanticDiagnostics?.(sourceFile) ?? []));
  }
  return diagnostics;
}

function uniqueDiagnostics(diagnostics) {
  const seen = new Set();
  return diagnostics.filter((diagnostic) => {
    const key = `${diagnostic.code}:${diagnostic.sourcePath ?? ''}:${diagnostic.start ?? ''}:${diagnostic.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeSuppliedDeclarationOutput(value) {
  const entries = value instanceof Map
    ? [...value.entries()].map(([sourcePath, sourceText]) => ({ sourcePath, sourceText }))
    : Array.isArray(value) ? value
      : typeof value === 'object' && value ? Object.entries(value).map(([sourcePath, sourceText]) => ({ sourcePath, sourceText }))
        : [];
  return {
    declarationFiles: entries.map((entry) => declarationFile(
      entry.sourcePath ?? entry.path,
      entry.sourceText ?? entry.text ?? '',
      entry.source ?? 'supplied'
    )),
    diagnostics: normalizeSuppliedDiagnostics(value?.diagnostics ?? [])
  };
}

function declarationFile(sourcePath, sourceText, source) {
  const text = String(sourceText ?? '');
  return compactRecord({
    sourcePath: normalizePath(sourcePath),
    sourceText: text,
    sourceHash: hashSemanticValue(text),
    source,
    bytes: byteLength(text)
  });
}

function unavailableGate(input, id) {
  const conflict = input.requireDeclarationOutput === true ? missingCompilerConflict(input) : undefined;
  const conflicts = [conflict].filter(Boolean);
  const status = conflict ? 'blocked' : 'skipped';
  const core = {
    kind: 'frontier.lang.jsTsProjectMergeDeclarationGate',
    version: 1,
    schema: 'frontier.lang.jsTsProjectMergeDeclarationGate.v1',
    id: `${id}_declaration_output`,
    status,
    sourcePaths: [],
    declarationFiles: [],
    diagnostics: [],
    conflicts,
    admission: {
      status,
      action: conflict ? 'human-review' : 'skip-declarations',
      reviewRequired: Boolean(conflict),
      autoApplyCandidate: !conflict,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      reasonCodes: uniqueStrings(conflicts.map((entry) => entry.code))
    },
    summary: declarationSummary([], [], conflicts),
    evidence: [{
      id: `${id}_declaration_output_evidence`,
      kind: 'js-ts-project-declaration-output',
      status: conflict ? 'failed' : 'skipped',
      summary: conflict ? conflict.message : 'Declaration output was requested but no TypeScript compiler API or supplied declarations were provided.',
      metadata: { declarationFiles: 0, conflicts: conflicts.length, declarationSource: 'missing' }
    }]
  };
  return { ...core, hash: hashSemanticValue(core) };
}

function missingCompilerConflict(input) {
  return {
    code: 'project-declaration-output-unavailable',
    gateId: 'project-declaration-output',
    message: 'Project declaration output is required but no TypeScript compiler API or supplied declarations were provided.',
    details: { required: input.requireDeclarationOutput === true }
  };
}

function missingDeclarationsConflict(input) {
  return {
    code: 'project-declaration-output-empty',
    gateId: 'project-declaration-output',
    message: 'Project declaration output is required but no declaration files were emitted.',
    details: { projectRoot: input.projectRoot }
  };
}

function declarationConflict(input, diagnostic) {
  return compactRecord({
    code: 'project-declaration-diagnostic',
    gateId: 'project-declaration-output',
    message: `Project declaration diagnostic ${diagnostic.code}: ${diagnostic.message}`,
    sourcePath: diagnostic.sourcePath,
    details: { diagnostic, projectRoot: input.projectRoot }
  });
}

function declarationSummary(declarationFiles, diagnostics, conflicts) {
  return {
    declarationFiles: declarationFiles.length,
    declarationBytes: declarationFiles.reduce((total, file) => total + Number(file.bytes ?? 0), 0),
    diagnostics: diagnostics.length,
    conflicts: conflicts.length,
    errors: diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length,
    warnings: diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length
  };
}

function declarationEvidence(id, status, declarationOutput, diagnostics, conflicts, input) {
  return {
    id: `${id}_declaration_output_evidence`,
    kind: 'js-ts-project-declaration-output',
    status: status === 'passed' ? 'passed' : 'failed',
    summary: status === 'passed'
      ? `Emitted ${declarationOutput.declarationFiles.length} declaration file(s) for JS/TS project output.`
      : `Blocked JS/TS project merge on ${conflicts.length} declaration output conflict(s).`,
    metadata: {
      declarationFiles: declarationOutput.declarationFiles.length,
      diagnostics: diagnostics.length,
      conflicts: conflicts.length,
      declarationSource: input.outputDeclarations || input.outputDeclarationFiles ? 'supplied' : 'typescript-compiler-api',
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  };
}

function byteLength(text) {
  return typeof TextEncoder === 'function' ? new TextEncoder().encode(text).length : String(text).length;
}

export { createJsTsProjectMergeDeclarationGate };
