import { idFragment } from '../../native-import-utils.js';
import { declarationRecord } from './declarationRecord.js';

export function importModuleEntries(input, nativeNodeId, moduleSpecifier, bindings, metadata) {
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
  }, ...bindings.map((binding) => importBindingEntry(input, nativeNodeId, moduleSpecifier, binding, metadata))];
}

export function importBindingEntry(input, nativeNodeId, moduleSpecifier, binding, metadata = {}) {
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
      commonJs: binding.commonJs,
      metadata: bindingMetadata('syntax-import-binding', moduleSpecifier, binding, false, metadata)
    })
  };
}

export function exportModuleEntries(input, nativeNodeId, moduleSpecifier, bindings, metadata) {
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
  }, ...bindings.map((binding) => exportBindingEntry(input, nativeNodeId, moduleSpecifier, binding, metadata))];
}

export function exportBindingEntry(input, nativeNodeId, moduleSpecifier, binding, metadata = {}) {
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
      commonJs: binding.commonJs,
      metadata: bindingMetadata('syntax-export-binding', moduleSpecifier, binding, true, metadata)
    })
  };
}

export function sourceValue(source) {
  if (typeof source?.value === 'string') return source.value;
  const kind = String(source?.type ?? source?.kind ?? '');
  if (kind === 'TemplateLiteral' && (source.expressions ?? []).length === 0 && (source.quasis ?? []).length === 1) {
    return source.quasis[0]?.value?.cooked ?? source.quasis[0]?.value?.raw;
  }
  return undefined;
}

export function identifierName(node) {
  return typeof node?.name === 'string' ? node.name : typeof node?.value === 'string' ? node.value : undefined;
}

export function declarationName(node) {
  return identifierName(node?.id) ?? identifierName(node?.name);
}

export function declarationTypeOnly(kind) {
  return kind === 'TSInterfaceDeclaration' || kind === 'TSTypeAliasDeclaration' || kind === 'InterfaceDeclaration' || kind === 'TypeAliasDeclaration';
}

export function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
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
    dynamicImport: metadata.dynamicImport,
    dynamicImportSpecifierKind: metadata.dynamicImportSpecifierKind,
    dynamicImportExpressionText: metadata.dynamicImportExpressionText,
    dynamicImportExpressionHash: metadata.dynamicImportExpressionHash,
    dynamicImportStaticSpecifierEvidence: metadata.dynamicImportStaticSpecifierEvidence,
    dynamicImportRuntimeResolutionClaim: metadata.dynamicImportRuntimeResolutionClaim,
    dynamicImportResolutionProofRequired: metadata.dynamicImportResolutionProofRequired,
    hostDependency: metadata.hostDependency,
    hostDependencyKind: metadata.hostDependencyKind,
    hostDependencyBase: metadata.hostDependencyBase,
    hostDependencyExpressionText: metadata.hostDependencyExpressionText,
    hostDependencyExpressionHash: metadata.hostDependencyExpressionHash,
    hostDependencyStaticSpecifierEvidence: metadata.hostDependencyStaticSpecifierEvidence,
    hostDependencyRuntimeResolutionClaim: metadata.hostDependencyRuntimeResolutionClaim,
    hostDependencyResolutionProofRequired: metadata.hostDependencyResolutionProofRequired,
    hasImportAttributes: metadata.hasImportAttributes,
    importAttributeCount: metadata.importAttributeCount,
    importAttributeKeys: metadata.importAttributeKeys,
    importAttributeHash: metadata.importAttributeHash,
    importAttributes: metadata.importAttributes,
    commonJs: metadata.commonJs,
    interopHelper: metadata.interopHelper,
    reexport: metadata.reexport,
    reExport: metadata.reExport,
    exportStar: metadata.exportStar,
    publicContract: metadata.reExport || metadata.exportKind
  });
}

function bindingMetadata(scan, moduleSpecifier, binding, publicContract = false, metadata = {}) {
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
    publicContract, hasImportAttributes: metadata.hasImportAttributes, importAttributeCount: metadata.importAttributeCount, importAttributeKeys: metadata.importAttributeKeys, importAttributeHash: metadata.importAttributeHash, importAttributes: metadata.importAttributes,
    commonJs: binding.commonJs,
    interopHelper: binding.interopHelper ?? metadata.interopHelper
  });
}
