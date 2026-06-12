import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { normalizeNativeLanguageId } from '../../native-import-utils.js';
import { nativeImportSourceText } from './nativeImportSourceText.js';
import { spanOffsets } from './semanticEditSourceRanges.js';

export function exactSourceBackprojectionForMatch(match, context) {
  if (!sameLanguage(context.source?.language, context.targetChangeSet?.language)) return undefined;
  const anchor = match.sourceAnchors[0];
  const link = match.sourceMapLinks.find((entry) => entry.precision === 'exact');
  const region = targetRegionForMatch(match, context);
  if (!anchor || !link || region?.changeKind !== 'modified') return undefined;
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
  if (!validRanges(ranges)) return undefined;
  const sourceMappedText = sourceText.slice(ranges.source.start, ranges.source.end);
  const targetBeforeMappedText = targetBeforeText.slice(ranges.generated.start, ranges.generated.end);
  const targetBeforeEditText = targetBeforeText.slice(ranges.before.start, ranges.before.end);
  const targetAfterEditText = targetAfterText.slice(ranges.after.start, ranges.after.end);
  const targetAfterMappedText = afterMappedText(targetBeforeMappedText, targetAfterEditText, ranges);
  const matchesBefore = sourceMappedText === targetBeforeMappedText;
  const matchesAfter = sourceMappedText === targetAfterMappedText;
  if (!matchesBefore && !matchesAfter) return undefined;
  const alreadyApplied = matchesAfter && !matchesBefore;
  const sourceEditRange = sourceEditRangeForMatch(ranges, alreadyApplied ? targetAfterEditText : targetBeforeEditText);
  const sourceEditText = sourceText.slice(sourceEditRange.start, sourceEditRange.end);
  if (sourceEditText !== (alreadyApplied ? targetAfterEditText : targetBeforeEditText)) return undefined;
  return compactRecord({
    mode: 'same-language-exact-source-map',
    alreadyApplied,
    sourceMapLinkId: link.id,
    sourceMapMappingId: link.sourceMapMappingId,
    sourceEditSpan: { start: sourceEditRange.start, end: sourceEditRange.end, path: anchor.sourcePath },
    targetBeforeEditSpan: { start: ranges.before.start, end: ranges.before.end, path: region.sourcePath },
    targetAfterEditSpan: { start: ranges.after.start, end: ranges.after.end, path: region.sourcePath },
    sourceEditTextHash: hashSemanticValue(sourceEditText),
    targetBeforeEditTextHash: hashSemanticValue(targetBeforeEditText),
    targetAfterEditTextHash: hashSemanticValue(targetAfterEditText),
    targetAfterSourceHash: context.targetChangeSet.afterHash
  });
}

function validRanges(ranges) {
  return ranges.source && ranges.generated && ranges.before && ranges.after && containedRange(ranges.before, ranges.generated);
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

function compactRecord(value) {
  return Object.fromEntries(Object.entries(value ?? {}).filter(([, entry]) => entry !== undefined && (!Array.isArray(entry) || entry.length > 0)));
}
