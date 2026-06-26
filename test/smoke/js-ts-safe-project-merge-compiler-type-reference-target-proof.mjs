import { assert } from './helpers.mjs';
import { publicCompilerTypeDeltaConflicts } from '../../src/js-ts-safe-project-merge-graph-delta-compiler-conflicts.js';
import {
  compilerGraph,
  publicReaderType
} from './js-ts-safe-project-merge-compiler-type-equivalence-helpers.mjs';

const baseGraph = await compilerGraph({ 'src/types.ts': modelSource('string') }, undefined, 'type_reference_target_base');
const changedGraph = await compilerGraph({ 'src/types.ts': modelSource('number') }, undefined, 'type_reference_target_changed');

const boxRecord = publicReaderType(changedGraph, '"src/types".Box');
assert.equal(boxRecord?.typeReferenceTargetCount, 1);
assert.equal(boxRecord?.typeEquivalenceStatus, 'compiler-backed-equivalent');
assert.equal(boxRecord?.typeEquivalenceProof?.status, 'passed');
assert.equal(boxRecord?.typeEquivalenceProof?.typeReferenceTargetSetHash, boxRecord?.typeEquivalenceTypeReferenceTargetSetHash);
assert.equal(boxRecord?.typeEquivalenceProof?.typeReferenceTargetCount, 1);
assert.equal(boxRecord?.typeEquivalenceProof?.requiredSignals?.includes('compiler-type-reference-target-proof-hashes'), true);
assert.equal(boxRecord?.typeEquivalenceProof?.autoMergeClaim, false);
assert.equal(boxRecord?.typeEquivalenceProof?.semanticEquivalenceClaim, false);
assert.equal(typeof boxRecord?.typeEquivalenceTypeReferenceTargetSetHash, 'string');

const target = boxRecord?.typeReferenceTargets?.[0];
assert.equal(target?.kind, 'type-reference-target');
assert.equal(target?.typeReferenceName, 'Model');
assert.equal(target?.targetSymbolName, 'Model');
assert.equal(String(target?.targetFullyQualifiedName).includes('Model'), true);
assert.equal(target?.targetDeclarationSourcePath, 'src/types.ts');
assert.equal(typeof target?.targetDeclarationTextHash, 'string');
assert.equal(typeof target?.targetSymbolIdentityHash, 'string');
assert.equal(typeof target?.typeReferenceTargetProofHash, 'string');
assert.equal(target?.autoMergeClaim, false);
assert.equal(target?.semanticEquivalenceClaim, false);
assert.equal(target?.runtimeEquivalenceClaim, false);
assert.equal(boxRecord?.typeEquivalenceCheckerEvidence?.typeReferenceTargetProofHashes?.[0], target?.typeReferenceTargetProofHash);

const readRecord = publicReaderType(changedGraph, '"src/types".read');
assert.equal(readRecord?.typeReferenceTargetCount, 1);
assert.equal(readRecord?.typeEquivalenceProof?.kind, 'typescript-checker-public-api-type-reference-target-proof');
assert.equal(typeof readRecord?.typeEquivalenceTypeReferenceTargetSetHash, 'string');
assert.equal(readRecord?.typeEquivalenceProof?.requiredSignals?.includes('compiler-type-reference-target-declaration-text-hashes'), true);

assert.equal(publicCompilerTypeDeltaConflicts(baseGraph, changedGraph, changedGraph, changedGraph).length, 0);

const changedWithoutTargetProofGraph = await compilerGraph(
  { 'src/types.ts': modelSource('number') },
  importsWithoutTypeReferenceTargetProofHash,
  'type_reference_target_changed_missing_proof'
);
const conflicts = publicCompilerTypeDeltaConflicts(baseGraph, changedWithoutTargetProofGraph, changedWithoutTargetProofGraph, changedWithoutTargetProofGraph);
const missingProofConflict = conflicts.find((conflict) => conflict.details?.reasonCode === 'typescript-public-api-type-equivalence-proof-missing');
assert.equal(Boolean(missingProofConflict), true);
assert.equal(missingProofConflict.details.typeEquivalenceEvidence.missingRecords.some((record) => (
  record.missingSignals?.includes('compiler-type-reference-target-proof-hashes')
)), true);
assert.equal(missingProofConflict.details.typeEquivalenceEvidence.missingRecords.some((record) => (
  record.typeEquivalenceReasonCodes?.includes('typescript-compiler-type-reference-target-proof-hashes-missing')
)), true);

function modelSource(idType) {
  return [
    'export interface Model {',
    `  id: ${idType};`,
    '}',
    'export type Box = Model;',
    'export function read(input: Model): Model { return input; }',
    ''
  ].join('\n');
}

function importsWithoutTypeReferenceTargetProofHash(imports) {
  return imports.map((importResult) => ({
    ...importResult,
    semanticIndex: importResult.semanticIndex ? {
      ...importResult.semanticIndex,
      facts: (importResult.semanticIndex.facts ?? []).map((fact) => fact.predicate === 'compilerType'
        ? {
            ...fact,
            value: {
              ...fact.value,
              typeReferenceTargets: (fact.value?.typeReferenceTargets ?? []).map((targetRecord) => omitKey(targetRecord, 'typeReferenceTargetProofHash'))
            }
          }
        : fact)
    } : importResult.semanticIndex
  }));
}

function omitKey(value, key) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const { [key]: _omitted, ...rest } = value;
  return rest;
}
