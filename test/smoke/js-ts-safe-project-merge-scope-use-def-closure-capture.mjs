import { assert } from './helpers.mjs';
import { importNativeSource, safeMergeJsTsProject } from './compiler-api.mjs';

const closureSource = [
  'export function makeReader(state) {',
  '  const prefix = state.prefix;',
  '  return function read(todo) {',
  '    const title = todo.title;',
  '    return prefix + title + state.suffix;',
  '  };',
  '}',
  ''
].join('\n');

const lexicalProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_scope_use_def_closure_capture',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: { 'src/closure.ts': closureSource },
  workerFiles: { 'src/closure.ts': closureSource },
  headFiles: { 'src/closure.ts': closureSource }
});

assert.equal(lexicalProject.status, 'merged');
assert.equal(lexicalProject.admission.semanticEquivalenceClaim, false);
assertClosureCaptureEvidence(lexicalProject.outputProjectSymbolGraph, {
  label: 'lexical closure capture',
  sourcePath: 'src/closure.ts',
  bindingName: 'prefix',
  ownerName: 'makeReader',
  evidenceKind: undefined
});

const structuralImport = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/closure-structural.ts',
  sourceText: closureSource,
  metadata: {
    scopeUseDefEvidence: structuralClosureEvidence(closureSource)
  }
});
const structuralProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_scope_use_def_structural_closure_capture',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [structuralImport],
  baseFiles: { 'src/closure-structural.ts': closureSource },
  workerFiles: { 'src/closure-structural.ts': closureSource },
  headFiles: { 'src/closure-structural.ts': closureSource }
});

assert.equal(structuralProject.status, 'merged');
assert.equal(structuralProject.outputProjectImport.metadata.outputProjectImportSource.matchedSuppliedImports, 1);
assertClosureCaptureEvidence(structuralProject.outputProjectSymbolGraph, {
  label: 'structural closure capture',
  sourcePath: 'src/closure-structural.ts',
  bindingName: 'prefix',
  ownerName: 'makeReader',
  evidenceKind: 'scope-use-def-records'
});

function assertClosureCaptureEvidence(graph, options) {
  const binding = graph.scopeBindingRecords.find((record) => (
    record.sourcePath === options.sourcePath
    && record.name === options.bindingName
    && record.publicOwnerName === options.ownerName
  ));
  assert.ok(binding, `${options.label}: expected captured binding`);
  assert.equal(binding.publicContract, true);
  assert.equal(binding.closureReferenceCount > 0, true);
  assert.equal(typeof binding.closureUseHash, 'string');
  assert.equal(typeof binding.closureCaptureHash, 'string');

  const reference = graph.scopeReferenceRecords.find((record) => (
    record.sourcePath === options.sourcePath
    && record.bindingId === binding.id
    && record.closure === true
  ));
  assert.ok(reference, `${options.label}: expected closure reference`);
  assert.equal(reference.closureDepthDelta > 0, true);
  assert.equal(typeof reference.closureBindingDepth, 'number');
  assert.equal(reference.closureOwnerName, options.ownerName);
  assert.equal(typeof reference.closureCaptureHash, 'string');
  assert.equal(reference.reasonCodes?.includes('lexical-scope-closure-reference') ?? false, false);
  if (options.evidenceKind) assert.equal(reference.scopeEvidenceKind, options.evidenceKind);
}

function structuralClosureEvidence(sourceText) {
  const makeReader = bindingRange(sourceText, 'makeReader', 0);
  const prefixDeclaration = bindingRange(sourceText, 'prefix', 0);
  const prefixReference = bindingRange(sourceText, 'prefix', 2);
  return {
    kind: 'scope-use-def-records',
    evidenceId: 'evidence_scope_closure_capture',
    bindings: [
      scopeBinding('makeReader', 'function', makeReader, 0, 'external_makeReader'),
      scopeBinding('prefix', 'const', prefixDeclaration, 1, 'external_prefix')
    ],
    references: [
      {
        name: 'prefix',
        start: prefixReference[0],
        end: prefixReference[1],
        depth: 2,
        bindingId: 'external_prefix',
        resolvedName: 'prefix'
      }
    ]
  };
}

function scopeBinding(name, kind, range, depth, id) {
  return {
    id,
    name,
    kind,
    start: range[0],
    end: range[1],
    depth,
    namespaces: ['value']
  };
}

function bindingRange(sourceText, needle, occurrence) {
  let start = -1;
  let searchFrom = 0;
  for (let index = 0; index <= occurrence; index += 1) {
    start = sourceText.indexOf(needle, searchFrom);
    searchFrom = start + needle.length;
  }
  return [start, start + needle.length];
}
