import { createUniversalConversionArtifacts, createUniversalConversionPlan, createUniversalConversionRouteEvidenceReceipt, createUniversalConversionWorklist, importNativeSource, queryUniversalConversionArtifacts, queryUniversalConversionPlan, queryUniversalConversionWorklist } from '../src/index.js';
import type { UniversalConversionArtifacts, UniversalConversionRouteArtifact, UniversalConversionRouteEvidenceReceipt, UniversalConversionWorklist } from '../src/index.js';

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
receipt.id satisfies string;
receipt.records.rejected[0]?.reason satisfies string | undefined;
receipt.records.bound[0]?.proof satisfies boolean | undefined;
receipt.records.interlinguaObligations[0]?.missingEvidence satisfies readonly string[] | undefined;
receipt.interlinguaRecordId satisfies string | undefined;
receipt.interlinguaConstraintFamilies satisfies readonly string[];
receipt.interlinguaConstraintActions satisfies readonly string[];
receipt.interlinguaConstraintRequiredKinds satisfies readonly string[];
receipt.interlinguaConstraintObligationMissingEvidence satisfies readonly string[];
receipt.summary.interlinguaConstraintActions satisfies Readonly<Record<string, number>>;
receipt.summary.interlinguaConstraintObligationMissingEvidence satisfies Readonly<Record<string, number>>;
receipt.autoMergeClaim satisfies false;
receipt.semanticEquivalenceClaim satisfies false;
receipt.summary.autoMergeClaims satisfies 0;
receipt.summary.semanticEquivalenceClaims satisfies 0;
receipt.records.bound[0]?.semanticEquivalenceClaim satisfies false | undefined;
receipt.records.rejected[0]?.autoMergeClaim satisfies false | undefined;
receipt.records.interlinguaObligations[0]?.autoMergeClaim satisfies false | undefined;
receipt.records.interlinguaObligations[0]?.semanticEquivalenceClaim satisfies false | undefined;

const receiptArtifacts: UniversalConversionArtifacts = createUniversalConversionArtifacts(receiptPlan, {
  evidence: [
    { id: 'receipt_type_route_proof', kind: 'conversion-replay-proof', status: 'passed', routeId: receiptRoute?.id, sourceLanguage: 'javascript', target: 'javascript' },
    { id: 'receipt_type_unscoped_proof', kind: 'conversion-replay-proof', status: 'passed' }
  ]
});
const receiptArtifact: UniversalConversionRouteArtifact | undefined = queryUniversalConversionArtifacts(receiptArtifacts, {
  evidenceReceiptRejectedReason: 'unscoped-evidence',
  evidenceReceiptInterlinguaConstraintObligationMissingEvidence: 'translation-adt-pattern:exhaustiveness',
  admissionRecordInterlinguaConstraintObligationMissingEvidence: 'translation-adt-pattern:exhaustiveness'
})[0];
receiptArtifacts.evidenceReceipts[0]?.id satisfies string | undefined;
receiptArtifacts.index.evidenceReceiptInterlinguaConstraintObligationMissingEvidence satisfies readonly string[];
receiptArtifacts.index.evidenceReceiptInterlinguaConstraintRequiredKinds satisfies readonly string[];
receiptArtifacts.index.admissionRecordInterlinguaConstraintObligationMissingEvidence satisfies readonly string[];
receiptArtifacts.summary.evidenceReceipts satisfies number;
receiptArtifacts.summary.receiptProofEvidence satisfies number;
receiptArtifacts.summary.compactCounts.evidenceReceipts.missingEvidence satisfies Readonly<Record<string, number>>;
receiptArtifacts.summary.compactCounts.evidenceReceipts.interlinguaConstraintObligationMissingEvidence satisfies Readonly<Record<string, number>>;
receiptArtifacts.summary.compactCounts.evidenceReceipts.interlinguaConstraintRequiredKinds satisfies Readonly<Record<string, number>>;
receiptArtifacts.summary.compactCounts.admissionRecordInterlingua.constraintObligationMissingEvidence satisfies Readonly<Record<string, number>>;
receiptArtifacts.summary.compactCounts.admissionRecordInterlingua.constraintRequiredKinds satisfies Readonly<Record<string, number>>;
receiptArtifacts.admissionRecords[0]?.interlinguaConstraintObligationMissingEvidence satisfies readonly string[] | undefined;
receiptArtifacts.admissionRecords[0]?.interlingua.constraintObligationMissingEvidence satisfies readonly string[] | undefined;
receiptArtifact?.evidenceReceipt.autoMergeClaim satisfies false | undefined;
receiptArtifact?.evidenceReceipt.semanticEquivalenceClaim satisfies false | undefined;
receiptArtifact?.materialization.evidenceReceiptIds satisfies readonly string[] | undefined;

const receiptWorklist: UniversalConversionWorklist = createUniversalConversionWorklist(receiptPlan);
const receiptWorklistQuery = queryUniversalConversionWorklist(receiptWorklist, { target: 'javascript' });
receiptWorklist.metadata.semanticEquivalenceClaim satisfies false;
receiptWorklist.summary.autoMergeClaims satisfies 0;
receiptWorklist.summary.semanticEquivalenceClaims satisfies 0;
receiptWorklist.summary.interlinguaConstraintFamilies satisfies readonly string[];
receiptWorklist.summary.interlinguaConstraintObligationStatuses satisfies readonly string[];
receiptWorklist.summary.interlinguaConstraintObligationMissingEvidence satisfies readonly string[];
receiptWorklistQuery.bestItem?.autoMergeClaim satisfies false | undefined;
receiptWorklistQuery.bestItem?.interlinguaConstraintObligationMissingEvidence satisfies readonly string[] | undefined;
