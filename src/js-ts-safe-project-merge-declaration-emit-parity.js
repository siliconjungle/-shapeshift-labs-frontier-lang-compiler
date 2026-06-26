import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord, uniqueStrings } from './js-ts-safe-merge-context.js';
import { createJsTsProjectMergeDeclarationGate } from './js-ts-safe-project-merge-declarations.js';

const DeclarationEmitParityKind = 'typescript-checker-public-api-declaration-emit-parity';
const DeclarationEmitParityProofLevel = 'typescript-checker-public-api-declaration-output-boundary';

function createJsTsProjectMergeDeclarationEmitParityProof(input = {}, files = [], outputFiles = [], id = 'js_ts_project_safe_merge') {
  const suppliedProof = input.declarationEmitParityProof ?? input.outputDeclarationEmitParityProof;
  if (suppliedProof) return normalizeDeclarationEmitParityProof(suppliedProof, id);
  if (!shouldCreateDeclarationEmitParityProof(input)) return undefined;
  const stageFiles = declarationParityStageFiles(files, outputFiles, input);
  const gateInput = declarationParityGateInput(input);
  const gates = Object.fromEntries(Object.entries(stageFiles).map(([stage, stageOutputFiles]) => [
    stage,
    createJsTsProjectMergeDeclarationGate(gateInput, stageOutputFiles, `${id}_${stage}`)
  ]));
  return declarationEmitParityProof(input, id, gates);
}

function shouldCreateDeclarationEmitParityProof(input) {
  return input.includeDeclarationOutput === true
    || input.requireDeclarationOutput === true
    || input.requirePublicApiDeclarationEmitParity === true;
}

function declarationParityStageFiles(files, outputFiles, input) {
  return {
    worker: files.map((file) => stageFile(file, workerStageSourceText(file), input)).filter(Boolean),
    head: files.map((file) => stageFile(file, headStageSourceText(file), input)).filter(Boolean),
    output: outputFiles
  };
}

function declarationParityGateInput(input) {
  return {
    ...input,
    includeDeclarationOutput: true,
    requireDeclarationOutput: true,
    outputDeclarations: undefined,
    outputDeclarationFiles: undefined
  };
}

function declarationEmitParityProof(input, id, gates) {
  const boundaries = Object.fromEntries(Object.entries(gates).map(([stage, gate]) => [stage, declarationBoundary(gate)]));
  const reasonCodes = declarationEmitParityReasonCodes(gates, boundaries);
  const status = reasonCodes.length ? 'failed' : 'passed';
  const outputFiles = boundaries.output?.files ?? [];
  const core = {
    kind: DeclarationEmitParityKind,
    version: 1,
    schema: 'frontier.lang.typescriptDeclarationEmitParityProof.v1',
    id: `${id}_declaration_emit_parity`,
    status,
    proofLevel: DeclarationEmitParityProofLevel,
    workerDeclarationBoundaryHash: boundaries.worker?.hash,
    headDeclarationBoundaryHash: boundaries.head?.hash,
    outputDeclarationBoundaryHash: boundaries.output?.hash,
    declarationFileCount: outputFiles.length,
    declarationFiles: outputFiles,
    compilerOptionsHash: compilerOptionsHash(input),
    diagnosticsHash: diagnosticsHash(gates),
    missingSignals: reasonCodes,
    reasonCodes,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  };
  return { ...compactRecord(core), hash: hashSemanticValue(core) };
}

function declarationEmitParityReasonCodes(gates, boundaries) {
  const reasonCodes = [];
  for (const [stage, gate] of Object.entries(gates)) {
    if (!gate) reasonCodes.push(`typescript-public-api-declaration-emit-${stage}-missing`);
    if (gate?.status !== 'passed') reasonCodes.push(stage === 'output'
      ? 'typescript-public-api-declaration-emit-output-missing'
      : 'typescript-public-api-declaration-emit-proof-missing');
    if ((gate?.diagnostics ?? []).some((diagnostic) => diagnostic.severity === 'error')) {
      reasonCodes.push('typescript-public-api-declaration-emit-diagnostics-blocked');
    }
  }
  if (!boundaries.worker?.hash || !boundaries.head?.hash || !boundaries.output?.hash) {
    reasonCodes.push('typescript-compiler-declaration-output-public-boundary-hash-missing');
  } else if (boundaries.worker.hash !== boundaries.head.hash || boundaries.worker.hash !== boundaries.output.hash) {
    reasonCodes.push('typescript-public-api-declaration-emit-parity-mismatch');
  }
  return uniqueStrings(reasonCodes);
}

