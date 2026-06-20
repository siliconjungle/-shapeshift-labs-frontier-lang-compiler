import { countBy, idFragment, maxSemanticMergeReadiness, normalizeSemanticMergeReadiness, uniqueStrings } from './native-import-utils.js';
import { JsTsSemanticConflictSidecarClasses } from './js-ts-semantic-conflict-sidecar-constants.js';
import { deleteModifySidecars, duplicateDeclarationSidecars, explicitSidecars, orderedListSidecars, parserLedgerLossSidecars, sameRegionSidecars, staleSourceHashSidecars, unsupportedSyntaxSidecars } from './js-ts-semantic-conflict-sidecar-detectors.js';
import { normalizedChanges } from './js-ts-semantic-conflict-sidecar-normalize.js';
import { array, classesFromRecords, compactRecord, dedupeSidecars, highestRisk, highestSeverity, mergeContext, summarySuggestedOutcome } from './js-ts-semantic-conflict-sidecar-utils.js';

export { JsTsSemanticConflictSidecarClasses } from './js-ts-semantic-conflict-sidecar-constants.js';

export function createJsTsSemanticConflictSidecars(input = {}, options = {}) {
  const context = mergeContext(input, options);
  const changes = normalizedChanges(input, context);
  const records = dedupeSidecars([
    ...explicitSidecars(input, context),
    ...sameRegionSidecars(changes, context),
    ...deleteModifySidecars(changes, context),
    ...duplicateDeclarationSidecars(input, changes, context),
    ...orderedListSidecars(input, changes, context),
    ...parserLedgerLossSidecars(input, context),
    ...staleSourceHashSidecars(input, context),
    ...unsupportedSyntaxSidecars(input, context)
  ]);
  const summary = summarizeJsTsSemanticConflictSidecars(records, context);
  const id = options.id
    ?? input.id
    ?? `js_ts_semantic_conflict_sidecars_${idFragment(context.sourcePath ?? context.language ?? 'source')}`;
  return {
    kind: 'frontier.lang.jsTsSemanticMergeConflictSidecars',
    version: 1,
    schema: 'frontier.lang.jsTsSemanticMergeConflictSidecars.v1',
    id,
    language: context.language,
    sourcePath: context.sourcePath,
    expectedSourceHash: context.expectedSourceHash,
    currentSourceHash: context.currentSourceHash,
    conflicts: records,
    sidecars: records,
    summary,
    admission: {
      status: records.length ? summary.readiness : 'ready',
      reviewRequired: records.length > 0,
      autoMergeSafe: records.length === 0,
      suggestedOutcome: summary.suggestedOutcome,
      reasonCodes: summary.reasonCodes
    },
    metadata: compactRecord({
      conflictSidecarSource: 'js-ts-semantic-merge',
      ...options.metadata,
      ...input.metadata
    })
  };
}

export function summarizeJsTsSemanticConflictSidecars(records = [], context = {}) {
  const list = array(records).filter(Boolean);
  const classes = uniqueStrings(list.map((record) => record.class));
  const reasonCodes = uniqueStrings(list.flatMap((record) => record.reasonCodes ?? []));
  const affectedSourcePaths = uniqueStrings([
    context.sourcePath,
    ...list.flatMap((record) => record.affected?.sourcePaths ?? [])
  ]);
  const affectedKeys = uniqueStrings(list.flatMap((record) => record.affected?.keys ?? []));
  const readiness = list.reduce(
    (current, record) => maxSemanticMergeReadiness(current, record.readiness ?? 'needs-review'),
    normalizeSemanticMergeReadiness(context.readiness) ?? 'ready'
  );
  return {
    schema: 'frontier.lang.jsTsSemanticConflictSidecarSummary.v1',
    total: list.length,
    classes,
    byClass: countBy(classesFromRecords(list)),
    bySeverity: countBy(list.map((record) => record.severity ?? 'warning')),
    byRisk: countBy(list.map((record) => record.risk ?? 'medium')),
    highestSeverity: highestSeverity(list),
    highestRisk: highestRisk(list),
    readiness,
    affectedSourcePaths,
    affectedKeys,
    reasonCodes,
    suggestedOutcome: summarySuggestedOutcome(list, readiness)
  };
}
