import { assert } from './helpers.mjs';
import {
  createSemanticImportSidecar,
  importNativeSource
} from './compiler-api.mjs';

const imported = importNativeSource({
  language: 'typescript',
  sourcePath: 'src/optional-dependency-calls.ts',
  sourceText: 'export const api = { load() { return true; } };\nexport function maybeRun() { return true; }\nexport function makeRunner() { return () => true; }\nexport async function auditCalls() {\n  await maybeRun();\n  void api?.load;\n  api?.load();\n  maybeRun?.();\n  makeRunner()();\n}\n'
});
const symbolsById = new Map(imported.semanticIndex.symbols.map((symbol) => [symbol.id, symbol]));
const auditSymbol = imported.semanticIndex.symbols.find((symbol) => symbol.name === 'auditCalls');
const auditRelations = imported.semanticIndex.relations.filter((relation) => relation.sourceId === auditSymbol.id);
assertHasRelation('calls', 'maybeRun', 5);
assertHasRelation('uses', 'api', 6);
assertHasRelation('calls', 'api', 7);
assertHasRelation('calls', 'maybeRun', 8);
assertHasRelation('calls', 'makeRunner', 9);
assert.equal(imported.semanticIndex.facts.some((fact) => fact.subjectId === auditSymbol.id
  && fact.predicate === 'effect'
  && fact.value.kind === 'async'
  && fact.value.line === 5), true);
const sidecar = createSemanticImportSidecar(imported);
const optionalCalls = auditRelations.filter((relation) => relation.predicate === 'calls');
assert.equal(sidecar.dependencies.calls >= optionalCalls.length, true);

function assertHasRelation(predicate, targetName, startLine) {
  assert.equal(auditRelations.some((relation) => relation.predicate === predicate
    && symbolsById.get(relation.targetId)?.name === targetName
    && relation.metadata.sourceSpan.startLine === startLine), true);
}
