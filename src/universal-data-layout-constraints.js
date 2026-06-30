import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalDataLayoutConstraintStatuses = Object.freeze([
  'not-applicable',
  'satisfied',
  'degraded',
  'needs-evidence',
  'blocked'
]);

export function createUniversalDataLayoutConstraintEvidence(input = {}) {
  const route = input.route ?? {};
  const sourceRecords = normalizeDataLayoutRecords('source', [
    ...(input.sourceDataLayoutRecords ?? []),
    ...(input.dataLayoutRecords ?? []),
    ...(input.layoutRecords ?? []),
    ...(input.abiRecords ?? []),
    ...(input.representationRecords ?? []),
    ...(input.imports ?? []).flatMap(dataLayoutRecordsFromImport)
  ]);
  const targetRecords = normalizeDataLayoutRecords('target', input.targetDataLayoutRecords ?? []);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedDataLayoutKinds(requiredKinds, targetRecords, {
    mode: input.mode ?? route.mode,
    sameLanguage: sameLanguage(input.sourceLanguage ?? route.sourceLanguage, input.target ?? route.target)
  });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const missingEvidence = dataLayoutMissingEvidence(missingKinds, sourceRecords, targetRecords, input);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = dataLayoutReview(missingKinds, sourceRecords, targetRecords, input);
  const status = dataLayoutStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalDataLayoutConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalDataLayoutConstraintEvidence.v1',
    id: input.id ?? `data_layout_constraints_${idFragment(input.routeId ?? route.id ?? `${input.sourceLanguage ?? route.sourceLanguage ?? 'source'}_${input.target ?? route.target ?? 'target'}`)}`,
    routeId: input.routeId ?? route.id,
    sourceLanguage: input.sourceLanguage ?? route.sourceLanguage,
    target: input.target ?? route.target,
    status,
    action: dataLayoutAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceDataLayoutRecords: sourceRecords,
    targetDataLayoutRecords: targetRecords,
    dataLayoutConstraints: requiredKinds.map((kind) => dataLayoutConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]),
    claims: {
      dataLayoutEquivalenceClaim: false,
      abiEquivalenceClaim: false,
      semanticEquivalenceClaim: false,
      autoMergeClaim: false
    },
    metadata: {
      note: 'Data-layout constraints record representation/ABI obligations for translation admission. They are not proof of equivalent target execution.',
      ...(input.metadata ?? {})
    }
  };
}

export function dataLayoutConstraintMatches(evidence = {}, query = {}) {
  return match(query.dataLayoutConstraintStatus, [evidence.status])
    && match(query.dataLayoutConstraintAction, [evidence.action])
    && match(query.dataLayoutConstraintRequiredKind, evidence.requiredKinds)
    && match(query.dataLayoutConstraintRepresentedKind, evidence.representedKinds)
    && match(query.dataLayoutConstraintMissingKind, evidence.missingKinds)
    && match(query.dataLayoutConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.dataLayoutConstraintEvidenceId, evidence.evidenceIds);
}

export function dataLayoutConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  const explicit = matchingDataLayoutInput(input, route, routeEvidence);
  const sourceDataLayoutRecords = [...(explicit?.sourceDataLayoutRecords ?? []), ...(explicit?.dataLayoutRecords ?? []), ...(explicit?.layoutRecords ?? []), ...(explicit?.abiRecords ?? []), ...(explicit?.representationRecords ?? []), ...routeImports.flatMap(dataLayoutRecordsFromImport)];
  const targetDataLayoutRecords = [...(explicit?.targetDataLayoutRecords ?? [])];
  if (!explicit && !sourceDataLayoutRecords.length && !targetDataLayoutRecords.length) return undefined;
  return createUniversalDataLayoutConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceDataLayoutRecords, targetDataLayoutRecords, evidenceIds: routeEvidence.map((record) => record?.id).filter(Boolean) });
}

