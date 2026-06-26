import assert from 'node:assert/strict';
import { runAdapterImportCases } from './adapter-import-cases.mjs';
import { runCoreFuzzCases } from './core-cases.mjs';
import { runExternalSemanticCases } from './external-semantic-cases.mjs';
import { runJsTsSemanticMergeFuzzCases } from './js-ts-semantic-merge-cases.mjs';
import { createFuzzNativeAdapters } from './native-adapters.mjs';
import { runProjectMatrixCases } from './project-matrix-cases.mjs';
import { runRegionAndSliceCases } from './region-slice-cases.mjs';
import { runUniversalRouteCases } from './universal-route-cases.mjs';

runCoreFuzzCases();
runExternalSemanticCases();
const jsTsSemanticMergeSummary = runJsTsSemanticMergeFuzzCases();
assert.equal(jsTsSemanticMergeSummary.realisticPatterns, 4, 'JS/TS realistic-pattern fuzz cases');
assert.equal(jsTsSemanticMergeSummary.realisticMatrixRows >= 4, true, 'JS/TS realistic-pattern matrix rows');
runRegionAndSliceCases();

const adapters = createFuzzNativeAdapters();
await runAdapterImportCases(adapters);
await runProjectMatrixCases(adapters);
await runUniversalRouteCases(adapters);
