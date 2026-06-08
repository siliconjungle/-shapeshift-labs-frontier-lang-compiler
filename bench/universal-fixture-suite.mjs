import { performance } from 'node:perf_hooks';
import {
  createSemanticMergeCandidateAdmissionRecord,
  createUniversalCapabilityMatrix,
  createUniversalConversionArtifacts,
  createUniversalConversionPlan,
  diffNativeSources,
  importNativeSource,
  sortSemanticMergeCandidateAdmissionRecords,
  summarizeNativeImportLosses
} from '../dist/index.js';
import { createBenchMatrixAdapters } from './native-adapters.mjs';

const requiredFeatures = ['syntax', 'semantic', 'sourcePreservation'];
const targets = ['javascript', 'python', 'rust', 'c'];
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

export function measureUniversalFixtureSuite(adapters) {
  const start = performance.now();
  const imports = createImports();
  const targetAdapters = createTargetAdapters();
  const matrix = createUniversalCapabilityMatrix({
    generatedAt: 1201,
    imports,
    adapters: createBenchMatrixAdapters(adapters),
    targetAdapters,
    targets,
    requiredFeatures
  });
  const plan = createUniversalConversionPlan({
    generatedAt: 1202,
    imports,
    adapters: createBenchMatrixAdapters(adapters),
    targetAdapters,
    targets,
    requiredFeatures,
    evidence: [{
      id: 'bench_universal_fixture_replay',
      kind: 'conversion-replay-proof',
      status: 'passed'
    }]
  });
  const artifacts = createUniversalConversionArtifacts(plan, { generatedAt: 1203 });
  const lossSummaries = imports.map((imported) => summarizeNativeImportLosses(imported.losses, {
    evidence: imported.evidence,
    exactAst: imported.metadata?.nativeImportLossSummary?.exactAst
  }));
  const candidateRecords = sortSemanticMergeCandidateAdmissionRecords(createCandidateRecords());
  const routeScores = plan.routes.map((route) => route.mergeScore.value);
  return {
    imports: imports.length,
    languages: matrix.summary.languages,
    routes: plan.routes.length,
    targetAdapterRoutes: plan.summary.targetAdapterRoutes,
    semanticIndexOnlyRoutes: plan.summary.semanticIndexOnlyRoutes,
    routeScoreMin: Math.min(...routeScores),
    routeScoreMax: Math.max(...routeScores),
    lossSummaries: lossSummaries.length,
    lossCategories: lossSummaries.reduce((sum, summary) => sum + summary.categories.length, 0),
    candidateRecords: candidateRecords.length,
    bestCandidateSortKey: candidateRecords[0]?.readinessSortKey ?? 0,
    artifactAdmissionRecords: artifacts.summary.admissionRecords,
    durationMs: performance.now() - start
  };
}

function createImports() {
  return [{
    language: 'javascript',
    sourcePath: 'src/bench-universal.js',
    sourceText: 'export function benchUniversal(value) { return value + 1; }\n'
  }, {
    language: 'python',
    sourcePath: 'bench_universal.py',
    sourceText: 'def bench_universal(value):\n    return value + 1\n'
  }, {
    language: 'rust',
    sourcePath: 'src/bench_universal.rs',
    sourceText: 'pub fn bench_universal(value: i32) -> i32 { value + 1 }\nmacro_rules! bench_universal_macro { () => {} }\n'
  }, {
    language: 'c',
    sourcePath: 'bench_universal.h',
    sourceText: '#define BENCH_UNIVERSAL 1\ntypedef struct BenchUniversal { int value; } BenchUniversal;\nint bench_universal(void);\n'
  }, {
    language: 'go',
    sourcePath: 'bench_universal.go',
    sourceText: 'package bench\nfunc BenchUniversal(value int) int { return value + 1 }\n'
  }, {
    language: 'swift',
    sourcePath: 'BenchUniversal.swift',
    sourceText: 'struct BenchUniversal { var value: Int }\nfunc benchUniversal(_ value: Int) -> Int { value + 1 }\n'
  }, {
    language: 'r',
    sourcePath: 'bench_universal.R',
    sourceText: 'bench_universal <- function(value) { value + 1 }\neval(parse(text = "generated <- TRUE"))\n'
  }].map((fixture) => importNativeSource(fixture));
}

function createTargetAdapters() {
  return [{
    id: 'bench-js-to-rust-universal-fixture',
    sourceLanguage: 'javascript',
    target: 'rust',
    coverage: { readiness: 'ready', handledLossKinds: handledHighRiskLossKinds },
    project() {
      return { output: 'pub fn bench_js_to_rust() {}\n', readiness: 'ready' };
    }
  }, {
    id: 'bench-python-to-rust-universal-fixture',
    sourceLanguage: 'python',
    target: 'rust',
    coverage: { readiness: 'ready', handledLossKinds: handledHighRiskLossKinds },
    project() {
      return { output: 'pub fn bench_python_to_rust() {}\n', readiness: 'ready' };
    }
  }, {
    id: 'bench-c-to-rust-universal-fixture',
    sourceLanguage: 'c',
    target: 'rust',
    coverage: { readiness: 'ready', handledLossKinds: handledHighRiskLossKinds },
    project() {
      return { output: 'pub fn bench_c_to_rust() {}\n', readiness: 'ready' };
    }
  }];
}

function createCandidateRecords() {
  return [{
    language: 'javascript',
    sourcePath: 'src/bench-candidate.js',
    beforeSourceText: 'export function benchCandidate(value) { return value + 1; }\n',
    afterSourceText: 'export function benchCandidate(value) { return value + 2; }\n',
    readiness: 'ready'
  }, {
    language: 'python',
    sourcePath: 'bench_candidate.py',
    beforeSourceText: 'def bench_candidate(value):\n    return value + 1\n',
    afterSourceText: 'def bench_candidate(value):\n    return value + 2\n',
    readiness: 'ready-with-losses'
  }, {
    language: 'rust',
    sourcePath: 'src/bench_candidate.rs',
    beforeSourceText: 'pub fn bench_candidate(value: i32) -> i32 { value + 1 }\n',
    afterSourceText: 'pub fn bench_candidate(value: i32) -> i32 { value + 2 }\n',
    readiness: 'needs-review'
  }, {
    language: 'c',
    sourcePath: 'bench_candidate.c',
    beforeSourceText: 'int bench_candidate(int value) { return value + 1; }\n',
    afterSourceText: 'int bench_candidate(int value) { return value + 2; }\n',
    readiness: 'blocked'
  }].map((spec, index) => createSemanticMergeCandidateAdmissionRecord(diffNativeSources({
    id: `bench_candidate_change_${index}`,
    language: spec.language,
    sourcePath: spec.sourcePath,
    beforeSourceText: spec.beforeSourceText,
    afterSourceText: spec.afterSourceText,
    evidenceId: `bench_candidate_evidence_${index}`,
    patchId: `bench_candidate_patch_${index}`,
    mergeCandidateId: `bench_candidate_${index}`
  }), {
    readiness: spec.readiness,
    evidence: [{
      id: `bench_candidate_verification_${index}`,
      kind: 'candidate-verification-proof',
      status: 'passed'
    }]
  }));
}
