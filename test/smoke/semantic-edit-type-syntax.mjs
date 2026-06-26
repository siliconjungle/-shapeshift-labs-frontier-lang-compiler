import { assert } from './helpers.mjs';
import { createSemanticEditScript } from './compiler-api.mjs';

const typeSyntaxHeadEdit = (source) => source.replace('export const keep = 1;', 'export const keep = 2;');

function assertTypeSyntaxBlocked(id, baseSourceText, workerSourceText, expectedReasonCode) {
  const script = createSemanticEditScript({
    id,
    language: 'typescript',
    sourcePath: `src/oracles/${id}.ts`,
    baseSourceText,
    workerSourceText,
    headSourceText: typeSyntaxHeadEdit(baseSourceText)
  });
  assert.equal(script.admission.status, 'blocked');
  assert.equal(script.admission.reasonCodes.includes(expectedReasonCode), true);
  assert.equal(script.admission.reasonCodes.includes('type-syntax-edit-requires-typechecker-or-declaration-evidence'), true);
  assert.equal(script.admission.semanticEquivalenceClaim, false);
  return script;
}

const genericConstraintBase = [
  'export function read<T extends { id: string }>(value: T): string {',
  '  return value.id;',
  '}',
  'export const keep = 1;',
  ''
].join('\n');
assertTypeSyntaxBlocked(
  'oracle_type_syntax_generic_constraint_blocked',
  genericConstraintBase,
  genericConstraintBase
    .replace('T extends { id: string }', 'T extends { id: string; slug: string }')
    .replace('value.id', 'value.slug'),
  'generic-constraint-edit-requires-typechecker-evidence'
);

const conditionalTypeBase = 'export type Box<T> = T extends string ? { s: T } : { n: T };\nexport const keep = 1;\n';
assertTypeSyntaxBlocked(
  'oracle_type_syntax_conditional_type_blocked',
  conditionalTypeBase,
  conditionalTypeBase.replace('{ s: T }', '{ value: T }'),
  'conditional-type-edit-requires-declaration-evidence'
);

const satisfiesBase = 'type Shape = { id: string };\nexport const config = { id: "a" } satisfies Shape;\nexport const keep = 1;\n';
assertTypeSyntaxBlocked(
  'oracle_type_syntax_satisfies_blocked',
  satisfiesBase,
  satisfiesBase.replace('id: "a"', 'id: 1'),
  'satisfies-expression-edit-requires-typechecker-evidence'
);

const asConstBase = 'export const palette = { tone: "blue" } as const;\nexport const keep = 1;\n';
assertTypeSyntaxBlocked(
  'oracle_type_syntax_as_const_blocked',
  asConstBase,
  asConstBase.replace('"blue"', '"red"'),
  'as-const-assertion-edit-requires-declaration-evidence'
);

const assertionBase = 'declare const raw: unknown;\nexport const amount = raw as number;\nexport const keep = 1;\n';
assertTypeSyntaxBlocked(
  'oracle_type_syntax_assertion_blocked',
  assertionBase,
  assertionBase.replace('raw as number', 'raw as string'),
  'type-assertion-edit-requires-typechecker-evidence'
);

const constTypeParameterBase = 'export function tuple<const T extends readonly string[]>(value: T): T { return value; }\nexport const keep = 1;\n';
assertTypeSyntaxBlocked(
  'oracle_type_syntax_const_type_parameter_blocked',
  constTypeParameterBase,
  constTypeParameterBase.replace('readonly string[]', 'readonly (string | number)[]'),
  'const-type-parameter-edit-requires-declaration-evidence'
);

const evidenceBacked = createSemanticEditScript({
  id: 'oracle_type_syntax_declaration_evidence_backed',
  language: 'typescript',
  sourcePath: 'src/oracles/type-syntax-evidence.ts',
  baseSourceText: genericConstraintBase,
  workerSourceText: genericConstraintBase
    .replace('T extends { id: string }', 'T extends { id: string; slug: string }')
    .replace('value.id', 'value.slug'),
  headSourceText: typeSyntaxHeadEdit(genericConstraintBase),
  typeSyntaxEvidence: [{
    id: 'oracle_type_syntax_declaration_output_evidence',
    kind: 'js-ts-project-declaration-output',
    status: 'passed'
  }]
});
assert.equal(evidenceBacked.admission.status, 'auto-merge-candidate');
assert.equal(evidenceBacked.admission.reasonCodes.includes('type-syntax-edit-backed-by-typechecker-or-declaration-evidence'), true);
assert.equal(evidenceBacked.admission.evidenceIds.includes('oracle_type_syntax_declaration_output_evidence'), true);
