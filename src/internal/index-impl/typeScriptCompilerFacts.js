import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { idFragment } from '../../native-import-utils.js';

const TypeScriptRefactorEvidenceKey = 'typescript-language-service-refactor-evidence';
const TypeScriptRefactorEvidenceMissingCode = 'project-typescript-refactor-evidence-missing';

function withTypeScriptRefactorEvidence(input = {}, classifications = [], files = []) {
  if (!requiresTypeScriptRefactorEvidence(input)) return classifications;
  return classifications.map((classification) => {
    const evidence = typeScriptRefactorEvidenceForClassification(input, classification, files);
    if (!evidence) return classification;
    const requiredEvidence = uniqueStrings([
      ...(classification.details?.requiredEvidence ?? []),
      TypeScriptRefactorEvidenceKey
    ]);
    const details = compactRecord({
      ...(classification.details ?? {}),
      requiredEvidence,
      typeScriptRefactorEvidence: evidence
    });
    if (evidence.status !== 'failed') return { ...classification, details };
    return {
      ...classification,
      code: TypeScriptRefactorEvidenceMissingCode,
      operation: `blocked-${classification.branch}-typescript-refactor-evidence`,
      details: compactRecord({
        ...details,
        reasonCode: TypeScriptRefactorEvidenceMissingCode,
        originalReasonCode: classification.code,
        originalConflictKey: classification.details?.conflictKey,
        conflictKey: `project-typescript-refactor-evidence#${classification.details?.conflictKey ?? classification.code}`
      })
    };
  });
}

function hasFailedTypeScriptRefactorEvidence(classifications = []) {
  return classifications.some((classification) => classification.details?.typeScriptRefactorEvidence?.status === 'failed');
}

