import {
  nativeExportDeclaration,
  nativeImportBindingDeclaration,
  nativeImportDeclaration
} from './native-region-scanner-core.js';

export function jsCommonJsReExportDeclarations(input, lineNumber, trimmed) {
  const exportStar = trimmed.match(/^(?:[A-Za-z_$][\w$]*\s*\.\s*)?__exportStar\(\s*require\(\s*(['"])([^'"]+)\1\s*\)\s*,\s*(?:module\.)?exports\s*\)\s*;?$/);
  if (exportStar) return commonJsExportStarDeclarations(input, lineNumber, exportStar[2]);
  const binding = trimmed.match(/^(?:[A-Za-z_$][\w$]*\s*\.\s*)?__createBinding\(\s*(?:module\.)?exports\s*,\s*require\(\s*(['"])([^'"]+)\1\s*\)\s*,\s*(['"])([^'"]+)\3(?:\s*,\s*(['"])([^'"]+)\5)?\s*\)\s*;?$/);
  if (binding) return commonJsCreateBindingDeclarations(input, lineNumber, binding[2], binding[4], binding[6] ?? binding[4]);
  return [];
}

function commonJsExportStarDeclarations(input, lineNumber, importPath) {
  const metadata = commonJsReExportMetadata({ exportStar: true, importKind: 'reexport' });
  return [
    ...importModuleDeclarations(input, lineNumber, importPath, 'CommonJsExportStarRequireDeclaration', [], metadata),
    ...exportModuleDeclarations(input, lineNumber, importPath, [], { ...metadata, exportKind: 'export-star' })
  ];
}

function commonJsCreateBindingDeclarations(input, lineNumber, importPath, importedName, exportedName) {
  if (!importedName || !exportedName || exportedName === '__esModule') return [];
  const binding = {
    localName: exportedName,
    importedName,
    exportedName,
    importKind: 'reexport',
    exportKind: 'named',
    commonJs: true
  };
  const metadata = commonJsReExportMetadata({ importKind: 'reexport', bindingCount: 1 });
  return [
    ...importModuleDeclarations(input, lineNumber, importPath, 'CommonJsCreateBindingRequireDeclaration', [binding], metadata),
    ...exportModuleDeclarations(input, lineNumber, importPath, [binding], { ...metadata, exportKind: 'named' })
  ];
}

function importModuleDeclarations(input, lineNumber, importPath, languageKind, bindings, metadata) {
  return [
    nativeImportDeclaration(input, lineNumber, importPath, languageKind, 'module', {
      fields: { moduleOnly: true, importBindings: bindings, reexport: true, commonJs: true, ...(metadata.exportStar ? { exportStar: true } : {}) },
      metadata: { moduleOnly: true, bindingCount: bindings.length, ...metadata }
    }),
    ...bindings.map((binding) => nativeImportBindingDeclaration(input, lineNumber, importPath, binding))
  ];
}

function exportModuleDeclarations(input, lineNumber, importPath, bindings, metadata) {
  const exports = bindings.map((binding) => ({
    localName: binding.importedName,
    importedName: binding.importedName,
    exportedName: binding.exportedName ?? binding.localName,
    exportKind: binding.exportKind ?? binding.importKind,
    commonJs: true
  }));
  return [
    nativeExportDeclaration(input, lineNumber, metadata.exportStar ? `* from ${importPath}` : `{${exports.map((binding) => binding.exportedName).join(',')}} from ${importPath}`, 'ExportFromDeclaration', {
      importPath: String(importPath),
      exportBindings: exports,
      ...(metadata.exportStar ? { exportStar: true } : {})
    }, { symbolKind: 'module', metadata }),
    ...exports.map((binding) => nativeExportDeclaration(input, lineNumber, binding.exportedName, 'ExportBinding', {
      ...binding,
      importPath: String(importPath)
    }, { metadata: { ...binding, importPath: String(importPath) } }))
  ];
}

function commonJsReExportMetadata(extra = {}) {
  return {
    commonJs: true,
    reexport: true,
    reExport: true,
    publicContract: true,
    ...extra
  };
}
