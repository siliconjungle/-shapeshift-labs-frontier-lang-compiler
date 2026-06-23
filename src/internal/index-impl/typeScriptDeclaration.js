import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';import{idFragment}from'../../native-import-utils.js';
import{declarationRecord}from'./declarationRecord.js';import{namedDeclaration}from'./namedDeclaration.js';import{stringFromTsExpression}from'./stringFromTsExpression.js';import{typeScriptExportedDeclarationEntries}from'./typeScriptExportedDeclarationEntries.js';import{typeScriptModuleDeclarationEntries}from'./typeScriptModuleDeclarationEntries.js';
export function typeScriptDeclaration(node, kind, nativeNodeId, input, options = {}) {
  const enrich = (declaration, symbolNode = node.name ?? node) => enrichTypeScriptDeclaration(node, symbolNode, declaration, input, options);
  const moduleEntries = typeScriptModuleDeclarationEntries(node, kind, nativeNodeId, input);
  if (moduleEntries?.length) return moduleEntries.map((entry) => enrich(entry.declaration, entry.symbolNode ?? node));
  const exportedEntries = typeScriptExportedDeclarationEntries(node, kind, nativeNodeId, input, options);
  if (exportedEntries.length && Array.isArray(node.declarationList?.declarations)) return exportedEntries.map((entry) => enrich(entry.declaration, entry.symbolNode ?? node));
  if (kind === 'ImportDeclaration' || kind === 'ImportEqualsDeclaration') {
    const name = stringFromTsExpression(node.moduleSpecifier) ?? stringFromTsExpression(node.externalModuleReference?.expression);
    if (name) return enrich(declarationRecord(input, nativeNodeId, name, 'module', 'import'), node.moduleSpecifier ?? node.externalModuleReference?.expression ?? node);
  }
  if (kind === 'FunctionDeclaration') return declarationWithExports(enrich(namedDeclaration(input, nativeNodeId, node.name, 'function')), exportedEntries, enrich, node);
  if (kind === 'ClassDeclaration') return declarationWithExports(enrich(namedDeclaration(input, nativeNodeId, node.name, 'class')), exportedEntries, enrich, node);
  if (kind === 'InterfaceDeclaration') return declarationWithExports(enrich(namedDeclaration(input, nativeNodeId, node.name, 'interface')), exportedEntries, enrich, node);
  if (kind === 'TypeAliasDeclaration' || kind === 'EnumDeclaration') return declarationWithExports(enrich(namedDeclaration(input, nativeNodeId, node.name, 'type')), exportedEntries, enrich, node);
  if (kind === 'VariableDeclaration') return enrich(namedDeclaration(input, nativeNodeId, node.name, 'variable'));
  if (kind === 'MethodDeclaration' || kind === 'MethodSignature') return enrich(namedDeclaration(input, nativeNodeId, node.name, 'method'));
  return undefined;
}

function declarationWithExports(declaration, exportedEntries, enrich, node) {
  const exports = exportedEntries.map((entry) => enrich(entry.declaration, entry.symbolNode ?? node));
  if (!declaration) return exports.length ? exports : undefined;
  return exports.length ? [declaration, ...exports] : declaration;
}

function enrichTypeScriptDeclaration(node, symbolNode, declaration, input, options) {
  if (!declaration) return declaration;
  const checker = options.typeChecker ?? options.checker ?? options.program?.getTypeChecker?.();
  const symbol = safeCall(checker?.getSymbolAtLocation, checker, symbolNode) ?? safeCall(checker?.getSymbolAtLocation, checker, node.name);
  if (!symbol) return declaration;
  const aliasedSymbol = safeCall(checker?.getAliasedSymbol, checker, symbol);
  const targetSymbol = aliasedSymbol && aliasedSymbol !== symbol ? aliasedSymbol : undefined;
  const identitySymbol = targetSymbol ?? symbol;
  const fullyQualifiedName = stringValue(safeCall(checker?.getFullyQualifiedName, checker, identitySymbol));
  const localName = stringValue(symbol.escapedName ?? symbol.name) ?? declaration.name;
  const targetName = targetSymbol ? stringValue(targetSymbol.escapedName ?? targetSymbol.name) : undefined;
  const identity = fullyQualifiedName ?? targetName ?? localName;
  const compilerSymbol = compactRecord({
    parser: options.parser,
    localName,
    targetName,
    fullyQualifiedName,
    flags: numberValue(symbol.flags),
    targetFlags: numberValue(targetSymbol?.flags),
    declarations: Array.isArray(identitySymbol.declarations) ? identitySymbol.declarations.length : undefined,
    aliased: Boolean(targetSymbol)
  });
  return {
    ...declaration,
    symbolId: `symbol:${input.language}:compiler:${declaration.role === 'import' ? 'import:' : ''}${idFragment(identity)}`,
    signatureHash: hashSemanticValue([input.language, declaration.symbolKind, identity, compilerSymbol]),
    metadata: {
      ...declaration.metadata,
      compilerSymbol,
      compilerSymbolIdentityHash: hashSemanticValue(compilerSymbol)
    }
  };
}

function safeCall(fn, receiver, ...args) {
  if (typeof fn !== 'function') return undefined;
  try { return fn.apply(receiver, args); } catch { return undefined; }
}

function stringValue(value) {
  return value === undefined || value === null || value === '' ? undefined : String(value);
}

function numberValue(value) {
  return Number.isFinite(value) ? value : undefined;
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
