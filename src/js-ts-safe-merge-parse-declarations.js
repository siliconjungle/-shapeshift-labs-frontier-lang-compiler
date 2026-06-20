import { JsTsSafeMergeConflictCodes, identifierRegExp } from './js-ts-safe-merge-constants.js';

export function classifyStatement(text, start, end) {
  const importInfo = parseImportInfo(text);
  if (importInfo) {
    return {
      kind: 'import',
      key: importLedgerKey(importInfo),
      text,
      start,
      end,
      importInfo,
      names: importInfo.specifiers.map((specifier) => specifier.localName).filter(Boolean)
    };
  }
  const declarationInfo = parseDeclarationInfo(text);
  if (declarationInfo) {
    const unsupported = unsupportedDeclarationPolicy(text, declarationInfo);
    if (unsupported) return { unsupported, text, start, end };
    return {
      kind: declarationInfo.kind,
      key: `${declarationInfo.kind}:${declarationInfo.names.join('|')}`,
      text,
      start,
      end,
      declarationInfo,
      names: declarationInfo.names
    };
  }
  return undefined;
}

function parseImportInfo(text) {
  const trimmed = text.trim();
  const sideEffect = trimmed.match(/^import\s+(['"])([^'"]+)\1\s*;?$/s);
  if (sideEffect) {
    return {
      moduleSpecifier: sideEffect[2],
      quote: sideEffect[1],
      typeOnly: false,
      sideEffectOnly: true,
      defaultLocalName: undefined,
      namespaceLocalName: undefined,
      specifiers: []
    };
  }

  const match = trimmed.match(/^import\s+(type\s+)?([\s\S]+?)\s+from\s+(['"])([^'"]+)\3\s*;?$/s);
  if (!match) return undefined;
  const typeOnly = Boolean(match[1]);
  const clause = match[2].trim();
  const parsedClause = parseImportClause(clause, { typeOnly });
  if (!parsedClause) return undefined;
  return {
    moduleSpecifier: match[4],
    quote: match[3],
    typeOnly,
    sideEffectOnly: false,
    ...parsedClause
  };
}

function parseImportClause(clause, options) {
  const namespace = clause.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
  if (namespace) {
    return {
      defaultLocalName: undefined,
      namespaceLocalName: namespace[1],
      specifiers: []
    };
  }

  const named = clause.match(/\{([\s\S]*)\}/);
  if (!named) {
    if (!identifierRegExp.test(clause)) return undefined;
    return {
      defaultLocalName: clause,
      namespaceLocalName: undefined,
      specifiers: []
    };
  }

  const beforeNamed = clause.slice(0, named.index).trim();
  const afterNamed = clause.slice(named.index + named[0].length).trim();
  if (afterNamed) return undefined;
  let defaultLocalName;
  if (beforeNamed) {
    const defaultText = beforeNamed.replace(/,$/, '').trim();
    if (!identifierRegExp.test(defaultText)) return undefined;
    defaultLocalName = defaultText;
  }

  const specifiers = splitCommaList(named[1]).map((part) => parseImportSpecifier(part, options)).filter(Boolean);
  if (splitCommaList(named[1]).filter((part) => part.trim()).length !== specifiers.length) return undefined;
  return {
    defaultLocalName,
    namespaceLocalName: undefined,
    specifiers
  };
}

function parseImportSpecifier(raw, options) {
  let text = String(raw ?? '').trim();
  if (!text) return undefined;
  let typeOnly = Boolean(options.typeOnly);
  if (text.startsWith('type ')) {
    typeOnly = true;
    text = text.slice(5).trim();
  }
  const match = text.match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
  if (!match) return undefined;
  const importedName = match[1];
  const localName = match[2] ?? importedName;
  return {
    importedName,
    localName,
    typeOnly,
    canonical: importSpecifierCanonical({ importedName, localName, typeOnly })
  };
}

function parseDeclarationInfo(text) {
  const trimmed = text.trim();
  const defaultFunction = trimmed.match(/^export\s+default\s+(?:async\s+)?function\*?(?:\s+([A-Za-z_$][\w$]*))?\b/);
  if (defaultFunction) return { kind: 'declaration', names: ['default'], declarationKind: 'function', exported: true, defaultExport: true };
  const defaultClass = trimmed.match(/^export\s+default\s+(?:abstract\s+)?class(?:\s+([A-Za-z_$][\w$]*))?\b/);
  if (defaultClass) return { kind: 'declaration', names: ['default'], declarationKind: 'class', exported: true, defaultExport: true };

  const namedExport = trimmed.match(/^export\s+(type\s+)?\{([\s\S]+)\}\s*;?$/);
  if (namedExport) {
    const names = splitCommaList(namedExport[2]).map((part) => parseExportSpecifierName(part)).filter(Boolean);
    const expectedCount = splitCommaList(namedExport[2]).filter((part) => part.trim()).length;
    if (names.length !== expectedCount || names.length === 0) return undefined;
    return { kind: 'export', names, declarationKind: 'export-list', exported: true, typeOnly: Boolean(namedExport[1]) };
  }

  const source = trimmed
    .replace(/^export\s+/, '')
    .replace(/^declare\s+/, '');
  const functionMatch = source.match(/^(?:async\s+)?function\*?\s+([A-Za-z_$][\w$]*)\b/);
  if (functionMatch) return { kind: 'declaration', names: [functionMatch[1]], declarationKind: 'function', exported: trimmed.startsWith('export ') };
  const classMatch = source.match(/^(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)\b/);
  if (classMatch) return { kind: 'declaration', names: [classMatch[1]], declarationKind: 'class', exported: trimmed.startsWith('export ') };
  const interfaceMatch = source.match(/^interface\s+([A-Za-z_$][\w$]*)\b/);
  if (interfaceMatch) return { kind: 'declaration', names: [interfaceMatch[1]], declarationKind: 'interface', exported: trimmed.startsWith('export ') };
  const typeMatch = source.match(/^type\s+([A-Za-z_$][\w$]*)\b/);
  if (typeMatch) return { kind: 'declaration', names: [typeMatch[1]], declarationKind: 'type', exported: trimmed.startsWith('export ') };
  const enumMatch = source.match(/^(?:const\s+)?enum\s+([A-Za-z_$][\w$]*)\b/);
  if (enumMatch) return { kind: 'declaration', names: [enumMatch[1]], declarationKind: 'enum', exported: trimmed.startsWith('export ') };
  const moduleMatch = source.match(/^(?:namespace|module)\s+([A-Za-z_$][\w$.]*)\b/);
  if (moduleMatch) return { kind: 'declaration', names: [moduleMatch[1]], declarationKind: 'module', exported: trimmed.startsWith('export ') };
  const variableMatch = source.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\b/);
  if (variableMatch) return { kind: 'declaration', names: [variableMatch[1]], declarationKind: 'variable', exported: trimmed.startsWith('export ') };
  return undefined;
}

function unsupportedDeclarationPolicy(text, declarationInfo) {
  const trimmed = text.trim();
  if (/^\s*@/m.test(text)) {
    return {
      code: JsTsSafeMergeConflictCodes.unsupportedDecorator,
      details: { reasonCode: 'unsupported-decorator-merge-anchor', declarationKind: declarationInfo.declarationKind }
    };
  }
  if (declarationInfo.declarationKind === 'function' && !trimmed.includes('{') && /;\s*$/.test(trimmed)) {
    return {
      code: JsTsSafeMergeConflictCodes.unsupportedOverload,
      details: { reasonCode: 'unsupported-overload-merge-anchor', names: declarationInfo.names }
    };
  }
  if (hasComputedMemberKey(text)) {
    return {
      code: JsTsSafeMergeConflictCodes.computedKey,
      details: { reasonCode: 'computed-key', declarationKind: declarationInfo.declarationKind, names: declarationInfo.names }
    };
  }
  return undefined;
}

function hasComputedMemberKey(text) {
  return /(?:^|[\n{,;])\s*(?:readonly\s+)?\[[^\]\n]+\]\??\s*(?::|\()/m.test(text);
}

function parseExportSpecifierName(raw) {
  let text = String(raw ?? '').trim();
  if (!text) return undefined;
  if (text.startsWith('type ')) text = text.slice(5).trim();
  const match = text.match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
  if (!match) return undefined;
  return match[2] ?? match[1];
}

function splitCommaList(raw) {
  return String(raw ?? '').split(',');
}

function importLedgerKey(importInfo) {
  if (importInfo.sideEffectOnly) return `import:side-effect:${importInfo.moduleSpecifier}`;
  return [
    'import:named',
    importInfo.moduleSpecifier,
    importInfo.typeOnly ? 'type' : 'value',
    importInfo.defaultLocalName ?? '',
    importInfo.namespaceLocalName ?? ''
  ].join(':');
}

export function importSpecifierCanonical(specifier) {
  return `${specifier.typeOnly ? 'type ' : ''}${specifier.importedName}${specifier.localName === specifier.importedName ? '' : ` as ${specifier.localName}`}`;
}
