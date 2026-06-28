import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { compactRecord, uniqueStrings } from './js-ts-safe-merge-context.js';
import { normalizeProjectReferences } from './js-ts-safe-project-merge-ts-options.js';

const ProjectReferenceCompositeProofKind = 'typescript-project-reference-composite-proof';
const ProjectReferenceCompositeProofLevel = 'typescript-project-reference-composite-source-declaration-boundary';
const projectReferenceDiagnosticCodes = new Set(['TS6053', 'TS6305', 'TS6306', 'TS6310', 'TS6311']);

function createJsTsProjectReferenceCompositeProof(input = {}, outputFiles = [], id = 'js_ts_project_safe_merge') {
  const suppliedProof = input.projectReferenceCompositeProof
    ?? input.typescriptProjectReferenceCompositeProof
    ?? input.projectReferenceProof
    ?? input.typescriptProjectReferenceProof;
  const references = normalizeProjectReferences(input, {});
  if (suppliedProof) return normalizeProjectReferenceCompositeProof(suppliedProof, input, references, id);
  if (!shouldCreateProjectReferenceCompositeProof(input, references)) return undefined;
  return projectReferenceCompositeProof(input, references, normalizeReferencedProjects(input), id);
}

function shouldCreateProjectReferenceCompositeProof(input, references) {
  return references.length > 0 && (
    input.includeProjectReferenceCompositeProof === true
    || input.requireProjectReferenceCompositeProof === true
    || normalizeReferencedProjects(input).length > 0
  );
}

function normalizeProjectReferenceCompositeProof(proof, input, references, id) {
  const currentProjects = normalizeReferencedProjects(input);
  const projects = currentProjects.length ? currentProjects : normalizeProofProjects(proof);
  const normalized = projectReferenceCompositeProof(input, references, projects, id);
  const suppliedReasonCodes = suppliedProofReasonCodes(proof, normalized);
  if (!suppliedReasonCodes.length && normalized.status === 'passed' && (!proof.status || proof.status === 'passed')) {
    return compactProof({ ...normalized, id: proof.id ?? normalized.id, hash: proof.hash ?? normalized.hash });
  }
  const reasonCodes = uniqueStrings([
    ...(normalized.reasonCodes ?? []),
    ...suppliedReasonCodes,
    ...(proof.status && proof.status !== 'passed' ? ['typescript-project-reference-composite-proof-not-passed'] : [])
  ]);
  return compactProof({
    ...normalized,
    id: proof.id ?? normalized.id,
    status: 'failed',
    reasonCodes,
    missingSignals: reasonCodes,
    suppliedProofHash: proof.hash,
    hash: undefined
  });
}

function projectReferenceCompositeProof(input, references, projects, id) {
  const normalizedProjects = projects.map(normalizeReferencedProject).filter((project) => project.path);
  const reasonCodes = projectReferenceCompositeReasonCodes(references, normalizedProjects);
  const status = reasonCodes.length ? 'failed' : 'passed';
  const projectReferenceHash = hashSemanticValue(references.map(projectReferenceRecord));
  const referencedProjectBoundaryHash = hashSemanticValue(normalizedProjects.map(projectBoundaryRecord));
  const sourceFileCount = normalizedProjects.reduce((total, project) => total + project.sourceFiles.length, 0);
  const declarationFileCount = normalizedProjects.reduce((total, project) => total + project.declarationFiles.length, 0);
  const diagnostics = normalizedProjects.flatMap((project) => project.diagnostics ?? []);
  const core = compactRecord({
    kind: ProjectReferenceCompositeProofKind,
    version: 1,
    schema: 'frontier.lang.typescriptProjectReferenceCompositeProof.v1',
    id: `${id}_project_reference_composite`,
    status,
    proofLevel: ProjectReferenceCompositeProofLevel,
    projectReferences: references.map(projectReferenceRecord),
    projectReferenceHash,
    referencedProjects: normalizedProjects.map(projectBoundaryRecord),
    referencedProjectBoundaryHash,
    sourceFileCount,
    declarationFileCount,
    diagnostics,
    suppressedDiagnosticCodes: [...projectReferenceDiagnosticCodes],
    missingSignals: reasonCodes,
    reasonCodes,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    buildModeEquivalenceClaim: false
  });
  return compactProof({ ...core, hash: hashSemanticValue(core) });
}

