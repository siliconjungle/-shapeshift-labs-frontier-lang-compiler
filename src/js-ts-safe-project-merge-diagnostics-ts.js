import { compactRecord } from './js-ts-safe-merge-context.js';
import {
  diagnosticsMetadata,
  keepDiagnostic,
  optionDiagnosticSource,
  uniqueDiagnostics
} from './js-ts-safe-project-merge-diagnostics-metadata.js';
import {
  createJsTsVirtualTypeScriptProgram,
  normalizePath,
  normalizeTypeScriptDiagnostic,
  sourceMapMatch
} from './js-ts-safe-project-merge-ts-program.js';
import {
  applyProjectReferenceCompositeProofToDiagnostics,
  createJsTsProjectReferenceCompositeProof,
  projectReferenceProofMetadata
} from './js-ts-safe-project-merge-project-reference-proof.js';

export function collectTypeScriptDiagnostics(input, outputFiles) {
  const created = createJsTsVirtualTypeScriptProgram(input, outputFiles);
  if (!created) return undefined;
  const { ts, sourceMap, program, compilerOptionDiagnostics = [], compilerMetadata = {}, rootNames = [] } = created;
  const projectRoot = normalizePath(input.projectRoot ?? '');
  const options = input.diagnosticOptions ?? input.typescriptDiagnosticOptions ?? {};
  const projectReferenceCompositeProof = createJsTsProjectReferenceCompositeProof(input, outputFiles, input.id);
  const diagnostics = [...compilerOptionDiagnostics];
  if (!program) {
    const filtered = applyProjectReferenceCompositeProofToDiagnostics(uniqueDiagnostics(diagnostics), projectReferenceCompositeProof);
    return {
      diagnostics: uniqueDiagnostics(filtered.diagnostics),
      metadata: {
        ...diagnosticsMetadata(compilerMetadata, rootNames, sourceMap, 'typescript-compiler-api'),
        projectReferenceCompositeProof: projectReferenceProofMetadata(projectReferenceCompositeProof, filtered.suppressedDiagnostics)
      }
    };
  }
  if (options.options !== false && program.getOptionsDiagnostics) {
    diagnostics.push(...program.getOptionsDiagnostics().map((diagnostic) => (
      normalizeTypeScriptDiagnostic(ts, diagnostic, optionDiagnosticSource(diagnostic, compilerMetadata))
    )));
  }
  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceMapMatch(sourceMap, sourceFile.fileName, projectRoot)) continue;
    if (options.syntactic !== false && program.getSyntacticDiagnostics) {
      diagnostics.push(...program.getSyntacticDiagnostics(sourceFile).map((diagnostic) => ({
        diagnostic,
        phase: 'syntax'
      })));
    }
    if (options.semantic !== false && program.getSemanticDiagnostics) {
      diagnostics.push(...program.getSemanticDiagnostics(sourceFile).map((diagnostic) => ({
        diagnostic,
        phase: 'semantic'
      })));
    }
  }
  const normalizedDiagnostics = uniqueDiagnostics(diagnostics.map((entry) => (
      entry?.diagnostic
        ? withDiagnosticPhase(normalizeTypeScriptDiagnostic(ts, entry.diagnostic), entry.phase)
        : withDiagnosticPhase(entry, entry.phase)
    )).filter((diagnostic) => keepDiagnostic(diagnostic, sourceMap, projectRoot)));
  const filtered = applyProjectReferenceCompositeProofToDiagnostics(normalizedDiagnostics, projectReferenceCompositeProof);
  return {
    diagnostics: uniqueDiagnostics(filtered.diagnostics),
    metadata: {
      ...diagnosticsMetadata(compilerMetadata, rootNames, sourceMap, 'typescript-compiler-api'),
      projectReferenceCompositeProof: projectReferenceProofMetadata(projectReferenceCompositeProof, filtered.suppressedDiagnostics)
    }
  };
}

function withDiagnosticPhase(diagnostic, phase) {
  const normalizedPhase = normalizeDiagnosticPhase(phase);
  return compactRecord({
    ...diagnostic,
    phase: normalizedPhase,
    syntax: diagnostic.syntax === true || normalizedPhase === 'syntax' ? true : undefined
  });
}

function normalizeDiagnosticPhase(value) {
  if (typeof value !== 'string') return undefined;
  const lowered = value.toLowerCase();
  if (lowered.includes('syntax') || lowered.includes('syntactic') || lowered.includes('parse')) return 'syntax';
  if (lowered.includes('semantic') || lowered.includes('type')) return 'semantic';
  return value;
}
