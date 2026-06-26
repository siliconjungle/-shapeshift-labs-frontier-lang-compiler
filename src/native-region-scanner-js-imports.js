import {
  nativeExportDeclaration,
  nativeImportBindingDeclaration,
  nativeImportDeclaration
} from './native-region-scanner-core.js';
import { jsCommonJsExportDeclarations } from './native-region-scanner-js-commonjs.js';
import { jsCommonJsHelperImportDeclarations } from './native-region-scanner-js-ts-helpers.js';
import { jsCommonJsReExportDeclarations } from './native-region-scanner-js-reexports.js';
import { idFragment } from './native-import-utils.js';
import { importAttributeMetadataFromSource } from './internal/index-impl/moduleImportAttributeMetadata.js';

export function jsImportDeclarations(input, lineNumber, trimmed) {
  const commonJsReExport = jsCommonJsReExportDeclarations(input, lineNumber, trimmed);
  if (commonJsReExport.length) return commonJsReExport;
  const commonJsHelperImport = jsCommonJsHelperImportDeclarations(input, lineNumber, trimmed);
  if (commonJsHelperImport.length) return commonJsHelperImport;
  const importEquals = trimmed.match(/^import\s+(type\s+)?([A-Za-z_$][\w$]*)\s*=\s*require\s*\(\s*(['"])([^'"]+)\3\s*\)/);
  if (importEquals) return jsImportModuleDeclarations(input, lineNumber, importEquals[4], 'ImportEqualsDeclaration', [{
    localName: importEquals[2],
    importedName: 'default',
    importKind: 'commonjs-require',
    typeOnly: Boolean(importEquals[1])
  }]);
  const importMatch = trimmed.match(/^import\s+(type\s+)?(?:(.+?)\s+from\s+)?(['"])([^'"]+)\3/);
  if (importMatch) {
    const typeOnly = Boolean(importMatch[1]);
    const importPath = importMatch[4];
    const clause = importMatch[2]?.trim();
    const bindings = clause ? jsImportBindingsFromClause(clause, { typeOnly }) : [];
    return jsImportModuleDeclarations(input, lineNumber, importPath, 'ImportDeclaration', bindings, { typeOnly, sideEffectOnly: bindings.length === 0, importKind: bindings.length === 0 ? 'side-effect' : 'module', ...importAttributeMetadataFromSource(trimmed) });
  }
  const exportMatch = trimmed.match(/^export\s+(type\s+)?(?:(\*)\s+from|\*\s+as\s+([A-Za-z_$][\w$]*)\s+from|\{([^}]+)\}\s+from)\s+(['"])([^'"]+)\5/);
  if (exportMatch) {
    const typeOnly = Boolean(exportMatch[1]);
    const importPath = exportMatch[6];
    const bindings = exportMatch[3]
      ? [{ localName: exportMatch[3], importedName: '*', exportedName: exportMatch[3], importKind: 'namespace-reexport', typeOnly }]
      : exportMatch[4]
        ? jsNamedImportBindings(exportMatch[4], { typeOnly, reexport: true })
        : [];
    return [
      ...jsImportModuleDeclarations(input, lineNumber, importPath, 'ExportFromDeclaration', bindings, { typeOnly, reexport: true, exportStar: Boolean(exportMatch[2]), ...importAttributeMetadataFromSource(trimmed) }),
      ...jsExportModuleDeclarations(input, lineNumber, importPath, bindings, { typeOnly, exportStar: Boolean(exportMatch[2]), ...importAttributeMetadataFromSource(trimmed) })
    ];
  }
  const destructuredRequireMatch = trimmed.match(/^(?:const|let|var)\s+\{([^}]+)\}\s*=\s*(?:await\s+)?(require|import)\s*\(\s*(['"])([^'"]+)\3\s*\)/);
  if (destructuredRequireMatch) {
    const dynamicImport = destructuredRequireMatch[2] === 'import';
    const importKind = dynamicImport ? 'dynamic-import-binding' : 'commonjs-require';
    const bindings = jsDestructuredImportBindings(destructuredRequireMatch[1], importKind);
    if (bindings.length) {
      return jsImportModuleDeclarations(input, lineNumber, destructuredRequireMatch[4], 'DestructuredRequireDeclaration', bindings, {
        destructured: true,
        ...(dynamicImport ? jsDynamicImportMetadata() : {})
      });
    }
  }
  const requireMatch = trimmed.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(require|import)\s*\(\s*(['"])([^'"]+)\3\s*\)/);
  if (requireMatch) {
    const dynamicImport = requireMatch[2] === 'import';
    return jsImportModuleDeclarations(input, lineNumber, requireMatch[4], dynamicImport ? 'DynamicImportBindingDeclaration' : 'CommonJsRequireDeclaration', [{
      localName: requireMatch[1],
      importedName: 'default',
      importKind: dynamicImport ? 'dynamic-import-binding' : 'commonjs-require'
    }], dynamicImport ? jsDynamicImportMetadata() : {});
  }
  const sideEffectRequireMatch = trimmed.match(/^require\s*\(\s*(['"])([^'"]+)\1\s*\)\s*;?$/);
  if (sideEffectRequireMatch) {
    return jsImportModuleDeclarations(input, lineNumber, sideEffectRequireMatch[2], 'CommonJsSideEffectRequireDeclaration', [], {
      sideEffectOnly: true,
      importKind: 'commonjs-require'
    });
  }
  const dynamicImportMatch = trimmed.match(/^import\s*\(\s*(['"])([^'"]+)\1\s*(?:,\s*(.+))?\)\s*;?$/);
  if (dynamicImportMatch) return jsImportModuleDeclarations(input, lineNumber, dynamicImportMatch[2], 'DynamicImportExpression', [], jsDynamicImportMetadata(dynamicImportMatch[3]));
  return [];
}

export function jsExportDeclarations(input, lineNumber, trimmed) {
  const commonJsExport = jsCommonJsExportDeclarations(input, lineNumber, trimmed);
  if (commonJsExport.length) return commonJsExport;
  if (/^export\s+(?:type\s+)?(?:\*|\{[^}]+\}\s+from\b)/.test(trimmed)) return [];
  const named = trimmed.match(/^export\s+(type\s+)?\{([^}]+)\}\s*;?$/);
  if (named) return jsLocalExportDeclarations(input, lineNumber, named[2], { typeOnly: Boolean(named[1]) });
  const namespace = trimmed.match(/^export\s+as\s+namespace\s+([A-Za-z_$][\w$]*)\s*;?$/);
  if (namespace) return [nativeExportDeclaration(input, lineNumber, namespace[1], 'ExportNamespaceDeclaration', {
    exportKind: 'namespace'
  })];
  const assignment = trimmed.match(/^export\s*=\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*;?$/);
  if (assignment) return [nativeExportDeclaration(input, lineNumber, 'module.exports', 'ExportAssignment', {
    exportKind: 'assignment',
    localName: assignment[1]
  }, {
    name: 'module.exports',
    metadata: {
      exportKind: 'assignment',
      exportedName: 'module.exports',
      localName: assignment[1],
      publicContract: true
    }
  })];
  if (!trimmed.startsWith('export ')) return [];
  const defaultMatch = trimmed.match(/^export\s+default\s+(.+)$/);
  if (defaultMatch) return [nativeExportDeclaration(input, lineNumber, 'default', 'ExportDefaultDeclaration', {
    exportDefault: true,
    localName: jsExportedDeclarationName(defaultMatch[1])
  }, { name: 'default' })];
  const declarationSource = trimmed.replace(/^export\s+(?:declare\s+)?/, '');
  if (!jsExportedDeclarationLooksComplete(declarationSource)) return [];
  const exportedName = jsExportedDeclarationName(declarationSource);
  if (!exportedName) return [];
  return [nativeExportDeclaration(input, lineNumber, exportedName, 'ExportNamedDeclaration', {
    declarationKind: jsExportedDeclarationKind(declarationSource)
  })];
}

function jsDestructuredImportBindings(raw, importKind) {
  return String(raw ?? '')
    .split(',')
    .map((part) => {
      const text = part.trim();
      if (!text || text.startsWith('...')) return undefined;
      const match = text.match(/^([A-Za-z_$][\w$]*|\*)\s*(?::\s*([A-Za-z_$][\w$]*))?$/);
      if (!match) return undefined;
      return {
        localName: match[2] ?? match[1],
        importedName: match[1],
        importKind
      };
    })
    .filter(Boolean);
}

function jsImportModuleDeclarations(input, lineNumber, importPath, languageKind, bindings = [], metadata = {}) {
  const bindingSummaries = bindings.map((binding) => ({
    localName: binding.localName,
    importedName: binding.importedName,
    importKind: binding.importKind,
    ...(binding.namespace ? { namespace: binding.namespace } : {}),
    ...(binding.exportedName ? { exportedName: binding.exportedName } : {}),
    ...(binding.typeOnly ? { typeOnly: true } : {})
  }));
  return [
    nativeImportDeclaration(input, lineNumber, importPath, languageKind, 'module', {
      fields: {
        moduleOnly: true,
        importBindings: bindingSummaries,
        ...(metadata.typeOnly ? { typeOnly: true } : {}),
        ...(metadata.sideEffectOnly ? { sideEffectOnly: true } : {}),
        ...(metadata.reexport ? { reexport: true } : {}),
        ...(metadata.exportStar ? { exportStar: true } : {}),
        ...(metadata.destructured ? { destructured: true } : {}),
        ...(metadata.dynamicImport ? { dynamicImport: true } : {}),
        ...(metadata.hasImportAttributes ? { hasImportAttributes: true } : {})
      },
      metadata: {
        moduleOnly: true,
        bindingCount: bindings.length,
        ...metadata
      }
    }),
    ...bindings.map((binding) => nativeImportBindingDeclaration(input, lineNumber, importPath, binding))
  ];
}

function jsDynamicImportMetadata(attributesSource) {
  return {
    importKind: 'dynamic-import',
    dynamicImport: true,
    ...importAttributeMetadataFromSource(attributesSource)
  };
}

function jsExportModuleDeclarations(input, lineNumber, importPath, bindings = [], metadata = {}) {
  const exports = bindings.map((binding) => ({
    localName: binding.importedName,
    exportedName: binding.exportedName ?? binding.localName,
    exportKind: binding.importKind,
    ...(binding.typeOnly ? { typeOnly: true } : {})
  }));
  const statementName = metadata.exportStar
    ? `* from ${importPath}`
    : exports.length
      ? `{${exports.map((binding) => binding.exportedName).join(',')}} from ${importPath}`
      : `from ${importPath}`;
  return [
    nativeExportDeclaration(input, lineNumber, statementName, 'ExportFromDeclaration', {
      importPath: String(importPath),
      exportBindings: exports,
      ...(metadata.typeOnly ? { typeOnly: true } : {}),
      ...(metadata.exportStar ? { exportStar: true } : {})
    }, { symbolKind: 'module', metadata }),
    ...exports.map((binding) => nativeExportDeclaration(input, lineNumber, binding.exportedName, 'ExportBinding', {
      ...binding,
      importPath: String(importPath)
    }, { metadata: { ...binding, importPath: String(importPath) } }))
  ];
}

function jsLocalExportDeclarations(input, lineNumber, raw, options = {}) {
  const bindings = jsNamedExportBindings(raw, options);
  if (!bindings.length) return [];
  return [
    nativeExportDeclaration(input, lineNumber, `{${bindings.map((binding) => binding.exportedName).join(',')}}`, 'ExportNamedDeclaration', {
      exportBindings: bindings,
      ...(options.typeOnly ? { typeOnly: true } : {})
    }, {
      symbolId: `symbol:${input.language}:export:statement:${idFragment(bindings.map((binding) => binding.exportedName).join('_'))}`,
      metadata: { bindingCount: bindings.length, ...(options.typeOnly ? { typeOnly: true } : {}) }
    }),
    ...bindings.map((binding) => nativeExportDeclaration(input, lineNumber, binding.exportedName, 'ExportBinding', binding, { metadata: binding }))
  ];
}

function jsImportBindingsFromClause(clause, options = {}) {
  const source = String(clause ?? '').trim();
  if (!source) return [];
  const namespace = source.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
  if (namespace) return [{ localName: namespace[1], importedName: '*', importKind: 'namespace', typeOnly: options.typeOnly }];
  const bindings = [];
  const named = source.match(/\{([^}]*)\}/);
  const defaultPart = source.replace(/\{[^}]*\}/, '').split(',').map((part) => part.trim()).filter(Boolean)[0];
  if (defaultPart && /^[A-Za-z_$][\w$]*$/.test(defaultPart)) {
    bindings.push({ localName: defaultPart, importedName: 'default', importKind: 'default', typeOnly: options.typeOnly });
  }
  if (named) bindings.push(...jsNamedImportBindings(named[1], options));
  return bindings;
}

function jsNamedImportBindings(raw, options = {}) {
  return String(raw ?? '')
    .split(',')
    .map((part) => jsNamedImportBinding(part, options))
    .filter(Boolean);
}

function jsNamedImportBinding(raw, options = {}) {
  let text = String(raw ?? '').trim();
  if (!text) return undefined;
  let typeOnly = Boolean(options.typeOnly);
  if (text.startsWith('type ')) {
    typeOnly = true;
    text = text.slice(5).trim();
  }
  const match = text.match(/^([A-Za-z_$][\w$]*|\*)\s*(?:as\s+([A-Za-z_$][\w$]*))?$/);
  if (!match) return undefined;
  const importedName = match[1];
  const localName = match[2] ?? importedName;
  return {
    localName,
    importedName,
    exportedName: options.reexport ? localName : undefined,
    importKind: options.reexport ? 'reexport' : typeOnly ? 'type-named' : 'named',
    typeOnly
  };
}

function jsNamedExportBindings(raw, options = {}) {
  return String(raw ?? '').split(',').map((part) => jsNamedExportBinding(part, options)).filter(Boolean);
}

function jsNamedExportBinding(raw, options = {}) {
  let text = String(raw ?? '').trim();
  if (!text) return undefined;
  let typeOnly = Boolean(options.typeOnly);
  if (text.startsWith('type ')) {
    typeOnly = true;
    text = text.slice(5).trim();
  }
  const match = text.match(/^([A-Za-z_$][\w$]*|\*)\s*(?:as\s+([A-Za-z_$][\w$]*|\*))?$/);
  if (!match) return undefined;
  const localName = match[1];
  return { localName, exportedName: match[2] ?? localName, exportKind: typeOnly ? 'type-named' : 'named', typeOnly };
}

function jsExportedDeclarationName(source) {
  const text = String(source ?? '').trim();
  return text.match(/^(?:async\s+)?function\*?\s+([A-Za-z_$][\w$]*)/)?.[1]
    ?? text.match(/^(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/)?.[1]
    ?? text.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/)?.[1]
    ?? text.match(/^type\s+([A-Za-z_$][\w$]*)/)?.[1]
    ?? text.match(/^interface\s+([A-Za-z_$][\w$]*)/)?.[1]
    ?? text.match(/^(?:const\s+)?enum\s+([A-Za-z_$][\w$]*)/)?.[1]
    ?? text.match(/^([A-Za-z_$][\w$]*)\b/)?.[1]
    ?? 'default';
}

function jsExportedDeclarationKind(source) {
  const text = String(source ?? '').trim();
  if (/^(?:async\s+)?function/.test(text)) return 'function';
  if (/^(?:abstract\s+)?class/.test(text)) return 'class';
  if (/^interface\b|^type\b|^(?:const\s+)?enum\b/.test(text)) return 'type';
  if (/^(?:const|let|var)\b/.test(text)) return 'variable';
  return 'value';
}

function jsExportedDeclarationLooksComplete(source) {
  const text = String(source ?? '').trim();
  if (/^(?:async\s+)?function/.test(text)) return text.includes(')') && /[;{]/.test(text);
  if (/^(?:abstract\s+)?class/.test(text)) return text.includes('{') || text.endsWith(';');
  return true;
}
