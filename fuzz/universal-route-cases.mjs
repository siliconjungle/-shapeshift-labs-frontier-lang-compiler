import assert from 'node:assert/strict';
import {
  createSemanticMergeCandidateAdmissionRecord,
  createUniversalCapabilityMatrix,
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  diffNativeSources,
  importNativeSource,
  querySemanticMergeCandidateAdmissionOverlaps,
  queryUniversalConversionPlan,
  runNativeImporterAdapter,
  sortSemanticMergeCandidateAdmissionRecords,
  summarizeNativeImportLosses
} from '../dist/index.js';
import {
  createClangAstImportCase,
  createEstreeImportCase,
  createGoAstImportCase,
  createJavaAstImportCase,
  createPythonAstImportCase,
  createRustSynImportCase
} from './adapter-fixtures.mjs';
import {
  createCSharpRoslynImportCase,
  createKotlinPsiImportCase,
  createSwiftSyntaxImportCase
} from './adapter-fixtures-extra.mjs';
import { allFuzzNativeAdapters } from './native-adapters.mjs';

const requiredFeatures = ['syntax', 'semantic', 'sourcePreservation'];
const routeTargets = ['javascript', 'python', 'rust', 'c'];
const handledHighRiskLossKinds = [
  'conditionalCompilation',
  'dynamicDispatch',
  'dynamicRuntime',
  'generatedCode',
  'macroExpansion',
  'macroHygiene',
  'metaprogramming',
  'overloadResolution',
  'preprocessor',
  'reflection',
  'typeInference',
  'unsupportedSemantic',
  'unsupportedSyntax'
];

export async function runUniversalRouteCases(adapters) {
  const adapterImports = await collectAdapterImports(adapters);
  const scannerImports = createScannerImports();
  const imports = [...adapterImports, ...scannerImports];
  const adapterList = allFuzzNativeAdapters(adapters);
  const targetAdapters = createTargetAdapters();

  const lossSummaries = imports.map((imported) => summarizeNativeImportLosses(imported.losses, {
    evidence: imported.evidence,
    exactAst: imported.metadata?.nativeImportLossSummary?.exactAst
  }));
  assert.ok(lossSummaries.some((summary) => summary.semanticMergeReadiness === 'ready'));
  assert.ok(lossSummaries.some((summary) => (summary.byKind.preprocessor ?? 0) > 0));
  assert.ok(lossSummaries.some((summary) => (summary.byKind.dynamicRuntime ?? 0) > 0));

  const matrix = createUniversalCapabilityMatrix({
    generatedAt: 901,
    imports,
    adapters: adapterList,
    targetAdapters,
    targets: routeTargets,
    requiredFeatures
  });
  assert.equal(matrix.kind, 'frontier.lang.universalCapabilityMatrix');
  assert.equal(matrix.summary.imports, imports.length);
  assert.equal(matrix.metadata.compileTargets.length, routeTargets.length);
  for (const language of ['javascript', 'python', 'rust', 'c', 'go', 'java', 'kotlin', 'csharp', 'swift', 'r']) {
    const row = matrix.languages.find((entry) => entry.language === language);
    assert.ok(row, `missing universal matrix row for ${language}`);
    assert.ok(row.imports.total >= 1, `missing import coverage for ${language}`);
  }

  const plan = createUniversalConversionPlan({
    generatedAt: 902,
    imports,
    adapters: adapterList,
    targetAdapters,
    targets: routeTargets,
    requiredFeatures,
    evidence: [{
      id: 'fuzz_universal_conversion_replay',
      kind: 'conversion-replay-proof',
      status: 'passed'
    }]
  });
  assert.equal(plan.kind, 'frontier.lang.universalConversionPlan');
  assert.equal(plan.summary.routes, matrix.summary.languages * routeTargets.length);
  assert.equal(plan.summary.autoMergeClaims, 0);
  assert.equal(plan.summary.semanticEquivalenceClaims, 0);

  const jsToRust = bestRoute(plan, 'javascript', 'rust');
  const pythonToRust = bestRoute(plan, 'python', 'rust');
  const cToRust = bestRoute(plan, 'c', 'rust');
  const rToRust = bestRoute(plan, 'r', 'rust');
  assert.equal(jsToRust.mode, 'target-adapter');
  assert.equal(pythonToRust.mode, 'target-adapter');
  assert.equal(cToRust.mode, 'target-adapter');
  assert.equal(rToRust.mode, 'semantic-index-only');
  assert.equal(rToRust.admissionAction, 'reject');
  assert.equal(Boolean(cToRust.adapter), true);
  assert.ok(jsToRust.mergeScore.sortKey > rToRust.mergeScore.sortKey);
  assert.ok(cToRust.mergeScore.sortKey > rToRust.mergeScore.sortKey);
  assert.equal(plan.routes.every((route) => route.autoMergeClaim === false), true);
  assert.ok(plan.routes.every((route) => route.mergeScore.schema === 'frontier.lang.semanticMergeScore.v1'));

  const artifacts = createUniversalConversionArtifacts(plan, { generatedAt: 903 });
  assert.equal(artifacts.summary.routes, plan.routes.length);
  assert.equal(artifacts.summary.admissionRecords, plan.routes.length);
  assert.equal(artifacts.summary.autoMergeClaims, 0);
  assert.ok(artifacts.summary.reasonCodes >= artifacts.summary.routes);

  assertSemanticCandidateScoring();
}

