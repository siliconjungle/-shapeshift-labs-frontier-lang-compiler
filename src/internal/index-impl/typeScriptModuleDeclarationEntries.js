import{idFragment}from'../../native-import-utils.js';
import{declarationRecord}from'./declarationRecord.js';import{dynamicImportExpressionMetadata}from'./dynamicImportExpressionMetadata.js';import{identifierName}from'./identifierName.js';import{hostModuleDependencyMetadata}from'./importMetaUrlDependencyMetadata.js';import{moduleImportAttributeMetadata}from'./moduleImportAttributeMetadata.js';import{stringFromTsExpression}from'./stringFromTsExpression.js';
export function typeScriptModuleDeclarationEntries(node, kind, nativeNodeId, input) {
  if (kind === 'ImportDeclaration') return importDeclarationEntries(node, nativeNodeId, input);
  if (kind === 'ImportEqualsDeclaration') return importEqualsDeclarationEntries(node, nativeNodeId, input);
  if (kind === 'CallExpression' && isDynamicImportCall(node)) return dynamicImportExpressionEntries(node, nativeNodeId, input);
  if (kind === 'CallExpression' || kind === 'NewExpression') { const dependencies = hostModuleDependencyMetadata(node, { kind }); if (dependencies.length) return dependencies.flatMap((dependency) => importModuleEntries(input, nativeNodeId, dependency.moduleSpecifier, 'HostModuleDependency', [], dependency.metadata)); }
  if (kind === 'ExportDeclaration') return exportDeclarationEntries(node, nativeNodeId, input); if (kind === 'ExportAssignment') return exportAssignmentEntries(node, nativeNodeId, input);
  return undefined;
}

function importDeclarationEntries(node, nativeNodeId, input) {
  const moduleSpecifier = stringFromTsExpression(node.moduleSpecifier);
  if (!moduleSpecifier) return [];
  const typeOnly = Boolean(node.importClause?.isTypeOnly);
  const bindings = importClauseBindings(node.importClause, typeOnly);
  return importModuleEntries(input, nativeNodeId, moduleSpecifier, 'ImportDeclaration', bindings, {
    typeOnly,
    sideEffectOnly: bindings.length === 0,
    importKind: bindings.length === 0 ? 'side-effect' : 'module',
    ...moduleImportAttributeMetadata(node)
  });
}

function importEqualsDeclarationEntries(node, nativeNodeId, input) {
  const moduleSpecifier = stringFromTsExpression(node.moduleReference?.expression ?? node.externalModuleReference?.expression);
  const localName = identifierName(node.name);
  if (!moduleSpecifier || !localName) return [];
  const typeOnly = Boolean(node.isTypeOnly);
  return importModuleEntries(input, nativeNodeId, moduleSpecifier, 'ImportEqualsDeclaration', [{
    localName,
    importedName: 'default',
    importKind: 'commonjs-require',
    isTypeOnly: typeOnly,
    symbolNode: node.name
  }], { typeOnly, importKind: 'commonjs-require' });
}

function dynamicImportExpressionEntries(node, nativeNodeId, input) {
  const firstArgument = node.arguments?.[0], moduleSpecifier = firstArgument ? stringLiteralFromTsExpression(firstArgument) ?? '<dynamic-import>' : undefined;
  if (!moduleSpecifier) return [];
  return importModuleEntries(input, nativeNodeId, moduleSpecifier, 'DynamicImportExpression', [], {
    importKind: 'dynamic-import',
    dynamicImport: true, ...dynamicImportExpressionMetadata(firstArgument, moduleSpecifier),
    ...moduleImportAttributeMetadata(node)
  });
}

