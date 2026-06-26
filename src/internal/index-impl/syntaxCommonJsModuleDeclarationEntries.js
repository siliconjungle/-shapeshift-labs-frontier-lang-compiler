import {
  exportBindingEntry,
  exportModuleEntries,
  identifierName,
  importModuleEntries,
  sourceValue
} from './syntaxModuleEntryRecords.js';

export function commonJsRequireVariableEntries(node, nativeNodeId, input) {
  const helper = commonJsInteropHelperRequireBinding(node);
  if (helper) return importModuleEntries(input, nativeNodeId, helper.moduleSpecifier, [helper.binding], helper.metadata);
  const moduleSpecifier = commonJsRequireModuleSpecifier(node.init);
  if (!moduleSpecifier) return [];
  const bindings = commonJsRequireBindings(node.id);
  return importModuleEntries(input, nativeNodeId, moduleSpecifier, bindings, {
    importKind: 'commonjs-require',
    commonJs: true
  });
}

export function commonJsRequireExpressionEntries(node, nativeNodeId, input) {
  const moduleSpecifier = commonJsRequireModuleSpecifier(node.expression);
  if (!moduleSpecifier) return [];
  return importModuleEntries(input, nativeNodeId, moduleSpecifier, [], {
    importKind: 'commonjs-require',
    sideEffectOnly: true,
    commonJs: true
  });
}

export function commonJsExpressionStatementEntries(node, nativeNodeId, input) {
  return [
    ...commonJsRequireExpressionEntries(node, nativeNodeId, input),
    ...commonJsExportStarExpressionEntries(node, nativeNodeId, input),
    ...commonJsCreateBindingReExportExpressionEntries(node, nativeNodeId, input),
    ...commonJsObjectAssignExportExpressionEntries(node, nativeNodeId, input),
    ...commonJsDefinePropertiesExportExpressionEntries(node, nativeNodeId, input),
    ...commonJsDefinePropertyExportExpressionEntries(node, nativeNodeId, input)
  ];
}

export function commonJsExportAssignmentEntries(node, nativeNodeId, input) {
  if (node.operator && node.operator !== '=') return [];
  const target = commonJsExportTarget(node.left);
  if (!target) return [];
  if (target.exportedName === '__esModule') return [];
  const assignment = exportBindingEntry(input, nativeNodeId, undefined, {
    localName: expressionExportLocalName(node.right),
    exportedName: target.exportedName,
    exportKind: target.exportKind,
    isTypeOnly: false,
    commonJs: true
  });
  return [
    assignment,
    ...(target.exportedName === 'module.exports'
      ? commonJsObjectExpressionExportBindings(node.right).map((binding) => exportBindingEntry(input, nativeNodeId, undefined, binding))
      : [])
  ];
}

function commonJsObjectAssignExportExpressionEntries(node, nativeNodeId, input) {
  const call = node.expression;
  const kind = String(call?.type ?? call?.kind ?? '');
  if (kind !== 'CallExpression') return [];
  const callee = memberExpressionParts(call.callee);
  if (callee?.objectName !== 'Object' || callee.propertyName !== 'assign') return [];
  if (!commonJsObjectAssignExportTarget((call.arguments ?? [])[0])) return [];
  return commonJsObjectExpressionExportBindings((call.arguments ?? [])[1])
    .map((binding) => exportBindingEntry(input, nativeNodeId, undefined, binding));
}

function commonJsExportStarExpressionEntries(node, nativeNodeId, input) {
  const call = node.expression;
  const kind = String(call?.type ?? call?.kind ?? '');
  if (kind !== 'CallExpression' || commonJsHelperName(call.callee) !== '__exportStar') return [];
  if (!commonJsObjectAssignExportTarget((call.arguments ?? [])[1])) return [];
  const moduleSpecifier = commonJsRequireModuleSpecifier((call.arguments ?? [])[0]);
  if (!moduleSpecifier) return [];
  const metadata = { commonJs: true, reexport: true, reExport: true, exportStar: true, importKind: 'reexport', interopHelper: commonJsHelperName(call.callee) };
  return [
    ...importModuleEntries(input, nativeNodeId, moduleSpecifier, [], metadata),
    ...exportModuleEntries(input, nativeNodeId, moduleSpecifier, [], { ...metadata, exportKind: 'export-star' })
  ];
}

