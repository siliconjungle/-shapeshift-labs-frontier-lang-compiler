import { runAdapterImportCases } from './adapter-import-cases.mjs';
import { runCoreFuzzCases } from './core-cases.mjs';
import { runExternalSemanticCases } from './external-semantic-cases.mjs';
import { createFuzzNativeAdapters } from './native-adapters.mjs';
import { runProjectMatrixCases } from './project-matrix-cases.mjs';
import { runRegionAndSliceCases } from './region-slice-cases.mjs';

runCoreFuzzCases();
runExternalSemanticCases();
runRegionAndSliceCases();

const adapters = createFuzzNativeAdapters();
await runAdapterImportCases(adapters);
await runProjectMatrixCases(adapters);
