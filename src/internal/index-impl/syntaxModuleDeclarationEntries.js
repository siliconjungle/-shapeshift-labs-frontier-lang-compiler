import {
  commonJsExpressionStatementEntries,
  commonJsExportAssignmentEntries,
  commonJsRequireVariableEntries
} from './syntaxCommonJsModuleDeclarationEntries.js';
import { dynamicImportExpressionMetadata } from './dynamicImportExpressionMetadata.js';
import { hostModuleDependencyMetadata } from './importMetaUrlDependencyMetadata.js';
import { moduleImportAttributeMetadata } from './moduleImportAttributeMetadata.js';
import {
  declarationName,
  declarationTypeOnly,
  exportBindingEntry,
  exportModuleEntries,
  identifierName,
  importModuleEntries,
  sourceValue
} from './syntaxModuleEntryRecords.js';

const UNKNOWN_DYNAMIC_IMPORT_MODULE_SPECIFIER = '<dynamic-import>';

export function syntaxModuleDeclarationEntries(node, nativeNodeId, input) {
  const kind = String(node.type ?? node.kind ?? '');
  if (kind === 'ImportDeclaration') return importDeclarationEntries(node, nativeNodeId, input);
  if (kind === 'VariableDeclarator') return commonJsRequireVariableEntries(node, nativeNodeId, input);
  if (kind === 'ExpressionStatement') return commonJsExpressionStatementEntries(node, nativeNodeId, input);
  if (kind === 'AssignmentExpression') return commonJsExportAssignmentEntries(node, nativeNodeId, input);
  if (kind === 'ImportExpression') return dynamicImportExpressionEntries(node, nativeNodeId, input);
  if (kind === 'CallExpression' && isDynamicImportCall(node)) return dynamicImportExpressionEntries(node, nativeNodeId, input);
  if (kind === 'CallExpression' || kind === 'NewExpression') return hostModuleDependencyEntries(node, nativeNodeId, input);
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
    importKind: bindings.length === 0 ? 'side-effect' : 'module',
    ...moduleImportAttributeMetadata(node)
  });
}

function dynamicImportExpressionEntries(node, nativeNodeId, input) {
  const importArgument = node.source ?? (node.arguments ?? [])[0];
  if (!importArgument) return [];
  const moduleSpecifier = sourceValue(importArgument) ?? UNKNOWN_DYNAMIC_IMPORT_MODULE_SPECIFIER;
  return importModuleEntries(input, nativeNodeId, moduleSpecifier, [], {
    importKind: 'dynamic-import',
    dynamicImport: true,
    ...dynamicImportExpressionMetadata(importArgument, moduleSpecifier),
    ...moduleImportAttributeMetadata(node)
  });
}

function hostModuleDependencyEntries(node, nativeNodeId, input) {
  return hostModuleDependencyMetadata(node, { kind: String(node.type ?? node.kind ?? '') }).flatMap((dependency) =>
    importModuleEntries(input, nativeNodeId, dependency.moduleSpecifier, [], dependency.metadata));
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
      importKind: 'reexport',
      ...moduleImportAttributeMetadata(node)
    }) : []),
    ...exportModuleEntries(input, nativeNodeId, moduleSpecifier, bindings, {
      typeOnly,
      reExport: Boolean(moduleSpecifier),
      exportKind: typeOnly ? 'type-named' : 'named',
      ...moduleImportAttributeMetadata(node)
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
      importKind: exportedName ? 'namespace-reexport' : 'reexport',
      ...moduleImportAttributeMetadata(node)
    }),
    ...exportModuleEntries(input, nativeNodeId, moduleSpecifier, bindings, {
      typeOnly,
      reExport: true,
      exportStar: !exportedName,
      exportKind: exportedName ? 'namespace-reexport' : 'export-star',
      ...moduleImportAttributeMetadata(node)
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

function isDynamicImportCall(node) {
  const calleeKind = String(node.callee?.type ?? node.callee?.kind ?? '');
  return calleeKind === 'Import' || calleeKind === 'ImportKeyword' || identifierName(node.callee) === 'import';
}