function projectReferenceCompositeReasonCodes(references, projects) {
  const projectByPath = new Map(projects.map((project) => [project.path, project]));
  return uniqueStrings([
    ...(references.length ? [] : ['typescript-project-reference-proof-no-project-references']),
    ...references.flatMap((reference) => {
      const project = projectByPath.get(reference.path);
      if (!project) return ['typescript-project-reference-proof-missing-referenced-project'];
      return [
        project.composite === true ? undefined : 'typescript-project-reference-composite-flag-missing',
        project.sourceFiles.length ? undefined : 'typescript-project-reference-source-boundary-missing',
        project.declarationFiles.length ? undefined : 'typescript-project-reference-declaration-boundary-missing',
        project.sourceFiles.some((file) => file.hashMismatch) ? 'typescript-project-reference-source-hash-mismatch' : undefined,
        project.declarationFiles.some((file) => file.hashMismatch) ? 'typescript-project-reference-declaration-hash-mismatch' : undefined,
        project.diagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'typescript-project-reference-diagnostics-blocked' : undefined
      ];
    })
  ]);
}

function suppliedProofReasonCodes(proof, normalized) {
  return uniqueStrings([
    proof.projectReferenceHash && proof.projectReferenceHash !== normalized.projectReferenceHash
      ? 'typescript-project-reference-hash-mismatch'
      : undefined,
    proof.referencedProjectBoundaryHash && proof.referencedProjectBoundaryHash !== normalized.referencedProjectBoundaryHash
      ? 'typescript-project-reference-boundary-hash-mismatch'
      : undefined
  ]);
}

function applyProjectReferenceCompositeProofToDiagnostics(diagnostics, proof) {
  if (proof?.status !== 'passed') {
    return {
      diagnostics: proof?.status === 'failed' ? [...diagnostics, projectReferenceProofDiagnostic(proof)] : diagnostics,
      suppressedDiagnostics: []
    };
  }
  const suppressedDiagnostics = diagnostics.filter(isProjectReferenceDiagnostic);
  return {
    diagnostics: diagnostics.filter((diagnostic) => !isProjectReferenceDiagnostic(diagnostic)),
    suppressedDiagnostics
  };
}

function projectReferenceProofMetadata(proof, suppressedDiagnostics = []) {
  if (!proof) return undefined;
  return compactRecord({
    kind: proof.kind,
    status: proof.status,
    proofLevel: proof.proofLevel,
    hash: proof.hash,
    projectReferenceHash: proof.projectReferenceHash,
    referencedProjectBoundaryHash: proof.referencedProjectBoundaryHash,
    sourceFileCount: proof.sourceFileCount,
    declarationFileCount: proof.declarationFileCount,
    reasonCodes: proof.reasonCodes,
    suppressedDiagnosticCodes: uniqueStrings(suppressedDiagnostics.map((diagnostic) => diagnostic.code)),
    suppressedDiagnostics: suppressedDiagnostics.length || undefined,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    buildModeEquivalenceClaim: false
  });
}

function isProjectReferenceDiagnostic(diagnostic) {
  return diagnostic?.source === 'typescript-project-references' && projectReferenceDiagnosticCodes.has(diagnostic.code);
}

function projectReferenceProofDiagnostic(proof) {
  return {
    id: `${proof.id}_diagnostic`,
    source: 'typescript-project-reference-composite-proof',
    code: 'TSFRP001',
    severity: 'error',
    message: `TypeScript project-reference composite proof failed: ${(proof.reasonCodes ?? []).join(', ') || 'unknown'}.`,
    phase: 'project-reference-proof',
    syntax: false
  };
}

function normalizeReferencedProjects(input) {
  const raw = input.referencedProjects
    ?? input.typescriptReferencedProjects
    ?? input.projectReferenceProjects
    ?? input.projectReferenceCompositeProjects
    ?? input.projectReferenceCompositeEvidence?.projects;
  if (!raw) return [];
  if (raw instanceof Map) return [...raw.entries()].map(([path, project]) => ({ path, ...project }));
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object') return Object.entries(raw).map(([path, project]) => ({ path, ...project }));
  return [];
}

function normalizeProofProjects(proof) {
  return (proof.referencedProjects ?? []).map((project) => ({
    path: project.path,
    tsconfigPath: project.tsconfigPath,
    compilerOptions: project.compilerOptions,
    composite: project.composite,
    sourceFiles: project.sourceFiles,
    declarationFiles: project.declarationFiles,
    diagnostics: project.diagnostics,
    sourceBoundaryHash: project.sourceBoundaryHash,
    declarationBoundaryHash: project.declarationBoundaryHash
  }));
}

