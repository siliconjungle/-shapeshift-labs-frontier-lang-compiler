import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { spanFromTypeScriptNode } from './spanFromTypeScriptNode.js';

const DecoratorMetadataProofKind = 'typescript-checker-decorator-static-metadata-evidence';
const DecoratorRuntimeExecutionGapKind = 'typescript-checker-decorator-runtime-execution-equivalence-gap';
const DecoratorRuntimeExecutionGapCode = 'decorator-execution-equivalence-not-claimed';
const DecoratorRuntimeExecutionRouteId = 'prove-decorator-runtime-execution-equivalence';
const DecoratorRuntimeExecutionRouteLane = 'decorator-runtime-boundaries';
const DecoratorRuntimeExecutionRouteNext = 'supply-decorator-runtime-execution-proof';

function compilerDecoratorMetadataRecord(_checker, identitySymbol, location, ts) {
  const declarations = classDeclarations(identitySymbol, location, ts);
  const decoratorMetadata = declarations.flatMap((declaration, declarationOrdinal) => [
    ...decoratorRecordsForTarget({
      node: declaration,
      ts,
      declarationOrdinal,
      targetKind: 'class',
      className: declarationName(declaration),
      recordKind: 'class-decorator'
    }),
    ...classMemberDecoratorRecords(declaration, declarationOrdinal, ts)
  ]);
  const decoratorMetadataHash = decoratorMetadata.length
    ? hashSemanticValue({
      kind: 'frontier.lang.typescript.compilerDecoratorStaticMetadata.v1',
      decoratorMetadata: decoratorMetadata.map(canonicalDecoratorRecord)
    })
    : undefined;
  const counts = decoratorMetadataCounts(decoratorMetadata);
  return compactRecord({
    decoratorMetadata: nonEmptyArray(decoratorMetadata),
    decoratorMetadataCount: counts.decoratorMetadataCount || undefined,
    classDecoratorCount: counts.classDecoratorCount || undefined,
    memberDecoratorCount: counts.memberDecoratorCount || undefined,
    parameterDecoratorCount: counts.parameterDecoratorCount || undefined,
    decoratorMetadataHash,
    decoratorMetadataProof: decoratorMetadata.length ? decoratorMetadataProof(counts, decoratorMetadataHash) : undefined
  });
}

function classMemberDecoratorRecords(declaration, declarationOrdinal, ts) {
  const className = declarationName(declaration);
  return arrayValue(declaration?.members).flatMap((member, memberOrdinal) => {
    const targetKind = memberTargetKind(member, ts);
    return [
      ...decoratorRecordsForTarget({
        node: member,
        ts,
        declarationOrdinal,
        memberOrdinal,
        targetKind,
        className,
        memberName: memberName(member, ts),
        memberKind: targetKind,
        recordKind: 'member-decorator',
        static: hasModifier(member?.modifiers, ts, 'StaticKeyword') || undefined,
        accessibility: accessibilityModifier(member, ts)
      }),
      ...parameterDecoratorRecords(member, declarationOrdinal, memberOrdinal, className, ts)
    ];
  });
}

function parameterDecoratorRecords(member, declarationOrdinal, memberOrdinal, className, ts) {
  const targetKind = memberTargetKind(member, ts);
  return arrayValue(member?.parameters).flatMap((parameter, parameterOrdinal) => decoratorRecordsForTarget({
    node: parameter,
    ts,
    declarationOrdinal,
    memberOrdinal,
    parameterOrdinal,
    targetKind: `${targetKind}-parameter`,
    className,
    memberName: memberName(member, ts),
    memberKind: targetKind,
    parameterName: nodeText(parameter?.name, sourceFileFor(parameter)),
    recordKind: 'parameter-decorator',
    accessibility: accessibilityModifier(parameter, ts),
    parameterProperty: isParameterProperty(parameter, ts) || undefined
  }));
}

