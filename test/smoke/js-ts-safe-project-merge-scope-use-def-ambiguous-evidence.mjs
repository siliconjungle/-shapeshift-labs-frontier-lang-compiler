import { assert } from './helpers.mjs';
import { projectScopeUseDefDeltaConflicts } from '../../src/js-ts-safe-project-merge-scope-use-def-conflicts.js';

const nestedCompilerReferenceConflicts = projectScopeUseDefDeltaConflicts({
  stages: {
    output: {
      projectSymbolGraph: {
        scopeBindingRecords: [],
        scopeReferenceRecords: [referenceRecord('output', undefined, 'ref:compiler-blocked', {
          compilerReferenceStatus: 'blocked',
          compilerReferenceReasonCodes: ['typescript-compiler-reference-site-ambiguous'],
          compilerReferenceProofHash: 'compiler-proof:ambiguous'
        })]
      },
      summary: { scopeReferenceRecords: 1 }
    }
  },
  summary: { stages: 1 }
});
const nestedCompilerReferenceConflict = nestedCompilerReferenceConflicts
  .find((conflict) => conflict.code === 'project-public-scope-reference-ambiguous-evidence');
assert.equal(nestedCompilerReferenceConflicts.length, 1);
assert.equal(nestedCompilerReferenceConflict?.details.reasonCodes.includes('typescript-compiler-reference-site-ambiguous'), true);
assert.equal(nestedCompilerReferenceConflict.details.output.compilerReferenceStatus, 'blocked');

const nestedAliasBindingConflicts = projectScopeUseDefDeltaConflicts({
  stages: {
    output: {
      projectSymbolGraph: {
        scopeBindingRecords: [bindingRecord('output', {
          aliasResolutionStatus: 'blocked',
          aliasResolutionReasonCodes: ['lexical-scope-import-alias-target-unresolved'],
          importAlias: true,
          moduleSpecifier: './dep.js',
          importedName: 'missingExport'
        })],
        scopeReferenceRecords: []
      },
      summary: { scopeBindingRecords: 1 }
    }
  },
  summary: { stages: 1 }
});
const nestedAliasBindingConflict = nestedAliasBindingConflicts
  .find((conflict) => conflict.code === 'project-public-scope-use-def-ambiguous-evidence');
assert.equal(nestedAliasBindingConflicts.length, 1);
assert.equal(nestedAliasBindingConflict?.details.reasonCodes.includes('lexical-scope-import-alias-target-unresolved'), true);
assert.equal(nestedAliasBindingConflict.details.output.aliasResolutionStatus, 'blocked');

const nestedAliasReferenceConflicts = projectScopeUseDefDeltaConflicts({
  stages: {
    output: {
      projectSymbolGraph: {
        scopeBindingRecords: [],
        scopeReferenceRecords: [aliasReferenceRecord('output', undefined, {
          aliasResolutionStatus: 'blocked',
          aliasResolutionReasonCodes: ['lexical-scope-import-alias-target-unresolved']
        })]
      },
      summary: { scopeReferenceRecords: 1 }
    }
  },
  summary: { stages: 1 }
});
const nestedAliasReferenceConflict = nestedAliasReferenceConflicts
  .find((conflict) => conflict.code === 'project-public-scope-reference-ambiguous-evidence');
assert.equal(nestedAliasReferenceConflicts.length, 1);
assert.equal(nestedAliasReferenceConflict?.details.reasonCodes.includes('lexical-scope-import-alias-target-unresolved'), true);
assert.equal(nestedAliasReferenceConflict.details.output.aliasResolutionStatus, 'blocked');

function referenceRecord(stage, memberName, signatureHash, fields = {}) {
  return {
    id: `scope_ref_${stage}`,
    sourcePath: 'src/scope.ts',
    sourceHash: `source:${stage}`,
    name: 'api',
    namespace: 'value',
    bindingName: 'api',
    bindingKind: 'import',
    bindingOrdinal: 1,
    publicContract: true,
    publicOwnerName: 'viewTodo',
    referenceKind: 'namespace-property-read',
    memberName,
    ordinal: 42,
    signatureHash,
    ...fields
  };
}

function bindingRecord(stage, fields = {}) {
  return {
    id: `scope_binding_${stage}`,
    sourcePath: 'src/scope.ts',
    sourceHash: `source:${stage}`,
    name: 'renderTodo',
    bindingKind: 'import',
    publicContract: true,
    publicOwnerName: 'viewTodo',
    namespaces: ['value'],
    ordinal: 7,
    signatureHash: `binding:${stage}`,
    ...fields
  };
}

function aliasReferenceRecord(stage, resolvedBindingUseHash, fields = {}) {
  return referenceRecord(stage, undefined, 'ref:alias-target', {
    name: 'renderTodo',
    bindingName: 'renderTodo',
    bindingKind: 'import',
    importAlias: true,
    moduleSpecifier: './barrel.js',
    importedName: 'publicFormat',
    resolvedSourcePath: 'src/barrel.ts',
    resolvedExportName: 'publicFormat',
    originSourcePath: 'src/dep.ts',
    resolvedBindingId: 'scope_binding_formatTodo',
    resolvedBindingName: 'formatTodo',
    resolvedBindingUseHash,
    ...fields
  });
}
