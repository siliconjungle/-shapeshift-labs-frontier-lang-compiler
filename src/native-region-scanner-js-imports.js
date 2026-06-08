import {
  nativeImportBindingDeclaration,
  nativeImportDeclaration
} from './native-region-scanner-core.js';

export function jsImportDeclarations(input, lineNumber, trimmed) {
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
    return jsImportModuleDeclarations(input, lineNumber, importPath, 'ImportDeclaration', bindings, { typeOnly, sideEffectOnly: bindings.length === 0 });
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
    return jsImportModuleDeclarations(input, lineNumber, importPath, 'ExportFromDeclaration', bindings, { typeOnly, reexport: true, exportStar: Boolean(exportMatch[2]) });
  }
  const destructuredRequireMatch = trimmed.match(/^(?:const|let|var)\s+\{([^}]+)\}\s*=\s*(?:await\s+)?(require|import)\s*\(\s*(['"])([^'"]+)\3\s*\)/);
  if (destructuredRequireMatch) {
    const importKind = destructuredRequireMatch[2] === 'import' ? 'dynamic-import-binding' : 'commonjs-require';
    const bindings = jsDestructuredImportBindings(destructuredRequireMatch[1], importKind);
    if (bindings.length) {
      return jsImportModuleDeclarations(input, lineNumber, destructuredRequireMatch[4], 'DestructuredRequireDeclaration', bindings, { destructured: true });
    }
  }
  const requireMatch = trimmed.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(?:require|import)\s*\(\s*(['"])([^'"]+)\2\s*\)/);
  if (requireMatch) return jsImportModuleDeclarations(input, lineNumber, requireMatch[3], 'CommonJsRequireDeclaration', [{
    localName: requireMatch[1],
    importedName: 'default',
    importKind: trimmed.includes('import') ? 'dynamic-import-binding' : 'commonjs-require'
  }]);
  return [];
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
        ...(metadata.destructured ? { destructured: true } : {})
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
