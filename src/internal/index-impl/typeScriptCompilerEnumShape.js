import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { computedEnumRuntimeValueHash } from './projectSymbolGraphCompilerEnumEquivalence.js';

const EnumRuntimeShapeProofKind = 'typescript-checker-public-api-enum-runtime-shape-evidence';

function compilerEnumShapeRecord(checker, identitySymbol, location, ts, options = {}) {
  const declarations = enumDeclarations(identitySymbol, ts);
  if (!declarations.length) return {};
  const baseMembers = declarations.flatMap((declaration, declarationOrdinal) => enumMemberRecords(checker, declaration, location, ts, declarationOrdinal));
  if (!baseMembers.length) return {};
  const constEnum = declarations.some((declaration) => hasModifier(declaration, ts, 'ConstKeyword'));
  const declareEnum = declarations.some((declaration) => hasModifier(declaration, ts, 'DeclareKeyword'));
  const enumRuntimeShapeHash = hashSemanticValue({
    kind: 'frontier.lang.typescript.compilerEnumRuntimeShapeEvidence.v1',
    constEnum,
    declareEnum,
    enumMembers: baseMembers.map(canonicalEnumMemberRecord)
  });
  const computedMemberCount = baseMembers.filter((member) => member.computed === true).length;
  const proofBridge = computedEnumRuntimeValueProofBridge(baseMembers, {
    sourcePath: options.sourcePath,
    sourceHash: options.sourceHash,
    enumName: stringValue(identitySymbol?.escapedName ?? identitySymbol?.name),
    enumRuntimeShapeHash,
    enumComputedMemberCount: computedMemberCount,
    constEnum,
    declareEnum
  }, options);
  const enumMembers = proofBridge.enumMembers;
  const counts = enumShapeCounts(enumMembers);
  const enumEmittedRuntimeShapeHash = emittedRuntimeShapeHash(enumMembers, { constEnum, declareEnum });
  return compactRecord({
    enumKind: constEnum ? 'const-enum' : 'enum',
    constEnum: constEnum || undefined,
    declareEnum: declareEnum || undefined,
    enumDeclarationCount: declarations.length || undefined,
    enumMemberCount: enumMembers.length,
    enumNumericMemberCount: counts.enumNumericMemberCount || undefined,
    enumStringMemberCount: counts.enumStringMemberCount || undefined,
    enumAutoMemberCount: counts.enumAutoMemberCount || undefined,
    enumComputedMemberCount: counts.enumComputedMemberCount || undefined,
    enumRuntimeShapeHash,
    enumEmittedRuntimeShapeHash,
    enumMembers,
    enumRuntimeShapeProof: {
      kind: EnumRuntimeShapeProofKind,
      status: 'passed',
      proofLevel: 'typescript-checker-public-api-enum-runtime-shape',
      checkerInvariant: 'enum member names, declaration order, initializer texts, and constant runtime values complete',
      requiredSignals: [
        'compiler-enum-member-count',
        'compiler-enum-member-names',
        'compiler-enum-member-value-texts',
        'compiler-enum-member-initializer-texts'
      ],
      enumRuntimeShapeHash,
      enumEmittedRuntimeShapeHash,
      enumMemberCount: enumMembers.length,
      computedEnumRuntimeValueHash: proofBridge.computedEnumRuntimeValueHash,
      computedEnumRuntimeValueProof: proofBridge.computedEnumRuntimeValueProof,
      ...counts,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false,
      runtimeEquivalenceClaim: false
    }
  });
}