async function collectAdapterImports(adapters) {
  return [
    await runNativeImporterAdapter(adapters.estreeAdapter, withoutName(createEstreeImportCase(910))),
    await runNativeImporterAdapter(adapters.pythonAstAdapter, createPythonAstImportCase(911)),
    await runNativeImporterAdapter(adapters.rustSynAdapter, createRustSynImportCase(912)),
    await runNativeImporterAdapter(adapters.clangAstAdapter, createClangAstImportCase(913)),
    await runNativeImporterAdapter(adapters.goAstAdapter, createGoAstImportCase(914)),
    await runNativeImporterAdapter(adapters.javaAstAdapter, createJavaAstImportCase(915)),
    await runNativeImporterAdapter(adapters.kotlinPsiAdapter, createKotlinPsiImportCase(916)),
    await runNativeImporterAdapter(adapters.csharpRoslynAdapter, createCSharpRoslynImportCase(917)),
    await runNativeImporterAdapter(adapters.swiftSyntaxAdapter, createSwiftSyntaxImportCase(918))
  ];
}

function createScannerImports() {
  return [{
    language: 'javascript',
    sourcePath: 'src/universal-scan.js',
    sourceText: 'export function scannedRoute(value) { return value ? "on" : "off"; }\n'
  }, {
    language: 'python',
    sourcePath: 'universal_scan.py',
    sourceText: 'def scanned_route(value):\n    return "on" if value else "off"\n'
  }, {
    language: 'rust',
    sourcePath: 'src/universal_scan.rs',
    sourceText: 'pub fn scanned_route(value: bool) -> bool { value }\nmacro_rules! fuzz_route { () => {} }\n'
  }, {
    language: 'c',
    sourcePath: 'universal_scan.h',
    sourceText: '#define FUZZ_ROUTE 1\ntypedef struct FuzzRoute { int value; } FuzzRoute;\nint scanned_route(void);\n'
  }, {
    language: 'r',
    sourcePath: 'universal_scan.R',
    sourceText: 'scanned_route <- function(value) { value }\neval(parse(text = "generated <- TRUE"))\n'
  }, {
    language: 'zig',
    sourcePath: 'src/universal_scan.zig',
    sourceText: 'pub const FuzzRoute = struct { value: bool };\npub fn scannedRoute(value: bool) bool { return value; }\ncomptime { @compileError("generated"); }\n'
  }].map((fixture) => importNativeSource(fixture));
}

