import { assert } from './helpers.mjs';
import ts from 'typescript';
import {
  createTypeScriptCompilerNativeImporterAdapter,
  runNativeImporterAdapter,
  safeMergeJsTsProject
} from './compiler-api.mjs';
import { projectScopeUseDefDeltaConflicts } from '../../src/js-ts-safe-project-merge-scope-use-def-conflicts.js';

const receiverProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_scope_use_def_receiver_members',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  baseFiles: counterFiles('value'),
  workerFiles: counterFiles('value'),
  headFiles: counterFiles('value')
});
const receiverGraph = receiverProject.outputProjectSymbolGraph;
assert.equal(receiverProject.status, 'merged');

const receiverReferences = receiverGraph.scopeReferenceRecords.filter((record) => record.publicOwnerName === 'Counter');
const thisWriteReference = receiverReferences.find((record) => record.receiverKind === 'this' && record.memberName === 'value');
assert.equal(thisWriteReference?.referenceKind, 'this-member-write');
assert.equal(thisWriteReference.writeOperation, 'assignment');
assert.equal(thisWriteReference.publicContract, true);

const computedThisReference = receiverReferences.find((record) => record.receiverKind === 'this' && record.memberName === 'label');
assert.equal(computedThisReference?.referenceKind, 'this-member-read');
assert.equal(computedThisReference.memberComputed, true);
assert.equal(computedThisReference.memberLiteralKind, 'string-literal');

const templateThisReference = receiverReferences.find((record) => record.receiverKind === 'this' && record.memberName === 'templateLabel');
assert.equal(templateThisReference?.referenceKind, 'this-member-read');
assert.equal(templateThisReference.memberComputed, true);
assert.equal(templateThisReference.memberLiteralKind, 'static-template-literal');
assert.equal(templateThisReference.memberStaticTemplateLiteral, true);

const optionalThisReference = receiverReferences.find((record) => record.receiverKind === 'this' && record.memberName === 'optional');
assert.equal(optionalThisReference?.memberOptional, true);

const superReference = receiverReferences.find((record) => record.receiverKind === 'super' && record.memberName === 'render');
assert.equal(superReference?.referenceKind, 'super-member-read');

const counterOwner = receiverGraph.scopeBindingRecords.find((record) => record.name === 'Counter' && record.bindingKind === 'class');
assert.equal(typeof counterOwner?.publicOwnerUseHash, 'string');
assert.equal(typeof counterOwner.useHash, 'string');

const receiverConflicts = projectScopeUseDefDeltaConflicts(scopeDelta({
  base: counterOwnerRecord('value'),
  worker: counterOwnerRecord('workerValue'),
  head: counterOwnerRecord('headValue')
}));
const receiverConflict = receiverConflicts.find((conflict) => conflict.details?.identityKey?.includes('#Counter#class#'));
assert.equal(receiverConflict?.details.reasonCode, 'project-public-scope-use-def-delta-conflict');
assert.notEqual(receiverConflict.details.worker.publicOwnerUseHash, receiverConflict.details.head.publicOwnerUseHash);

const receiverLiteralKindConflicts = projectScopeUseDefDeltaConflicts(scopeReferenceDelta({
  base: counterComputedReceiverReferenceRecord('this.label', 'base'),
  worker: counterComputedReceiverReferenceRecord('this["label"]', 'worker'),
  head: counterComputedReceiverReferenceRecord('this[`label`]', 'head')
}));
const receiverLiteralKindConflict = receiverLiteralKindConflicts
  .find((conflict) => conflict.code === 'project-public-scope-reference-delta-conflict');
assert.equal(receiverLiteralKindConflict?.details.reasonCode, 'project-public-scope-reference-delta-conflict');
assert.equal(receiverLiteralKindConflict.details.worker.receiverKind, 'this');
assert.equal(receiverLiteralKindConflict.details.worker.memberName, 'label');
assert.equal(receiverLiteralKindConflict.details.worker.memberLiteralKind, 'string-literal');
assert.equal(receiverLiteralKindConflict.details.head.memberLiteralKind, 'static-template-literal');

