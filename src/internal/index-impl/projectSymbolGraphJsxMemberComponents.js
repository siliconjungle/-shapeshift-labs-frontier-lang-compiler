import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';

function jsxSameFileMemberComponentOwnerIndex(sourceText, componentOwners = new Map()) {
  const result = new Map();
  for (const binding of jsxStaticMemberComponentBindings(sourceText, componentOwners)) {
    addMemberOwner(result, `${binding.objectName}.${binding.propertyName}`, binding.owner);
  }
  return result;
}

function jsxSameFileMemberComponentObjectIndex(sourceText, componentOwners = new Map()) {
  const result = new Map();
  for (const binding of jsxStaticMemberComponentBindings(sourceText, componentOwners)) {
    const objectMembers = result.get(binding.objectName) ?? new Map();
    objectMembers.set(binding.propertyName, [...(objectMembers.get(binding.propertyName) ?? []), binding.owner]);
    result.set(binding.objectName, objectMembers);
  }
  return result;
}

function jsxStaticMemberComponentBindings(sourceText, componentOwners = new Map()) {
  const result = [];
  for (const binding of objectLiteralBindings(sourceText)) {
    for (const member of objectLiteralComponentMembers(binding.body)) {
      const owners = componentOwners.get(member.localName) ?? [];
      if (owners.length !== 1) continue;
      result.push({
        objectName: binding.objectName,
        propertyName: member.propertyName,
        localName: member.localName,
        owner: memberOwnerRecord(owners[0], binding, member)
      });
    }
  }
  return result;
}

function memberOwnerRecord(owner, binding, member) {
  const componentCallMemberBindingHash = hashSemanticValue({
    kind: 'frontier.lang.projectJsxSameFileMemberComponentBinding',
    objectName: binding.objectName,
    propertyName: member.propertyName,
    localName: member.localName,
    declarationKind: binding.declarationKind
  });
  return {
    ...owner,
    componentProviderLookupScope: 'same-file-member-component',
    componentCallLookupStatus: 'same-file-member-component-target-evidence',
    componentCallMemberObjectName: binding.objectName,
    componentCallMemberPropertyName: member.propertyName,
    componentCallMemberLocalName: member.localName,
    componentCallMemberBindingKind: binding.declarationKind,
    componentCallMemberBindingHash
  };
}

function objectLiteralBindings(sourceText) {
  const text = String(sourceText ?? '');
  const bindings = [];
  const pattern = /\b(const|let|var)\s+([A-Z][A-Za-z0-9_$]*)\s*=\s*\{/g;
  let match;
  while ((match = pattern.exec(text))) {
    const open = pattern.lastIndex - 1;
    const close = matchingBrace(text, open);
    if (close === -1) continue;
    bindings.push({
      declarationKind: match[1],
      objectName: match[2],
      body: text.slice(open + 1, close)
    });
    pattern.lastIndex = close + 1;
  }
  return bindings;
}

function objectLiteralComponentMembers(body) {
  return splitTopLevel(body, ',').flatMap((part) => {
    const text = String(part ?? '').trim();
    if (!text || text.startsWith('...') || /\(|\{|\[/.test(text)) return [];
    const shorthand = /^([A-Z][A-Za-z0-9_$]*)$/.exec(text);
    if (shorthand) return [{ propertyName: shorthand[1], localName: shorthand[1] }];
    const pair = /^(?:([A-Z][A-Za-z0-9_$]*)|"([A-Z][A-Za-z0-9_$]*)"|'([A-Z][A-Za-z0-9_$]*)')\s*:\s*([A-Z][A-Za-z0-9_$]*)$/.exec(text);
    return pair ? [{ propertyName: pair[1] ?? pair[2] ?? pair[3], localName: pair[4] }] : [];
  });
}

function matchingBrace(text, open) {
  let depth = 0;
  let quote;
  for (let index = open; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '/' && next === '/') { index = text.indexOf('\n', index + 2); if (index === -1) return -1; continue; }
    if (char === '/' && next === '*') { index = text.indexOf('*/', index + 2); if (index === -1) return -1; index += 1; continue; }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function splitTopLevel(text, separator) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let quote;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '(' || char === '[' || char === '{') depth += 1;
    if (char === ')' || char === ']' || char === '}') depth -= 1;
    if (depth === 0 && char === separator) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

function addMemberOwner(result, name, owner) {
  result.set(name, [...(result.get(name) ?? []), owner]);
}

export { jsxSameFileMemberComponentObjectIndex, jsxSameFileMemberComponentOwnerIndex };
