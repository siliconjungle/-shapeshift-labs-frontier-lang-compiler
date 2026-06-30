import { createUniversalConversionPlan, createUniversalConversionRouteEvidenceReceipt, importNativeSource, queryUniversalConversionPlan } from '../src/index.js';
import type { UniversalConversionRouteEvidenceReceipt } from '../src/index.js';

const receiptImport = importNativeSource({
  language: 'javascript',
  sourcePath: 'src/receipt.js',
  sourceText: 'export const receipt = true;\n'
});
const receiptPlan = createUniversalConversionPlan({
  imports: [receiptImport],
  targets: ['javascript']
});
const receiptRoute = queryUniversalConversionPlan(receiptPlan, { sourceLanguage: 'javascript', target: 'javascript' }).bestRoute;
const receipt: UniversalConversionRouteEvidenceReceipt = createUniversalConversionRouteEvidenceReceipt(receiptPlan, {
  routeId: receiptRoute?.id,
  evidence: [
    { id: 'receipt_type_route_proof', kind: 'conversion-replay-proof', status: 'passed', routeId: receiptRoute?.id, sourceLanguage: 'javascript', target: 'javascript' },
    { id: 'receipt_type_unscoped_proof', kind: 'conversion-replay-proof', status: 'passed' }
  ]
});

receipt.summary.boundEvidence satisfies number;
receipt.records.rejected[0]?.reason satisfies string | undefined;
receipt.records.bound[0]?.proof satisfies boolean | undefined;
receipt.autoMergeClaim satisfies false;