function computedEnumRuntimeValueProofBridge(enumMembers, context, options) {
  const computedMembers = enumMembers.filter((member) => member.computed === true);
  if (!computedMembers.length) return { enumMembers };
  const candidate = computedEnumRuntimeValueCandidate({ ...context, enumMembers, computedMembers }, options);
  if (!candidate) return { enumMembers };
  const provedMembers = enumMembers.map((member) => member.computed === true
    ? { ...member, ...runtimeValueForMember(member, candidate) }
    : member);
  const computedValueHash = computedEnumRuntimeValueHash({
    enumRuntimeShapeHash: context.enumRuntimeShapeHash,
    enumMembers: provedMembers
  }, context);
  const emittedHash = emittedRuntimeShapeHash(provedMembers, context);
  const proof = compactRecord({
    id: candidate.id,
    evidenceId: candidate.evidenceId,
    evidenceIds: nonEmptyArray(arrayValue(candidate.evidenceIds)),
    schema: candidate.schema ?? 'frontier.lang.typescript.computedEnumRuntimeValueProof.v1',
    kind: candidate.kind,
    status: candidate.status,
    sourcePath: candidate.sourcePath ?? context.sourcePath,
    sourceHash: candidate.sourceHash ?? context.sourceHash,
    enumName: candidate.enumName ?? context.enumName,
    enumRuntimeShapeHash: candidate.enumRuntimeShapeHash ?? context.enumRuntimeShapeHash,
    enumEmittedRuntimeShapeHash: candidate.enumEmittedRuntimeShapeHash ?? emittedHash,
    enumComputedMemberCount: candidate.enumComputedMemberCount ?? computedMembers.length,
    computedMembers: nonEmptyArray(provedMembers.filter((member) => member.computed === true).map(runtimeValueProofMember)),
    computedEnumRuntimeValueHash: candidate.computedEnumRuntimeValueHash ?? computedValueHash,
    command: candidate.command,
    traceHash: candidate.traceHash,
    evidenceHash: candidate.evidenceHash,
    autoMergeClaim: candidate.autoMergeClaim ?? false,
    semanticEquivalenceClaim: candidate.semanticEquivalenceClaim ?? false,
    runtimeEquivalenceClaim: candidate.runtimeEquivalenceClaim ?? false,
    computedEnumRuntimeEvaluationEquivalenceClaim: candidate.computedEnumRuntimeEvaluationEquivalenceClaim ?? false
  });
  return {
    enumMembers: provedMembers,
    computedEnumRuntimeValueHash: computedValueHash,
    computedEnumRuntimeValueProof: proof
  };
}

function computedEnumRuntimeValueCandidate(context, options) {
  const provider = options.computedEnumRuntimeValueProofProvider ?? options.computedEnumRuntimeValueTraceProvider;
  const provided = typeof provider === 'function' ? safeCall(provider, undefined, {
    ...context,
    proofKind: 'frontier.lang.typescript.computedEnumRuntimeValueProof'
  }) : undefined;
  const candidates = [
    ...candidateList(provided),
    ...candidateList(options.computedEnumRuntimeValueProofs),
    ...candidateList(options.computedEnumRuntimeValueProof),
    ...candidateList(options.computedEnumRuntimeValueTraces)
  ];
  return candidates.find((candidate) => candidateMatches(candidate, context));
}

function candidateMatches(candidate, context) {
  if (!candidate || typeof candidate !== 'object') return false;
  if (candidate.sourcePath !== undefined && candidate.sourcePath !== context.sourcePath) return false;
  const candidateName = candidate.enumName ?? candidate.publicOwnerName ?? candidate.symbolName;
  if (candidateName !== undefined && candidateName !== context.enumName) return false;
  return true;
}

function candidateList(value) {
  if (Array.isArray(value)) return value.filter(objectValue);
  const object = objectValue(value);
  if (!object) return [];
  if (object.status || object.schema || object.kind || object.computedMembers || object.runtimeValues || object.enumMembers) return [object];
  return Object.values(object).filter(objectValue);
}

function runtimeValueForMember(member, candidate) {
  const runtimeValues = objectValue(candidate.runtimeValues);
  const directValue = runtimeValues?.[member.name];
  const record = candidateMemberRecords(candidate).find((item) => memberRecordMatches(item, member));
  return runtimeValueRecord(record ?? directValue);
}

function candidateMemberRecords(candidate) {
  return [
    ...arrayValue(candidate.computedMembers),
    ...arrayValue(candidate.members),
    ...arrayValue(candidate.enumMembers),
    ...arrayValue(candidate.values)
  ].filter((value) => value !== undefined && value !== null);
}

function memberRecordMatches(record, member) {
  if (!objectValue(record)) return false;
  if (record.declarationOrdinal !== undefined && record.ordinal !== undefined) {
    return Number(record.declarationOrdinal) === Number(member.declarationOrdinal)
      && Number(record.ordinal) === Number(member.ordinal);
  }
  if (record.ordinal !== undefined && Number(record.ordinal) === Number(member.ordinal)) return true;
  return record.name !== undefined && String(record.name) === String(member.name);
}

