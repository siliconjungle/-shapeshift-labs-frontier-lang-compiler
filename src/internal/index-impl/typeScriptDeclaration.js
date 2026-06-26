import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{declarationRecord}from'./declarationRecord.js';import{namedDeclaration}from'./namedDeclaration.js';import{stringFromTsExpression}from'./stringFromTsExpression.js';import{typeScriptExportedDeclarationEntries}from'./typeScriptExportedDeclarationEntries.js';import{typeScriptModuleDeclarationEntries}from'./typeScriptModuleDeclarationEntries.js';
import{typeScriptCompilerSymbolRecordForNode}from'./typeScriptCompilerSymbolIdentity.js';
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
  if (kind === 'ModuleDeclaration') return declarationWithExports(enrich(moduleDeclaration(input, nativeNodeId, node), node.name ?? node), exportedEntries, enrich, node);
  if (kind === 'VariableDeclaration') return enrich(namedDeclaration(input, nativeNodeId, node.name, 'variable'));
  if (kind === 'MethodDeclaration' || kind === 'MethodSignature') return enrich(namedDeclaration(input, nativeNodeId, node.name, 'method'));
  return undefined;
}

function declarationWithExports(declaration, exportedEntries, enrich, node) {
  const exports = exportedEntries.map((entry) => enrich(entry.declaration, entry.symbolNode ?? node));
  if (!declaration) return exports.length ? exports : undefined;
  return exports.length ? [declaration, ...exports] : declaration;
}

function moduleDeclaration(input, nativeNodeId, node) {
  const name = stringFromTsExpression(node.name);
  if (!name) return undefined;
  return {
    ...declarationRecord(input, nativeNodeId, name, 'module', 'definition'),
    metadata: compactRecord({
      scan: 'typescript-module-declaration',
      moduleName: name,
      namespace: name
    })
  };
}

function enrichTypeScriptDeclaration(node, symbolNode, declaration, input, options) {
  if (!declaration) return declaration;
  const compiler = typeScriptCompilerSymbolRecordForNode(symbolNode, input, options, node.name, { importRole: declaration.role === 'import' });
  if (!compiler) return declaration;
  return {
    ...declaration,
    symbolId: compiler.symbolId,
    signatureHash: hashSemanticValue([input.language, declaration.symbolKind, compiler.identity, compiler.compilerSymbol, compiler.compilerType]),
    metadata: {
      ...declaration.metadata,
      compilerSymbol: compiler.compilerSymbol,
      compilerSymbolIdentityHash: compiler.compilerSymbolIdentityHash,
      compilerType: compiler.compilerType,
      compilerTypeIdentityHash: compiler.compilerTypeIdentityHash
    }
  };
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
