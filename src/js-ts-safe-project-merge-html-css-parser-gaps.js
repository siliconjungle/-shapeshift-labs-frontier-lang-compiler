import { compactRecord } from './js-ts-safe-merge-context.js';
import { uniqueStrings } from './js-ts-safe-project-merge-core.js';

function normalizeHtmlCssParserEvidenceSides({ result, base, worker, head }) {
  const parserEvidence = result?.parserEvidence;
  if (!isPlainObject(parserEvidence?.sides)) return result;
  const sides = { ...parserEvidence.sides };
  fillParserEvidenceSide(sides, 'base', base, { worker, head });
  fillParserEvidenceSide(sides, 'worker', worker, { base, head });
  fillParserEvidenceSide(sides, 'head', head, { base, worker });
  if (['base', 'worker', 'head'].every((side) => sides[side] === parserEvidence.sides[side])) return result;
  return { ...result, parserEvidence: { ...parserEvidence, sides } };
}

function fillParserEvidenceSide(sides, target, targetSource, candidates) {
  if (isPlainObject(sides[target])) return;
  for (const [candidate, candidateSource] of Object.entries(candidates)) {
    if (targetSource === candidateSource && isPlainObject(sides[candidate])) {
      sides[target] = { ...sides[candidate], side: target, parserEvidenceSideAlias: candidate };
      return;
    }
  }
}

function blockCssScopedParserEvidenceGap({ result, id, sourcePath }) {
  const sides = cssScopedParserEvidenceGapSides(result?.parserEvidence);
  if (!sides.length) return undefined;
  const conflicts = [...(result.conflicts ?? []), cssScopedParserEvidenceGapConflict(id, sourcePath, sides)];
  const { mergedSourceText, mergedSourceHash, ...rest } = result;
  return compactRecord({
    ...rest,
    status: 'blocked',
    operation: 'blocked',
    conflicts,
    admission: blockedCssProofGapAdmission(result.admission, conflicts),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserCascadeEquivalenceClaim: false,
    browserRenderEquivalenceClaim: false
  });
}

function blockCssSelectorFunctionalPseudoSpecificityGap({ result, id, sourcePath }) {
  const gaps = cssSelectorFunctionalPseudoSpecificityGaps(result?.selectorTargetEvidence);
  if (!gaps.length) return undefined;
  const conflicts = [
    ...(result.conflicts ?? []),
    ...gaps.map((gap) => cssSelectorFunctionalPseudoSpecificityGapConflict(id, sourcePath, gap))
  ];
  const { mergedSourceText, mergedSourceHash, ...rest } = result;
  return compactRecord({
    ...rest,
    selectorTargetEvidence: blockSelectorTargetEvidenceRebases(result.selectorTargetEvidence, gaps),
    status: 'blocked',
    operation: 'blocked',
    conflicts,
    admission: blockedCssProofGapAdmission(result.admission, conflicts),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserCascadeEquivalenceClaim: false,
    browserRenderEquivalenceClaim: false
  });
}

function cssScopedParserEvidenceGapSides(evidence) {
  if (evidence?.kind !== 'frontier.lang.cssSafeMergeParserEvidence') return [];
  return Object.entries(evidence.sides ?? {})
    .filter(([, side]) => (side?.scopedCascadeGraphShapeKeys ?? 0) > 0 && side?.declarationCount === 0 && side?.parserBackedDeclarationSpans !== true)
    .map(([side, details]) => ({
      side,
      scopedCascadeGraphShapeKeys: details.scopedCascadeGraphShapeKeys,
      recordCount: details.recordCount,
      declarationCount: details.declarationCount,
      parserBackedDeclarationSpans: details.parserBackedDeclarationSpans
    }));
}

function cssScopedParserEvidenceGapConflict(id, sourcePath, sides) {
  return {
    code: 'css-scoped-cascade-parser-proof-blocked',
    gateId: 'css-semantic-merge',
    sourcePath,
    details: compactRecord({
      reasonCode: 'css-scoped-cascade-nesting-unproved',
      conflictKey: `css#${id}#css-scoped-cascade-nesting-unproved#${sourcePath ?? 'source'}`,
      parserEvidenceSides: sides,
      proofGap: {
        code: 'css-scoped-cascade-nesting-unproved',
        status: 'not-claimed',
        summary: 'Scoped CSS nesting has parser-backed scope shapes but no parser-backed declaration spans, so scoped cascade proof shape admission must fail closed.',
        nextProof: 'Expand or parse nested CSS rules in the owning CSS package, then supply source-bound scoped cascade proofs with exact scope shape keys and base/worker/head/output hashes.',
        failClosed: true,
        semanticEquivalenceClaim: false
      }
    })
  };
}

