import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { spanOffsets } from './semanticEditSourceRanges.js';

export function explicitSourceReplacementEditForOperation(operation, identity, headSourceText, order) {
  const backprojection = operation.metadata?.sourceBackprojection;
  if (backprojection?.mode !== 'cross-language-explicit-source-replacement') return undefined;
  const replacement = backprojection.sourceReplacementText;
  const range = spanOffsets(headSourceText, backprojection.sourceEditSpan ?? operation.spans?.head ?? operation.spans?.base);
  const anchorRange = spanOffsets(headSourceText, operation.anchor?.sourceSpan);
  const reasons = [];
  if (typeof replacement !== 'string') reasons.push(`source-replacement-text-missing:${operation.id}`);
  if (!range) reasons.push(`head-span-not-resolvable:${operation.id}`);
  if (reasons.length) return { ok: false, reasonCodes: reasons };
  const current = headSourceText.slice(range.start, range.end);
  const currentHash = hashSemanticValue(current);
  const replacementHash = hashSemanticValue(replacement);
  const expectedCurrentHash = backprojection.sourceEditTextHash ?? operation.hashes?.headTextHash ?? operation.hashes?.baseTextHash;
  if (expectedCurrentHash && currentHash !== expectedCurrentHash) reasons.push(`head-span-hash-mismatch:${operation.id}`);
  if (backprojection.sourceReplacementTextHash && replacementHash !== backprojection.sourceReplacementTextHash) {
    reasons.push(`source-replacement-text-hash-mismatch:${operation.id}`);
  }
  if (reasons.length) return { ok: false, reasonCodes: reasons };
  return {
    ok: true,
    value: {
      operationId: operation.id,
      order,
      ...identity,
      editKind: 'replace',
      sourceRangeKind: 'cross-language-explicit-source-replacement',
      start: range.start,
      end: range.end,
      headAnchorStart: anchorRange?.start,
      headAnchorEnd: anchorRange?.end,
      replacement,
      replacementSpanText: replacement,
      current
    }
  };
}
