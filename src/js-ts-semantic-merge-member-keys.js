function memberKey(text, kind) {
  if (kind === 'object') return objectMemberKey(text);
  if (kind === 'class') return classMemberKey(text);
  return typeMemberKey(text);
}

function objectMemberKey(text) {
  const source = text.replace(/[;,]\s*$/, '').trim();
  const methodSource = stripObjectMemberPrefixes(source);
  const methodMatch = methodSource.match(/^(['"]?)([A-Za-z_$][\w$-]*)\1\s*(?:<[^({;]+>)?\s*\(/);
  if (methodMatch) return { key: methodMatch[2], memberKind: 'method' };
  const colon = topLevelColon(text);
  if (colon >= 0) {
    const key = propertyKey(text.slice(0, colon).trim());
    return key ? { key, memberKind: 'property' } : undefined;
  }
  const shorthand = propertyKey(source);
  return shorthand ? { key: shorthand, memberKind: 'property' } : undefined;
}

function typeMemberKey(text) {
  const source = text.replace(/[;,]\s*$/, '').trim().replace(/^readonly\s+/, '');
  const methodMatch = source.match(/^(['"]?)([A-Za-z_$][\w$-]*)\1\??\s*(?:<[^({;]+>)?\s*\(/);
  if (methodMatch) return { key: methodMatch[2], memberKind: 'method' };
  const colon = topLevelColon(source);
  if (colon < 0) return undefined;
  const key = propertyKey(source.slice(0, colon).trim().replace(/\?$/, '').trim());
  return key ? { key, memberKind: 'property' } : undefined;
}

function classMemberKey(text) {
  const stripped = stripClassMemberPrefixes(text.replace(/[;,]\s*$/, '').trim());
  const source = stripped.source;
  if (!source || source.startsWith('@') || /^static\s*\{/.test(source)) return undefined;
  const constructorMatch = source.match(/^constructor\s*\(/);
  if (constructorMatch) return { key: 'constructor', memberKind: 'constructor' };
  const accessorMatch = source.match(/^(get|set)\s+(['"]?)(#?[A-Za-z_$][\w$-]*)\2\s*\(/);
  if (accessorMatch) return { key: classMemberKeyName(accessorMatch[3], stripped.isStatic), memberKind: 'accessor' };
  const methodMatch = source.match(/^(?:async\s+)?(['"]?)(#?[A-Za-z_$][\w$-]*)\1\s*(?:<[^({;]+>)?\s*\(/);
  if (methodMatch) return { key: classMemberKeyName(methodMatch[2], stripped.isStatic), memberKind: 'method' };
  const propertyMatch = source.match(/^(['"]?)(#?[A-Za-z_$][\w$-]*)\1[?!]?\s*(?::|=|$)/);
  if (propertyMatch) return { key: classMemberKeyName(propertyMatch[2], stripped.isStatic), memberKind: 'property' };
  return undefined;
}

function classMemberKeyName(name, isStatic) {
  return isStatic ? `static.${name}` : name;
}

function stripObjectMemberPrefixes(source) {
  return String(source ?? '').replace(/^(?:async|get|set)\s+/, '');
}

function stripClassMemberPrefixes(source) {
  let output = String(source ?? '').trim();
  let isStatic = false;
  const prefixes = ['public', 'private', 'protected', 'abstract', 'override', 'declare', 'readonly', 'accessor'];
  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of prefixes) {
      const pattern = new RegExp(`^${prefix}\\s+`);
      if (pattern.test(output)) {
        output = output.replace(pattern, '').trimStart();
        changed = true;
      }
    }
    if (/^static\s+/.test(output)) {
      output = output.replace(/^static\s+/, '').trimStart();
      isStatic = true;
      changed = true;
    }
  }
  return { source: output, isStatic };
}

function isTypeAliasConflictMember(text) {
  return /^\|/.test(text) || /^&/.test(text);
}

function hasSpreadLikeMember(text) {
  return stripLeadingMemberKeywords(text).startsWith('...');
}

function hasComputedMemberKey(text) {
  return stripLeadingMemberKeywords(text).startsWith('[');
}

function stripLeadingMemberKeywords(text) {
  let source = String(text ?? '').trim();
  const prefixes = ['public', 'private', 'protected', 'abstract', 'override', 'declare', 'readonly', 'static', 'accessor', 'async', 'get', 'set'];
  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of prefixes) {
      const pattern = new RegExp(`^${prefix}\\s+`);
      if (pattern.test(source)) {
        source = source.replace(pattern, '').trimStart();
        changed = true;
      }
    }
  }
  return source;
}

function propertyKey(source) {
  if (!source || source.startsWith('[')) return undefined;
  const quoted = source.match(/^(['"])([^'"\\]+)\1$/);
  if (quoted) return quoted[2];
  const identifier = source.match(/^[A-Za-z_$][\w$-]*$/);
  return identifier?.[0];
}

function topLevelColon(source) {
  let quote;
  let escaped = false;
  let depth = 0;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{' || char === '[' || char === '(') depth += 1;
    else if (char === '}' || char === ']' || char === ')') depth -= 1;
    else if (char === ':' && depth === 0) return index;
  }
  return -1;
}

export {
  hasComputedMemberKey,
  hasSpreadLikeMember,
  isTypeAliasConflictMember,
  memberKey
};