function createTargetAdapters() {
  return [{
    id: 'fuzz-js-to-rust-universal-route',
    sourceLanguage: 'javascript',
    target: 'rust',
    coverage: { readiness: 'ready', handledLossKinds: handledHighRiskLossKinds },
    project() {
      return { output: 'pub fn fuzz_js_to_rust() {}\n', readiness: 'ready' };
    }
  }, {
    id: 'fuzz-python-to-rust-universal-route',
    sourceLanguage: 'python',
    target: 'rust',
    coverage: { readiness: 'ready', handledLossKinds: handledHighRiskLossKinds },
    project() {
      return { output: 'pub fn fuzz_python_to_rust() {}\n', readiness: 'ready' };
    }
  }, {
    id: 'fuzz-c-to-rust-universal-route',
    sourceLanguage: 'c',
    target: 'rust',
    coverage: { readiness: 'ready', handledLossKinds: handledHighRiskLossKinds },
    project() {
      return { output: 'pub fn fuzz_c_to_rust() {}\n', readiness: 'ready' };
    }
  }];
}

function assertSemanticCandidateScoring() {
  const specs = [{
    language: 'javascript',
    sourcePath: 'src/candidate-score.js',
    beforeSourceText: 'export function candidateScore(value) { return value + 1; }\n',
    afterSourceText: 'export function candidateScore(value) { return value + 2; }\n',
    readiness: 'ready'
  }, {
    language: 'python',
    sourcePath: 'candidate_score.py',
    beforeSourceText: 'def candidate_score(value):\n    return value + 1\n',
    afterSourceText: 'def candidate_score(value):\n    return value + 2\n',
    readiness: 'ready-with-losses'
  }, {
    language: 'rust',
    sourcePath: 'src/candidate_score.rs',
    beforeSourceText: 'pub fn candidate_score(value: i32) -> i32 { value + 1 }\n',
    afterSourceText: 'pub fn candidate_score(value: i32) -> i32 { value + 2 }\n',
    readiness: 'needs-review'
  }, {
    language: 'c',
    sourcePath: 'candidate_score.c',
    beforeSourceText: 'int candidate_score(int value) { return value + 1; }\n',
    afterSourceText: 'int candidate_score(int value) { return value + 2; }\n',
    readiness: 'blocked'
  }];
  const records = specs.map((spec, index) => {
    const changeSet = diffNativeSources({
      id: `fuzz_candidate_change_${index}`,
      language: spec.language,
      sourcePath: spec.sourcePath,
      beforeSourceText: spec.beforeSourceText,
      afterSourceText: spec.afterSourceText,
      evidenceId: `fuzz_candidate_evidence_${index}`,
      patchId: `fuzz_candidate_patch_${index}`,
      mergeCandidateId: `fuzz_candidate_${index}`
    });
    assert.ok(changeSet.changedRegions.length >= 1);
    const record = createSemanticMergeCandidateAdmissionRecord(changeSet, {
      readiness: spec.readiness,
      evidence: [{
        id: `fuzz_candidate_verification_${index}`,
        kind: 'candidate-verification-proof',
        status: 'passed'
      }]
    });
    assert.equal(record.language, spec.language);
    assert.equal(typeof record.readinessSortKey, 'number');
    assert.ok(record.changedSemanticRegions.length >= 1);
    return record;
  });
  const sorted = sortSemanticMergeCandidateAdmissionRecords(records);
  assert.deepEqual(sorted.map((record) => record.readiness), ['ready', 'ready-with-losses', 'needs-review', 'blocked']);
  assert.ok(sorted[0].readinessSortKey > sorted[sorted.length - 1].readinessSortKey);
  assert.equal(new Set(records.map((record) => record.language)).size, 4);
  assert.equal(querySemanticMergeCandidateAdmissionOverlaps(records).length, 0);
}

function bestRoute(plan, sourceLanguage, target) {
  const query = queryUniversalConversionPlan(plan, { sourceLanguage, target });
  assert.equal(query.found, true, `missing route ${sourceLanguage} -> ${target}`);
  assert.ok(query.bestRoute, `missing best route ${sourceLanguage} -> ${target}`);
  return query.bestRoute;
}

function withoutName(importCase) {
  const { name: _name, ...rest } = importCase;
  return rest;
}
