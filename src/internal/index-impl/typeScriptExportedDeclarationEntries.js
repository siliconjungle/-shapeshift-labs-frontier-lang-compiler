import{idFragment}from'../../native-import-utils.js';
import{declarationRecord}from'./declarationRecord.js';import{identifierName}from'./identifierName.js';
export function typeScriptExportedDeclarationEntries(node, kind, nativeNodeId, input, options = {}) {
  const modifiers = declarationModifiers(node, options.ts);
  if (!modifiers.exported) return [];
  if (isVariableStatement(node, kind)) return variableStatementExportEntries(node, nativeNodeId, input, modifiers);
  const localName = identifierName(node.name);
  const symbolKind = exportedSymbolKind(kind);
  if (!symbolKind && !modifiers.defaulted) return [];
  return [exportEntry(input, nativeNodeId, {
    localName,
    exportedName: modifiers.defaulted ? 'default' : localName,
    exportKind: modifiers.defaulted ? 'default' : exportKindForDeclaration(kind),
    isTypeOnly: typeOnlyDeclarationKind(kind),
    symbolNode: node.name ?? node
  })];
}

function variableStatementExportEntries(node, nativeNodeId, input, modifiers) {
  const declarations = node.declarationList?.declarations ?? [];
  return declarations
    .map((declaration) => {
      const localName = identifierName(declaration.name);
      if (!localName) return undefined;
      return exportEntry(input, nativeNodeId, {
        localName,
        exportedName: modifiers.defaulted ? 'default' : localName,
        exportKind: modifiers.defaulted ? 'default' : 'named',
        isTypeOnly: false,
        symbolNode: declaration.name
      });
    })
    .filter(Boolean);
}

function exportEntry(input, nativeNodeId, binding) {
  return {
    declaration: {
      ...declarationRecord(input, nativeNodeId, binding.exportedName, 'export', 'export'),
      symbolId: `symbol:${input.language}:export:${idFragment(binding.exportedName)}`,
      localName: binding.localName,
      exportedName: binding.exportedName,
      exportKind: binding.exportKind,
      isTypeOnly: binding.isTypeOnly,
      publicContract: true,
      metadata: {
        scan: 'typescript-exported-declaration',
        localName: binding.localName,
        exportedName: binding.exportedName,
        exportKind: binding.exportKind,
        isTypeOnly: binding.isTypeOnly,
        typeOnly: binding.isTypeOnly,
        publicContract: true
      }
    },
    symbolNode: binding.symbolNode
  };
}

function declarationModifiers(node, ts) {
  const helperModifiers = safeModifiers(node, ts);
  const names = new Set([...(node.modifiers ?? []), ...helperModifiers].map((modifier) => modifierName(modifier, ts)));
  return {
    exported: names.has('ExportKeyword') || names.has('export'),
    defaulted: names.has('DefaultKeyword') || names.has('default')
  };
}

function safeModifiers(node, ts) {
  try {
    if (typeof ts?.canHaveModifiers === 'function' && !ts.canHaveModifiers(node)) return [];
    return typeof ts?.getModifiers === 'function' ? [...(ts.getModifiers(node) ?? [])] : [];
  } catch {
    return [];
  }
}

function isVariableStatement(node, kind) {
  return kind === 'VariableStatement' || Array.isArray(node.declarationList?.declarations);
}

function modifierName(modifier, ts) {
  if (typeof modifier.kindName === 'string') return modifier.kindName;
  if (ts?.SyntaxKind && modifier.kind !== undefined) return ts.SyntaxKind[modifier.kind] ?? String(modifier.kind);
  if (typeof modifier.text === 'string') return modifier.text;
  if (typeof modifier.name === 'string') return modifier.name;
  return String(modifier.kind ?? '');
}

function exportedSymbolKind(kind) {
  if (kind === 'FunctionDeclaration') return 'function';
  if (kind === 'ClassDeclaration') return 'class';
  if (kind === 'InterfaceDeclaration') return 'interface';
  if (kind === 'TypeAliasDeclaration' || kind === 'EnumDeclaration') return 'type';
  return undefined;
}

function exportKindForDeclaration(kind) {
  return typeOnlyDeclarationKind(kind) ? 'type-named' : 'named';
}

function typeOnlyDeclarationKind(kind) {
  return kind === 'InterfaceDeclaration' || kind === 'TypeAliasDeclaration';
}
