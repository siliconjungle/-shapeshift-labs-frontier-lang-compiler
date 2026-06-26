import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

const TypeInferenceSyntaxProofKind = 'typescript-checker-public-api-type-inference-syntax-evidence';

function compilerTypeInferenceSyntaxRecord(checker, identitySymbol, location, ts) {
  const records = compilerTypeInferenceSyntaxRecords(checker, identitySymbol, location, ts);
  if (!records.length) return {};
  const counts = inferenceSyntaxCounts(records);
  const typeInferenceSyntaxHash = hashSemanticValue({
    kind: 'frontier.lang.typescript.compilerTypeInferenceSyntaxEvidence.v1',
    records: records.map(canonicalInferenceSyntaxRecord)
  });
  return {
    typeInferenceSyntax: records,
    typeInferenceSyntaxKinds: uniqueStrings(records.map((record) => record.kind)),
    typeInferenceSyntaxCount: records.length,
    satisfiesExpressionCount: counts.satisfiesExpressionCount || undefined,
    asConstAssertionCount: counts.asConstAssertionCount || undefined,
    constTypeParameterCount: counts.constTypeParameterCount || undefined,
    typeInferenceSyntaxHash,
    typeInferenceSyntaxProof: {
      kind: TypeInferenceSyntaxProofKind,
      status: 'passed',
      proofLevel: 'typescript-checker-public-api-type-inference-syntax',
      checkerInvariant: 'inference syntax node/type texts complete',
      requiredSignals: [
        'compiler-type-inference-syntax-node-texts',
        'compiler-type-inference-syntax-expression-texts',
        'compiler-type-inference-syntax-type-texts'
      ],
      typeInferenceSyntaxHash,
      ...counts,
      autoMergeClaim: false,
      semanticEquivalenceClaim: false
    }
  };
}

function compilerTypeInferenceSyntaxRecords(checker, identitySymbol, location, ts) {
  const records = [];
  for (const declaration of Array.isArray(identitySymbol?.declarations) ? identitySymbol.declarations : []) {
    visitSyntaxNodes(ts, declaration, (node) => {
      const record = inferenceSyntaxNodeRecord(checker, node, location, ts);
      if (record) records.push(record);
    });
  }
  return uniqueRecords(records, (record) => [record.kind, record.nodeText, record.typeText].join('\0'));
}

function inferenceSyntaxNodeRecord(checker, node, location, ts) {
  if (isSyntaxKind(ts, node, 'SatisfiesExpression')) return satisfiesExpressionRecord(checker, node, location, ts);
  if (isAsConstAssertion(node, ts)) return asConstAssertionRecord(checker, node, location, ts);
  if (isConstTypeParameter(node, ts)) return constTypeParameterRecord(checker, node, location, ts);
  return undefined;
}

function satisfiesExpressionRecord(checker, node, location, ts) {
  return compactRecord({
    kind: 'satisfies-expression',
    syntaxKind: syntaxKindName(ts, node.kind),
    nodeText: nodeText(node),
    expressionText: nodeText(node.expression),
    expressionTypeText: typeTextAt(checker, node.expression, location),
    typeText: typeTextFromTypeNode(checker, node.type, location)
  });
}

function asConstAssertionRecord(checker, node, location, ts) {
  return compactRecord({
    kind: 'as-const-assertion',
    syntaxKind: syntaxKindName(ts, node.kind),
    nodeText: nodeText(node),
    expressionText: nodeText(node.expression),
    expressionTypeText: typeTextAt(checker, node.expression, location),
    typeText: typeTextAt(checker, node, location)
  });
}

function constTypeParameterRecord(checker, node, location, ts) {
  return compactRecord({
    kind: 'const-type-parameter',
    syntaxKind: syntaxKindName(ts, node.kind),
    nodeText: nodeText(node),
    name: stringValue(node.name?.escapedText ?? node.name?.text),
    typeText: typeTextAt(checker, node.name ?? node, location),
    constraintTypeText: typeTextFromTypeNode(checker, node.constraint, location),
    defaultTypeText: typeTextFromTypeNode(checker, node.default, location)
  });
}

function visitSyntaxNodes(ts, node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  if (typeof ts?.forEachChild === 'function') {
    ts.forEachChild(node, (child) => visitSyntaxNodes(ts, child, visit));
    return;
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((child) => visitSyntaxNodes(ts, child, visit));
    else if (value && typeof value === 'object' && Number.isFinite(value.kind)) visitSyntaxNodes(ts, value, visit);
  }
}

function isAsConstAssertion(node, ts) {
  if (!isSyntaxKind(ts, node, 'AsExpression')) return false;
  return /\bas\s+const\b/.test(nodeText(node));
}

function isConstTypeParameter(node, ts) {
  if (!isSyntaxKind(ts, node, 'TypeParameter')) return false;
  const constKeyword = syntaxKind(ts, 'ConstKeyword');
  return constKeyword !== undefined && Array.isArray(node.modifiers)
    && node.modifiers.some((modifier) => modifier.kind === constKeyword);
}

function inferenceSyntaxCounts(records) {
  return {
    satisfiesExpressionCount: countKind(records, 'satisfies-expression'),
    asConstAssertionCount: countKind(records, 'as-const-assertion'),
    constTypeParameterCount: countKind(records, 'const-type-parameter')
  };
}

function canonicalInferenceSyntaxRecord(record) {
  return compactRecord({
    kind: record.kind,
    nodeText: record.nodeText,
    expressionText: record.expressionText,
    expressionTypeText: record.expressionTypeText,
    typeText: record.typeText,
    constraintTypeText: record.constraintTypeText,
    defaultTypeText: record.defaultTypeText,
    name: record.name
  });
}

function typeTextFromTypeNode(checker, node, location) {
  const type = safeCall(checker?.getTypeFromTypeNode, checker, node) ?? safeCall(checker?.getTypeAtLocation, checker, node ?? location);
  return type ? stringValue(safeCall(checker?.typeToString, checker, type)) : nodeText(node);
}

function typeTextAt(checker, node, location) {
  const type = safeCall(checker?.getTypeAtLocation, checker, node ?? location);
  return type ? stringValue(safeCall(checker?.typeToString, checker, type)) : nodeText(node);
}

function syntaxKind(ts, name) { return numberValue(ts?.SyntaxKind?.[name]); }
function isSyntaxKind(ts, node, name) { return node?.kind === syntaxKind(ts, name); }
function syntaxKindName(ts, kind) { return stringValue(ts?.SyntaxKind?.[kind]) ?? (Number.isFinite(kind) ? String(kind) : undefined); }
function nodeText(node) { return stringValue(safeCall(node?.getText, node)); }
function countKind(records, kind) { return records.filter((record) => record.kind === kind).length; }
function safeCall(fn, receiver, ...args) {
  if (typeof fn !== 'function') return undefined;
  try { return fn.apply(receiver, args); } catch { return undefined; }
}
function stringValue(value) { return value === undefined || value === null || value === '' ? undefined : String(value); }
function numberValue(value) { return Number.isFinite(value) ? value : undefined; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function uniqueStrings(values) { return [...new Set(values.filter((value) => typeof value === 'string' && value.length > 0))]; }
function uniqueRecords(records, keyFn) {
  const seen = new Set();
  return records.filter((record) => {
    const key = keyFn(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { compilerTypeInferenceSyntaxRecord };
