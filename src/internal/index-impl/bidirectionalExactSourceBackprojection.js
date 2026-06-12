import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { normalizeNativeLanguageId } from '../../native-import-utils.js';
import { nativeImportSourceText } from './nativeImportSourceText.js';
import { spanOffsets } from './semanticEditSourceRanges.js';

export function exactSourceBackprojectionForMatch(match, context) {
  if (!sameLanguage(context.source?.language, context.targetChangeSet?.language)) return undefined;
  const anchor = match.sourceAnchors[0];
  const link = match.sourceMapLinks.find((entry) => entry.precision === 'exact');
  const region = targetRegionForMatch(match, context);
  if (!anchor || !link || !['added', 'modified', 'removed'].includes(region?.changeKind)) return undefined;
  const sourceText = nativeImportSourceText(context.source);
  const targetBeforeText = nativeImportSourceText(context.targetChangeSet.before);
  const targetAfterText = nativeImportSourceText(context.targetChangeSet.after);
  const beforeSpan = region.metadata?.changedRegionProjection?.before?.sourceSpan ?? region.sourceSpan;
  const afterSpan = region.metadata?.changedRegionProjection?.after?.sourceSpan;
  const ranges = {
    source: spanOffsets(sourceText, link.sourceSpan ?? anchor.sourceSpan),
    generated: spanOffsets(targetBeforeText, link.generatedSpan),
    before: spanOffsets(targetBeforeText, beforeSpan),
    after: spanOffsets(targetAfterText, afterSpan)
  };
  if (region.changeKind === 'added') return addedSourceBackprojection({ anchor, link, region, sourceText, targetAfterText, ranges, context });
  if (!validRanges(ranges, region.changeKind)) return undefined;
  const sourceMappedText = sourceText.slice(ranges.source.start, ranges.source.end);
  const targetBeforeMappedText = targetBeforeText.slice(ranges.generated.start, ranges.generated.end);
  const targetBeforeEditText = targetBeforeText.slice(ranges.before.start, ranges.before.end);
  const targetAfterEditText = region.changeKind === 'removed'
    ? ''
    : targetAfterText.slice(ranges.after.start, ranges.after.end);
  const targetAfterMappedText = afterMappedText(targetBeforeMappedText, targetAfterEditText, ranges);
  const matchesBefore = sourceMappedText === targetBeforeMappedText;
  const matchesAfter = sourceMappedText === targetAfterMappedText;
  const lineEndingStableBefore = !matchesBefore && sameLineEndingStable(sourceMappedText, targetBeforeMappedText);
  const lineEndingStableAfter = !matchesBefore && sameLineEndingStable(sourceMappedText, targetAfterMappedText);
  if (!matchesBefore && !matchesAfter && !lineEndingStableBefore && !lineEndingStableAfter) return undefined;
  const alreadyApplied = matchesAfter && !matchesBefore;
  const lineEndingStable = lineEndingStableBefore || lineEndingStableAfter;
  const sourceEditRange = lineEndingStable
    ? lineEndingStableSourceEditRange(sourceMappedText, lineEndingStableAfter ? targetAfterMappedText : targetBeforeMappedText, ranges, lineEndingStableAfter ? targetAfterEditText : targetBeforeEditText)
    : sourceEditRangeForMatch(ranges, alreadyApplied ? targetAfterEditText : targetBeforeEditText);
  if (!sourceEditRange) return undefined;
  const sourceEditText = sourceText.slice(sourceEditRange.start, sourceEditRange.end);
  const expectedSourceEditText = alreadyApplied || lineEndingStableAfter ? targetAfterEditText : targetBeforeEditText;
  if (sourceEditText !== expectedSourceEditText && !sameLineEndingStable(sourceEditText, expectedSourceEditText)) return undefined;
  return compactRecord({
    mode: 'same-language-exact-source-map',
    alreadyApplied: alreadyApplied || lineEndingStableAfter,
    lineEndingStable,
    sourceMapLinkId: link.id,
    sourceMapMappingId: link.sourceMapMappingId,
    sourceEditSpan: { start: sourceEditRange.start, end: sourceEditRange.end, path: anchor.sourcePath },
    targetBeforeEditSpan: { start: ranges.before.start, end: ranges.before.end, path: region.sourcePath },
    targetAfterEditSpan: ranges.after ? { start: ranges.after.start, end: ranges.after.end, path: region.sourcePath } : undefined,
    sourceEditTextHash: hashSemanticValue(sourceEditText),
    targetBeforeEditTextHash: hashSemanticValue(targetBeforeEditText),
    targetAfterEditTextHash: hashSemanticValue(targetAfterEditText),
    targetAfterSourceHash: context.targetChangeSet.afterHash
  });
}

