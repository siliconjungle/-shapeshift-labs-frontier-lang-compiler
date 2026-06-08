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
  const exactText = shortNodeText(exact);
  if (exactText) return exactText;
  const valueText = treeSitterFieldValueText(node?.fields?.[field] ?? node?.[field]);
  if (valueText) return valueText;
  return treeSitterNamedFieldText(node, field) ?? treeSitterFallbackFieldText(node, field);
}

export function treeSitterFieldKind(node, field) {
  const exact = treeSitterFieldNode(node, field)
    ?? treeSitterFieldValueNode(node?.fields?.[field] ?? node?.[field])
    ?? treeSitterNamedFieldNode(node, field);
  return exact ? treeSitterNodeKind(exact) : undefined;
}

function treeSitterFieldNode(node, field) {
  if (typeof node?.childForFieldName === 'function') return node.childForFieldName(field);
  if (typeof node?.child_by_field_name === 'function') return node.child_by_field_name(field);
  if (typeof node?.childrenForFieldName === 'function') return treeSitterFirstNode(node.childrenForFieldName(field));
  if (typeof node?.children_by_field_name === 'function') return treeSitterFirstNode(node.children_by_field_name(field));
  return undefined;
}

function treeSitterNamedFieldText(node, field) {
  const fieldNode = treeSitterNamedFieldNode(node, field);
  return shortNodeText(fieldNode);
}

function treeSitterNamedFieldNode(node, field) {
  for (const child of treeSitterChildren(node)) {
    if (treeSitterFieldName(child) === field) {
      return child;
    }
  }
  return undefined;
}

function treeSitterFallbackFieldText(node, field) {
  const children = treeSitterChildren(node);
  if (field === 'name') return treeSitterFirstChildText(children, /^(?:identifier|type_identifier|property_identifier|field_identifier|private_property_identifier)$/);
  if (field === 'path' || field === 'source') return treeSitterFirstChildText(children, /^(?:string|template_string|string_fragment|raw_string_literal)$/);
  return undefined;
}

function treeSitterFirstChildText(children, pattern) {
  for (const child of children) {
    if (!pattern.test(treeSitterNodeKind(child))) continue;
    const text = shortNodeText(child);
    if (text) return text;
  }
  return undefined;
}

function treeSitterFieldValueText(value) {
  if (typeof value === 'string') return shortNodeText({ text: value });
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = treeSitterFieldValueText(item);
      if (text) return text;
    }
  }
  if (value && typeof value === 'object') return shortNodeText(value);
  return undefined;
}

function treeSitterFieldValueNode(value) {
  if (Array.isArray(value)) return value.find((item) => item && typeof item === 'object');
  return value && typeof value === 'object' ? value : undefined;
}

function treeSitterFirstNode(value) {
  if (Array.isArray(value)) return value.find((item) => item && typeof item === 'object');
  return value && typeof value === 'object' ? value : undefined;
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