function exportDeclarationEntries(node, nativeNodeId, input) {
  const moduleSpecifier = stringFromTsExpression(node.moduleSpecifier);
  const typeOnly = Boolean(node.isTypeOnly);
  const exportStar = moduleSpecifier && !node.exportClause;
  const bindings = exportClauseBindings(node.exportClause, { typeOnly, reExport: Boolean(moduleSpecifier) });
  const namespaceReExport = Boolean(moduleSpecifier && bindings.some((binding) => binding.exportKind === 'namespace-reexport'));
  return [
    ...(moduleSpecifier ? importModuleEntries(input, nativeNodeId, moduleSpecifier, 'ExportFromDeclaration', reExportImportBindings(bindings, exportStar), {
      typeOnly,
      reexport: true,
      exportStar,
      namespaceReExport,
      importKind: exportStar ? 'reexport' : 'reexport',
      ...moduleImportAttributeMetadata(node)
    }) : []),
    ...exportModuleEntries(input, nativeNodeId, moduleSpecifier, bindings, {
      typeOnly,
      exportStar,
      reExport: Boolean(moduleSpecifier),
      namespaceReExport,
      exportKind: exportStar ? 'export-star' : 'named',
      ...moduleImportAttributeMetadata(node)
    })
  ];
}

function exportAssignmentEntries(node, nativeNodeId, input) {
  const exportedName = node.isExportEquals ? 'module.exports' : 'default';
  const localName = stringFromTsExpression(node.expression);
  return [{
    declaration: compactRecord({
      ...declarationRecord(input, nativeNodeId, exportedName, 'export', 'export'),
      exportedName,
      localName,
      exportKind: node.isExportEquals ? 'assignment' : 'default',
      publicContract: true,
      metadata: compactRecord({
        exportKind: node.isExportEquals ? 'assignment' : 'default',
        exportedName,
        localName,
        publicContract: true
      })
    }),
    symbolNode: node.expression ?? node
  }];
}

function importClauseBindings(importClause, typeOnly) {
  if (!importClause) return [];
  const bindings = [];
  const defaultName = identifierName(importClause.name);
  if (defaultName) bindings.push({
    localName: defaultName,
    importedName: 'default',
    importKind: typeOnly ? 'type-default' : 'default',
    isTypeOnly: typeOnly,
    symbolNode: importClause.name
  });
  const named = importClause.namedBindings;
  if (!named) return bindings;
  if (Array.isArray(named.elements)) {
    bindings.push(...named.elements.map((element) => importSpecifierBinding(element, typeOnly)).filter(Boolean));
  } else {
    const namespace = identifierName(named.name);
    if (namespace) bindings.push({ localName: namespace, importedName: '*', namespace, importKind: 'namespace', isTypeOnly: typeOnly, symbolNode: named.name });
  }
  return bindings;
}

function importSpecifierBinding(element, parentTypeOnly) {
  const localName = identifierName(element.name);
  if (!localName) return undefined;
  const typeOnly = Boolean(parentTypeOnly || element.isTypeOnly);
  const importedName = identifierName(element.propertyName) ?? localName;
  return {
    localName,
    importedName,
    importKind: typeOnly ? 'type-named' : 'named',
    isTypeOnly: typeOnly,
    symbolNode: element.name
  };
}

function exportClauseBindings(exportClause, options) {
  if (!exportClause) return [];
  if (Array.isArray(exportClause.elements)) {
    return exportClause.elements.map((element) => exportSpecifierBinding(element, options)).filter(Boolean);
  }
  const exportedName = identifierName(exportClause.name);
  if (!exportedName) return [];
  return [{
    localName: exportedName,
    importedName: '*',
    exportedName,
    namespace: exportedName,
    importKind: 'namespace-reexport',
    exportKind: 'namespace-reexport',
    isTypeOnly: Boolean(options.typeOnly),
    reExport: Boolean(options.reExport),
    symbolNode: exportClause.name
  }];
}

function exportSpecifierBinding(element, options) {
  const exportedName = identifierName(element.name);
  if (!exportedName) return undefined;
  const typeOnly = Boolean(options.typeOnly || element.isTypeOnly);
  const localName = identifierName(element.propertyName) ?? exportedName;
  return {
    localName,
    importedName: options.reExport ? localName : undefined,
    exportedName,
    importKind: options.reExport ? typeOnly ? 'type-reexport' : 'reexport' : undefined,
    exportKind: typeOnly ? 'type-named' : 'named',
    isTypeOnly: typeOnly,
    reExport: Boolean(options.reExport),
    symbolNode: element.name
  };
}

