import { assert } from './helpers.mjs';
import { safeMergeJsTsProject } from '../../src/index.js';

const oracleProjectMissingProofEvidence = safeMergeJsTsProject({
  id: 'oracle_project_missing_proof_evidence_review',
  language: 'typescript',
  baseFiles: {
    'src/value.ts': 'export const value = 1;\n',
    'src/consumer.ts': "import { value } from './value.js';\nexport const current = value;\n"
  },
  workerFiles: {
    'src/value.ts': 'export const value = 1;\nexport const workerValue = value + 1;\n',
    'src/consumer.ts': "import { value } from './value.js';\nexport const current = value;\n"
  },
  headFiles: {
    'src/value.ts': 'export const value = 1;\n',
    'src/consumer.ts': "import { value } from './value.js';\nexport const current = value;\n"
  },
  testGates: { id: 'proof-policy', status: 'passed', command: 'node test/smoke/js-ts-safe-project-merge-admission-proof-policy.mjs' }
});

assert.equal(oracleProjectMissingProofEvidence.status, 'merged');
assert.equal(oracleProjectMissingProofEvidence.admission.semanticEquivalenceClaim, false);
assert.equal(oracleProjectMissingProofEvidence.admission.proofEvidenceStatus, 'review-evidence-missing');
assert.equal(oracleProjectMissingProofEvidence.confidence.recommendedAction, 'review');
assert.equal(oracleProjectMissingProofEvidence.confidence.missingSignals.includes('output-diagnostics-gate-not-run'), true);
assert.equal(oracleProjectMissingProofEvidence.confidence.missingSignals.includes('project-graph-evidence-not-included'), true);
assert.equal(oracleProjectMissingProofEvidence.confidence.missingSignals.includes('project-graph-delta-evidence-not-included'), true);
assert.equal(oracleProjectMissingProofEvidence.proofEvidence.summary.nextMissingEvidence.code, 'output-diagnostics-gate-not-run');
assert.equal(oracleProjectMissingProofEvidence.proofEvidence.summary.nextMissingEvidence.routeId, 'run-output-diagnostics');
assert.equal(oracleProjectMissingProofEvidence.confidence.nextMissingEvidence.code, 'output-diagnostics-gate-not-run');
assert.equal(oracleProjectMissingProofEvidence.confidence.nextMissingEvidence.proofLevel, 'diagnostics-clean');
assert.equal(oracleProjectMissingProofEvidence.confidence.nextMissingEvidence.routeNext, 'supply-output-diagnostics');
assert.equal(oracleProjectMissingProofEvidence.confidence.dimensions.diagnostics, 'missing');
assert.equal(oracleProjectMissingProofEvidence.confidence.dimensions.semanticEquivalence, 'unknown');
assert.equal(oracleProjectMissingProofEvidence.confidence.missingEvidenceMatrix.byRoute['run-output-diagnostics'], 1);
assert.equal(oracleProjectMissingProofEvidence.summary.nextMissingEvidenceCode, 'output-diagnostics-gate-not-run');
assert.equal(oracleProjectMissingProofEvidence.summary.nextMissingProofLevel, 'diagnostics-clean');
assert.equal(oracleProjectMissingProofEvidence.summary.nextMissingEvidenceRouteId, 'run-output-diagnostics');
assert.equal(oracleProjectMissingProofEvidence.summary.nextMissingEvidenceRouteLane, 'project-output');
assert.equal(oracleProjectMissingProofEvidence.summary.missingEvidenceMatrix.byRoute['run-output-diagnostics'], 1);
assert.equal(oracleProjectMissingProofEvidence.summary.admissionMatrixPartialRows > 0, true);
const matrixAudit = oracleProjectMissingProofEvidence.confidence.admissionMatrixAudit;
assert.equal(matrixAudit.kind, 'frontier.lang.jsTsProjectMergeAdmissionMatrixAudit');
assert.equal(matrixAudit.semanticEquivalenceClaim, false);
assert.equal(JSON.parse(JSON.stringify(matrixAudit)).missingRouteIds.includes('emit-output-declarations'), true);
const genericSemanticSurface = matrixSurface(matrixAudit, 'generic-semantic-edit-admission');
assert.equal(genericSemanticSurface.proofStatuses['semantic-edit-replay-clean'], 'passed');
assert.equal(genericSemanticSurface.routeIds.includes('produce-semantic-edit-replay-proof'), true);
assert.equal(genericSemanticSurface.missingRouteIds.includes('produce-semantic-edit-replay-proof'), false);
const scopeSurface = matrixSurface(matrixAudit, 'scope-use-def-graph');
assert.equal(scopeSurface.proofStatuses['project-graph-delta'], 'missing');
assert.equal(scopeSurface.missingRouteIds.includes('include-project-graph-delta'), true);
const typeSurface = matrixSurface(matrixAudit, 'type-public-api-graph');
assert.equal(typeSurface.proofStatuses['declaration-output-stable'], 'skipped');
assert.equal(typeSurface.routeIds.includes('emit-output-declarations'), true);
assert.equal(typeSurface.missingRouteIds.includes('emit-output-declarations'), true);
const semanticProofSurface = matrixSurface(matrixAudit, 'semantic-equivalence-proof');
assert.equal(semanticProofSurface.proofStatuses['semantic-equivalence-unknown'], 'unknown');
assert.equal(semanticProofSurface.missingRouteIds.includes('external-semantic-equivalence-proof'), true);
const unsupportedSurface = matrixSurface(matrixAudit, 'unsupported-js-ts-surface-coverage');
assert.equal(unsupportedSurface.status, 'partial');
assert.equal(unsupportedSurface.proofStatuses['unsupported-js-ts-surface-review'], 'unknown');
assert.equal(unsupportedSurface.missingRouteIds.includes('prove-unsupported-js-ts-surface'), true);
assert.equal(unsupportedSurface.nextMissingRouteId, 'prove-unsupported-js-ts-surface');
assert.equal(unsupportedSurface.semanticEquivalenceClaim, false);
const unsupportedSurfaceProof = oracleProjectMissingProofEvidence.proofEvidence.records.find((record) => record.level === 'unsupported-js-ts-surface-review');
assert.equal(unsupportedSurfaceProof.status, 'unknown');
assert.equal(unsupportedSurfaceProof.proofClaim, false);
assert.equal(unsupportedSurfaceProof.semanticEquivalenceClaim, false);
assert.equal(oracleProjectMissingProofEvidence.proofEvidence.summary.missingSignals.includes('unsupported-js-ts-surface-proof-not-available'), true);
const unsupportedSurfaceMetadataProject = safeMergeJsTsProject({
  id: 'oracle_project_unsupported_surface_metadata',
  language: 'typescript',
  baseFiles: {
    'src/surfaces.ts': [
      '@sealed',
      'export class Store {',
      '  accessor value = 1;',
      '  #secret = 2;',
      '  static { initialize(Store); }',
      '  load() {',
      '    using resource = acquire();',
      '    return this.value + this.#secret;',
      '  }',
      '}',
      'enum StoreMode { Ready = 1 }',
      'namespace StoreNamespace { export const mode = StoreMode.Ready; }',
      'declare module "ambient-store" { export const ambientValue: number; }',
      'declare global { interface Window { storeMode: StoreMode; } }',
      'export = StoreNamespace;',
      'export const moduleUrl = import.meta.url;',
      'const config = await loadConfig(import.meta.url);',
      'export function seal<const T>(input: T) { return input; }',
      'export async function* stream(source) { yield await source.next(); }',
      'export function* ids(source) { yield source.next(); }',
      'export const typedStore = { mode: "ready" } as const satisfies { readonly mode: string };',
      ''
    ].join('\n')
  },
  workerFiles: {
    'src/surfaces.ts': [
      '@sealed',
      'export class Store {',
      '  accessor value = 1;',
      '  #secret = 2;',
      '  static { initialize(Store); }',
      '  load() {',
      '    using resource = acquire();',
      '    return this.value + this.#secret;',
      '  }',
      '}',
      'enum StoreMode { Ready = 1 }',
      'namespace StoreNamespace { export const mode = StoreMode.Ready; }',
      'declare module "ambient-store" { export const ambientValue: number; }',
      'declare global { interface Window { storeMode: StoreMode; } }',
      'export = StoreNamespace;',
      'export const moduleUrl = import.meta.url;',
      'const config = await loadConfig(import.meta.url);',
      'export function seal<const T>(input: T) { return input; }',
      'export async function* stream(source) { yield await source.next(); }',
      'export function* ids(source) { yield source.next(); }',
      'export const typedStore = { mode: "ready" } as const satisfies { readonly mode: string };',
      ''
    ].join('\n')
  },
  headFiles: {
    'src/surfaces.ts': [
      '@sealed',
      'export class Store {',
      '  accessor value = 1;',
      '  #secret = 2;',
      '  static { initialize(Store); }',
      '  load() {',
      '    using resource = acquire();',
      '    return this.value + this.#secret;',
      '  }',
      '}',
      'enum StoreMode { Ready = 1 }',
      'namespace StoreNamespace { export const mode = StoreMode.Ready; }',
      'declare module "ambient-store" { export const ambientValue: number; }',
      'declare global { interface Window { storeMode: StoreMode; } }',
      'export = StoreNamespace;',
      'export const moduleUrl = import.meta.url;',
      'const config = await loadConfig(import.meta.url);',
      'export function seal<const T>(input: T) { return input; }',
      'export async function* stream(source) { yield await source.next(); }',
      'export function* ids(source) { yield source.next(); }',
      'export const typedStore = { mode: "ready" } as const satisfies { readonly mode: string };',
      ''
    ].join('\n')
  }
});
const unsupportedSurfaceMetadata = unsupportedSurfaceMetadataProject.proofEvidence.records.find((record) => record.level === 'unsupported-js-ts-surface-review')?.metadata;
const expectedUnsupportedSurfaceKinds = 'explicit-resource-management decorator accessor-field private-class-element class-static-block enum-declaration namespace-declaration ambient-module-declaration global-augmentation export-assignment import-meta-expression satisfies-expression as-const-assertion const-type-parameter async-generator-function generator-function top-level-await'.split(' ');
const expectedSurfaceFocusedEvidenceKinds = 'explicit-resource-management-acquisition-disposal-order-evidence typescript-decorator-static-metadata-evidence typescript-accessor-field-static-shape-evidence typescript-private-class-member-static-shape-evidence class-static-block-initialization-order-evidence typescript-enum-runtime-shape-evidence typescript-namespace-static-module-shape-evidence typescript-ambient-module-static-shape-evidence typescript-global-augmentation-static-shape-evidence typescript-export-assignment-static-module-shape-evidence import-meta-host-context-member-evidence typescript-satisfies-static-inference-syntax-evidence typescript-as-const-static-inference-syntax-evidence typescript-const-type-parameter-static-inference-syntax-evidence async-generator-await-yield-order-evidence generator-yield-order-evidence top-level-await-module-runtime-scope-evidence'.split(' ');
const expectedUnsupportedSurfaceProofGapCodes = 'resource-management-disposal-effect-equivalence-not-claimed decorator-execution-equivalence-not-claimed accessor-field-runtime-equivalence-not-claimed private-class-member-runtime-equivalence-not-claimed class-static-block-executable-runtime-equivalence-not-claimed enum-runtime-evaluation-equivalence-not-claimed namespace-runtime-evaluation-equivalence-not-claimed ambient-module-compatibility-equivalence-not-claimed global-augmentation-compatibility-equivalence-not-claimed export-assignment-runtime-interop-equivalence-not-claimed import-meta-host-context-equivalence-not-claimed satisfies-inference-semantics-equivalence-not-claimed as-const-inference-semantics-equivalence-not-claimed const-type-parameter-inference-semantics-equivalence-not-claimed async-generator-runtime-protocol-equivalence-not-claimed generator-runtime-protocol-equivalence-not-claimed top-level-await-executable-suspension-order-equivalence-not-claimed'.split(' ');
const classPrivateAccessorProofRouteId = 'prove-class-private-accessor-runtime-equivalence';
const classPrivateAccessorProofRouteLane = 'class-private-accessor-runtime-boundaries';
const expectedUnsupportedSurfaceProofGapRouteIds = ['prove-resource-management-disposal-effect-equivalence', 'prove-decorator-runtime-execution-equivalence', classPrivateAccessorProofRouteId, 'prove-global-augmentation-compatibility', 'prove-async-generator-runtime-protocol-equivalence', 'prove-generator-runtime-protocol-equivalence'];
const expectedUnsupportedSurfaceProofGapRouteLanes = ['control-flow-effect-graph-runtime-resource-management', 'decorator-runtime-boundaries', classPrivateAccessorProofRouteLane, 'module-runtime-global-augmentation', 'generator-runtime-boundaries'];
assert.equal(unsupportedSurfaceMetadata.surfaceEvidenceStatus, 'observed');
assert.deepEqual(unsupportedSurfaceMetadata.observedUnsupportedSurfaces, expectedUnsupportedSurfaceKinds);
assert.deepEqual(unsupportedSurfaceMetadata.surfaceFocusedEvidenceKinds, expectedSurfaceFocusedEvidenceKinds);
assert.deepEqual(unsupportedSurfaceMetadata.surfaceProofGapCodes, expectedUnsupportedSurfaceProofGapCodes);
assert.deepEqual(unsupportedSurfaceMetadata.surfaceProofGapRouteIds, expectedUnsupportedSurfaceProofGapRouteIds);
assert.deepEqual(unsupportedSurfaceMetadata.surfaceProofGapRouteLanes, expectedUnsupportedSurfaceProofGapRouteLanes);
assert.deepEqual(unsupportedSurfaceMetadata.surfaceReasonCodes, expectedUnsupportedSurfaceProofGapCodes);
assert.equal(unsupportedSurfaceMetadata.surfaceReasonCodes.some((reasonCode) => reasonCode.startsWith('partial-')), false);
assert.equal(unsupportedSurfaceMetadata.surfaceEvidenceCount >= expectedUnsupportedSurfaceKinds.length, true);
assert.equal(unsupportedSurfaceMetadataProject.proofEvidence.summary.unsupportedSurfaceEvidenceCount >= expectedUnsupportedSurfaceKinds.length, true);
assert.deepEqual(unsupportedSurfaceMetadataProject.proofEvidence.summary.unsupportedSurfaceKinds, expectedUnsupportedSurfaceKinds);
assert.deepEqual(unsupportedSurfaceMetadataProject.proofEvidence.summary.unsupportedSurfaceReasonCodes, expectedUnsupportedSurfaceProofGapCodes);
for (const record of unsupportedSurfaceMetadata.surfaceEvidence) {
  assert.equal(record.sourcePath, 'src/surfaces.ts');
  assert.equal(record.observedSurfaceKind, record.kind);
  assert.equal(record.boundedEvidence.status, 'bounded-evidence-available');
  assert.equal(typeof record.boundedEvidence.kind, 'string');
  assert.equal(typeof record.boundedEvidence.summary, 'string');
  assert.equal(record.remainingProofGap.status, 'not-claimed');
  assert.equal(record.remainingProofGap.code, record.reasonCode);
  assert.equal(record.remainingProofGap.semanticEquivalenceClaim, false);
  assert.equal(record.proofGapCode, record.remainingProofGap.code);
  assert.equal(typeof record.start, 'number');
  assert.equal(typeof record.end, 'number');
  assert.equal(record.end > record.start, true);
  assert.equal(typeof record.line, 'number');
  assert.equal(typeof record.column, 'number');
  assert.equal(typeof record.excerpt, 'string');
}
assert.equal(unsupportedSurfaceMetadata.surfaceEvidence.some((record) => (
  record.kind === 'decorator'
    && record.stage === 'base'
    && record.line === 1
    && record.column === 1
    && record.excerpt.startsWith('@sealed')
)), true);
assert.equal(unsupportedSurfaceMetadata.surfaceEvidence.some((record) => (
  record.kind === 'private-class-element'
    && record.excerpt.includes('#secret')
)), true);
assert.equal(surfaceEvidenceByKind('class-static-block').boundedEvidence.kind, 'class-static-block-initialization-order-evidence');
assert.equal(surfaceEvidenceByKind('class-static-block').remainingProofGap.code, 'class-static-block-executable-runtime-equivalence-not-claimed');
assert.equal(surfaceEvidenceByKind('explicit-resource-management').remainingProofGap.routeId, 'prove-resource-management-disposal-effect-equivalence');
assert.equal(surfaceEvidenceByKind('explicit-resource-management').remainingProofGap.routeLane, 'control-flow-effect-graph-runtime-resource-management');
assert.equal(surfaceEvidenceByKind('explicit-resource-management').remainingProofGap.failClosed, true);
assert.equal(surfaceEvidenceByKind('explicit-resource-management').remainingProofGap.blocksSemanticEquivalence, true);
assert.equal(surfaceEvidenceByKind('import-meta-expression').boundedEvidence.kind, 'import-meta-host-context-member-evidence');
assert.equal(surfaceEvidenceByKind('import-meta-expression').remainingProofGap.code, 'import-meta-host-context-equivalence-not-claimed');
assert.equal(surfaceEvidenceByKind('top-level-await').boundedEvidence.kind, 'top-level-await-module-runtime-scope-evidence');
assert.equal(surfaceEvidenceByKind('top-level-await').remainingProofGap.code, 'top-level-await-executable-suspension-order-equivalence-not-claimed');
assert.equal(surfaceEvidenceByKind('enum-declaration').boundedEvidence.kind, 'typescript-enum-runtime-shape-evidence');
assert.equal(surfaceEvidenceByKind('enum-declaration').remainingProofGap.code, 'enum-runtime-evaluation-equivalence-not-claimed');
assert.equal(surfaceEvidenceByKind('decorator').boundedEvidence.kind, 'typescript-decorator-static-metadata-evidence');
assert.equal(surfaceEvidenceByKind('decorator').remainingProofGap.code, 'decorator-execution-equivalence-not-claimed');
assert.equal(surfaceEvidenceByKind('decorator').remainingProofGap.routeId, 'prove-decorator-runtime-execution-equivalence');
assert.equal(surfaceEvidenceByKind('decorator').remainingProofGap.routeLane, 'decorator-runtime-boundaries');
assert.equal(surfaceEvidenceByKind('decorator').remainingProofGap.failClosed, true);
assert.equal(surfaceEvidenceByKind('decorator').remainingProofGap.blocksSemanticEquivalence, true);
for (const [kind, evidenceKind, code] of [
  ['accessor-field', 'typescript-accessor-field-static-shape-evidence', 'accessor-field-runtime-equivalence-not-claimed'],
  ['private-class-element', 'typescript-private-class-member-static-shape-evidence', 'private-class-member-runtime-equivalence-not-claimed']
]) {
  const proofGap = surfaceEvidenceByKind(kind).remainingProofGap;
  assert.equal(surfaceEvidenceByKind(kind).boundedEvidence.kind, evidenceKind);
  assert.equal(proofGap.code, code);
  assert.equal(proofGap.routeId, classPrivateAccessorProofRouteId);
  assert.equal(proofGap.routeLane, classPrivateAccessorProofRouteLane);
  assert.equal(proofGap.failClosed, true);
  assert.equal(proofGap.blocksSemanticEquivalence, true);
}
assert.equal(surfaceEvidenceByKind('satisfies-expression').boundedEvidence.kind, 'typescript-satisfies-static-inference-syntax-evidence');
assert.equal(surfaceEvidenceByKind('satisfies-expression').remainingProofGap.code, 'satisfies-inference-semantics-equivalence-not-claimed');
assert.equal(surfaceEvidenceByKind('as-const-assertion').boundedEvidence.kind, 'typescript-as-const-static-inference-syntax-evidence');
assert.equal(surfaceEvidenceByKind('as-const-assertion').remainingProofGap.code, 'as-const-inference-semantics-equivalence-not-claimed');
assert.equal(surfaceEvidenceByKind('const-type-parameter').boundedEvidence.kind, 'typescript-const-type-parameter-static-inference-syntax-evidence');
assert.equal(surfaceEvidenceByKind('const-type-parameter').remainingProofGap.code, 'const-type-parameter-inference-semantics-equivalence-not-claimed');
assert.equal(surfaceEvidenceByKind('async-generator-function').boundedEvidence.kind, 'async-generator-await-yield-order-evidence');
assert.equal(surfaceEvidenceByKind('async-generator-function').remainingProofGap.routeId, 'prove-async-generator-runtime-protocol-equivalence');
assert.equal(surfaceEvidenceByKind('generator-function').boundedEvidence.kind, 'generator-yield-order-evidence');
assert.equal(surfaceEvidenceByKind('generator-function').remainingProofGap.routeId, 'prove-generator-runtime-protocol-equivalence');
const unsupportedSurfaceMaskedTextProject = safeMergeJsTsProject({
  id: 'oracle_project_unsupported_surface_masked_text',
  language: 'typescript',
  baseFiles: {
    'src/text.ts': [
      'const text = "@sealed using resource = acquire() accessor value #secret static { enum Mode { namespace Foo { export = Foo as const satisfies Shape <const T>";',
      '// @sealed using resource = acquire() accessor value #secret static { enum Mode { namespace Foo { export = Foo as const satisfies Shape <const T>',
      '/* declare module "ambient" { export const value: number; } declare global { interface Window { value: string; } } */',
      'const template = `@sealed using resource = acquire() accessor value #secret static { enum Mode { namespace Foo { export = Foo as const satisfies Shape <const T> import.meta.url await load() declare global { }`;',
      'export const value = text + template;',
      ''
    ].join('\n')
  },
  workerFiles: {
    'src/text.ts': [
      'const text = "@sealed using resource = acquire() accessor value #secret static { enum Mode { namespace Foo { export = Foo as const satisfies Shape <const T>";',
      '// @sealed using resource = acquire() accessor value #secret static { enum Mode { namespace Foo { export = Foo as const satisfies Shape <const T>',
      '/* declare module "ambient" { export const value: number; } declare global { interface Window { value: string; } } */',
      'const template = `@sealed using resource = acquire() accessor value #secret static { enum Mode { namespace Foo { export = Foo as const satisfies Shape <const T> import.meta.url await load() declare global { }`;',
      'export const value = text + template;',
      ''
    ].join('\n')
  },
  headFiles: {
    'src/text.ts': [
      'const text = "@sealed using resource = acquire() accessor value #secret static { enum Mode { namespace Foo { export = Foo as const satisfies Shape <const T>";',
      '// @sealed using resource = acquire() accessor value #secret static { enum Mode { namespace Foo { export = Foo as const satisfies Shape <const T>',
      '/* declare module "ambient" { export const value: number; } declare global { interface Window { value: string; } } */',
      'const template = `@sealed using resource = acquire() accessor value #secret static { enum Mode { namespace Foo { export = Foo as const satisfies Shape <const T> import.meta.url await load() declare global { }`;',
      'export const value = text + template;',
      ''
    ].join('\n')
  }
});
const maskedUnsupportedSurfaceMetadata = unsupportedSurfaceMaskedTextProject.proofEvidence.records.find((record) => record.level === 'unsupported-js-ts-surface-review')?.metadata;
assert.equal(maskedUnsupportedSurfaceMetadata.surfaceEvidenceStatus, 'not-observed-by-lightweight-scan');
assert.deepEqual(maskedUnsupportedSurfaceMetadata.observedUnsupportedSurfaces, []);
assert.equal(unsupportedSurfaceMaskedTextProject.proofEvidence.summary.unsupportedSurfaceEvidenceCount, 0);
assert.equal(oracleProjectMissingProofEvidence.summary.proofSourceSpanRoundtripStatus, 'passed');
assert.equal(oracleProjectMissingProofEvidence.summary.proofSemanticEditReplayCleanStatus, 'passed');
assert.equal(oracleProjectMissingProofEvidence.summary.proofDiagnosticsStatus, 'skipped');
assert.equal(oracleProjectMissingProofEvidence.summary.proofDeclarationOutputStatus, 'skipped');
assert.equal(oracleProjectMissingProofEvidence.summary.proofFocusedTestStatus, 'passed');
assert.equal(oracleProjectMissingProofEvidence.summary.proofSemanticEquivalenceStatus, 'unknown');
assert.equal(oracleProjectMissingProofEvidence.summary.semanticEquivalenceClaim, false);
assert.equal(JSON.parse(JSON.stringify(oracleProjectMissingProofEvidence.confidence)).dimensions.proof, 'partial');
assert.equal(oracleProjectMissingProofEvidence.evidence.some((record) => (
  record.kind === 'js-ts-project-graph-evidence'
    && record.status === 'skipped'
    && record.metadata?.nextMissingEvidence?.code === 'project-graph-evidence-not-included'
)), true);

function matrixSurface(audit, surface) {
  const entry = audit.surfaces.find((candidate) => candidate.surface === surface);
  assert.ok(entry, `missing admission matrix surface ${surface}`);
  return entry;
}

function surfaceEvidenceByKind(kind) {
  const record = unsupportedSurfaceMetadata.surfaceEvidence.find((candidate) => candidate.kind === kind);
  assert.ok(record, `missing unsupported surface evidence for ${kind}`);
  return record;
}
