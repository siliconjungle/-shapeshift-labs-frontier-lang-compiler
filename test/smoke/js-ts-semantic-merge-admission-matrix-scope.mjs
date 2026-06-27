import { assert } from './helpers.mjs';

const semanticMergeScopeMatrixCells = [
  {
    id: 'scope-use-def-graph/static-template-computed-member-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-scope-use-def-computed-namespace + js-ts-safe-project-merge-scope-use-def-receiver-members',
    note: 'namespace imports and this/super receiver computed member reads normalize no-expression template literals as static member evidence while expression templates stay blocked'
  },
  {
    id: 'scope-use-def-graph/tagged-template-interpolation-site-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-scope-use-def-template-literal',
    note: 'template interpolation references distinguish plain templates from tagged templates and carry static tag path/root/member evidence into public owner use hashes'
  },
  {
    id: 'scope-use-def-graph/destructured-rest-parameter-binding-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-scope-use-def-parameters',
    note: 'function and arrow parameter lists collect object, nested object, array, alias, default-initializer, and rest parameter bindings without treating property keys as parameter bindings'
  },
  {
    id: 'scope-use-def-graph/receiver-computed-literal-kind-delta-evidence',
    status: 'done',
    evidence: 'js-ts-safe-project-merge-scope-use-def-receiver-members',
    note: 'receiver member reference delta conflicts preserve receiver kind and computed member literal kind so same-name string and static-template receiver reads remain review routed'
  }
];

assert.equal(semanticMergeScopeMatrixCells.every((cell) => cell.status === 'done'), true);
for (const cell of semanticMergeScopeMatrixCells) {
  assert.match(cell.id, /^[a-z0-9-]+\/[a-z0-9-]+(?:-[a-z0-9]+)*$/);
  assert.equal(['done', 'missing'].includes(cell.status), true, `${cell.id}: matrix status`);
  assert.equal(typeof cell.evidence, 'string', `${cell.id}: evidence`);
  assert.equal(typeof cell.note, 'string', `${cell.id}: note`);
}