function reExportImportBindings(bindings, exportStar) {
  if (exportStar) return [];
  return bindings.map((binding) => ({
    localName: binding.exportedName ?? binding.localName,
    importedName: binding.importedName ?? binding.localName,
    exportedName: binding.exportedName,
    namespace: binding.namespace,
    importKind: binding.importKind ?? 'reexport',
    isTypeOnly: binding.isTypeOnly,
    symbolNode: binding.symbolNode
  }));
}

function importModuleEntries(input, nativeNodeId, moduleSpecifier, _languageKind, bindings, metadata) {
  const moduleEntry = {
    declaration: compactRecord({
      ...declarationRecord(input, nativeNodeId, moduleSpecifier, 'module', 'import'),
      importPath: moduleSpecifier,
      moduleSpecifier,
      importKind: metadata.importKind,
      isTypeOnly: metadata.typeOnly,
      exportStar: metadata.exportStar,
      metadata: moduleMetadata('typescript-import', bindings, metadata)
    })
  };
  return [moduleEntry, ...bindings.map((binding) => importBindingEntry(input, nativeNodeId, moduleSpecifier, binding, metadata))];
}

function importBindingEntry(input, nativeNodeId, moduleSpecifier, binding, metadata = {}) {
  const declaration = compactRecord({
    ...declarationRecord(input, nativeNodeId, binding.localName, 'import', 'import'),
    symbolId: `symbol:${input.language}:import:${idFragment(`${moduleSpecifier}:${binding.localName}:${binding.importedName}`)}`,
    importPath: moduleSpecifier,
    moduleSpecifier,
    localName: binding.localName,
    importedName: binding.importedName,
    exportedName: binding.exportedName,
    namespace: binding.namespace,
    importKind: binding.importKind,
    isTypeOnly: binding.isTypeOnly,
    metadata: compactRecord({
      scan: 'typescript-import-binding',
      moduleSpecifier,
      importPath: moduleSpecifier,
      localName: binding.localName,
      importedName: binding.importedName,
      exportedName: binding.exportedName,
      namespace: binding.namespace,
      importKind: binding.importKind,
      isTypeOnly: binding.isTypeOnly,
      typeOnly: binding.isTypeOnly, hasImportAttributes: metadata.hasImportAttributes, importAttributeCount: metadata.importAttributeCount, importAttributeKeys: metadata.importAttributeKeys, importAttributeHash: metadata.importAttributeHash, importAttributes: metadata.importAttributes
    })
  });
  return { declaration, symbolNode: binding.symbolNode };
}

function exportModuleEntries(input, nativeNodeId, moduleSpecifier, bindings, metadata) {
  const statementName = metadata.exportStar
    ? `* from ${moduleSpecifier}`
    : moduleSpecifier ? `{${bindings.map((binding) => binding.exportedName).join(',')}} from ${moduleSpecifier}` : `{${bindings.map((binding) => binding.exportedName).join(',')}}`;
  const statement = {
    declaration: compactRecord({
      ...declarationRecord(input, nativeNodeId, statementName, 'module', 'export'),
      exportPath: moduleSpecifier,
      moduleSpecifier,
      exportKind: metadata.exportKind,
      exportStar: metadata.exportStar,
      isTypeOnly: metadata.typeOnly,
      reExport: metadata.reExport,
      publicContract: true,
      metadata: moduleMetadata('typescript-export', bindings, metadata)
    })
  };
  return [statement, ...bindings.map((binding) => exportBindingEntry(input, nativeNodeId, moduleSpecifier, binding, metadata))];
}

