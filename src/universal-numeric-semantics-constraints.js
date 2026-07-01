import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalNumericSemanticsConstraintStatuses = Object.freeze(['not-applicable', 'satisfied', 'degraded', 'needs-evidence', 'blocked']);

export function createUniversalNumericSemanticsConstraintEvidence(input = {}) {
  input = input ?? {};
  const route = input.route ?? {};
  const routeId = input.routeId ?? route.id;
  const sourceLanguage = input.sourceLanguage ?? route.sourceLanguage;
  const target = input.target ?? route.target;
  const mode = input.mode ?? route.mode;
  const sourceRecords = normalizeNumericRecords('source', [
    ...(input.sourceNumericSemanticsRecords ?? []),
    ...(input.numericSemanticsRecords ?? []),
    ...(input.numericRecords ?? []),
    ...(input.numberRecords ?? []),
    ...(input.numericTypes ?? []),
    ...(input.sourceNumericSemanticsConstraints ?? []),
    ...(input.numericSemanticsConstraints ?? []),
    ...(input.imports ?? []).flatMap(numericRecordsFromImport)
  ]);
  const targetRecords = normalizeNumericRecords('target', [
    ...(input.targetNumericSemanticsRecords ?? []),
    ...(input.targetNumericSemanticsConstraints ?? [])
  ]);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedNumericKinds(requiredKinds, targetRecords, { mode, sameLanguage: sameLanguage(sourceLanguage, target) });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const context = { ...input, route, routeId, sourceLanguage, target, mode, preserveSource: mode === 'preserve-source' && sameLanguage(sourceLanguage, target) };
  const missingEvidence = numericMissingEvidence(missingKinds, sourceRecords, targetRecords, context);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = numericReview(missingKinds, sourceRecords, targetRecords, context);
  const status = numericStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalNumericSemanticsConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalNumericSemanticsConstraintEvidence.v1',
    id: input.id ?? `numeric_semantics_constraints_${idFragment(routeId ?? `${sourceLanguage ?? 'source'}_${target ?? 'target'}`)}`,
    routeId,
    sourceLanguage,
    target,
    status,
    action: numericAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceRecords,
    targetRecords,
    numericSemanticsConstraints: requiredKinds.map((kind) => numericConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]),
    claims: { numericEquivalenceClaim: false, arithmeticEquivalenceClaim: false, floatingPointEquivalenceClaim: false, semanticEquivalenceClaim: false, autoMergeClaim: false },
    metadata: { note: 'Numeric-semantics constraints model value/arithmetic behavior for translation admission. They are not proof of equivalent target execution.', ...(input.metadata ?? {}) }
  };
}

export function numericSemanticsConstraintMatches(evidence = {}, query = {}) {
  return match(query.numericSemanticsConstraintStatus, [evidence.status])
    && match(query.numericSemanticsConstraintAction, [evidence.action])
    && match(query.numericSemanticsConstraintRequiredKind, evidence.requiredKinds)
    && match(query.numericSemanticsConstraintRepresentedKind, evidence.representedKinds)
    && match(query.numericSemanticsConstraintMissingKind, evidence.missingKinds)
    && match(query.numericSemanticsConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.numericSemanticsConstraintEvidenceId, evidence.evidenceIds);
}

export function numericSemanticsConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  input = input ?? {};
  route = route ?? {};
  const explicit = matchingNumericInput(input, route, routeEvidence);
  const sourceRecords = [
    ...(explicit?.sourceNumericSemanticsRecords ?? []),
    ...(explicit?.numericSemanticsRecords ?? []),
    ...(explicit?.numericRecords ?? []),
    ...(explicit?.numberRecords ?? []),
    ...(explicit?.numericTypes ?? []),
    ...(explicit?.sourceNumericSemanticsConstraints ?? []),
    ...(explicit?.numericSemanticsConstraints ?? []),
    ...routeImports.flatMap(numericRecordsFromImport)
  ];
  const targetRecords = [
    ...(explicit?.targetNumericSemanticsRecords ?? []),
    ...(explicit?.targetNumericSemanticsConstraints ?? [])
  ];
  if (!explicit && !sourceRecords.length && !targetRecords.length) return undefined;
  return createUniversalNumericSemanticsConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceNumericSemanticsRecords: sourceRecords, targetNumericSemanticsRecords: targetRecords, evidenceIds: uniqueStrings([...(explicit?.evidenceIds ?? []), ...routeEvidence.map((record) => record?.id).filter(Boolean)]) });
}