function runtimeValueRecord(value) {
  if (value === undefined || value === null) return {};
  const record = objectValue(value);
  if (!record) return { runtimeValueText: String(value), runtimeValueKind: typeof value };
  const raw = record.runtimeValue ?? record.value;
  return compactRecord({
    runtimeValueText: stringValue(record.runtimeValueText ?? record.valueText ?? (raw === undefined ? undefined : String(raw))),
    runtimeValueKind: stringValue(record.runtimeValueKind ?? record.valueKind ?? (raw === undefined ? undefined : typeof raw))
  });
}

function runtimeValueProofMember(member) {
  return compactRecord({
    name: member.name,
    ordinal: member.ordinal,
    declarationOrdinal: member.declarationOrdinal,
    initializerText: member.initializerText,
    runtimeValueText: member.runtimeValueText,
    runtimeValueKind: member.runtimeValueKind
  });
}

function emittedRuntimeShapeHash(enumMembers, context) {
  const erased = context.constEnum === true || context.declareEnum === true;
  return hashSemanticValue({
    kind: 'frontier.lang.typescript.enumEmittedRuntimeShape.v1',
    erased,
    entries: erased ? [] : enumMembers.flatMap(emittedRuntimeEntries)
  });
}

function emittedRuntimeEntries(member) {
  const valueText = member.runtimeValueText ?? member.valueText;
  const valueKind = member.runtimeValueKind ?? member.valueKind;
  const forward = compactRecord({ direction: 'forward', name: member.name, valueText, valueKind });
  const reverse = valueKind === 'number' ? compactRecord({ direction: 'reverse', valueText, name: member.name }) : undefined;
  return [forward, reverse].filter(Boolean);
}

function enumMemberRecords(checker, declaration, location, ts, declarationOrdinal) {
  return arrayValue(declaration.members).map((member, ordinal) => {
    const constantValue = safeCall(checker?.getConstantValue, checker, member);
    const initializerText = nodeText(member.initializer);
    const valueKind = constantValue === undefined ? undefined : typeof constantValue;
    return compactRecord({
      name: stringValue(member.name?.escapedText ?? member.name?.text ?? nodeText(member.name)),
      ordinal,
      declarationOrdinal,
      initializerText,
      valueText: constantValue === undefined ? undefined : String(constantValue),
      valueKind,
      auto: member.initializer ? undefined : true,
      computed: member.initializer && constantValue === undefined ? true : undefined,
      memberText: nodeText(member),
      memberTypeText: typeTextAt(checker, member.name ?? member, location)
    });
  });
}

function enumShapeCounts(records) {
  return {
    enumNumericMemberCount: records.filter((record) => record.valueKind === 'number').length,
    enumStringMemberCount: records.filter((record) => record.valueKind === 'string').length,
    enumAutoMemberCount: records.filter((record) => record.auto).length,
    enumComputedMemberCount: records.filter((record) => record.computed).length
  };
}

function enumDeclarations(identitySymbol, ts) {
  return arrayValue(identitySymbol?.declarations).filter((declaration) => declaration.kind === syntaxKind(ts, 'EnumDeclaration'));
}

function canonicalEnumMemberRecord(record) {
  return compactRecord({
    name: record.name,
    ordinal: record.ordinal,
    declarationOrdinal: record.declarationOrdinal,
    initializerText: record.initializerText,
    valueText: record.valueText,
    valueKind: record.valueKind,
    runtimeValueText: record.runtimeValueText,
    runtimeValueKind: record.runtimeValueKind,
    auto: record.auto,
    computed: record.computed
  });
}

function hasModifier(node, ts, kindName) {
  const kind = syntaxKind(ts, kindName);
  return kind !== undefined && arrayValue(node.modifiers).some((modifier) => modifier.kind === kind);
}

function typeTextAt(checker, node, location) {
  const type = safeCall(checker?.getTypeAtLocation, checker, node ?? location);
  return type ? stringValue(safeCall(checker?.typeToString, checker, type)) : nodeText(node);
}

function syntaxKind(ts, name) { return numberValue(ts?.SyntaxKind?.[name]); }
function nodeText(node) { return stringValue(safeCall(node?.getText, node)); }
function safeCall(fn, receiver, ...args) {
  if (typeof fn !== 'function') return undefined;
  try { return fn.apply(receiver, args); } catch { return undefined; }
}
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function objectValue(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined; }
function stringValue(value) { return value === undefined || value === null || value === '' ? undefined : String(value); }
function numberValue(value) { return Number.isFinite(value) ? value : undefined; }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { compilerEnumShapeRecord };
