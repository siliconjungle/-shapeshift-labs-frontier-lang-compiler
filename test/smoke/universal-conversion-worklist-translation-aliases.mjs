import { assert } from './helpers.mjs';
import { createUniversalConversionWorklist, queryUniversalConversionWorklist } from './compiler-api.mjs';

const aliasTranslationWorklist = createUniversalConversionWorklist({
  kind: 'frontier.lang.universalConversionPlan',
  version: 1,
  id: 'translation_alias_worklist_plan',
  generatedAt: 806,
  routes: [{
    id: 'translation_alias_worklist_route',
    sourceLanguage: 'javascript',
    languageIds: ['javascript'],
    target: 'rust',
    mode: 'target-projection',
    readiness: 'needs-evidence',
    admissionAction: 'review',
    routeAction: 'collect-evidence',
    priority: 'normal',
    adapter: 'route-fixture-js-rust',
    missingEvidence: [],
    blockers: [],
    review: [],
    translationAdmission: {
      translationAdmissionStatus: 'needs-evidence',
      translationAdmissionAction: 'collect-translation-evidence',
      missingTranslationEvidence: 'translation-proof-or-replay',
      translationRuntimeProofStatus: 'needs-proof',
      requiredTranslationConstructKind: 'runtime',
      representedTranslationConstructKind: 'import',
      targetAdapterId: 'alias-fixture-js-rust'
    }
  }]
});

assert.equal(aliasTranslationWorklist.items.length, 1);
assert.equal(aliasTranslationWorklist.summary.translationAdmissionStatuses.includes('needs-evidence'), true);
assert.equal(aliasTranslationWorklist.summary.translationAdmissionActions.includes('collect-translation-evidence'), true);
assert.equal(aliasTranslationWorklist.summary.missingTranslationEvidence.includes('translation-proof-or-replay'), true);
assert.equal(aliasTranslationWorklist.summary.translationRuntimeProofStatuses.includes('needs-proof'), true);
assert.equal(aliasTranslationWorklist.summary.requiredTranslationConstructKinds.includes('runtime'), true);
assert.equal(aliasTranslationWorklist.summary.representedTranslationConstructKinds.includes('import'), true);
assert.equal(aliasTranslationWorklist.summary.targetAdapterIds.includes('alias-fixture-js-rust'), true);
assert.equal(queryUniversalConversionWorklist(aliasTranslationWorklist, {
  missingTranslationEvidence: 'translation-proof-or-replay',
  translationRuntimeProofStatus: 'needs-proof',
  requiredTranslationConstructKind: 'runtime',
  representedTranslationConstructKind: 'import',
  targetAdapterId: 'alias-fixture-js-rust'
}).found, true);
assert.equal(queryUniversalConversionWorklist(aliasTranslationWorklist, {
  targetAdapterId: 'missing-alias-adapter'
}).found, false);