function normalizeReferencedProject(project) {
  const compilerOptions = project.compilerOptions ?? project.tsconfig?.compilerOptions ?? {};
  const sourceFiles = normalizeBoundaryFiles(project.sourceFiles ?? project.files ?? project.projectFiles, 'source');
  const declarationFiles = normalizeBoundaryFiles(project.declarationFiles ?? project.declarations ?? project.outputDeclarations, 'declaration');
  return compactRecord({
    path: normalizePath(project.path ?? project.originalPath ?? ''),
    originalPath: project.originalPath === undefined ? undefined : normalizePath(project.originalPath),
    tsconfigPath: project.tsconfigPath === undefined ? undefined : normalizePath(project.tsconfigPath),
    composite: project.composite === true || compilerOptions.composite === true,
    declaration: project.declaration === true || compilerOptions.declaration === true,
    compilerOptions: metadataOptions(compilerOptions),
    compilerOptionsHash: hashSemanticValue(metadataOptions(compilerOptions)),
    sourceFiles,
    declarationFiles,
    diagnostics: normalizeDiagnostics(project.diagnostics),
    sourceBoundaryHash: project.sourceBoundaryHash ?? boundaryHash(sourceFiles),
    declarationBoundaryHash: project.declarationBoundaryHash ?? boundaryHash(declarationFiles)
  });
}

function normalizeBoundaryFiles(value, source) {
  const entries = value instanceof Map
    ? [...value.entries()].map(([sourcePath, sourceText]) => ({ sourcePath, sourceText }))
    : Array.isArray(value) ? value
      : value && typeof value === 'object' ? Object.entries(value).map(([sourcePath, sourceText]) => ({ sourcePath, sourceText }))
        : [];
  return entries.map((entry) => boundaryFile(entry, source)).filter((file) => file.sourcePath);
}

function boundaryFile(entry, source) {
  const sourcePath = normalizePath(entry.sourcePath ?? entry.path ?? '');
  const sourceText = typeof entry.sourceText === 'string' ? entry.sourceText : typeof entry.text === 'string' ? entry.text : undefined;
  const actualHash = sourceText === undefined ? entry.sourceHash ?? entry.hash : hashSemanticValue(sourceText);
  const suppliedHash = entry.sourceHash ?? entry.hash;
  return compactRecord({
    sourcePath,
    sourceHash: actualHash,
    suppliedSourceHash: suppliedHash && suppliedHash !== actualHash ? suppliedHash : undefined,
    hashMismatch: Boolean(suppliedHash && suppliedHash !== actualHash),
    source,
    bytes: typeof sourceText === 'string' ? byteLength(sourceText) : entry.bytes
  });
}

function normalizeDiagnostics(value) {
  const values = Array.isArray(value) ? value : [value].filter(Boolean);
  return values.map((diagnostic, index) => compactRecord({
    id: diagnostic.id ?? `project_reference_diagnostic_${index + 1}`,
    source: diagnostic.source ?? 'typescript-project-reference-host',
    code: String(diagnostic.code ?? 'diagnostic'),
    severity: diagnostic.severity ?? 'error',
    message: String(diagnostic.message ?? diagnostic.messageText ?? '')
  }));
}

function projectReferenceRecord(reference) {
  return compactRecord({
    path: reference.path,
    originalPath: reference.originalPath,
    prepend: reference.prepend === true ? true : undefined,
    circular: reference.circular === true ? true : undefined
  });
}

function projectBoundaryRecord(project) {
  return compactRecord({
    path: project.path,
    originalPath: project.originalPath,
    tsconfigPath: project.tsconfigPath,
    composite: project.composite,
    declaration: project.declaration,
    compilerOptions: project.compilerOptions,
    compilerOptionsHash: project.compilerOptionsHash,
    sourceFiles: project.sourceFiles.map(fileBoundaryRecord),
    declarationFiles: project.declarationFiles.map(fileBoundaryRecord),
    sourceBoundaryHash: project.sourceBoundaryHash,
    declarationBoundaryHash: project.declarationBoundaryHash,
    diagnostics: project.diagnostics
  });
}

function fileBoundaryRecord(file) {
  return compactRecord({
    sourcePath: file.sourcePath,
    sourceHash: file.sourceHash,
    bytes: file.bytes,
    source: file.source
  });
}

function boundaryHash(files) { return hashSemanticValue(files.map(fileBoundaryRecord)); }
function metadataOptions(value) { return value && typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : {}; }
function compactProof(proof) { return { ...proof, hash: proof.hash ?? hashSemanticValue({ ...proof, hash: undefined }) }; }
function byteLength(text) { return typeof TextEncoder === 'function' ? new TextEncoder().encode(text).length : String(text).length; }

function normalizePath(value) {
  return String(value ?? '').replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, '');
}

export {
  ProjectReferenceCompositeProofKind,
  ProjectReferenceCompositeProofLevel,
  applyProjectReferenceCompositeProofToDiagnostics,
  createJsTsProjectReferenceCompositeProof,
  projectReferenceProofMetadata
};
