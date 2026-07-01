import { idFragment, uniqueStrings } from './native-import-utils.js';

export const UniversalTextSemanticsConstraintStatuses = Object.freeze(['not-applicable', 'satisfied', 'degraded', 'needs-evidence', 'blocked']);

export function createUniversalTextSemanticsConstraintEvidence(input = {}) {
  input = input ?? {};
  const route = input.route ?? {};
  const routeId = input.routeId ?? route.id;
  const sourceLanguage = input.sourceLanguage ?? route.sourceLanguage;
  const target = input.target ?? route.target;
  const mode = input.mode ?? route.mode;
  const sourceRecords = normalizeTextRecords('source', [
    ...(input.sourceTextSemanticsRecords ?? []),
    ...(input.textSemanticsRecords ?? []),
    ...(input.textRecords ?? []),
    ...(input.stringRecords ?? []),
    ...(input.stringTypes ?? []),
    ...(input.sourceTextSemanticsConstraints ?? []),
    ...(input.textSemanticsConstraints ?? []),
    ...(input.imports ?? []).flatMap(textRecordsFromImport)
  ]);
  const targetRecords = normalizeTextRecords('target', [
    ...(input.targetTextSemanticsRecords ?? []),
    ...(input.targetTextSemanticsConstraints ?? [])
  ]);
  const requiredKinds = uniqueStrings(sourceRecords.flatMap((record) => record.constraintKinds));
  const representedKinds = representedTextKinds(requiredKinds, targetRecords, { mode, sameLanguage: sameLanguage(sourceLanguage, target) });
  const missingKinds = requiredKinds.filter((kind) => !representedKinds.includes(kind));
  const context = { ...input, route, routeId, sourceLanguage, target, mode, preserveSource: mode === 'preserve-source' && sameLanguage(sourceLanguage, target) };
  const missingEvidence = textMissingEvidence(missingKinds, sourceRecords, targetRecords, context);
  const blockers = uniqueStrings([...(input.blockers ?? [])]);
  const review = textReview(missingKinds, sourceRecords, targetRecords, context);
  const status = textStatus({ sourceRecords, targetRecords, requiredKinds, missingEvidence, blockers });
  return {
    kind: 'frontier.lang.universalTextSemanticsConstraintEvidence',
    version: 1,
    schema: 'frontier.lang.universalTextSemanticsConstraintEvidence.v1',
    id: input.id ?? `text_semantics_constraints_${idFragment(routeId ?? `${sourceLanguage ?? 'source'}_${target ?? 'target'}`)}`,
    routeId,
    sourceLanguage,
    target,
    status,
    action: textAction(status),
    requiredKinds,
    representedKinds,
    missingKinds,
    missingEvidence,
    blockers,
    review,
    sourceRecords,
    targetRecords,
    textSemanticsConstraints: requiredKinds.map((kind) => textConstraintRecord(kind, sourceRecords, targetRecords, representedKinds)),
    evidenceIds: uniqueStrings([...(input.evidenceIds ?? []), ...sourceRecords.flatMap((record) => record.evidenceIds ?? []), ...targetRecords.flatMap((record) => record.evidenceIds ?? [])]),
    claims: { textEquivalenceClaim: false, unicodeEquivalenceClaim: false, regexEquivalenceClaim: false, semanticEquivalenceClaim: false, autoMergeClaim: false },
    metadata: { note: 'Text-semantics constraints model string, Unicode, regex, and byte/text boundary behavior for translation admission. They are not proof of equivalent target execution.', ...(input.metadata ?? {}) }
  };
}

export function textSemanticsConstraintMatches(evidence = {}, query = {}) {
  return match(query.textSemanticsConstraintStatus, [evidence.status])
    && match(query.textSemanticsConstraintAction, [evidence.action])
    && match(query.textSemanticsConstraintRequiredKind, evidence.requiredKinds)
    && match(query.textSemanticsConstraintRepresentedKind, evidence.representedKinds)
    && match(query.textSemanticsConstraintMissingKind, evidence.missingKinds)
    && match(query.textSemanticsConstraintMissingEvidence, evidence.missingEvidence)
    && match(query.textSemanticsConstraintEvidenceId, evidence.evidenceIds);
}