function normalizeNumericRecords(role, records) {
  return uniqueNumericRecords((records ?? []).flatMap((record, index) => {
    const constraintKinds = numericConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_numeric_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      name: record?.name ?? record?.symbolName ?? record?.typeName ?? record?.numericTypeName,
      symbolId: record?.symbolId ?? record?.id,
      numericKind: record?.numericKind ?? record?.numberKind ?? record?.kind ?? record?.typeKind ?? record?.valueKind,
      width: record?.width ?? record?.bitWidth ?? record?.integerWidth,
      signedness: record?.signedness ?? (record?.signed === true ? 'signed' : record?.signed === false ? 'unsigned' : undefined),
      overflowMode: record?.overflowMode ?? record?.overflowBehavior,
      divisionMode: record?.divisionMode ?? record?.integerDivisionMode,
      moduloMode: record?.moduloMode ?? record?.remainderMode,
      floatFormat: record?.floatFormat ?? record?.floatPrecision,
      roundingMode: record?.roundingMode,
      specialValues: list(record?.specialValues, record?.floatSpecialValues, record?.nan === true ? 'nan' : undefined, record?.infinity === true ? 'infinity' : undefined),
      coercionKinds: list(record?.coercionKinds, record?.coercions, record?.coercionKind, record?.conversionKind),
      literalKinds: list(record?.literalKinds, record?.literalKind, record?.radix, record?.separatorPolicy),
      constraintKinds,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      evidenceIds: record?.evidenceIds ?? []
    }];
  }));
}

function numericRecordsFromImport(imported) {
  return uniqueNumericRecords([
    ...(imported?.numericSemanticsConstraints ?? []),
    ...(imported?.numericSemanticsRecords ?? []),
    ...(imported?.numericRecords ?? []),
    ...(imported?.numberRecords ?? []),
    ...(imported?.numericTypes ?? []),
    ...(imported?.semanticIndex?.symbols ?? []).filter(numericLikeRecord),
    ...(imported?.semanticIndex?.facts ?? []).filter(numericLikeRecord),
    ...(imported?.nativeAst?.declarations ?? []).filter(numericLikeRecord),
    ...(imported?.nativeAst?.expressions ?? []).filter(numericLikeRecord)
  ]);
}

function numericLikeRecord(record = {}) {
  const token = String([record.kind, record.numericKind, record.numberKind, record.typeKind, record.valueKind, record.operator, record.predicate, record.capability].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.width || record.bitWidth || record.integerWidth || record.floatFormat || record.roundingMode || record.overflowMode || record.divisionMode || record.moduloMode || /numeric|number|integer|int|uint|float|double|decimal|bigint|overflow|division|modulo|remainder|rounding|nan|infinity|literal|coercion/.test(token));
}

function numericConstraintKinds(record = {}) {
  const primitiveToken = typeof record === 'string' || typeof record === 'number' || typeof record === 'boolean' ? record : undefined;
  const tokens = uniqueStrings([
    primitiveToken,
    record.numericKind,
    record.numberKind,
    record.kind,
    record.typeKind,
    record.valueKind,
    record.operator,
    record.predicate,
    record.capability,
    record.width,
    record.bitWidth,
    record.integerWidth,
    record.floatFormat,
    record.floatPrecision,
    record.roundingMode,
    record.overflowMode,
    record.overflowBehavior,
    record.divisionMode,
    record.integerDivisionMode,
    record.moduloMode,
    record.remainderMode,
    record.coercionKind,
    record.conversionKind,
    record.literalKind,
    record.radix,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? []),
    record.signed === true ? 'signed' : undefined,
    record.signed === false ? 'unsigned' : undefined,
    record.nan === true ? 'nan' : undefined,
    record.infinity === true ? 'infinity' : undefined,
    record.bigint === true ? 'bigint' : undefined,
    record.decimal === true ? 'decimal' : undefined
  ].filter(Boolean).map(normalizeToken));
  return uniqueStrings(tokens.flatMap(numericKindForToken));
}

function numericKindForToken(token) {
  const kinds = [];
  if (/numeric|number|integer|int|uint|float|double|decimal|bigint|usize|isize/.test(token)) kinds.push('numeric-type');
  if (/width|bit-width|integer-width|u8|u16|u32|u64|i8|i16|i32|i64|usize|isize/.test(token)) kinds.push('integer-width');
  if (/signed|unsigned|sign/.test(token)) kinds.push('signedness');
  if (/overflow|wrap|wrapping|checked|trap|panic|saturating/.test(token)) kinds.push('overflow-behavior');
  if (/division|integer-division|truncating|floor-division|ceil-division/.test(token)) kinds.push('division-semantics');
  if (/modulo|remainder|euclidean-rem|floor-mod/.test(token)) kinds.push('modulo-remainder');
  if (/float|floating|double|float32|float64|f32|f64|ieee|binary32|binary64/.test(token)) kinds.push('floating-point-format');
  if (/round|rounding|nearest|ties|toward-zero|ceil|floor/.test(token)) kinds.push('rounding-mode');
  if (/nan|infinity|inf|signed-zero|negative-zero/.test(token)) kinds.push('nan-infinity');
  if (/coercion|conversion|cast|widening|narrowing|number-conversion|int-to-float/.test(token)) kinds.push('numeric-coercion');
  if (/bigint|big-int|arbitrary-precision|bignum/.test(token)) kinds.push('bigint-semantics');
  if (/decimal|fixed-point|money/.test(token)) kinds.push('decimal-semantics');
  if (/literal|radix|separator|suffix|prefix|hex|binary|octal/.test(token)) kinds.push('literal-parsing');
  if (/bitwise|shift|rotate/.test(token)) kinds.push('bitwise-semantics');
  if (/numeric-comparison|total-order|partial-order/.test(token)) kinds.push('numeric-ordering');
  return kinds;
}

function representedNumericKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function numericMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  return uniqueStrings([
    ...(targetRecords.length || input.preserveSource ? [] : ['translation-numeric-semantics-target-evidence']),
    ...(missingKinds.length ? ['translation-numeric-semantics-proof'] : []),
    ...missingKinds.map((kind) => `translation-numeric-semantics:${kind}`),
    ...(input.missingEvidence ?? [])
  ]);
}

function numericReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Numeric semantics are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length && !input.preserveSource ? ['Source numeric behavior is not represented by target numeric-semantics evidence.'] : []),
    ...(missingKinds.includes('overflow-behavior') ? ['Integer overflow, trap, wrap, checked, or saturating behavior requires explicit target proof.'] : []),
    ...(missingKinds.some((kind) => kind === 'division-semantics' || kind === 'modulo-remainder') ? ['Integer division and remainder semantics require explicit target proof.'] : []),
    ...(missingKinds.some((kind) => kind === 'floating-point-format' || kind === 'rounding-mode' || kind === 'nan-infinity') ? ['Floating-point precision, rounding, NaN, infinity, or signed-zero behavior requires explicit target proof.'] : []),
    ...(missingKinds.some((kind) => kind === 'numeric-coercion' || kind === 'literal-parsing') ? ['Numeric coercion and literal parsing require source-bound target evidence.'] : []),
    ...(input.review ?? [])
  ]);
}

function numericStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function numericAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-numeric-semantics-evidence';
  if (status === 'degraded') return 'review-numeric-semantics-loss';
  if (status === 'satisfied') return 'attach-numeric-semantics-record';
  return 'skip';
}

function numericConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceNumericSemanticsIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetNumericSemanticsIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['integer-width', 'signedness', 'overflow-behavior', 'division-semantics', 'modulo-remainder', 'floating-point-format', 'rounding-mode', 'nan-infinity', 'numeric-coercion', 'bigint-semantics', 'decimal-semantics'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingNumericInput(input, route, routeEvidence) {
  const candidates = [
    input.numericSemanticsConstraint,
    input.translationNumericSemanticsConstraint,
    ...(input.numericSemanticsConstraints ?? []),
    ...routeEvidence.flatMap(numericCandidatesFromRouteEvidence)
  ].filter(Boolean);
  return candidates.find((candidate) => routeMatch(candidate, route));
}

function numericCandidatesFromRouteEvidence(record) {
  if (!record) return [];
  return [record.numericSemanticsConstraint, record.translationNumericSemanticsConstraint, numericEvidenceRecord(record) ? record : undefined, ...(record.numericSemanticsConstraints ?? []), ...(record.translationNumericSemanticsConstraints ?? [])].filter(Boolean);
}

function numericEvidenceRecord(record) {
  return record?.kind === 'frontier.lang.universalNumericSemanticsConstraintEvidence' || record?.schema === 'frontier.lang.universalNumericSemanticsConstraintEvidence.v1' || Boolean((record?.sourceRecords?.length || record?.targetRecords?.length) && record?.numericSemanticsConstraints?.length);
}

function routeMatch(candidate, route = {}) {
  return (!candidate.routeId || String(candidate.routeId) === String(route.id))
    && (!candidate.sourceLanguage || normalizeToken(candidate.sourceLanguage) === normalizeToken(route.sourceLanguage))
    && (!candidate.target || normalizeToken(candidate.target) === normalizeToken(route.target));
}

function list(...values) {
  return uniqueStrings(values.flatMap((value) => Array.isArray(value) ? value : value ? [value] : []).map(listValue).filter(Boolean).map(String));
}

function listValue(value) {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'object') return value;
  return value.name ?? value.id ?? value.kind ?? value.mode ?? value.label;
}

function sameLanguage(source, target) {
  const sourceKey = normalizeToken(source);
  const targetKey = normalizeToken(target);
  return Boolean(sourceKey && targetKey && sourceKey === targetKey);
}

function match(filter, values) {
  const filters = (Array.isArray(filter) ? filter : filter === undefined || filter === null ? [] : [filter]).filter((item) => item !== null && item !== undefined);
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).filter((value) => value !== null && value !== undefined).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}

function normalizeToken(value) {
  return String(value ?? '').trim().toLowerCase().replace(/_/g, '-');
}

function uniqueNumericRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    if (!record) return false;
    const key = record.id ?? record.symbolId ?? [record.name, record.kind, record.numericKind, record.typeKind].filter(Boolean).join(':') ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