function decoratorRecordsForTarget(input) {
  const decorators = decoratorsForNode(input.node, input.ts);
  const sourceFile = sourceFileFor(input.node);
  return decorators.map((decorator, decoratorOrdinal) => {
    const expressionText = nodeText(decorator.expression, sourceFile);
    return compactRecord({
      kind: input.recordKind,
      targetKind: input.targetKind,
      className: input.className,
      memberKind: input.memberKind,
      memberName: input.memberName,
      parameterName: input.parameterName,
      declarationOrdinal: input.declarationOrdinal,
      memberOrdinal: input.memberOrdinal,
      parameterOrdinal: input.parameterOrdinal,
      decoratorOrdinal,
      targetStatic: input.static,
      targetAccessibility: input.accessibility,
      parameterProperty: input.parameterProperty,
      syntaxKind: syntaxKindName(input.ts, decorator.kind),
      expressionKind: syntaxKindName(input.ts, decorator.expression?.kind),
      decoratorText: nodeText(decorator, sourceFile),
      expressionText,
      expressionHash: expressionText ? hashSemanticValue(expressionText) : undefined,
      sourceSpan: spanFromTypeScriptNode(decorator, sourceFile),
      staticDecoratorMetadataEvidence: true,
      decoratorExecutionEquivalenceClaim: false,
      runtimeEquivalenceClaim: false,
      semanticEquivalenceClaim: false
    });
  });
}

function decoratorMetadataProof(counts, decoratorMetadataHash) {
  return {
    kind: DecoratorMetadataProofKind,
    status: 'passed',
    proofLevel: 'typescript-checker-decorator-static-metadata',
    proofScope: 'static-decorator-metadata-only',
    checkerInvariant: 'decorator targets, expression texts, declaration order, and source spans complete; decorator execution semantics are not evaluated',
    requiredSignals: [
      'typescript-get-decorators-api',
      'compiler-decorator-target-kind',
      'compiler-decorator-expression-text',
      'compiler-decorator-source-span',
      'compiler-decorator-declaration-order'
    ],
    decoratorMetadataHash,
    ...counts,
    runtimeExecutionEquivalenceGap: decoratorRuntimeExecutionGap(counts, decoratorMetadataHash),
    conflictRouting: decoratorConflictRouting(decoratorMetadataHash),
    staticDecoratorMetadataEvidence: true,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    decoratorExecutionEquivalenceClaim: false
  };
}

function decoratorRuntimeExecutionGap(counts, decoratorMetadataHash) {
  return {
    kind: DecoratorRuntimeExecutionGapKind,
    status: 'blocked',
    proofLevel: 'decorator-runtime-execution-equivalence',
    reasonCode: DecoratorRuntimeExecutionGapCode,
    summary: 'Static decorator metadata records targets and expression text only; decorator factory calls, invocation order, side effects, returned replacements, and emitted runtime behavior are not evaluated.',
    requiredEvidence: 'decorator-runtime-execution-trace-or-equivalence-proof',
    missingSignals: [
      'decorator-factory-call-order',
      'decorator-invocation-order',
      'decorator-side-effect-trace',
      'decorator-result-application-proof',
      'decorator-emit-runtime-equivalence'
    ],
    routeId: DecoratorRuntimeExecutionRouteId,
    routeLane: DecoratorRuntimeExecutionRouteLane,
    routeNext: DecoratorRuntimeExecutionRouteNext,
    failClosed: true,
    blocksSemanticEquivalence: true,
    decoratorMetadataHash,
    ...counts,
    staticDecoratorMetadataEvidence: true,
    proofClaim: false,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    decoratorExecutionEquivalenceClaim: false
  };
}

function decoratorConflictRouting(decoratorMetadataHash) {
  return {
    status: 'fail-closed',
    conflictCode: 'project-public-compiler-type-delta-conflict',
    reasonCode: DecoratorRuntimeExecutionGapCode,
    branchDivergenceSignal: 'decoratorMetadataHash',
    routeId: DecoratorRuntimeExecutionRouteId,
    routeLane: DecoratorRuntimeExecutionRouteLane,
    routeNext: DecoratorRuntimeExecutionRouteNext,
    decoratorMetadataHash,
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false,
    decoratorExecutionEquivalenceClaim: false
  };
}

function decoratorsForNode(node, ts) {
  const apiDecorators = safeCall(ts?.canHaveDecorators, ts, node)
    ? safeCall(ts?.getDecorators, ts, node)
    : undefined;
  if (Array.isArray(apiDecorators)) return apiDecorators;
  const decoratorKind = syntaxKind(ts, 'Decorator');
  return decoratorKind === undefined ? [] : arrayValue(node?.modifiers).filter((modifier) => modifier.kind === decoratorKind);
}