export function textSemanticsConstraintForConversionRoute(input = {}, route = {}, routeImports = [], routeEvidence = []) {
  input = input ?? {};
  route = route ?? {};
  const explicit = matchingTextInput(input, route, routeEvidence);
  const sourceRecords = [
    ...(explicit?.sourceTextSemanticsRecords ?? []),
    ...(explicit?.textSemanticsRecords ?? []),
    ...(explicit?.textRecords ?? []),
    ...(explicit?.stringRecords ?? []),
    ...(explicit?.stringTypes ?? []),
    ...(explicit?.sourceTextSemanticsConstraints ?? []),
    ...(explicit?.textSemanticsConstraints ?? []),
    ...routeImports.flatMap(textRecordsFromImport)
  ];
  const targetRecords = [...(explicit?.targetTextSemanticsRecords ?? []), ...(explicit?.targetTextSemanticsConstraints ?? [])];
  if (!explicit && !sourceRecords.length && !targetRecords.length) return undefined;
  return createUniversalTextSemanticsConstraintEvidence({ ...explicit, route, routeId: route.id, sourceLanguage: route.sourceLanguage, target: route.target, mode: route.mode, imports: routeImports, sourceTextSemanticsRecords: sourceRecords, targetTextSemanticsRecords: targetRecords, evidenceIds: uniqueStrings([...(explicit?.evidenceIds ?? []), ...routeEvidence.map((record) => record?.id).filter(Boolean)]) });
}

function normalizeTextRecords(role, records) {
  return uniqueTextRecords((records ?? []).flatMap((record, index) => {
    const constraintKinds = textConstraintKinds(record);
    if (!constraintKinds.length) return [];
    return [{
      id: record?.id ?? `${role}_text_${index + 1}_${idFragment(constraintKinds.join('_'))}`,
      role: record?.role ?? role,
      name: record?.name ?? record?.symbolName ?? record?.typeName ?? record?.stringTypeName,
      symbolId: record?.symbolId ?? record?.id,
      textKind: record?.textKind ?? record?.stringKind ?? record?.kind ?? record?.typeKind ?? record?.valueKind,
      encoding: record?.encoding ?? record?.charset ?? record?.codepage,
      codeUnit: record?.codeUnit ?? record?.codeUnitWidth,
      indexingUnit: record?.indexingUnit ?? record?.indexUnit,
      normalizationForm: record?.normalizationForm ?? record?.normalization,
      locale: record?.locale ?? record?.localePolicy,
      collation: record?.collation ?? record?.collationPolicy,
      caseMapping: record?.caseMapping ?? record?.caseFolding,
      regexEngine: record?.regexEngine ?? record?.regexFlavor,
      escapeMode: record?.escapeMode ?? record?.escaping,
      interpolationMode: record?.interpolationMode ?? record?.interpolation,
      termination: record?.termination ?? record?.nullTermination,
      boundaryKinds: list(record?.boundaryKinds, record?.boundaries, record?.boundaryKind, record?.byteBoundary),
      mutability: record?.mutability ?? record?.stringMutability,
      constraintKinds,
      sourcePath: record?.sourcePath ?? record?.sourceSpan?.path,
      sourceHash: record?.sourceHash,
      sourceSpan: record?.sourceSpan,
      evidenceIds: record?.evidenceIds ?? []
    }];
  }));
}

function textRecordsFromImport(imported) {
  return uniqueTextRecords([
    ...(imported?.textSemanticsConstraints ?? []),
    ...(imported?.textSemanticsRecords ?? []),
    ...(imported?.textRecords ?? []),
    ...(imported?.stringRecords ?? []),
    ...(imported?.stringTypes ?? []),
    ...(imported?.semanticIndex?.symbols ?? []).filter(textLikeRecord),
    ...(imported?.semanticIndex?.facts ?? []).filter(textLikeRecord),
    ...(imported?.nativeAst?.declarations ?? []).filter(textLikeRecord),
    ...(imported?.nativeAst?.expressions ?? []).filter(textLikeRecord)
  ]);
}

