import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalSerializationSemanticsConstraintStatuses = Object.freeze(['not-applicable', 'satisfied', 'degraded', 'needs-evidence', 'blocked']);

export function createUniversalSerializationSemanticsConstraintEvidence(input = {}) {
  input = input ?? {};
  const route = input.route ?? {};
  const routeId = input.routeId ?? route.id;
  const sourceLanguage = input.sourceLanguage ?? route.sourceLanguage;
  const target = input.target ?? route.target;
  const mode = input.mode ?? route.mode;
  const sourceRecords = normalizeSerializationRecords('source', [
    ...(input.sourceSerializationSemanticsRecords ?? []), ...(input.serializationSemanticsRecords ?? []), ...(input.serializationRecords ?? []),
    ...(input.wireFormatRecords ?? []), ...(input.codecRecords ?? []), ...(input.schemaRecords ?? []),
    ...(input.sourceSerializationSemanticsConstraints ?? []), ...(input.serializationSemanticsConstraints ?? []),
    ...(input.imports ?? []).flatMap(serializationRecordsFromImport)
  ]);
  const targetRecords = normalizeSerializationRecords('target', [
    ...(input.targetSerializationSemanticsRecords ?? []), ...(input.targetSerializationSemanticsConstraints ?? [])
  ]);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedSerializationKinds(requiredKinds, targetRecords, { mode, sameLanguage: sameLanguage(sourceLanguage, target) });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const context = { ...input, route, routeId, sourceLanguage, target, mode, preserveSource: mode === 'preserve-source' && sameLanguage(sourceLanguage, target) };
  const missingEvidence = serializationMissingEvidence(missingKinds, sourceRecords, targetRecords, context);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = serializationReview(missingKinds, sourceRecords, targetRecords, context);
  const status = serializationStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalSerializationSemanticsConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalSerializationSemanticsConstraintEvidence.v1',
    id: input.id ?? `serialization_semantics_constraints_${idFragment(routeId ?? `${sourceLanguage ?? 'source'}_${target ?? 'target'}`)}`,
    routeId, sourceLanguage, target, status, action: serializationAction(status),
    requiredKinds, representedKinds, missingKinds, missingEvidence, blockers, review, sourceRecords, targetRecords,
    serializationSemanticsConstraints: requiredKinds.map((kind) => serializationConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]),
    claims: { serializationEquivalenceClaim: false, wireEquivalenceClaim: false, roundtripEquivalenceClaim: false, semanticEquivalenceClaim: false, autoMergeClaim: false },
    metadata: { note: 'Serialization-semantics constraints model wire-format behavior for translation admission. They are not proof of equivalent target execution.', ...(input.metadata ?? {}) }
  };
}

export function serializationSemanticsConstraintMatches(evidence = {}, query = {}) {
  return match(query.serializationSemanticsConstraintStatus, [evidence.status])
    && match(query.serializationSemanticsConstraintAction, [evidence.action])
    && match(query.serializationSemanticsConstraintRequiredKind, evidence.requiredKinds)
    && match(query.serializationSemanticsConstraintRepresentedKind, evidence.representedKinds)
    && match(query.serializationSemanticsConstraintMissingKind, evidence.missingKinds)
    && match(query.serializationSemanticsConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.serializationSemanticsConstraintEvidenceId, evidence.evidenceIds);
}

export function serializationSemanticsConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  input = input ?? {};
  route = route ?? {};
  const explicit = matchingSerializationInput(input, route, routeEvidence);
  const sourceRecords = [
    ...(explicit?.sourceSerializationSemanticsRecords ?? []), ...(explicit?.serializationSemanticsRecords ?? []), ...(explicit?.serializationRecords ?? []),
    ...(explicit?.wireFormatRecords ?? []), ...(explicit?.codecRecords ?? []), ...(explicit?.schemaRecords ?? []),
    ...(explicit?.sourceSerializationSemanticsConstraints ?? []), ...(explicit?.serializationSemanticsConstraints ?? []), ...routeImports.flatMap(serializationRecordsFromImport)
  ];
  const targetRecords = [...(explicit?.targetSerializationSemanticsRecords ?? []), ...(explicit?.targetSerializationSemanticsConstraints ?? [])];
  if (!explicit && !sourceRecords.length && !targetRecords.length) return undefined;
  return createUniversalSerializationSemanticsConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceSerializationSemanticsRecords: sourceRecords, targetSerializationSemanticsRecords: targetRecords, evidenceIds: uniqueStrings([...(explicit?.evidenceIds ?? []), ...routeEvidence.map((record) => record?.id).filter(Boolean)]) });
}

