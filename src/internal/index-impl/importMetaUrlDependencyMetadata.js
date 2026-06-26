import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

const UNKNOWN_HOST_DEPENDENCY_MODULE_SPECIFIER = '<host-dependency>';

export function importMetaUrlDependencyMetadata(node, options = {}) {
  if (!isNewUrlExpression(node, options)) return undefined;
  const args = nodeArguments(node);
  const firstArgument = args[0];
  const secondArgument = args[1];
  const moduleSpecifier = literalString(firstArgument);
  if (!firstArgument || !isImportMetaUrl(secondArgument)) return undefined;
  const expressionText = expressionTextForNode(node) ?? `new URL(${JSON.stringify(moduleSpecifier)}, import.meta.url)`;
  return hostDependencyRecord(moduleSpecifier ?? UNKNOWN_HOST_DEPENDENCY_MODULE_SPECIFIER, 'import-meta-url', 'import.meta.url', expressionText, {
    staticSpecifier: Boolean(moduleSpecifier)
  });
}

export function hostModuleDependencyMetadata(node, options = {}) {
  const importMetaUrl = importMetaUrlDependencyMetadata(node, options);
  if (importMetaUrl) return [importMetaUrl];
  if (isNewExpression(node, options)) return workerConstructorDependencyMetadata(node);
  if (isCallExpression(node, options)) return callExpressionDependencyMetadata(node);
  return [];
}

export function hostDependencyEdgeFields(metadata) {
  return compactRecord({
    hostDependency: metadata?.hostDependency,
    hostDependencyKind: metadata?.hostDependencyKind,
    hostDependencyBase: metadata?.hostDependencyBase,
    hostDependencyExpressionText: metadata?.hostDependencyExpressionText,
    hostDependencyExpressionHash: metadata?.hostDependencyExpressionHash,
    hostDependencyStaticSpecifierEvidence: metadata?.hostDependencyStaticSpecifierEvidence,
    hostDependencyRuntimeResolutionClaim: metadata?.hostDependencyRuntimeResolutionClaim,
    hostDependencyResolutionProofRequired: metadata?.hostDependencyResolutionProofRequired
  });
}

function isNewUrlExpression(node, options) {
  return isNewExpression(node, options) && expressionTextForNode(node.expression ?? node.callee) === 'URL';
}

function isNewExpression(node, options = {}) {
  return nodeArguments(node).length > 0 && (options.kind === 'NewExpression' || node?.type === 'NewExpression' || node?.kindName === 'NewExpression');
}

function isCallExpression(node, options = {}) {
  return nodeArguments(node).length > 0 && (options.kind === 'CallExpression' || node?.type === 'CallExpression');
}

function workerConstructorDependencyMetadata(node) {
  const callee = expressionTextForNode(node.expression ?? node.callee);
  const kind = callee === 'Worker' ? 'worker-constructor' : callee === 'SharedWorker' ? 'shared-worker-constructor' : undefined;
  const firstArgument = nodeArguments(node)[0];
  if (!kind || !firstArgument || isNewUrlExpression(firstArgument, {}) || expressionTextForNode(firstArgument)?.startsWith('new URL(')) return [];
  const moduleSpecifier = literalString(firstArgument);
  return [hostDependencyRecord(moduleSpecifier ?? UNKNOWN_HOST_DEPENDENCY_MODULE_SPECIFIER, kind, callee, expressionTextForNode(node), {
    staticSpecifier: Boolean(moduleSpecifier)
  })];
}

function callExpressionDependencyMetadata(node) {
  const callee = expressionTextForNode(node.expression ?? node.callee);
  const args = nodeArguments(node);
  if (callee === 'importScripts') return args.map((argument) =>
    hostDependencyRecord(literalString(argument) ?? UNKNOWN_HOST_DEPENDENCY_MODULE_SPECIFIER, 'worker-import-scripts', 'importScripts', expressionTextForNode(node), {
      staticSpecifier: Boolean(literalString(argument))
    })).filter(Boolean);
  const first = literalString(args[0]);
  if (!args[0]) return [];
  if (callee === 'import.meta.resolve') return [hostDependencyRecord(first ?? UNKNOWN_HOST_DEPENDENCY_MODULE_SPECIFIER, 'import-meta-resolve', 'import.meta', expressionTextForNode(node), { staticSpecifier: Boolean(first) })];
  if (callee === 'require.resolve') return [hostDependencyRecord(first ?? UNKNOWN_HOST_DEPENDENCY_MODULE_SPECIFIER, 'require-resolve', 'require', expressionTextForNode(node), { staticSpecifier: Boolean(first) })];
  if (callee?.endsWith('.register') && callee.includes('serviceWorker')) return [hostDependencyRecord(first ?? UNKNOWN_HOST_DEPENDENCY_MODULE_SPECIFIER, 'service-worker-register', callee.replace(/\.register$/, ''), expressionTextForNode(node), { staticSpecifier: Boolean(first) })];
  if (callee?.endsWith('.addModule') && /worklet/i.test(callee)) return [hostDependencyRecord(first ?? UNKNOWN_HOST_DEPENDENCY_MODULE_SPECIFIER, 'worklet-add-module', callee.replace(/\.addModule$/, ''), expressionTextForNode(node), { staticSpecifier: Boolean(first) })];
  return [];
}