function normalizeDataLayoutRecords(role, records) {
  return (records ?? []).flatMap((record, index) => {
    const constraintKinds = dataLayoutConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_data_layout_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      layoutKind: record?.layoutKind ?? record?.kind ?? record?.representationKind,
      abiKind: record?.abiKind ?? record?.callingConvention,
      typeId: record?.typeId ?? record?.symbolId ?? record?.nodeId,
      structId: record?.structId,
      unionId: record?.unionId,
      enumId: record?.enumId,
      fieldId: record?.fieldId,
      bitfieldId: record?.bitfieldId,
      sizeBytes: record?.sizeBytes,
      alignmentBytes: record?.alignmentBytes,
      offsetBytes: record?.offsetBytes,
      endian: record?.endian ?? record?.endianness,
      pointerWidth: record?.pointerWidth,
      integerWidth: record?.integerWidth,
      floatFormat: record?.floatFormat,
      repr: record?.repr ?? record?.reprAttribute,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      constraintKinds,
      evidenceIds: record?.evidenceIds ?? []
    }];
  });
}

function dataLayoutRecordsFromImport(imported) {
  return [
    ...(imported?.dataLayoutConstraints ?? []),
    ...(imported?.dataLayoutRecords ?? []),
    ...(imported?.layoutRecords ?? []),
    ...(imported?.abiRecords ?? []),
    ...(imported?.representationRecords ?? []),
    ...(imported?.semanticIndex?.facts ?? []).filter(dataLayoutLikeRecord),
    ...(imported?.semanticIndex?.symbols ?? []).filter(dataLayoutLikeRecord),
    ...(imported?.nativeAst?.layouts ?? []),
    ...(imported?.nativeAst?.declarations ?? []).filter(dataLayoutLikeRecord)
  ];
}

function dataLayoutLikeRecord(record = {}) {
  const token = String([record.kind, record.layoutKind, record.representationKind, record.abiKind, record.callingConvention, record.repr, record.reprAttribute, record.endian, record.endianness, record.predicate, record.capability].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.sizeBytes || record.alignmentBytes || record.offsetBytes || record.bitfieldId || record.pointerWidth || record.integerWidth || record.floatFormat || /layout|abi|repr|alignment|padding|packed|bitfield|union|discriminant|tagged-union|endian|pointer-width|calling-convention|ffi|serialization|niche/.test(token));
}

function dataLayoutConstraintKinds(record = {}) {
  const tokens = uniqueStrings([
    record.layoutKind,
    record.kind,
    record.representationKind,
    record.abiKind,
    record.callingConvention,
    record.repr,
    record.reprAttribute,
    record.endian,
    record.endianness,
    record.predicate,
    record.capability,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? []),
    record.sizeBytes !== undefined ? 'type-size' : undefined,
    record.alignmentBytes !== undefined ? 'alignment' : undefined,
    record.offsetBytes !== undefined ? 'field-offset' : undefined,
    record.fieldOrder ? 'field-order' : undefined,
    record.packed === true ? 'packed-layout' : undefined,
    record.bitfieldId ? 'bitfield-layout' : undefined,
    record.unionId ? 'union-layout' : undefined,
    record.enumId ? 'enum-discriminant' : undefined,
    record.pointerWidth ? 'pointer-width' : undefined,
    record.integerWidth ? 'integer-width' : undefined,
    record.floatFormat ? 'float-format' : undefined
  ].filter(Boolean).map((value) => String(value).toLowerCase()));
  return uniqueStrings(tokens.flatMap(dataLayoutKindForToken));
}