function commonJsCreateBindingReExportExpressionEntries(node, nativeNodeId, input) {
  const call = node.expression;
  const kind = String(call?.type ?? call?.kind ?? '');
  if (kind !== 'CallExpression' || commonJsHelperName(call.callee) !== '__createBinding') return [];
  if (!commonJsObjectAssignExportTarget((call.arguments ?? [])[0])) return [];
  const moduleSpecifier = commonJsRequireModuleSpecifier((call.arguments ?? [])[1]);
  const importedName = sourceValue((call.arguments ?? [])[2]);
  const exportedName = sourceValue((call.arguments ?? [])[3]) ?? importedName;
  if (!moduleSpecifier || !importedName || !exportedName || exportedName === '__esModule') return [];
  const binding = {
    localName: exportedName,
    importedName,
    exportedName,
    importKind: 'reexport',
    exportKind: 'named',
    isTypeOnly: false,
    reExport: true,
    commonJs: true
  };
  const metadata = { commonJs: true, reexport: true, reExport: true, importKind: 'reexport', interopHelper: commonJsHelperName(call.callee) };
  return [
    ...importModuleEntries(input, nativeNodeId, moduleSpecifier, [binding], metadata),
    ...exportModuleEntries(input, nativeNodeId, moduleSpecifier, [binding], { ...metadata, exportKind: 'named' })
  ];
}

function commonJsDefinePropertyExportExpressionEntries(node, nativeNodeId, input) {
  const call = node.expression;
  const kind = String(call?.type ?? call?.kind ?? '');
  if (kind !== 'CallExpression') return [];
  const callee = memberExpressionParts(call.callee);
  if (callee?.objectName !== 'Object' || callee.propertyName !== 'defineProperty') return [];
  if (!commonJsObjectAssignExportTarget((call.arguments ?? [])[0])) return [];
  const exportedName = sourceValue((call.arguments ?? [])[1]);
  if (!exportedName || exportedName === '__esModule') return [];
  return [exportBindingEntry(input, nativeNodeId, undefined, {
    localName: commonJsDescriptorLocalName((call.arguments ?? [])[2]),
    exportedName,
    exportKind: 'commonjs-named',
    isTypeOnly: false,
    commonJs: true
  })];
}

function commonJsDefinePropertiesExportExpressionEntries(node, nativeNodeId, input) {
  const call = node.expression;
  const kind = String(call?.type ?? call?.kind ?? '');
  if (kind !== 'CallExpression') return [];
  const callee = memberExpressionParts(call.callee);
  if (callee?.objectName !== 'Object' || callee.propertyName !== 'defineProperties') return [];
  if (!commonJsObjectAssignExportTarget((call.arguments ?? [])[0])) return [];
  return commonJsDefinePropertiesExportBindings((call.arguments ?? [])[1])
    .map((binding) => exportBindingEntry(input, nativeNodeId, undefined, binding));
}

function commonJsDefinePropertiesExportBindings(node) {
  const kind = String(node?.type ?? node?.kind ?? '');
  if (kind !== 'ObjectExpression') return [];
  return (node.properties ?? []).map(commonJsDefinePropertiesExportBinding).filter(Boolean);
}

function commonJsDefinePropertiesExportBinding(property) {
  const kind = String(property?.type ?? property?.kind ?? '');
  if (kind === 'SpreadElement' || kind === 'SpreadProperty') return undefined;
  const exportedName = property.computed ? sourceValue(property.key) : memberPropertyName(property.key);
  if (!exportedName || exportedName === '__esModule') return undefined;
  return {
    localName: commonJsDescriptorLocalName(property.value),
    exportedName,
    exportKind: 'commonjs-named',
    isTypeOnly: false,
    commonJs: true
  };
}

function commonJsObjectAssignExportTarget(node) {
  if (identifierName(node) === 'exports') return true;
  const member = memberExpressionParts(node);
  return member?.objectName === 'module' && member.propertyName === 'exports';
}

function commonJsRequireModuleSpecifier(node) {
  if (!isCommonJsRequireCall(node)) return undefined;
  return sourceValue((node.arguments ?? [])[0]);
}

function isCommonJsRequireCall(node) {
  const kind = String(node?.type ?? node?.kind ?? '');
  return kind === 'CallExpression' && identifierName(node.callee) === 'require' && Array.isArray(node.arguments) && node.arguments.length > 0;
}

function commonJsRequireBindings(pattern) {
  const localName = identifierName(pattern);
  if (localName) return [{ localName, importedName: 'default', importKind: 'commonjs-require', commonJs: true }];
  const kind = String(pattern?.type ?? pattern?.kind ?? '');
  if (kind !== 'ObjectPattern') return [];
  return (pattern.properties ?? []).map(commonJsDestructuredRequireBinding).filter(Boolean);
}