function cssSelectorFunctionalPseudoSpecificityGaps(evidence) {
  if (!isPlainObject(evidence)) return [];
  return (evidence.rebaseProofs ?? []).flatMap((proof, index) => {
    const selectors = uniqueStrings([...(proof.fromSelectors ?? []), ...(proof.toSelectors ?? [])]);
    const functionalPseudoSelectors = selectors.filter(hasFunctionalPseudoSpecificityRisk);
    if (!functionalPseudoSelectors.length) return [];
    if (hasExactSelectorsLevel4SpecificityProof(proof)) return [];
    return [compactRecord({
      index,
      proofId: proof.id,
      property: proof.property,
      cascadeKey: proof.cascadeKey,
      fromRuleKey: proof.fromRuleKey,
      toRuleKey: proof.toRuleKey,
      fromSelectors: proof.fromSelectors,
      toSelectors: proof.toSelectors,
      beforeSpecificity: proof.beforeSpecificity,
      afterSpecificity: proof.afterSpecificity,
      selectorTargetGraphHash: proof.selectorTargetGraphHash,
      beforeSelectorTargetGraphHash: proof.beforeSelectorTargetGraphHash,
      afterSelectorTargetGraphHash: proof.afterSelectorTargetGraphHash,
      functionalPseudoSelectors,
      blockedRebaseProof: proof
    })];
  });
}

function blockSelectorTargetEvidenceRebases(evidence, gaps) {
  if (!isPlainObject(evidence)) return evidence;
  const blockedIndexes = new Set(gaps.map((gap) => gap.index));
  const rebaseProofs = (evidence.rebaseProofs ?? []).filter((_, index) => !blockedIndexes.has(index));
  const blockedRebaseProofs = (evidence.rebaseProofs ?? []).filter((_, index) => blockedIndexes.has(index));
  return compactRecord({
    ...evidence,
    rebasedChangeCount: rebaseProofs.length,
    rebaseProofs,
    functionalPseudoSpecificityProofBlocked: true,
    functionalPseudoSpecificityGapCount: gaps.length,
    blockedRebaseProofs
  });
}

function cssSelectorFunctionalPseudoSpecificityGapConflict(id, sourcePath, gap) {
  const reasonCode = 'css-selector-functional-pseudo-specificity-unproved';
  return {
    code: 'css-selector-target-conflict',
    gateId: 'css-semantic-merge',
    sourcePath,
    details: compactRecord({
      reasonCode,
      conflictKey: `css#${id}#${reasonCode}#${gap.cascadeKey ?? gap.proofId ?? sourcePath ?? 'source'}`,
      selectorMove: compactRecord({
        fromRuleKey: gap.fromRuleKey,
        toRuleKey: gap.toRuleKey,
        fromSelectors: gap.fromSelectors,
        toSelectors: gap.toSelectors,
        beforeSpecificity: gap.beforeSpecificity,
        afterSpecificity: gap.afterSpecificity,
        selectorTargetGraphHash: gap.selectorTargetGraphHash,
        beforeSelectorTargetGraphHash: gap.beforeSelectorTargetGraphHash,
        afterSelectorTargetGraphHash: gap.afterSelectorTargetGraphHash
      }),
      property: gap.property,
      cascadeKey: gap.cascadeKey,
      functionalPseudoSelectors: gap.functionalPseudoSelectors,
      blockedRebaseProof: gap.blockedRebaseProof,
      proofGap: {
        code: reasonCode,
        status: 'not-claimed',
        summary: 'CSS selector target rebase uses functional pseudo selectors whose specificity records are not exact parser-backed Selectors Level 4 evidence in the lower CSS package.',
        nextProof: 'Supply a source-bound selector target proof whose rebase proof carries parser-backed Selectors Level 4 specificity metadata, exact before/after specificity records, and matching base/worker/head source hashes.',
        failClosed: true,
        semanticEquivalenceClaim: false,
        browserCascadeEquivalenceClaim: false,
        browserRenderEquivalenceClaim: false
      }
    })
  };
}

function hasFunctionalPseudoSpecificityRisk(selector) {
  return /:(?:is|where|has|not|matches|nth-child|nth-last-child)\s*\(/i.test(String(selector ?? ''));
}

function hasExactSelectorsLevel4SpecificityProof(proof) {
  const algorithm = proof?.specificityAlgorithm ?? proof?.selectorSpecificityAlgorithm;
  return proof?.parserBackedSelectorSpecificity === true &&
    proof?.selectorsLevel4Specificity === true &&
    proof?.specificityExact !== false &&
    algorithm === 'selectors-level-4' &&
    selectorSpecificityRecordsExact(proof.beforeSelectorSpecificityRecords) &&
    selectorSpecificityRecordsExact(proof.afterSelectorSpecificityRecords);
}

function selectorSpecificityRecordsExact(records) {
  return Array.isArray(records) && records.length > 0 && records.every((record) => record?.parserBackedSelectorSpecificity === true && record?.selectorsLevel4Specificity === true && record?.specificityExact !== false && record?.algorithm === 'selectors-level-4');
}

function blockedCssProofGapAdmission(admission = {}, conflicts = []) {
  return compactRecord({
    ...admission,
    status: 'blocked',
    action: 'human-review',
    reviewRequired: true,
    autoApplyCandidate: false,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    browserCascadeEquivalenceClaim: false,
    browserRenderEquivalenceClaim: false,
    reasonCodes: uniqueStrings([...(admission.reasonCodes ?? []), ...conflicts.map((conflict) => conflict.details?.reasonCode ?? conflict.code)])
  });
}

function isPlainObject(value) { return Boolean(value && typeof value === 'object' && !Array.isArray(value)); }

export { blockCssScopedParserEvidenceGap, blockCssSelectorFunctionalPseudoSpecificityGap, normalizeHtmlCssParserEvidenceSides };
