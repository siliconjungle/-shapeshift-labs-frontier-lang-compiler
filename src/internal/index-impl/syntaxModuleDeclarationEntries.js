import{idFragment}from'../../native-import-utils.js';
import{declarationRecord}from'./declarationRecord.js';
export function syntaxModuleDeclarationEntries(node, nativeNodeId, input) {
  const kind = String(node.type ?? node.kind ?? '');
  if (kind === 'ImportDeclaration') return importDeclarationEntries(node, nativeNodeId, input);
  if (kind === 'ExportNamedDeclaration') return exportNamedDeclarationEntries(node, nativeNodeId, input);
  if (kind === 'ExportAllDeclaration') return exportAllDeclarationEntries(node, nativeNodeId, input);
  if (kind === 'ExportDefaultDeclaration') return exportDefaultDeclarationEntries(node, nativeNodeId, input);
  return [];
}

function importDeclarationEntries(node, nativeNodeId, input) {
  const moduleSpecifier = sourceValue(node.source);
  if (!moduleSpecifier) return [];
  const typeOnly = node.importKind === 'type';
  const bindings = (node.specifiers ?? []).map((specifier) => importSpecifierBinding(specifier, typeOnly)).filter(Boolean);
  return importModuleEntries(input, nativeNodeId, moduleSpecifier, bindings, {
    typeOnly,
    sideEffectOnly: bindings.length === 0,
    importKind: bindings.length === 0 ? 'side-effect' : 'module'
  });
}

function exportNamedDeclarationEntries(node, nativeNodeId, input) {
  const moduleSpecifier = sourceValue(node.source);
  const typeOnly = node.exportKind === 'type';
  const bindings = [
    ...(node.specifiers ?? []).map((specifier) => exportSpecifierBinding(specifier, { typeOnly, reExport: Boolean(moduleSpecifier) })).filter(Boolean),
    ...declarationExportBindings(node.declaration, { typeOnly })
  ];
  return [
    ...(moduleSpecifier ? importModuleEntries(input, nativeNodeId, moduleSpecifier, reExportImportBindings(bindings), {
      typeOnly,
      reexport: true,
      importKind: 'reexport'
    }) : []),
    ...exportModuleEntries(input, nativeNodeId, moduleSpecifier, bindings, {
      typeOnly,
      reExport: Boolean(moduleSpecifier),
      exportKind: typeOnly ? 'type-named' : 'named'
    })
  ];
}

function exportAllDeclarationEntries(node, nativeNodeId, input) {
  const moduleSpecifier = sourceValue(node.source);
  if (!moduleSpecifier) return [];
  const exportedName = identifierName(node.exported);
  const typeOnly = node.exportKind === 'type';
  const bindings = exportedName ? [{
    localName: exportedName,
    importedName: '*',
    exportedName,
    namespace: exportedName,
    importKind: 'namespace-reexport',
    exportKind: 'namespace-reexport',
    isTypeOnly: typeOnly,
    reExport: true
  }] : [];
  return [
    ...importModuleEntries(input, nativeNodeId, moduleSpecifier, reExportImportBindings(bindings), {
      typeOnly,
      reexport: true,
      exportStar: !exportedName,
      importKind: exportedName ? 'namespace-reexport' : 'reexport'
    }),
    ...exportModuleEntries(input, nativeNodeId, moduleSpecifier, bindings, {
      typeOnly,
      reExport: true,
      exportStar: !exportedName,
      exportKind: exportedName ? 'namespace-reexport' : 'export-star'
    })
  ];
}

function exportDefaultDeclarationEntries(node, nativeNodeId, input) {
  const localName = declarationName(node.declaration) ?? identifierName(node.declaration);
  return [exportBindingEntry(input, nativeNodeId, undefined, {
    localName,
    exportedName: 'default',
    exportKind: 'default',
    isTypeOnly: false
  })];
}

function importSpecifierBinding(specifier, parentTypeOnly) {
  const kind = String(specifier.type ?? specifier.kind ?? '');
  const localName = identifierName(specifier.local);
  if (!localName) return undefined;
  const typeOnly = Boolean(parentTypeOnly || specifier.importKind === 'type');
  if (kind === 'ImportDefaultSpecifier') return { localName, importedName: 'default', importKind: typeOnly ? 'type-default' : 'default', isTypeOnly: typeOnly };
  if (kind === 'ImportNamespaceSpecifier') return { localName, importedName: '*', namespace: localName, importKind: 'namespace', isTypeOnly: typeOnly };
  return {
    localName,
    importedName: identifierName(specifier.imported) ?? localName,
    importKind: typeOnly ? 'type-named' : 'named',
    isTypeOnly: typeOnly
  };
}

function exportSpecifierBinding(specifier, options) {
  const kind = String(specifier.type ?? specifier.kind ?? '');
  const typeOnly = Boolean(options.typeOnly || specifier.exportKind === 'type');
  const exportedName = identifierName(specifier.exported) ?? identifierName(specifier.local);
  if (!exportedName) return undefined;
  if (kind === 'ExportNamespaceSpecifier') return {
    localName: exportedName,
    importedName: '*',
    exportedName,
    namespace: exportedName,
    importKind: 'namespace-reexport',
    exportKind: 'namespace-reexport',
    isTypeOnly: typeOnly,
    reExport: Boolean(options.reExport)
  };
  const localName = identifierName(specifier.local) ?? exportedName;
  return {
    localName,
    importedName: options.reExport ? localName : undefined,
    exportedName,
    importKind: options.reExport ? typeOnly ? 'type-reexport' : 'reexport' : undefined,
    exportKind: typeOnly ? 'type-named' : 'named',
    isTypeOnly: typeOnly,
    reExport: Boolean(options.reExport)
  };
}