function exportBindingEntry(input, nativeNodeId, moduleSpecifier, binding, metadata = {}) {
  const declaration = compactRecord({
    ...declarationRecord(input, nativeNodeId, binding.exportedName, 'export', 'export'),
    symbolId: `symbol:${input.language}:export:${idFragment(`${moduleSpecifier ?? 'local'}:${binding.exportedName}:${binding.localName}`)}`,
    exportPath: moduleSpecifier,
    moduleSpecifier,
    localName: binding.localName,
    importedName: binding.importedName,
    exportedName: binding.exportedName,
    namespace: binding.namespace,
    exportKind: binding.exportKind,
    isTypeOnly: binding.isTypeOnly,
    reExport: binding.reExport,
    publicContract: true,
    metadata: compactRecord({
      scan: 'typescript-export-binding',
      moduleSpecifier,
      exportPath: moduleSpecifier,
      localName: binding.localName,
      importedName: binding.importedName,
      exportedName: binding.exportedName,
      namespace: binding.namespace,
      exportKind: binding.exportKind,
      isTypeOnly: binding.isTypeOnly,
      typeOnly: binding.isTypeOnly,
      reExport: binding.reExport,
      publicContract: true, hasImportAttributes: metadata.hasImportAttributes, importAttributeCount: metadata.importAttributeCount, importAttributeKeys: metadata.importAttributeKeys, importAttributeHash: metadata.importAttributeHash, importAttributes: metadata.importAttributes
    })
  });
  return { declaration, symbolNode: binding.symbolNode };
}

function moduleMetadata(scan, bindings, metadata) {
  return compactRecord({
    scan,
    moduleOnly: true,
    bindingCount: bindings.length,
    importKind: metadata.importKind,
    exportKind: metadata.exportKind,
    isTypeOnly: metadata.typeOnly,
    typeOnly: metadata.typeOnly,
    sideEffectOnly: metadata.sideEffectOnly, dynamicImport: metadata.dynamicImport,
    dynamicImportSpecifierKind: metadata.dynamicImportSpecifierKind, dynamicImportExpressionText: metadata.dynamicImportExpressionText, dynamicImportExpressionHash: metadata.dynamicImportExpressionHash, dynamicImportStaticSpecifierEvidence: metadata.dynamicImportStaticSpecifierEvidence, dynamicImportRuntimeResolutionClaim: metadata.dynamicImportRuntimeResolutionClaim, dynamicImportResolutionProofRequired: metadata.dynamicImportResolutionProofRequired, hostDependency: metadata.hostDependency, hostDependencyKind: metadata.hostDependencyKind, hostDependencyBase: metadata.hostDependencyBase, hostDependencyExpressionText: metadata.hostDependencyExpressionText, hostDependencyExpressionHash: metadata.hostDependencyExpressionHash, hostDependencyStaticSpecifierEvidence: metadata.hostDependencyStaticSpecifierEvidence, hostDependencyRuntimeResolutionClaim: metadata.hostDependencyRuntimeResolutionClaim, hostDependencyResolutionProofRequired: metadata.hostDependencyResolutionProofRequired,
    hasImportAttributes: metadata.hasImportAttributes,
    importAttributeCount: metadata.importAttributeCount,
    importAttributeKeys: metadata.importAttributeKeys,
    importAttributeHash: metadata.importAttributeHash,
    importAttributes: metadata.importAttributes,
    reexport: metadata.reexport,
    reExport: metadata.reExport,
    namespaceReExport: metadata.namespaceReExport,
    exportStar: metadata.exportStar,
    publicContract: metadata.reExport || metadata.exportKind
  });
}

function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

function isDynamicImportCall(node) {
  return Array.isArray(node?.arguments) && node.arguments.length > 0 && typeScriptExpressionText(node.expression) === 'import';
}

function typeScriptExpressionText(node) {
  if (!node) return undefined;
  if (typeof node.getText === 'function') {
    try { return node.getText(); } catch {}
  }
  if (typeof node.kindName === 'string') return node.kindName === 'ImportKeyword' ? 'import' : node.kindName;
  if (node.kind === 'ImportKeyword') return 'import';
  return undefined;
}

function stringLiteralFromTsExpression(node) {
  if (!node) return undefined; if (typeof node.value === 'string') return node.value;
  const rawText = typeof node.text === 'string' && typeof node.escapedText !== 'string' ? typeScriptExpressionText(node) : undefined; return rawText && /^['"`]/.test(rawText) ? node.text : undefined;
}