function declarationBoundary(gate) {
  if (!gate || gate.status !== 'passed') return undefined;
  const files = [...(gate.declarationFiles ?? [])]
    .map((file) => compactRecord({
      sourcePath: file.sourcePath,
      sourceHash: file.sourceHash,
      bytes: file.bytes,
      source: file.source
    }))
    .sort((a, b) => String(a.sourcePath).localeCompare(String(b.sourcePath)));
  return {
    files,
    hash: hashSemanticValue({ kind: 'frontier.lang.typescriptDeclarationBoundary', files })
  };
}

function missingDeclarationEmitParityEvidence(proof, options = {}) {
  if (options.requireDeclarationEmitParity !== true) return undefined;
  if (!proof) {
    return {
      reasonCode: 'typescript-public-api-declaration-emit-proof-missing',
      requiredEvidence: DeclarationEmitParityKind,
      proofLevel: DeclarationEmitParityProofLevel,
      missingSignals: ['typescript-public-api-declaration-emit-proof-missing']
    };
  }
  if (proof.status === 'passed') return undefined;
  const missingSignals = uniqueStrings(proof.reasonCodes ?? proof.missingSignals ?? ['typescript-public-api-declaration-emit-parity-mismatch']);
  return compactRecord({
    reasonCode: missingSignals[0],
    requiredEvidence: DeclarationEmitParityKind,
    proofLevel: DeclarationEmitParityProofLevel,
    status: proof.status,
    missingSignals,
    workerDeclarationBoundaryHash: proof.workerDeclarationBoundaryHash,
    headDeclarationBoundaryHash: proof.headDeclarationBoundaryHash,
    outputDeclarationBoundaryHash: proof.outputDeclarationBoundaryHash,
    declarationFileCount: proof.declarationFileCount,
    compilerOptionsHash: proof.compilerOptionsHash,
    diagnosticsHash: proof.diagnosticsHash,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
}

function normalizeDeclarationEmitParityProof(proof, id) {
  const core = compactRecord({
    ...proof,
    kind: proof.kind ?? DeclarationEmitParityKind,
    version: proof.version ?? 1,
    id: proof.id ?? `${id}_declaration_emit_parity`,
    proofLevel: proof.proofLevel ?? DeclarationEmitParityProofLevel,
    status: proof.status ?? 'failed',
    reasonCodes: uniqueStrings(proof.reasonCodes ?? proof.missingSignals ?? []),
    missingSignals: uniqueStrings(proof.missingSignals ?? proof.reasonCodes ?? []),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false
  });
  return { ...core, hash: proof.hash ?? hashSemanticValue(core) };
}

function workerStageSourceText(file) {
  if (file.workerDeleted) return undefined;
  return file.workerSourceText ?? file.baseSourceText;
}

function headStageSourceText(file) {
  if (file.headDeleted) return undefined;
  return file.headSourceText ?? file.baseSourceText;
}

function stageFile(file, sourceText, input) {
  if (typeof sourceText !== 'string' || !file.sourcePath) return undefined;
  return compactRecord({ sourcePath: file.sourcePath, language: file.language ?? input.language, sourceText });
}

function compilerOptionsHash(input) {
  return hashSemanticValue({
    compilerOptions: input.compilerOptions,
    typescriptCompilerOptions: input.typescriptCompilerOptions,
    declarationCompilerOptions: input.declarationCompilerOptions,
    typescriptDeclarationCompilerOptions: input.typescriptDeclarationCompilerOptions,
    tsconfig: input.tsconfig,
    moduleResolution: input.moduleResolution,
    projectReferences: input.projectReferences ?? input.typescriptProjectReferences ?? input.tsconfigProjectReferences
  });
}

function diagnosticsHash(gates) {
  return hashSemanticValue(Object.fromEntries(Object.entries(gates).map(([stage, gate]) => [stage, gate?.diagnostics ?? []])));
}

export {
  createJsTsProjectMergeDeclarationEmitParityProof,
  missingDeclarationEmitParityEvidence
};