function textLikeRecord(record = {}) {
  const token = String([record.kind, record.textKind, record.stringKind, record.typeKind, record.valueKind, record.operator, record.predicate, record.capability, record.encoding, record.regexEngine].filter(Boolean).join(' ')).toLowerCase();
  return Boolean(record.encoding || record.charset || record.codeUnit || record.indexingUnit || record.normalizationForm || record.locale || record.collation || record.regexEngine || record.escapeMode || record.interpolationMode || /text|string|unicode|utf-|utf8|utf16|code-unit|code-point|grapheme|normalization|locale|collation|case|regex|regexp|escape|interpolation|null-terminat|byte-boundary/.test(token));
}

function textConstraintKinds(record = {}) {
  const primitiveToken = typeof record === 'string' || typeof record === 'number' || typeof record === 'boolean' ? record : undefined;
  const tokens = uniqueStrings([
    primitiveToken,
    record.textKind,
    record.stringKind,
    record.kind,
    record.typeKind,
    record.valueKind,
    record.operator,
    record.predicate,
    record.capability,
    record.encoding,
    record.charset,
    record.codepage,
    record.codeUnit,
    record.codeUnitWidth,
    record.indexingUnit,
    record.indexUnit,
    record.normalizationForm,
    record.normalization,
    record.locale,
    record.localePolicy,
    record.collation,
    record.collationPolicy,
    record.caseMapping,
    record.caseFolding,
    record.regexEngine,
    record.regexFlavor,
    record.escapeMode,
    record.escaping,
    record.interpolationMode,
    record.interpolation,
    record.termination,
    record.nullTermination,
    record.byteBoundary,
    record.mutability,
    record.stringMutability,
    ...(record.constraintKinds ?? []),
    ...(record.factKinds ?? []),
    ...(record.metadata?.factKinds ?? [])
  ].filter(Boolean).map(normalizeToken));
  return uniqueStrings(tokens.flatMap(textKindForToken));
}

function textKindForToken(token) {
  const kinds = [];
  if (/text|string|str|char|character|rune|symbol/.test(token)) kinds.push('text-type');
  if (/utf|utf-8|utf8|utf-16|utf16|utf-32|utf32|ascii|latin|charset|encoding|codepage/.test(token)) kinds.push('encoding');
  if (/code-unit|unit-width|utf-16-unit|u16/.test(token)) kinds.push('code-unit');
  if (/code-point|unicode-scalar|rune|scalar/.test(token)) kinds.push('code-point');
  if (/grapheme|cluster|user-perceived/.test(token)) kinds.push('grapheme-cluster');
  if (/index|offset|length|char-at/.test(token)) kinds.push('indexing-semantics');
  if (/slice|substring|substr|range/.test(token)) kinds.push('slicing-semantics');
  if (/normalization|normalize|nfc|nfd|nfkc|nfkd|canonical/.test(token)) kinds.push('normalization');
  if (/locale|intl|culture/.test(token)) kinds.push('locale');
  if (/collation|sort|compare|string-comparison/.test(token)) kinds.push('collation');
  if (/case|casefold|case-fold|lower|upper|title/.test(token)) kinds.push('case-mapping');
  if (/regex|regexp|regular-expression|lookbehind|unicode-flag/.test(token)) kinds.push('regex-semantics');
  if (/escape|escaping|quote|raw-string/.test(token)) kinds.push('escaping');
  if (/interpolation|template|string-template|format/.test(token)) kinds.push('interpolation');
  if (/null-terminat|nul-terminat|c-string|cstring/.test(token)) kinds.push('null-termination');
  if (/byte|bytes|buffer|binary|boundary|transcode|decode|encode/.test(token)) kinds.push('byte-text-boundary');
  if (/mutable|immutable|copy-on-write|cow/.test(token)) kinds.push('string-mutability');
  return kinds;
}

function representedTextKinds(requiredKinds, targetRecords, options) {
  if (options.sameLanguage && options.mode === 'preserve-source') return requiredKinds;
  const targetKinds = uniqueStrings(targetRecords.flatMap((record) => record.constraintKinds));
  return requiredKinds.filter((kind) => targetKinds.includes(kind));
}