function commonJsInteropHelperRequireBinding(node) {
  const localName = identifierName(node.id);
  const init = node.init;
  const kind = String(init?.type ?? init?.kind ?? '');
  const helper = commonJsHelperName(init?.callee);
  if (!localName || kind !== 'CallExpression' || (helper !== '__importStar' && helper !== '__importDefault')) return undefined;
  const moduleSpecifier = commonJsRequireModuleSpecifier((init.arguments ?? [])[0]);
  if (!moduleSpecifier) return undefined;
  const binding = helper === '__importStar'
    ? { localName, importedName: '*', namespace: localName, importKind: 'namespace', commonJs: true }
    : { localName, importedName: 'default', importKind: 'default', commonJs: true };
  return {
    moduleSpecifier,
    binding,
    metadata: { importKind: binding.importKind, commonJs: true, interopHelper: helper }
  };
}

function commonJsHelperName(node) {
  const direct = identifierName(node);
  return direct ?? memberExpressionParts(node)?.propertyName;
}

function commonJsDestructuredRequireBinding(property) {
  const kind = String(property?.type ?? property?.kind ?? '');
  if (kind === 'RestElement' || kind === 'RestProperty') return undefined;
  const importedName = memberPropertyName(property.key);
  const localName = identifierName(property.value) ?? identifierName(property.argument) ?? importedName;
  if (!importedName || !localName) return undefined;
  return { localName, importedName, importKind: 'commonjs-require', commonJs: true };
}

function commonJsExportTarget(node) {
  const member = memberExpressionParts(node);
  if (!member) return undefined;
  if (member.objectName === 'module' && member.propertyName === 'exports') {
    return { exportedName: 'module.exports', exportKind: 'assignment' };
  }
  if (member.objectName === 'exports') {
    return { exportedName: member.propertyName, exportKind: 'commonjs-named' };
  }
  const nestedObject = memberExpressionParts(member.objectNode);
  if (nestedObject?.objectName === 'module' && nestedObject.propertyName === 'exports') {
    return { exportedName: member.propertyName, exportKind: 'commonjs-named' };
  }
  return undefined;
}

function commonJsObjectExpressionExportBindings(node) {
  const kind = String(node?.type ?? node?.kind ?? '');
  if (kind !== 'ObjectExpression') return [];
  return (node.properties ?? []).map(commonJsObjectExpressionExportBinding).filter(Boolean);
}

function commonJsObjectExpressionExportBinding(property) {
  const kind = String(property?.type ?? property?.kind ?? '');
  if (kind === 'SpreadElement' || kind === 'SpreadProperty') return undefined;
  const exportedName = property.computed ? sourceValue(property.key) : memberPropertyName(property.key);
  if (!exportedName || exportedName === '__esModule') return undefined;
  return {
    localName: property.shorthand ? exportedName : expressionExportLocalName(property.value),
    exportedName,
    exportKind: 'commonjs-named',
    isTypeOnly: false,
    commonJs: true
  };
}

function commonJsDescriptorLocalName(node) {
  const kind = String(node?.type ?? node?.kind ?? '');
  if (kind !== 'ObjectExpression') return undefined;
  for (const property of node.properties ?? []) {
    const key = property.computed ? sourceValue(property.key) : memberPropertyName(property.key);
    if (key === 'value') return expressionExportLocalName(property.value);
    if (key === 'get') return returnExpressionLocalName(property.value);
  }
  return undefined;
}

function returnExpressionLocalName(node) {
  const kind = String(node?.type ?? node?.kind ?? '');
  if (kind === 'ArrowFunctionExpression') return returnBlockExpressionLocalName(node.body) ?? expressionExportLocalName(node.body);
  if (kind !== 'FunctionExpression' && kind !== 'FunctionDeclaration') return undefined;
  return returnBlockExpressionLocalName(node.body);
}

function returnBlockExpressionLocalName(node) {
  const kind = String(node?.type ?? node?.kind ?? '');
  if (kind !== 'BlockStatement') return undefined;
  const statement = (node.body ?? []).find((entry) => String(entry?.type ?? entry?.kind ?? '') === 'ReturnStatement');
  return expressionExportLocalName(statement?.argument);
}

function memberExpressionParts(node) {
  const kind = String(node?.type ?? node?.kind ?? '');
  if (kind !== 'MemberExpression' && kind !== 'OptionalMemberExpression') return undefined;
  const objectName = expressionExportLocalName(node.object);
  const propertyName = node.computed ? sourceValue(node.property) : memberPropertyName(node.property);
  if (!objectName || !propertyName) return undefined;
  return { objectName, propertyName, objectNode: node.object };
}

function memberPropertyName(node) {
  return identifierName(node);
}

function expressionExportLocalName(node) {
  const name = identifierName(node);
  if (name) return name;
  const member = memberExpressionParts(node);
  return member ? `${member.objectName}.${member.propertyName}` : undefined;
}