function addedSourceBackprojection(input) {
  const { anchor, link, region, sourceText, targetAfterText, ranges, context } = input;
  const generated = spanOffsets(targetAfterText, link.generatedSpan);
  if (!ranges.source || !ranges.after || !generated) return undefined;
  const sourceMappedText = sourceText.slice(ranges.source.start, ranges.source.end);
  const targetAfterMappedText = targetAfterText.slice(generated.start, generated.end);
  const targetAfterEditText = targetAfterText.slice(ranges.after.start, ranges.after.end);
  const exact = sourceMappedText === targetAfterMappedText && sourceMappedText === targetAfterEditText;
  const lineEndingStable = !exact && sameLineEndingStable(sourceMappedText, targetAfterMappedText) && sameLineEndingStable(sourceMappedText, targetAfterEditText);
  if (!exact && !lineEndingStable) return undefined;
  const sourceEditRange = lineEndingStable
    ? lineEndingStableSourceEditRange(sourceMappedText, targetAfterMappedText, { ...ranges, before: generated, generated }, targetAfterEditText)
    : { start: ranges.source.start, end: ranges.source.start + targetAfterEditText.length };
  if (!sourceEditRange) return undefined;
  return compactRecord({
    mode: 'same-language-exact-source-map',
    alreadyApplied: true,
    lineEndingStable,
    sourceMapLinkId: link.id,
    sourceMapMappingId: link.sourceMapMappingId,
    sourceEditSpan: { start: sourceEditRange.start, end: sourceEditRange.end, path: anchor.sourcePath },
    targetAfterEditSpan: { start: ranges.after.start, end: ranges.after.end, path: region.sourcePath },
    sourceEditTextHash: hashSemanticValue(sourceText.slice(sourceEditRange.start, sourceEditRange.end)),
    targetBeforeEditTextHash: hashSemanticValue(''),
    targetAfterEditTextHash: hashSemanticValue(targetAfterEditText),
    targetAfterSourceHash: context.targetChangeSet.afterHash
  });
}

function validRanges(ranges, changeKind) {
  const hasAfter = changeKind === 'removed' || ranges.after;
  return ranges.source && ranges.generated && ranges.before && hasAfter && containedRange(ranges.before, ranges.generated);
}

function afterMappedText(targetBeforeMappedText, targetAfterEditText, ranges) {
  const start = ranges.before.start - ranges.generated.start;
  const end = ranges.before.end - ranges.generated.start;
  return targetBeforeMappedText.slice(0, start) + targetAfterEditText + targetBeforeMappedText.slice(end);
}

function sourceEditRangeForMatch(ranges, editText) {
  const start = ranges.source.start + ranges.before.start - ranges.generated.start;
  return { start, end: start + editText.length };
}

function lineEndingStableSourceEditRange(sourceMappedText, targetAfterMappedText, ranges, targetAfterEditText) {
  const targetStart = ranges.before.start - ranges.generated.start;
  const targetEnd = targetStart + targetAfterEditText.length;
  const normalizedStart = normalizedPrefixLength(targetAfterMappedText, targetStart);
  const normalizedEnd = normalizedPrefixLength(targetAfterMappedText, targetEnd);
  const sourceStart = rawOffsetForNormalizedPrefix(sourceMappedText, normalizedStart);
  const sourceEnd = rawOffsetForNormalizedPrefix(sourceMappedText, normalizedEnd);
  if (sourceStart < 0 || sourceEnd < sourceStart) return undefined;
  return {
    start: ranges.source.start + sourceStart,
    end: ranges.source.start + sourceEnd
  };
}

function targetRegionForMatch(match, context) {
  return context.targetChangeSet.changedRegions.find((region) => region.id === match.targetRegion?.id)
    ?? match.targetRegion;
}

function sameLanguage(left, right) {
  return normalizeNativeLanguageId(left) && normalizeNativeLanguageId(left) === normalizeNativeLanguageId(right);
}

function containedRange(inner, outer) {
  return Boolean(inner && outer && outer.start <= inner.start && inner.end <= outer.end);
}

function sameLineEndingStable(left, right) {
  return normalizeLineEndings(left) === normalizeLineEndings(right);
}

function normalizeLineEndings(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function normalizedPrefixLength(value, rawOffset) {
  return normalizeLineEndings(String(value ?? '').slice(0, rawOffset)).length;
}

function rawOffsetForNormalizedPrefix(value, normalizedOffset) {
  let normalized = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (normalized === normalizedOffset) return index;
    if (value[index] === '\r' && value[index + 1] === '\n') index += 1;
    normalized += 1;
  }
  return normalized === normalizedOffset ? value.length : -1;
}

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
