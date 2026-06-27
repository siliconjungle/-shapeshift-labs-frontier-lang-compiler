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

export { blockCssScopedParserEvidenceGap, normalizeHtmlCssParserEvidenceSides };
