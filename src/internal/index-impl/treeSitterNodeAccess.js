import{shortNodeText}from'./shortNodeText.js';
export function treeSitterNodeKind(node) {
  return String(node?.type ?? node?.kind ?? 'node');
}

export function treeSitterChildren(node) {
  const children = treeSitterArrayChildren(node, 'children');
  if (children.length) return children;
  const childCountChildren = treeSitterIndexedChildren(node, 'childCount', 'child');
  if (childCountChildren.length) return childCountChildren;
  const namedChildren = treeSitterArrayChildren(node, 'namedChildren');
  if (namedChildren.length) return namedChildren;
  return treeSitterIndexedChildren(node, 'namedChildCount', 'namedChild');
}

export function treeSitterChildText(node, kinds) {
  const wanted = new Set(kinds);
  const stack = [...treeSitterChildren(node)];
  while (stack.length) {
    const child = stack.shift();
    if (!child || typeof child !== 'object') continue;
    if (wanted.has(treeSitterNodeKind(child))) {
      const text = shortNodeText(child);
      if (text) return text;
    }
    stack.unshift(...treeSitterChildren(child));
  }
  return undefined;
}

export function treeSitterFieldText(node, field) {
  const exact = treeSitterFieldNode(node, field);
  if (exact) return shortNodeText(exact);
  return treeSitterNamedFieldText(node, field);
}

function treeSitterFieldNode(node, field) {
  if (typeof node?.childForFieldName === 'function') return node.childForFieldName(field);
  if (typeof node?.child_by_field_name === 'function') return node.child_by_field_name(field);
  return undefined;
}

function treeSitterNamedFieldText(node, field) {
  for (const child of treeSitterChildren(node)) {
    if (treeSitterFieldName(child) === field) {
      const text = shortNodeText(child);
      if (text) return text;
    }
  }
  return undefined;
}

function treeSitterFieldName(node) {
  if (typeof node?.fieldName === 'string') return node.fieldName;
  if (typeof node?.field_name === 'string') return node.field_name;
  if (typeof node?.fieldName === 'function') return node.fieldName();
  if (typeof node?.field_name === 'function') return node.field_name();
  return undefined;
}

function treeSitterArrayChildren(node, field) {
  const value = node?.[field];
  return Array.isArray(value) ? value.filter((child) => child && typeof child === 'object') : [];
}

function treeSitterIndexedChildren(node, countField, childMethod) {
  const count = Number(node?.[countField]);
  if (!Number.isFinite(count) || count <= 0 || typeof node?.[childMethod] !== 'function') return [];
  const children = [];
  for (let index = 0; index < count; index += 1) {
    const child = node[childMethod](index);
    if (child && typeof child === 'object') children.push(child);
  }
  return children;
}