function textMissingEvidence(missingKinds, sourceRecords, targetRecords, input) {
  if (!sourceRecords.length) return [];
  return uniqueStrings([
    ...(targetRecords.length || input.preserveSource ? [] : ['translation-text-semantics-target-evidence']),
    ...(missingKinds.length ? ['translation-text-semantics-proof'] : []),
    ...missingKinds.map((kind) => `translation-text-semantics:${kind}`),
    ...(input.missingEvidence ?? [])
  ]);
}

function textReview(missingKinds, sourceRecords, targetRecords, input) {
  return uniqueStrings([
    ...(missingKinds.length ? [`Text semantics are missing target evidence for: ${missingKinds.join(', ')}.`] : []),
    ...(sourceRecords.length && !targetRecords.length && !input.preserveSource ? ['Source text behavior is not represented by target text-semantics evidence.'] : []),
    ...(missingKinds.some((kind) => ['encoding', 'code-unit', 'code-point', 'grapheme-cluster', 'byte-text-boundary'].includes(kind)) ? ['Unicode encoding, indexing unit, grapheme, and byte/text boundaries require explicit target proof.'] : []),
    ...(missingKinds.some((kind) => ['normalization', 'locale', 'collation', 'case-mapping'].includes(kind)) ? ['Normalization, locale, collation, and case mapping require source-bound target evidence.'] : []),
    ...(missingKinds.includes('regex-semantics') ? ['Regex engine, flag, capture, backtracking, and Unicode-mode semantics require explicit target proof.'] : []),
    ...(missingKinds.some((kind) => ['escaping', 'interpolation', 'null-termination', 'string-mutability'].includes(kind)) ? ['Escaping, interpolation, null termination, or mutability semantics require explicit target proof.'] : []),
    ...(input.review ?? [])
  ]);
}

function textStatus(input) {
  if (!input.sourceRecords.length && !input.targetRecords.length) return 'not-applicable';
  if (input.blockers.length) return 'blocked';
  if (input.missingEvidence.length) return input.targetRecords.length ? 'degraded' : 'needs-evidence';
  return input.requiredKinds.length ? 'satisfied' : 'not-applicable';
}

function textAction(status) {
  if (status === 'blocked') return 'reject';
  if (status === 'needs-evidence') return 'collect-text-semantics-evidence';
  if (status === 'degraded') return 'review-text-semantics-loss';
  if (status === 'satisfied') return 'attach-text-semantics-record';
  return 'skip';
}

function textConstraintRecord(kind, sourceRecords, targetRecords, representedKinds) {
  return {
    kind,
    status: representedKinds.includes(kind) ? 'represented' : 'missing',
    sourceTextSemanticsIds: sourceRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    targetTextSemanticsIds: targetRecords.filter((record) => record.constraintKinds.includes(kind)).map((record) => record.id),
    severity: ['encoding', 'code-unit', 'code-point', 'grapheme-cluster', 'indexing-semantics', 'slicing-semantics', 'normalization', 'locale', 'collation', 'case-mapping', 'regex-semantics', 'byte-text-boundary'].includes(kind) ? 'error' : 'warning'
  };
}

function matchingTextInput(input, route, routeEvidence) {
  const candidates = [input.textSemanticsConstraint, input.translationTextSemanticsConstraint, ...(input.textSemanticsConstraints ?? []), ...routeEvidence.flatMap(textCandidatesFromRouteEvidence)].filter(Boolean);
  return candidates.find((candidate) => routeMatch(candidate, route));
}

function textCandidatesFromRouteEvidence(record) {
  if (!record) return [];
  return [record.textSemanticsConstraint, record.translationTextSemanticsConstraint, textEvidenceRecord(record) ? record : undefined, ...(record.textSemanticsConstraints ?? []), ...(record.translationTextSemanticsConstraints ?? [])].filter(Boolean);
}

function textEvidenceRecord(record) {
  return record?.kind === 'frontier.lang.universalTextSemanticsConstraintEvidence' || record?.schema === 'frontier.lang.universalTextSemanticsConstraintEvidence.v1' || Boolean((record?.sourceRecords?.length || record?.targetRecords?.length) && record?.textSemanticsConstraints?.length);
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

function uniqueTextRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    if (!record) return false;
    const key = record.id ?? record.symbolId ?? [record.name, record.kind, record.textKind, record.stringKind, record.typeKind].filter(Boolean).join(':') ?? JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
