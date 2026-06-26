import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { spanFromTypeScriptNode } from './spanFromTypeScriptNode.js';

function compilerTypeReferenceTargets(checker, identitySymbol, location, ts) {
  const declarations = Array.isArray(identitySymbol?.declarations) ? identitySymbol.declarations : [];
  const records = [];
  for (const declaration of declarations) {
    visitTypeNodes(ts, declaration, (node) => {
      if (!isSyntaxKind(ts, node, 'TypeReference')) return;
      const record = typeReferenceTargetRecord(checker, node, location, ts);
      if (record) records.push(record);
    });
  }
  return uniqueRecords(records, (record) => [
    record.typeReferenceName,
    record.nodeText,
    record.targetFullyQualifiedName,
    record.targetDeclarationTextHash
  ].join('\0'));
}

function typeReferenceTargetRecord(checker, node, location, ts) {
  const symbol = safeCall(checker?.getSymbolAtLocation, checker, node.typeName);
  const aliasedSymbol = safeCall(checker?.getAliasedSymbol, checker, symbol);
  const targetSymbol = aliasedSymbol && aliasedSymbol !== symbol ? aliasedSymbol : symbol;
  const declaration = targetDeclaration(targetSymbol);
  if (!targetSymbol || !declaration) return undefined;
  const referenceSpan = spanForNode(node, location);
  const declarationSpan = spanForNode(declaration, location);
  const declarationTextHash = declarationSourceHash(declaration, declarationSpan);
  const targetSymbolIdentityHash = targetSymbol ? hashSemanticValue({
    kind: 'frontier.lang.typescript.compilerTypeReferenceTargetSymbol.v1',
    name: stringValue(targetSymbol.escapedName ?? targetSymbol.name),
    fullyQualifiedName: stringValue(safeCall(checker?.getFullyQualifiedName, checker, targetSymbol)),
    flags: numberValue(targetSymbol.flags),
    declarationKind: syntaxKindName(ts, declaration?.kind),
    declarationSpan,
    declarationTextHash
  }) : undefined;
  const targetProof = compactRecord({
    kind: 'frontier.lang.typescript.compilerPublicApiTypeReferenceTargetProof.v1',
    typeReferenceName: nodeText(node.typeName),
    targetSymbolName: stringValue(targetSymbol?.escapedName ?? targetSymbol?.name),
    targetFullyQualifiedName: stringValue(targetSymbol ? safeCall(checker?.getFullyQualifiedName, checker, targetSymbol) : undefined),
    targetSymbolFlags: numberValue(targetSymbol?.flags),
    targetDeclarationKind: syntaxKindName(ts, declaration?.kind),
    targetDeclarationSourcePath: declarationSpan?.path ?? sourcePathForNode(declaration),
    targetDeclarationSpan: declarationSpan,
    targetDeclarationTextHash: declarationTextHash,
    targetSymbolIdentityHash
  });
  return compactRecord({
    kind: 'type-reference-target',
    syntaxKind: syntaxKindName(ts, node.kind),
    nodeText: nodeText(node),
    typeText: typeTextFromTypeNode(checker, node, location),
    typeReferenceName: nodeText(node.typeName),
    sourceSpan: referenceSpan,
    typeArgumentCount: arrayValue(node.typeArguments).length || undefined,
    targetStatus: 'resolved',
    targetAliased: aliasedSymbol && aliasedSymbol !== symbol ? true : undefined,
    targetSymbolName: targetProof.targetSymbolName,
    targetFullyQualifiedName: targetProof.targetFullyQualifiedName,
    targetSymbolFlags: targetProof.targetSymbolFlags,
    targetSymbolIdentityHash,
    targetDeclarationKind: targetProof.targetDeclarationKind,
    targetDeclarationSourcePath: targetProof.targetDeclarationSourcePath,
    targetDeclarationSpan: declarationSpan,
    targetDeclarationTextHash: declarationTextHash,
    typeReferenceTargetProofHash: hashSemanticValue(targetProof),
    autoMergeClaim: false,
    semanticEquivalenceClaim: false,
    runtimeEquivalenceClaim: false
  });
}

function targetDeclaration(symbol) {
  return symbol?.valueDeclaration ?? arrayValue(symbol?.declarations)[0];
}

function declarationSourceHash(node, span) {
  const text = nodeText(node);
  if (!text) return undefined;
  return hashSemanticValue({
    kind: 'frontier.lang.typescript.compilerTypeReferenceTargetDeclarationSource.v1',
    sourcePath: span?.path ?? sourcePathForNode(node),
    span,
    text
  });
}

function spanForNode(node, fallback) {
  if (!node || typeof node !== 'object') return undefined;
  const sourceFile = safeCall(node.getSourceFile, node) ?? safeCall(fallback?.getSourceFile, fallback);
  return sourceFile ? spanFromTypeScriptNode(node, sourceFile) : undefined;
}

function sourcePathForNode(node) {
  return stringValue(safeCall(node?.getSourceFile, node)?.fileName);
}

function visitTypeNodes(ts, node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  if (typeof ts?.forEachChild === 'function') {
    ts.forEachChild(node, (child) => visitTypeNodes(ts, child, visit));
    return;
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((child) => visitTypeNodes(ts, child, visit));
    else if (value && typeof value === 'object' && Number.isFinite(value.kind)) visitTypeNodes(ts, value, visit);
  }
}

function typeTextFromTypeNode(checker, node, location) {
  const type = safeCall(checker?.getTypeFromTypeNode, checker, node) ?? safeCall(checker?.getTypeAtLocation, checker, node ?? location);
  return type ? stringValue(safeCall(checker?.typeToString, checker, type)) : nodeText(node);
}

function syntaxKind(ts, name) { return numberValue(ts?.SyntaxKind?.[name]); }
function isSyntaxKind(ts, node, name) { return node?.kind === syntaxKind(ts, name); }
function syntaxKindName(ts, kind) { return stringValue(ts?.SyntaxKind?.[kind]) ?? (Number.isFinite(kind) ? String(kind) : undefined); }
function nodeText(node) { return stringValue(safeCall(node?.getText, node)); }
function safeCall(fn, receiver, ...args) {
  if (typeof fn !== 'function') return undefined;
  try { return fn.apply(receiver, args); } catch { return undefined; }
}
function stringValue(value) { return value === undefined || value === null || value === '' ? undefined : String(value); }
function numberValue(value) { return Number.isFinite(value) ? value : undefined; }
function arrayValue(value) { return Array.isArray(value) ? value : []; }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }
function uniqueRecords(records, keyFn) {
  const seen = new Set();
  return records.filter((record) => {
    const key = keyFn(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { compilerTypeReferenceTargets };
