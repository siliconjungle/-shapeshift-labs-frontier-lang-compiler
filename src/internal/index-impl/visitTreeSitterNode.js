import{idFragment}from'../../native-import-utils.js';
import{nativeNodeId}from'./nativeNodeId.js';import{numberOrUndefined}from'./numberOrUndefined.js';import{shortNodeText}from'./shortNodeText.js';import{spanFromTreeSitterNode}from'./spanFromTreeSitterNode.js';import{treeSitterDeclaration}from'./treeSitterDeclaration.js';
export function visitTreeSitterNode(node, context, propertyPath, depth = 0) {
  if (!node || typeof node !== 'object' || context.truncated) return undefined;
  if (context.objectIds.has(node)) return context.objectIds.get(node);
  if (context.counter >= context.maxNodes) {
    context.truncated = true;
    return undefined;
  }
  context.counter += 1;
  const kind = String(node.type ?? node.kind ?? 'node');
  const span = spanFromTreeSitterNode(node, context.input);
  const id = nativeNodeId(context, kind, { start: { line: span?.startLine, column: span?.startColumn } }, propertyPath);
  context.objectIds.set(node, id);
  if (!context.rootId) context.rootId = id;
  const children = [];
  const rawChildren = treeSitterChildren(node);
  rawChildren.forEach((child, index) => {
    const childId = visitTreeSitterNode(child, context, `${propertyPath}.children[${index}]`, depth + 1);
    if (childId) children.push(childId);
  });
  const named = treeSitterBoolean(node, 'isNamed', 'named');
  const missing = treeSitterBoolean(node, 'isMissing', 'missing');
  const extra = treeSitterBoolean(node, 'isExtra', 'extra');
  const parseError = treeSitterBoolean(node, 'isError') || kind === 'ERROR';
  const containsParseError = treeSitterBoolean(node, 'hasError') || parseError;
  observeTreeSitterCstNode(context, { kind, named, missing, parseError, containsParseError, childCount: children.length, depth });
  const declaration = treeSitterDeclaration(node, kind, id, context.input, context.options);
  const nativeNode = {
    id,
    kind,
    languageKind: `${context.input.language}.${kind}`,
    span,
    value: declaration?.name ?? shortNodeText(node),
    fields: {
      named,
      missing,
      extra,
      error: containsParseError,
      parseError,
      containsParseError
    },
    children,
    metadata: {
      astFormat: context.options.astFormat,
      propertyPath,
      cstDepth: depth,
      childCount: children.length,
      startIndex: numberOrUndefined(node.startIndex),
      endIndex: numberOrUndefined(node.endIndex),
      parseState: numberOrUndefined(node.parseState),
      nextParseState: numberOrUndefined(node.nextParseState),
      grammarId: numberOrUndefined(node.grammarId),
      grammarType: stringOrUndefined(node.grammarType),
      nodeType: stringOrUndefined(node.type ?? node.kind)
    }
  };
  context.nodes[id] = nativeNode;
  if (declaration) context.declarations.push({ ...declaration, nativeNode });
  if (containsParseError || missing) {
    context.losses.push({
      id: `loss_${idFragment(id)}_tree_sitter_error`,
      severity: 'error',
      phase: 'parse',
      sourceFormat: context.input.language,
      kind: 'unsupportedSyntax',
      message: missing
        ? 'Tree-sitter reported a missing syntax node during tolerant parsing.'
        : 'Tree-sitter reported a parse error node.',
      span,
      nodeId: id,
      metadata: {
        parser: context.options.parser,
        astFormat: context.options.astFormat,
        tolerantParse: true,
        parseError,
        containsParseError,
        missing
      }
    });
  }
  return id;
}

function treeSitterChildren(node) {
  const children = treeSitterArrayChildren(node, 'children');
  if (children.length) return children;
  const childCountChildren = treeSitterIndexedChildren(node, 'childCount', 'child');
  if (childCountChildren.length) return childCountChildren;
  const namedChildren = treeSitterArrayChildren(node, 'namedChildren');
  if (namedChildren.length) return namedChildren;
  return treeSitterIndexedChildren(node, 'namedChildCount', 'namedChild');
}

function treeSitterArrayChildren(node, field) {
  const value = node[field];
  return Array.isArray(value) ? value.filter((child) => child && typeof child === 'object') : [];
}

function treeSitterIndexedChildren(node, countField, childMethod) {
  const count = Number(node[countField]);
  if (!Number.isFinite(count) || count <= 0 || typeof node[childMethod] !== 'function') return [];
  const children = [];
  for (let index = 0; index < count; index += 1) {
    const child = node[childMethod](index);
    if (child && typeof child === 'object') children.push(child);
  }
  return children;
}

function treeSitterBoolean(node, ...fields) {
  for (const field of fields) {
    const value = node[field];
    if (typeof value === 'function') return Boolean(value.call(node));
    if (value !== undefined) return Boolean(value);
  }
  return false;
}

function stringOrUndefined(value) {
  return value === undefined || value === null ? undefined : String(value);
}

function observeTreeSitterCstNode(context, node) {
  const summary = context.treeSitterCstSummary ??= {
    totalNodes: 0,
    namedNodes: 0,
    anonymousNodes: 0,
    missingNodes: 0,
    errorNodes: 0,
    containingErrorNodes: 0,
    leafNodes: 0,
    maxDepth: 0,
    kinds: {}
  };
  summary.totalNodes += 1;
  if (node.named) summary.namedNodes += 1;
  else summary.anonymousNodes += 1;
  if (node.missing) summary.missingNodes += 1;
  if (node.parseError) summary.errorNodes += 1;
  if (node.containsParseError) summary.containingErrorNodes += 1;
  if (!node.childCount) summary.leafNodes += 1;
  summary.maxDepth = Math.max(summary.maxDepth, node.depth);
  summary.kinds[node.kind] = (summary.kinds[node.kind] ?? 0) + 1;
}