function classDeclarations(identitySymbol, location, ts) {
  const declarations = arrayValue(identitySymbol?.declarations).filter((declaration) => isSyntaxKind(ts, declaration, 'ClassDeclaration'));
  if (declarations.length) return declarations;
  return isSyntaxKind(ts, location, 'ClassDeclaration') ? [location] : [];
}

function decoratorMetadataCounts(records) {
  return {
    decoratorMetadataCount: records.length,
    classDecoratorCount: records.filter((record) => record.kind === 'class-decorator').length,
    memberDecoratorCount: records.filter((record) => record.kind === 'member-decorator').length,
    parameterDecoratorCount: records.filter((record) => record.kind === 'parameter-decorator').length
  };
}

function canonicalDecoratorRecord(record) {
  return compactRecord({
    kind: record.kind,
    targetKind: record.targetKind,
    className: record.className,
    memberKind: record.memberKind,
    memberName: record.memberName,
    parameterName: record.parameterName,
    declarationOrdinal: record.declarationOrdinal,
    memberOrdinal: record.memberOrdinal,
    parameterOrdinal: record.parameterOrdinal,
    decoratorOrdinal: record.decoratorOrdinal,
    targetStatic: record.targetStatic,
    targetAccessibility: record.targetAccessibility,
    parameterProperty: record.parameterProperty,
    expressionKind: record.expressionKind,
    expressionText: record.expressionText,
    sourceSpan: record.sourceSpan
  });
}

function memberTargetKind(member, ts) {
  if (isSyntaxKind(ts, member, 'Constructor')) return 'constructor';
  if (isSyntaxKind(ts, member, 'MethodDeclaration')) return 'method';
  if (isSyntaxKind(ts, member, 'GetAccessor')) return 'get-accessor';
  if (isSyntaxKind(ts, member, 'SetAccessor')) return 'set-accessor';
  if (isSyntaxKind(ts, member, 'PropertyDeclaration') && hasModifier(member?.modifiers, ts, 'AccessorKeyword')) return 'accessor-field';
  if (isSyntaxKind(ts, member, 'PropertyDeclaration')) return 'field';
  return syntaxKindName(ts, member?.kind) ?? 'class-member';
}

function memberName(member, ts) {
  if (isSyntaxKind(ts, member, 'Constructor')) return 'constructor';
  const name = member?.name;
  return stringValue(name?.escapedText ?? name?.text ?? nodeText(name, sourceFileFor(member)));
}

function declarationName(declaration) {
  const name = declaration?.name;
  return stringValue(name?.escapedText ?? name?.text ?? nodeText(name, sourceFileFor(declaration)));
}

function accessibilityModifier(node, ts) {
  const modifiers = arrayValue(node?.modifiers);
  if (hasModifier(modifiers, ts, 'PrivateKeyword')) return 'private';
  if (hasModifier(modifiers, ts, 'ProtectedKeyword')) return 'protected';
  if (hasModifier(modifiers, ts, 'PublicKeyword')) return 'public';
  return undefined;
}

function isParameterProperty(parameter, ts) {
  const modifiers = arrayValue(parameter?.modifiers);
  return ['PrivateKeyword', 'ProtectedKeyword', 'PublicKeyword', 'ReadonlyKeyword'].some((kind) => hasModifier(modifiers, ts, kind));
}

function hasModifier(modifiers, ts, kind) {
  const expected = syntaxKind(ts, kind);
  return expected !== undefined && arrayValue(modifiers).some((modifier) => modifier.kind === expected);
}

function sourceFileFor(node) { return safeCall(node?.getSourceFile, node); }
function nodeText(node, sourceFile) { return stringValue(safeCall(node?.getText, node, sourceFile)); }
function syntaxKind(ts, name) { return numberValue(ts?.SyntaxKind?.[name]); }
function isSyntaxKind(ts, node, name) { return node?.kind === syntaxKind(ts, name); }
function syntaxKindName(ts, kind) { return stringValue(ts?.SyntaxKind?.[kind]) ?? (Number.isFinite(kind) ? String(kind) : undefined); }
function safeCall(fn, receiver, ...args) {
  if (typeof fn !== 'function') return undefined;
  try { return fn.apply(receiver, args); } catch { return undefined; }
}
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function nonEmptyArray(value) { return Array.isArray(value) && value.length ? value : undefined; }
function numberValue(value) { return Number.isFinite(value) ? value : undefined; }
function stringValue(value) { return value === undefined || value === null || value === '' ? undefined : String(value); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { compilerDecoratorMetadataRecord };