function normalizeSerializationRecords(role, records) {
  return uniqueSerializationRecords((records ?? []).flatMap((record, index) => {
    const constraintKinds = serializationConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_serialization_${index + 1}_${idFragment(constraintKinds.join('_'))}`, role: record?.role ?? role,
      name: record?.name ?? record?.symbolName ?? record?.typeName ?? record?.schemaName, symbolId: record?.symbolId ?? record?.id,
      format: record?.format ?? record?.wireFormat ?? record?.serializationFormat ?? record?.kind, codec: record?.codec ?? record?.runtimeCodec,
      schema: record?.schema ?? record?.schemaName ?? record?.schemaId, fieldNaming: record?.fieldNaming ?? record?.naming, fieldOrder: record?.fieldOrder ?? record?.order,
      omittedFields: record?.omittedFields ?? record?.omissionPolicy, defaultValues: record?.defaultValues ?? record?.defaultValueSemantics,
      nullSemantics: record?.nullSemantics ?? record?.nullability, unknownFields: record?.unknownFields ?? record?.unknownFieldPolicy,
      enumEncoding: record?.enumEncoding ?? record?.tagEncoding, endianness: record?.endianness, alignment: record?.alignment, varint: record?.varint ?? record?.varintEncoding,
      schemaVersion: record?.schemaVersion ?? record?.version, compatibility: record?.compatibility, canonicalization: record?.canonicalization, deterministic: record?.deterministic,
      precision: record?.precision ?? record?.precisionLoss, roundtrip: record?.roundtrip ?? record?.roundtripStability, validation: record?.validation,
      escaping: record?.escaping ?? record?.securityEscaping, streaming: record?.streaming, framing: record?.framing, constraintKinds,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path, sourceHash: record?.sourceHash, sourceSpan: record?.sourceSpan, evidenceIds: record?.evidenceIds ?? []
    }];
  }));
}

function serializationRecordsFromImport(imported) {
  return uniqueSerializationRecords([
    ...(imported?.serializationSemanticsConstraints ?? []), ...(imported?.serializationSemanticsRecords ?? []), ...(imported?.serializationRecords ?? []),
    ...(imported?.wireFormatRecords ?? []), ...(imported?.codecRecords ?? []), ...(imported?.schemaRecords ?? []),
    ...(imported?.semanticIndex?.symbols ?? []).filter(serializationLikeRecord), ...(imported?.semanticIndex?.facts ?? []).filter(serializationLikeRecord),
    ...(imported?.nativeAst?.declarations ?? []).filter(serializationLikeRecord), ...(imported?.nativeAst?.expressions ?? []).filter(serializationLikeRecord)
  ]);
}

function serializationLikeRecord(record = {}) {
  const token = String([record.kind, record.format, record.wireFormat, record.serializationFormat, record.codec, record.schema, record.schemaName, record.fieldNaming, record.fieldOrder, record.enumEncoding, record.tagEncoding, record.endianness, record.canonicalization, record.framing].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.format || record.wireFormat || record.codec || record.schema || record.fieldNaming || record.unknownFieldPolicy || record.enumEncoding || record.endianness || record.canonicalization || /json|yaml|toml|xml|protobuf|proto|avro|msgpack|cbor|bincode|serde|codec|serialize|deserialize|wire|schema|field|enum|tag|endianness|varint|canonical|roundtrip|framing/.test(token));
}

function serializationConstraintKinds(record = {}) {
  const primitiveToken = typeof record === 'string' || typeof record === 'number' || typeof record === 'boolean' ? record : undefined;
  const tokens = uniqueStrings([
    primitiveToken, record.format, record.wireFormat, record.serializationFormat, record.kind, record.codec, record.runtimeCodec, record.schema, record.schemaName, record.schemaId,
    record.fieldNaming, record.naming, record.fieldOrder, record.order, record.omittedFields, record.omissionPolicy, record.defaultValues, record.defaultValueSemantics,
    record.nullSemantics, record.nullability, record.unknownFields, record.unknownFieldPolicy, record.enumEncoding, record.tagEncoding, record.endianness, record.alignment,
    record.varint, record.varintEncoding, record.schemaVersion, record.version, record.compatibility, record.canonicalization, record.deterministic, record.precision,
    record.precisionLoss, record.roundtrip, record.roundtripStability, record.validation, record.escaping, record.securityEscaping, record.streaming, record.framing,
    ...(record.constraintKinds ?? []), ...(record.factKinds ?? []), ...(record.metadata?.factKinds ?? [])
  ].filter(Boolean).map(normalizeToken));
  return uniqueStrings(tokens.flatMap(serializationKindForToken));
}

function serializationKindForToken(token) {
  const kinds = [];
  if (/json|yaml|toml|xml|protobuf|proto|avro|msgpack|messagepack|cbor|bincode|serde|serialize|deserialize|wire-format|codec|format/.test(token)) kinds.push('serialization-format');
  if (/wire|payload|document|binary|text/.test(token)) kinds.push('wire-format');
  if (/field-name|field-naming|camel|snake|kebab|rename/.test(token)) kinds.push('field-naming');
  if (/field-order|order|stable-order|sorted/.test(token)) kinds.push('field-order');
  if (/omit|optional|default|default-value|skip-serializing/.test(token)) kinds.push('default-values');
  if (/null|nil|none|undefined|nullable/.test(token)) kinds.push('nullability');
  if (/unknown|extra-field|forward-compatible|backward-compatible/.test(token)) kinds.push('unknown-fields');
  if (/enum|tag|discriminant|variant/.test(token)) kinds.push('enum-tagging');
  if (/endian|little-endian|big-endian/.test(token)) kinds.push('binary-endianness');
  if (/align|padding|packed/.test(token)) kinds.push('binary-alignment');
  if (/varint|zigzag|leb128/.test(token)) kinds.push('varint-encoding');
  if (/schema|version|migration|compatib/.test(token)) kinds.push('schema-versioning');
  if (/canonical|canonicalization/.test(token)) kinds.push('canonicalization');
  if (/deterministic|stable-output|stable-encoding/.test(token)) kinds.push('deterministic-output');
  if (/precision|loss|rounding|decimal|float/.test(token)) kinds.push('precision-loss');
  if (/roundtrip|decode-encode|encode-decode/.test(token)) kinds.push('roundtrip-stability');
  if (/validate|validation|required/.test(token)) kinds.push('validation');
  if (/escape|escaping|injection|xss|security/.test(token)) kinds.push('security-escaping');
  if (/stream|streaming|frame|framing|delimiter|chunk/.test(token)) kinds.push('streaming-framing');
  if (/runtime|codec|library|dependency/.test(token)) kinds.push('codec-runtime');
  return kinds;
}

function representedSerializationKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function serializationMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  return uniqueStrings([
    ...(targetRecords.length || input.preserveSource ? [] : ['translation-serialization-semantics-target-evidence']),
    ...(missingKinds.length ? ['translation-serialization-semantics-proof'] : []),
    ...missingKinds.map((kind) => `translation-serialization-semantics:${kind}`),
    ...(input.missingEvidence ?? [])
  ]);
}

function serializationReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Serialization semantics are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length && !input.preserveSource ? ['Source wire-format behavior is not represented by target serialization-semantics evidence.'] : []),
    ...(missingKinds.some((kind) => ['field-naming', 'field-order', 'default-values', 'nullability', 'unknown-fields'].includes(kind)) ? ['Field naming, ordering, defaults, nulls, and unknown-field behavior require explicit target proof.'] : []),
    ...(missingKinds.some((kind) => ['enum-tagging', 'binary-endianness', 'binary-alignment', 'varint-encoding'].includes(kind)) ? ['Enum tags, binary endian/alignment, and varint semantics require source-bound target evidence.'] : []),
    ...(missingKinds.some((kind) => ['schema-versioning', 'canonicalization', 'deterministic-output', 'precision-loss', 'roundtrip-stability'].includes(kind)) ? ['Schema compatibility, canonical output, determinism, precision, and roundtrip stability require explicit proof.'] : []),
    ...(missingKinds.some((kind) => ['validation', 'security-escaping', 'streaming-framing', 'codec-runtime'].includes(kind)) ? ['Validation, escaping/security, streaming/framing, and codec runtime dependencies require explicit proof.'] : []),
    ...(input.review ?? [])
  ]);
}

function serializationStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function serializationAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-serialization-semantics-evidence';
  if (status === 'degraded') return 'review-serialization-semantics-loss';
  if (status === 'satisfied') return 'attach-serialization-semantics-record';
  return 'skip';
}

function serializationConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind, status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceSerializationSemanticsIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetSerializationSemanticsIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['field-naming', 'field-order', 'default-values', 'nullability', 'unknown-fields', 'enum-tagging', 'binary-endianness', 'varint-encoding', 'schema-versioning', 'canonicalization', 'precision-loss', 'roundtrip-stability', 'security-escaping', 'streaming-framing'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingSerializationInput(input, route, routeEvidence) {
  const candidates = [input.serializationSemanticsConstraint, input.translationSerializationSemanticsConstraint, ...(input.serializationSemanticsConstraints ?? []), ...routeEvidence.flatMap(serializationCandidatesFromRouteEvidence)].filter(Boolean);
  return candidates.find((candidate) => routeMatch(candidate, route));
}

function serializationCandidatesFromRouteEvidence(record) {
  if (!record) return [];
  return [record.serializationSemanticsConstraint, record.translationSerializationSemanticsConstraint, serializationEvidenceRecord(record) ? record : undefined, ...(record.serializationSemanticsConstraints ?? []), ...(record.translationSerializationSemanticsConstraints ?? [])].filter(Boolean);
}

function serializationEvidenceRecord(record) {
  return record?.kind === 'frontier.lang.universalSerializationSemanticsConstraintEvidence' || record?.schema === 'frontier.lang.universalSerializationSemanticsConstraintEvidence.v1' || Boolean((record?.sourceRecords?.length || record?.targetRecords?.length) && record?.serializationSemanticsConstraints?.length);
}

function routeMatch(candidate, route = {}) {
  return (!candidate.routeId || String(candidate.routeId) === String(route.id))
    && (!candidate.sourceLanguage || normalizeToken(candidate.sourceLanguage) === normalizeToken(route.sourceLanguage))
    && (!candidate.target || normalizeToken(candidate.target) === normalizeToken(route.target));
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

function uniqueSerializationRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    if (!record) return false;
    const key = record.id ?? record.symbolId ?? [record.name, record.kind, record.format, record.wireFormat, record.codec, record.schema].filter(Boolean).join(':') ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