function dataLayoutKindForToken(token) {
  const kinds = [];
  if (/type-size|sizeof|object-size|layout-size|\bsize\b/.test(token)) kinds.push('type-size');
  if (/align|alignment/.test(token)) kinds.push('alignment');
  if (/field-order|member-order|declaration-order/.test(token)) kinds.push('field-order');
  if (/field-offset|offset|offsetof/.test(token)) kinds.push('field-offset');
  if (/padding|pad-byte|tail-padding/.test(token)) kinds.push('padding');
  if (/packed-layout|packed|repr\(packed\)|pragma-pack/.test(token)) kinds.push('packed-layout');
  if (/bitfield|bit-field|bitfield-layout/.test(token)) kinds.push('bitfield-layout');
  if (/union-layout|union|variant-overlay/.test(token)) kinds.push('union-layout');
  if (/enum-discriminant|discriminant|tag-value/.test(token)) kinds.push('enum-discriminant');
  if (/tagged-union|sum-type-tag|variant-tag/.test(token)) kinds.push('tagged-union');
  if (/endian|endianness|big-endian|little-endian/.test(token)) kinds.push('endianness');
  if (/integer-width|int-width|u32|i32|usize|isize/.test(token)) kinds.push('integer-width');
  if (/float-format|ieee|float32|float64|f32|f64/.test(token)) kinds.push('float-format');
  if (/pointer-width|address-width|word-size/.test(token)) kinds.push('pointer-width');
  if (/abi-calling-convention|calling-convention|cdecl|stdcall|fastcall|system-v|aapcs/.test(token)) kinds.push('abi-calling-convention');
  if (/ffi-boundary|extern|foreign-function|native-bridge/.test(token)) kinds.push('ffi-boundary');
  if (/serialization-layout|wire-layout|binary-format|codec-layout/.test(token)) kinds.push('serialization-layout');
  if (/nullable-representation|null-pointer-optimization|nullable-pointer/.test(token)) kinds.push('nullable-representation');
  if (/niche-optimization|niche|option-layout/.test(token)) kinds.push('niche-optimization');
  if (/repr-attribute|repr\(|layout-attribute/.test(token)) kinds.push('repr-attribute');
  if (/layout-stability|stable-layout|abi-stable/.test(token)) kinds.push('layout-stability');
  if (!kinds.length && (token === 'layout' || token === 'data-layout' || token === 'abi')) kinds.push('data-layout');
  return kinds;
}

function representedDataLayoutKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function dataLayoutMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  const preserveSource = input.mode === 'preserve-source' && sameLanguage(input.sourceLanguage, input.target);
  return uniqueStrings([
    ...(targetRecords.length || preserveSource ? [] : ['translation-data-layout-target-evidence']),
    ...(missingKinds.length ? ['translation-data-layout-proof'] : []),
    ...(missingKinds.map((kind) => `translation-data-layout:${kind}`)),
    ...(input.missingEvidence ?? [])
  ]);
}

function dataLayoutReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Data-layout constraints are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length ? ['Source representation/ABI semantics are not represented by target data-layout evidence.'] : []),
    ...(input.review ?? [])
  ]);
}

function dataLayoutStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function dataLayoutAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-data-layout-evidence';
  if (status === 'degraded') return 'review-data-layout-loss';
  if (status === 'satisfied') return 'attach-data-layout-record';
  return 'skip';
}

function dataLayoutConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceDataLayoutIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetDataLayoutIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['type-size', 'alignment', 'field-order', 'field-offset', 'packed-layout', 'bitfield-layout', 'union-layout', 'enum-discriminant', 'endianness', 'pointer-width', 'abi-calling-convention', 'ffi-boundary', 'layout-stability'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingDataLayoutInput(input, route, routeEvidence) {
  const candidates = [input.dataLayoutConstraint, input.translationDataLayoutConstraint, ...(input.dataLayoutConstraints ?? []), ...routeEvidence.map((record) => record?.dataLayoutConstraint ?? record?.translationDataLayoutConstraint)].filter(Boolean);
  return candidates.find((candidate) => routeMatch(candidate, route));
}

function routeMatch(candidate, route) {
  return (!candidate.routeId || candidate.routeId === route.id)
    && (!candidate.sourceLanguage || candidate.sourceLanguage === route.sourceLanguage)
    && (!candidate.target || candidate.target === route.target);
}

function sameLanguage(source, target) {
  return String(source ?? '').toLowerCase() === String(target ?? '').toLowerCase();
}

function match(filter, values) {
  const filters = Array.isArray(filter) ? filter : filter === undefined ? [] : [filter];
  if (!filters.length) return true;
  const valueSet = new Set((values ?? []).filter(Boolean).map(String));
  return filters.some((item) => valueSet.has(String(item)));
}