function nodeArguments(node) {
  return node?.arguments && typeof node.arguments.length === 'number' ? Array.from(node.arguments) : [];
}

function hostDependencyRecord(moduleSpecifier, kind, base, expressionText, options = {}) {
  const staticSpecifier = options.staticSpecifier !== false;
  return {
    moduleSpecifier,
    metadata: {
      importKind: kind,
      hostDependency: true,
      hostDependencyKind: kind,
      hostDependencyBase: base,
      hostDependencyExpressionText: expressionText,
      hostDependencyExpressionHash: hashSemanticValue({ kind, moduleSpecifier, base, expressionText }),
      hostDependencyStaticSpecifierEvidence: staticSpecifier,
      hostDependencyRuntimeResolutionClaim: false,
      hostDependencyResolutionProofRequired: !staticSpecifier
    }
  };
}

function isImportMetaUrl(node) {
  const text = expressionTextForNode(node);
  if (text?.replace(/\s+/g, '') === 'import.meta.url') return true;
  const property = propertyName(node.property ?? node.name);
  if (property !== 'url') return false;
  const object = node.object ?? node.expression;
  if (String(object?.type ?? object?.kindName ?? '') === 'MetaProperty') return importMetaText(object) === 'import.meta';
  return expressionTextForNode(object)?.replace(/\s+/g, '') === 'import.meta';
}

function importMetaText(node) {
  const meta = propertyName(node.meta);
  const property = propertyName(node.property);
  return meta && property ? `${meta}.${property}` : expressionTextForNode(node);
}

function literalString(node) {
  if (!node) return undefined;
  if (typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && (node.expressions ?? []).length === 0 && (node.quasis ?? []).length === 1) {
    return node.quasis[0]?.value?.cooked ?? node.quasis[0]?.value?.raw;
  }
  if (typeof node.text === 'string' && !/^[A-Za-z_$][\w$]*$/.test(node.text)) return node.text;
  return undefined;
}

function propertyName(node) {
  if (!node) return undefined;
  if (typeof node === 'string') return node;
  if (typeof node.name === 'string') return node.name;
  if (typeof node.escapedText === 'string') return node.escapedText;
  if (typeof node.text === 'string') return node.text;
  return undefined;
}

function expressionTextForNode(node) {
  if (!node) return undefined;
  if (typeof node.getText === 'function') {
    try {
      const text = node.getText();
      if (typeof text === 'string' && text.trim()) return text.trim();
    } catch {}
  }
  if (node.type === 'MetaProperty') return importMetaText(node);
  if (node.type === 'MemberExpression') {
    const object = expressionTextForNode(node.object);
    const property = expressionTextForNode(node.property);
    return object && property ? node.computed ? `${object}[${property}]` : `${object}.${property}` : undefined;
  }
  if (node.expression && node.name) {
    const object = expressionTextForNode(node.expression);
    const property = expressionTextForNode(node.name);
    return object && property ? `${object}.${property}` : undefined;
  }
  if (node.type === 'CallExpression') return `${expressionTextForNode(node.callee) ?? 'call'}(${argumentText(node)})`;
  if (node.expression && Array.isArray(node.arguments)) return `${expressionTextForNode(node.expression) ?? 'call'}(${argumentText(node)})`;
  if (node.type === 'NewExpression') return `new ${expressionTextForNode(node.callee) ?? 'constructor'}(${argumentText(node)})`;
  if (node.type === 'TemplateLiteral' && Array.isArray(node.quasis)) return templateLiteralText(node);
  return propertyName(node);
}

function argumentText(node) {
  return nodeArguments(node).map((argument) => expressionTextForNode(argument) ?? 'expression').join(', ');
}

function templateLiteralText(node) {
  const parts = [];
  for (let index = 0; index < node.quasis.length; index += 1) {
    parts.push(node.quasis[index]?.value?.raw ?? '');
    if (node.expressions?.[index]) parts.push('${', expressionTextForNode(node.expressions[index]) ?? 'expression', '}');
  }
  return `\`${parts.join('')}\``;
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