function typeScriptRefactorEvidenceRecordsFromClassifications(classifications = []) {
  const records = classifications
    .map((classification) => classification.details?.typeScriptRefactorEvidence)
    .filter((record) => record?.id);
  const seen = new Set();
  return records.filter((record) => {
    if (seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
}

function typeScriptRefactorEvidenceForClassification(input, classification, files) {
  const requirements = typeScriptRefactorEvidenceRequirements(classification);
  if (!requirements.length) return undefined;
  const observations = requirements.map((requirement) => observeTypeScriptRefactorEvidenceRequirement(input, files, requirement));
  const missing = observations.filter((observation) => observation.status !== 'passed');
  const id = `evidence_${idFragment(hashSemanticValue([
    classification.details?.conflictKey ?? classification.code,
    TypeScriptRefactorEvidenceKey
  ]))}_typescript_refactor`;
  return {
    id,
    kind: 'typescript-language-service-refactor-evidence-oracle',
    status: missing.length ? 'failed' : 'passed',
    scope: 'project-refactor',
    branch: classification.branch,
    sourcePaths: classification.sourcePaths ?? [],
    summary: missing.length
      ? `Missing TypeScript refactor evidence for ${missing.length} project rename/move requirement(s).`
      : `TypeScript refactor evidence covered ${observations.length} project rename/move requirement(s).`,
    metadata: compactRecord({
      code: missing.length ? TypeScriptRefactorEvidenceMissingCode : undefined,
      refactorKind: classification.kind,
      branch: classification.branch,
      requiredEvidence: TypeScriptRefactorEvidenceKey,
      requirements: observations,
      missing,
      missingRequirements: missing.length,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    })
  };
}

function typeScriptRefactorEvidenceRequirements(classification) {
  const branch = classification?.branch;
  const details = classification?.details ?? {};
  if (!branch) return [];
  if (classification.kind === 'cross-file-symbol-rename') {
    return uniqueRequirements([
      requirement('base', details.exportSourcePath, 'declaration', 'base-export-declaration', details.fromName),
      requirement('base', details.importSourcePath, 'reference', 'base-import-reference', details.fromName),
      requirement(branch, details.exportSourcePath, 'declaration', 'branch-export-declaration', details.toName),
      requirement(branch, details.importSourcePath, 'reference', 'branch-import-reference', details.toName)
    ]);
  }
  if (classification.kind === 'imported-symbol-move') {
    return uniqueRequirements([
      requirement('base', details.fromSourcePath, 'declaration', 'base-export-declaration', details.symbolName),
      requirement('base', details.importerSourcePath, 'reference', 'base-import-reference', details.symbolName),
      requirement(branch, details.toSourcePath, 'declaration', 'branch-export-declaration', details.symbolName),
      requirement(branch, details.importerSourcePath, 'reference', 'branch-import-reference', details.symbolName)
    ]);
  }
  if (classification.kind === 'exported-symbol-move') {
    return uniqueRequirements([
      requirement('base', details.fromSourcePath, 'declaration', 'base-export-declaration', details.symbolName ?? details.exportedName),
      requirement(branch, details.toSourcePath, 'declaration', 'branch-export-declaration', details.symbolName ?? details.exportedName)
    ]);
  }
  return [];
}

function observeTypeScriptRefactorEvidenceRequirement(input, files, requirement) {
  const expectedSourceHash = expectedProjectSourceHash(files, requirement.stage, requirement.sourcePath);
  const importResult = matchingProjectImport(input, requirement.stage, requirement.sourcePath, expectedSourceHash);
  const signals = typeScriptCompilerEvidenceSignals(importResult);
  const passed = requirement.requirement === 'reference'
    ? signals.compilerReferences > 0
    : signals.compilerSymbols > 0 || signals.compilerTypes > 0;
  return compactRecord({
    ...requirement,
    status: passed ? 'passed' : 'missing',
    code: passed ? undefined : missingRequirementCode(requirement, importResult, expectedSourceHash, signals),
    expectedSourceHash,
    sourceImportMatched: Boolean(importResult),
    importSourceHash: sourceHashForImport(importResult),
    parser: signals.parser,
    astFormat: signals.astFormat,
    compilerSymbols: signals.compilerSymbols,
    compilerTypes: signals.compilerTypes,
    compilerReferences: signals.compilerReferences,
    referenceRelations: signals.referenceRelations,
    referenceGraphReferences: signals.referenceGraphReferences,
    evidenceIds: signals.evidenceIds
  });
}

function matchingProjectImport(input, stage, sourcePath, expectedSourceHash) {
  if (!sourcePath) return undefined;
  return normalizeProjectImports(projectImportsForStage(input, stage)).find((importResult) => {
    if (sourcePathForImport(importResult) !== sourcePath) return false;
    if (!expectedSourceHash) return true;
    return sourceHashForImport(importResult) === expectedSourceHash;
  });
}

function typeScriptCompilerEvidenceSignals(importResult) {
  const semanticIndex = importResult?.semanticIndex;
  const facts = semanticIndex?.facts ?? [];
  const relations = semanticIndex?.relations ?? [];
  const evidence = uniqueEvidenceRecords([
    ...(importResult?.evidence ?? []),
    ...(semanticIndex?.evidence ?? [])
  ]);
  const compilerReferences = facts.filter((fact) => fact.predicate === 'compilerSymbolReference').length;
  const referenceRelations = relations.filter((relation) => relation.predicate === 'references' && relation.metadata?.compilerReference === true).length;
  const referenceGraphReferences = Number(
    semanticIndex?.metadata?.compilerReferenceGraph?.references
    ?? importResult?.metadata?.compilerReferenceGraph?.references
    ?? 0
  );
  return {
    parser: firstString(importResult?.adapter?.parser, importResult?.nativeAst?.parser, semanticIndex?.metadata?.parser),
    astFormat: firstString(importResult?.metadata?.astFormat, semanticIndex?.metadata?.astFormat),
    compilerSymbols: facts.filter((fact) => fact.predicate === 'compilerSymbol').length,
    compilerTypes: facts.filter((fact) => fact.predicate === 'compilerType').length,
    compilerReferences: compilerReferences + referenceRelations + referenceGraphReferences,
    referenceRelations,
    referenceGraphReferences,
    evidenceIds: uniqueStrings([
      ...evidence
        .filter((record) => record.kind === 'typescript-compiler-reference-graph' || record.metadata?.graphRecords?.compilerSymbols || record.metadata?.references)
        .map((record) => record.id),
      ...facts.flatMap((fact) => fact.evidenceIds ?? [])
    ])
  };
}

function expectedProjectSourceHash(files, stage, sourcePath) {
  const sourceText = stageSourceText(files.find((file) => file.sourcePath === sourcePath), stage);
  return typeof sourceText === 'string' ? hashSemanticValue(sourceText) : undefined;
}

function stageSourceText(file, stage) {
  if (!file) return undefined;
  if (stage === 'base') return file.baseSourceText;
  if (stage === 'worker') return file.workerDeleted ? undefined : file.workerSourceText ?? file.baseSourceText;
  if (stage === 'head') return file.headDeleted ? undefined : file.headSourceText ?? file.baseSourceText;
  return undefined;
}

function projectImportsForStage(input, stage) {
  if (stage === 'base') return input.baseProjectImports ?? input.projectGraphImports?.base;
  if (stage === 'worker') return input.workerProjectImports ?? input.projectGraphImports?.worker;
  if (stage === 'head') return input.headProjectImports ?? input.projectGraphImports?.head;
  if (stage === 'output') return input.outputProjectImports ?? input.projectGraphImports?.output;
  return input.projectGraphImports?.[stage];
}

function sourcePathForImport(importResult) {
  return firstString(
    importResult?.sourcePath,
    importResult?.nativeSource?.sourcePath,
    importResult?.nativeAst?.sourcePath,
    importResult?.semanticIndex?.documents?.[0]?.path
  );
}

function sourceHashForImport(importResult) {
  return firstString(
    importResult?.sourceHash,
    importResult?.nativeSource?.sourceHash,
    importResult?.nativeAst?.sourceHash,
    importResult?.semanticIndex?.documents?.[0]?.sourceHash
  );
}

function missingRequirementCode(requirement, importResult, expectedSourceHash, signals) {
  if (!importResult) return 'typescript-refactor-project-import-missing';
  if (expectedSourceHash && sourceHashForImport(importResult) !== expectedSourceHash) return 'typescript-refactor-project-import-stale';
  if (requirement.requirement === 'reference' && signals.compilerReferences === 0) return 'typescript-refactor-reference-evidence-missing';
  return 'typescript-refactor-symbol-evidence-missing';
}

function requirement(stage, sourcePath, requirementKind, role, symbolName) {
  return compactRecord({
    stage,
    sourcePath,
    requirement: requirementKind,
    role,
    symbolName
  });
}

function requiresTypeScriptRefactorEvidence(input = {}) {
  return input.requireTypeScriptRefactorEvidence === true
    || input.requireTypeScriptLanguageServiceRefactorEvidence === true
    || input.requireCompilerRefactorEvidence === true;
}

function normalizeProjectImports(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value instanceof Map) return [...value.values()].filter(Boolean);
  if (typeof value === 'object') return Object.values(value).filter(Boolean);
  return [];
}

function uniqueRequirements(requirements) {
  const seen = new Set();
  return requirements.filter((item) => {
    if (!item.sourcePath) return false;
    const key = `${item.stage}\0${item.sourcePath}\0${item.requirement}\0${item.role}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueEvidenceRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const key = record?.id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))];
}

function firstString(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value)) return String(value);
  }
  return undefined;
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

export {
  TypeScriptRefactorEvidenceKey,
  TypeScriptRefactorEvidenceMissingCode,
  hasFailedTypeScriptRefactorEvidence,
  requiresTypeScriptRefactorEvidence,
  typeScriptRefactorEvidenceRecordsFromClassifications,
  withTypeScriptRefactorEvidence
};