function declarationExportBindings(declaration, options) {
  const kind = String(declaration?.type ?? declaration?.kind ?? '');
  if (!kind) return [];
  if (kind === 'VariableDeclaration') {
    return (declaration.declarations ?? []).map((entry) => identifierName(entry.id)).filter(Boolean).map((name) => exportBinding(name, name, 'named', false));
  }
  const name = declarationName(declaration);
  if (!name) return [];
  return [exportBinding(name, name, declarationTypeOnly(kind) || options.typeOnly ? 'type-named' : 'named', declarationTypeOnly(kind) || options.typeOnly)];
}

function exportBinding(localName, exportedName, exportKind, isTypeOnly) {
  return { localName, exportedName, exportKind, isTypeOnly, reExport: false };
}

function reExportImportBindings(bindings) {
  return bindings.map((binding) => ({
    localName: binding.exportedName ?? binding.localName,
    importedName: binding.importedName ?? binding.localName,
    exportedName: binding.exportedName,
    namespace: binding.namespace,
    importKind: binding.importKind ?? 'reexport',
    isTypeOnly: binding.isTypeOnly
  }));
}

function importModuleEntries(input, nativeNodeId, moduleSpecifier, bindings, metadata) {
  return [{
    declaration: compactRecord({
      ...declarationRecord(input, nativeNodeId, moduleSpecifier, 'module', 'import'),
      importPath: moduleSpecifier,
      moduleSpecifier,
      importKind: metadata.importKind,
      isTypeOnly: metadata.typeOnly,
      exportStar: metadata.exportStar,
      metadata: moduleMetadata('syntax-import', bindings, metadata)
    })
  }, ...bindings.map((binding) => importBindingEntry(input, nativeNodeId, moduleSpecifier, binding))];
}

function importBindingEntry(input, nativeNodeId, moduleSpecifier, binding) {
  return {
    declaration: compactRecord({
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
      metadata: bindingMetadata('syntax-import-binding', moduleSpecifier, binding)
    })
  };
}

function exportModuleEntries(input, nativeNodeId, moduleSpecifier, bindings, metadata) {
  const statementName = metadata.exportStar
    ? `* from ${moduleSpecifier}`
    : moduleSpecifier ? `{${bindings.map((binding) => binding.exportedName).join(',')}} from ${moduleSpecifier}` : `{${bindings.map((binding) => binding.exportedName).join(',')}}`;
  return [{
    declaration: compactRecord({
      ...declarationRecord(input, nativeNodeId, statementName, 'module', 'export'),
      exportPath: moduleSpecifier,
      moduleSpecifier,
      exportKind: metadata.exportKind,
      exportStar: metadata.exportStar,
      isTypeOnly: metadata.typeOnly,
      reExport: metadata.reExport,
      publicContract: true,
      metadata: moduleMetadata('syntax-export', bindings, metadata)
    })
  }, ...bindings.map((binding) => exportBindingEntry(input, nativeNodeId, moduleSpecifier, binding))];
}

function exportBindingEntry(input, nativeNodeId, moduleSpecifier, binding) {
  return {
    declaration: compactRecord({
      ...declarationRecord(input, nativeNodeId, binding.exportedName, 'export', 'export'),
      symbolId: `symbol:${input.language}:export:${idFragment(binding.exportedName)}`,
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
      metadata: bindingMetadata('syntax-export-binding', moduleSpecifier, binding, true)
    })
  };
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
    sideEffectOnly: metadata.sideEffectOnly,
    reexport: metadata.reexport,
    reExport: metadata.reExport,
    exportStar: metadata.exportStar,
    publicContract: metadata.reExport || metadata.exportKind
  });
}

function bindingMetadata(scan, moduleSpecifier, binding, publicContract = false) {
  return compactRecord({
    scan,
    moduleSpecifier,
    importPath: moduleSpecifier,
    exportPath: moduleSpecifier,
    localName: binding.localName,
    importedName: binding.importedName,
    exportedName: binding.exportedName,
    namespace: binding.namespace,
    importKind: binding.importKind,
    exportKind: binding.exportKind,
    isTypeOnly: binding.isTypeOnly,
    typeOnly: binding.isTypeOnly,
    reExport: binding.reExport,
    publicContract
  });
}

function sourceValue(source) {
  return typeof source?.value === 'string' ? source.value : undefined;
}

function identifierName(node) {
  return typeof node?.name === 'string' ? node.name : typeof node?.value === 'string' ? node.value : undefined;
}

function declarationName(node) {
  return identifierName(node?.id) ?? identifierName(node?.name);
}

function declarationTypeOnly(kind) {
  return kind === 'TSInterfaceDeclaration' || kind === 'TSTypeAliasDeclaration' || kind === 'InterfaceDeclaration' || kind === 'TypeAliasDeclaration';
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