const compilerReceiverSource = [
  'class BaseCounter {',
  '  render(label: string) { return label; }',
  '}',
  'export class Counter extends BaseCounter {',
  '  #value = 0;',
  '  read() {',
  '    this.#value += 1;',
  '    return super.render(String(this.#value));',
  '  }',
  '}',
  ''
].join('\n');
const compilerReceiverImport = await typeScriptCompilerImport('src/compiler-counter.ts', compilerReceiverSource);
const compilerReceiverProject = safeMergeJsTsProject({
  id: 'js_ts_project_safe_merge_scope_use_def_receiver_members_compiler_reference',
  language: 'typescript',
  includeOutputProjectSymbolGraph: true,
  outputProjectImports: [compilerReceiverImport],
  baseFiles: { 'src/compiler-counter.ts': compilerReceiverSource },
  workerFiles: { 'src/compiler-counter.ts': compilerReceiverSource },
  headFiles: { 'src/compiler-counter.ts': compilerReceiverSource }
});
const compilerReceiverGraph = compilerReceiverProject.outputProjectSymbolGraph;
assert.equal(compilerReceiverProject.status, 'merged');
assert.equal(compilerReceiverProject.outputProjectImport.metadata.outputProjectImportSource.matchedSuppliedImports, 1);
const privateReceiverReference = compilerReceiverGraph.scopeReferenceRecords.find((record) => (
  record.receiverKind === 'this'
  && record.memberName === '#value'
  && record.referenceKind === 'this-member-write'
));
assert.equal(privateReceiverReference?.compilerReferenceStatus, 'passed');
assert.equal(privateReceiverReference.compilerReferenceLocalName, '#value');
assert.equal(privateReceiverReference.compilerReferenceFullyQualifiedName.endsWith('.#value'), true);
assert.equal(typeof privateReceiverReference.compilerReferenceProofHash, 'string');
const compilerSuperReference = compilerReceiverGraph.scopeReferenceRecords.find((record) => (
  record.receiverKind === 'super'
  && record.memberName === 'render'
));
assert.equal(compilerSuperReference?.compilerReferenceStatus, 'passed');
assert.equal(compilerSuperReference.compilerReferenceLocalName, 'render');
assert.equal(typeof compilerSuperReference.compilerReferenceProofHash, 'string');

function counterFiles(memberName) {
  return {
    'src/counter.ts': [
      'export class Counter extends BaseCounter {',
      '  value = 0;',
      '  label = "count";',
      '  templateLabel = "template";',
      '  read() {',
      `    this.${memberName} += 1;`,
      '    const label = this["label"];',
      '    const templateLabel = this[`templateLabel`];',
      '    const maybe = this?.optional;',
      '    return super.render(label) + maybe;',
      '  }',
      '}',
      ''
    ].join('\n')
  };
}

function counterOwnerRecord(memberName) {
  const project = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_scope_use_def_receiver_member_delta_${memberName}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: counterFiles(memberName),
    workerFiles: counterFiles(memberName),
    headFiles: counterFiles(memberName)
  });
  assert.equal(project.status, 'merged');
  return project.outputProjectSymbolGraph.scopeBindingRecords.find((record) => record.name === 'Counter' && record.bindingKind === 'class');
}

function counterComputedReceiverFiles(accessExpression) {
  return {
    'src/counter-literal.ts': [
      'export class Counter {',
      '  label = "count";',
      '  read() {',
      `    return ${accessExpression};`,
      '  }',
      '}',
      ''
    ].join('\n')
  };
}

function counterComputedReceiverReferenceRecord(accessExpression, stage) {
  const project = safeMergeJsTsProject({
    id: `js_ts_project_safe_merge_scope_use_def_receiver_literal_kind_delta_${stage}`,
    language: 'typescript',
    includeOutputProjectSymbolGraph: true,
    baseFiles: counterComputedReceiverFiles(accessExpression),
    workerFiles: counterComputedReceiverFiles(accessExpression),
    headFiles: counterComputedReceiverFiles(accessExpression)
  });
  assert.equal(project.status, 'merged');
  return project.outputProjectSymbolGraph.scopeReferenceRecords.find((record) => (
    record.receiverKind === 'this'
    && record.memberName === 'label'
    && record.publicOwnerName === 'Counter'
  ));
}

async function typeScriptCompilerImport(sourcePath, sourceText) {
  const compilerOptions = { target: ts.ScriptTarget.Latest, module: ts.ModuleKind.ESNext, noResolve: true };
  const sourceFile = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const host = ts.createCompilerHost(compilerOptions);
  host.getSourceFile = (fileName) => (fileName === sourcePath ? sourceFile : undefined);
  host.fileExists = (fileName) => fileName === sourcePath;
  host.readFile = (fileName) => (fileName === sourcePath ? sourceText : undefined);
  host.writeFile = () => {};
  const program = ts.createProgram([sourcePath], compilerOptions, host);
  return runNativeImporterAdapter(createTypeScriptCompilerNativeImporterAdapter({
    typescript: ts,
    program,
    typeChecker: program.getTypeChecker()
  }), {
    language: 'typescript',
    sourcePath,
    sourceText,
    adapterOptions: { sourceFile: program.getSourceFile(sourcePath) ?? sourceFile }
  });
}

function scopeDelta(stages) {
  return {
    stages: Object.fromEntries(Object.entries(stages).map(([stage, record]) => [stage, {
      projectSymbolGraph: { scopeBindingRecords: record ? [record] : [] },
      summary: { scopeBindingRecords: record ? 1 : 0 }
    }])),
    summary: { stages: Object.keys(stages).length }
  };
}

function scopeReferenceDelta(stages) {
  return {
    stages: Object.fromEntries(Object.entries(stages).map(([stage, record]) => [stage, {
      projectSymbolGraph: { scopeBindingRecords: [], scopeReferenceRecords: record ? [record] : [] },
      summary: { scopeReferenceRecords: record ? 1 : 0 }
    }])),
    summary: { stages: Object.keys(stages).length }
  };
}
