import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

const UNKNOWN_DYNAMIC_IMPORT_MODULE_SPECIFIER = '<dynamic-import>';

export function dynamicImportExpressionMetadata(argument, moduleSpecifier) {
  const staticSpecifier = Boolean(moduleSpecifier && moduleSpecifier !== UNKNOWN_DYNAMIC_IMPORT_MODULE_SPECIFIER);
  const expressionText = expressionSourceText(argument);
  const specifierKind = dynamicImportSpecifierKind(argument, expressionText, staticSpecifier);
  return compactRecord({
    dynamicImportSpecifierKind: specifierKind,
    dynamicImportExpressionText: expressionText,
    dynamicImportExpressionHash: hashSemanticValue({ kind: specifierKind, text: expressionText ?? '', staticSpecifier }),
    dynamicImportStaticSpecifierEvidence: staticSpecifier,
    dynamicImportRuntimeResolutionClaim: false,
    dynamicImportResolutionProofRequired: !staticSpecifier
  });
}

export function dynamicImportExpressionEdgeFields(metadata) {
  return compactRecord({
    dynamicImport: metadata?.dynamicImport,
    dynamicImportSpecifierKind: metadata?.dynamicImportSpecifierKind,
    dynamicImportExpressionText: metadata?.dynamicImportExpressionText,
    dynamicImportExpressionHash: metadata?.dynamicImportExpressionHash,
    dynamicImportStaticSpecifierEvidence: metadata?.dynamicImportStaticSpecifierEvidence,
    dynamicImportRuntimeResolutionClaim: metadata?.dynamicImportRuntimeResolutionClaim,
    dynamicImportResolutionProofRequired: metadata?.dynamicImportResolutionProofRequired
  });
}

function dynamicImportSpecifierKind(node, text, staticSpecifier) {
  if (staticSpecifier) return 'literal';
  const kind = String(node?.type ?? node?.kindName ?? node?.kind ?? '');
  if (/Template/.test(kind) || text?.startsWith('`')) return 'template';
  if (/CallExpression/.test(kind) || node?.callee || (node?.expression && Array.isArray(node?.arguments)) || /\)\s*$/.test(text ?? '')) return 'call';
  if (/Identifier/.test(kind) || /^[A-Za-z_$][\w$]*$/.test(text ?? '') || typeof node?.escapedText === 'string') return 'identifier';
  if (/MemberExpression|PropertyAccessExpression|ElementAccessExpression/.test(kind) || node?.property || node?.name) return 'member';
  if (/BinaryExpression|LogicalExpression/.test(kind) || node?.left && node?.right) return 'binary';
  if (/ConditionalExpression/.test(kind) || node?.test && node?.consequent && node?.alternate) return 'conditional';
  return kind ? kind.replace(/Expression$/, '').toLowerCase() : 'expression';
}

function expressionSourceText(node) {
  if (!node) return undefined;
  if (typeof node.getText === 'function') {
    try {
      const text = node.getText();
      if (typeof text === 'string' && text.trim()) return text.trim();
    } catch {}
  }
  if (typeof node.value === 'string') return JSON.stringify(node.value);
  if (typeof node.raw === 'string') return node.raw;
  if (typeof node.name === 'string') return node.name;
  if (typeof node.escapedText === 'string') return node.escapedText;
  if (typeof node.text === 'string') return node.text;
  if (node.type === 'TemplateLiteral' && Array.isArray(node.quasis)) return templateLiteralText(node);
  if (node.type === 'MemberExpression') return memberExpressionText(node);
  if (node.type === 'CallExpression') return `${expressionSourceText(node.callee) ?? 'call'}(...)`;
  if (node.left && node.right && node.operator) return `${expressionSourceText(node.left) ?? 'left'} ${node.operator} ${expressionSourceText(node.right) ?? 'right'}`;
  return String(node.type ?? node.kindName ?? node.kind ?? 'expression');
}

function templateLiteralText(node) {
  const parts = [];
  for (let index = 0; index < node.quasis.length; index += 1) {
    parts.push(node.quasis[index]?.value?.raw ?? '');
    if (node.expressions?.[index]) parts.push('${', expressionSourceText(node.expressions[index]) ?? 'expression', '}');
  }
  return `\`${parts.join('')}\``;
}

function memberExpressionText(node) {
  const object = expressionSourceText(node.object) ?? 'object';
  const property = expressionSourceText(node.property) ?? 'property';
  return node.computed ? `${object}[${property}]` : `${object}.${property}`;
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
