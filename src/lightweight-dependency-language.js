const ignoredIdentifiers = new Set([
  'abstract', 'alias', 'and', 'as', 'async', 'await', 'break', 'case', 'catch',
  'class', 'const', 'continue', 'def', 'default', 'defer', 'delete', 'do',
  'else', 'enum', 'export', 'extends', 'false', 'finally', 'fn', 'for', 'from',
  'func', 'function', 'if', 'impl', 'import', 'in', 'interface', 'let', 'match',
  'mod', 'module', 'namespace', 'new', 'nil', 'none', 'not', 'null', 'or',
  'package', 'pass', 'protocol', 'pub', 'public', 'return', 'self', 'static',
  'struct', 'super', 'switch', 'this', 'throw', 'trait', 'true', 'try', 'type',
  'undefined', 'use', 'using', 'var', 'void', 'while', 'with', 'yield'
]);

export function dependencyIdentifiers(input, declaration, line) {
  const identifiers = new Set();
  if (declaration.role === 'import' && declaration.fields?.moduleOnly && Array.isArray(declaration.fields.importBindings) && declaration.fields.importBindings.length > 0) {
    return [];
  }
  if (declaration.role === 'import' && declaration.fields?.localName) {
    addIdentifier(identifiers, declaration.fields.localName);
    addIdentifier(identifiers, declaration.fields.importedName);
    return [...identifiers];
  }
  addIdentifier(identifiers, declaration.name);
  for (const part of splitIdentifierPath(declaration.name)) addIdentifier(identifiers, part);
  for (const field of ['methodName', 'propertyName', 'owner']) addIdentifier(identifiers, declaration.fields?.[field]);
  if (declaration.role === 'import') {
    for (const identifier of importLineIdentifiers(input, line)) addIdentifier(identifiers, identifier);
    for (const identifier of importPathIdentifiers(declaration.importPath ?? declaration.name)) addIdentifier(identifiers, identifier);
  }
  return [...identifiers];
}

export function addIdentifier(set, value) {
  if (isDependencyIdentifier(value)) set.add(String(value));
}

export function isDependencyIdentifier(value) {
  const text = String(value ?? '');
  return /^[A-Za-z_$][\w$]*$/.test(text) && !ignoredIdentifiers.has(text.toLowerCase());
}

export function dependencyScanRanges(input, declarations, lines) {
  const ordered = [...(declarations ?? [])].sort((left, right) => (left.span?.startLine ?? 0) - (right.span?.startLine ?? 0));
  return ordered
    .filter((declaration) => declaration?.symbolId && declaration.role !== 'import')
    .map((declaration, index) => ({
      declaration,
      startLine: declaration.span?.startLine ?? 1,
      endLine: dependencyScanEndLine(input, declaration, lines, ordered[index + 1]?.span?.startLine)
    }));
}

export function maskDependencyLine(input, line, state) {
  const language = String(input.language ?? '').toLowerCase();
  const text = String(line ?? '');
  let output = '';
  let quote;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (state.inBlockComment) {
      output += ' ';
      if (char === '*' && next === '/') {
        output += ' ';
        index += 1;
        state.inBlockComment = false;
      }
      continue;
    }
    if (quote) {
      output += ' ';
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '/' && next === '*') {
      output += '  ';
      index += 1;
      state.inBlockComment = true;
      continue;
    }
    if (startsLineComment(language, char, next, text, index)) break;
    if (char === '\'' || char === '"' || char === '`') {
      output += ' ';
      quote = char;
      continue;
    }
    output += char;
  }
  return output;
}

export function emptyDependencySummary() {
  return { total: 0, calls: 0, uses: 0 };
}

function importLineIdentifiers(input, line) {
  const language = String(input.language ?? '').toLowerCase();
  const source = String(line ?? '').trim();
  if (language === 'python') return pythonImportIdentifiers(source);
  if (language === 'rust') return rustImportIdentifiers(source);
  if (language === 'go') return aliasedPathImportIdentifiers(source);
  if (language === 'javascript' || language === 'typescript') return jsImportIdentifiers(source);
  if (language === 'haskell') return haskellImportIdentifiers(source);
  return aliasedPathImportIdentifiers(source);
}

function jsImportIdentifiers(source) {
  const identifiers = [];
  let match = source.match(/^import\s+([A-Za-z_$][\w$]*)\s+from\b/);
  if (match) identifiers.push(match[1]);
  match = source.match(/^import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\b/);
  if (match) identifiers.push(match[1]);
  match = source.match(/^import\s+[^,{]+,\s*\{([^}]+)\}\s+from\b|^import\s+\{([^}]+)\}\s+from\b/);
  if (match) identifiers.push(...namedImportIdentifiers(match[1] ?? match[2]));
  return identifiers;
}

function pythonImportIdentifiers(source) {
  const identifiers = [];
  const importMatch = source.match(/^import\s+(.+)$/);
  if (importMatch) identifiers.push(...commaParts(importMatch[1]).map((part) => part.split(/\s+as\s+/i).pop()));
  const fromMatch = source.match(/^from\s+\S+\s+import\s+(.+)$/);
  if (fromMatch) identifiers.push(...namedImportIdentifiers(fromMatch[1]));
  return identifiers;
}

function rustImportIdentifiers(source) {
  const match = source.match(/^use\s+(.+?);?$/);
  if (!match) return [];
  const raw = match[1].replace(/[{}]/g, ' ');
  return raw.split(/::|,|\s+as\s+/i).map((part) => part.trim()).filter(Boolean);
}

function haskellImportIdentifiers(source) {
  const match = source.match(/^import\s+(?:qualified\s+)?([A-Za-z_][\w.]*)(?:\s+as\s+([A-Za-z_]\w*))?/);
  return match ? [match[2], ...splitIdentifierPath(match[1])].filter(Boolean) : [];
}

function aliasedPathImportIdentifiers(source) {
  const alias = source.match(/^(?:import|using|use)\s+([A-Za-z_$][\w$]*)\s*=/)?.[1]
    ?? source.match(/^(?:import|using|use)\s+([A-Za-z_$][\w$]*)\s+["']/)?.[1]
    ?? source.match(/\bas\s+([A-Za-z_$][\w$]*)\b/)?.[1];
  return alias ? [alias] : [];
}

function namedImportIdentifiers(raw) {
  return commaParts(raw).map((part) => part.trim().split(/\s+as\s+/i).pop()?.trim()).filter(Boolean);
}

function importPathIdentifiers(value) {
  return splitIdentifierPath(String(value ?? '').replace(/['";]/g, ''));
}

function splitIdentifierPath(value) {
  return String(value ?? '').split(/[^A-Za-z0-9_$]+/).filter(isDependencyIdentifier);
}

function commaParts(raw) {
  return String(raw ?? '').split(',').map((part) => part.trim()).filter(Boolean);
}

function dependencyScanEndLine(input, declaration, lines, nextStartLine) {
  const startLine = declaration.span?.startLine ?? 1;
  if (!declaration.metadata?.hasBody) return startLine;
  if (usesIndentationBlocks(input)) {
    return indentationRegionEndLine(lines, startLine);
  }
  const balancedEnd = balancedRegionEndLine(lines, startLine);
  const fallbackEnd = nextStartLine ? nextStartLine - 1 : lines.length;
  return Math.max(startLine, Math.min(balancedEnd > startLine ? balancedEnd : fallbackEnd, lines.length));
}

function usesIndentationBlocks(input) {
  return ['python'].includes(String(input.language ?? '').toLowerCase());
}

function indentationRegionEndLine(lines, startLine) {
  const header = lines[startLine - 1]?.line ?? '';
  const baseIndent = indentationWidth(header);
  let lastBodyLine = startLine;
  let sawBodyLine = false;
  for (let index = startLine; index < lines.length; index += 1) {
    const line = lines[index]?.line ?? '';
    if (!line.trim()) {
      if (sawBodyLine) lastBodyLine = index + 1;
      continue;
    }
    const indent = indentationWidth(line);
    if (indent <= baseIndent) return Math.max(startLine, lastBodyLine);
    sawBodyLine = true;
    lastBodyLine = index + 1;
  }
  return lastBodyLine;
}

function indentationWidth(line) {
  let width = 0;
  for (const char of String(line ?? '')) {
    if (char === ' ') width += 1;
    else if (char === '\t') width += 4;
    else break;
  }
  return width;
}

function balancedRegionEndLine(lines, startLine) {
  const state = { inBlockComment: false };
  let depth = 0;
  let opened = false;
  for (let index = Math.max(0, startLine - 1); index < lines.length; index += 1) {
    for (const char of maskDependencyLine({ language: 'javascript' }, lines[index].line, state)) {
      if (char === '{' || char === '[' || char === '(') {
        depth += 1;
        opened = true;
      } else if (char === '}' || char === ']' || char === ')') {
        depth -= 1;
      }
    }
    if (opened && depth <= 0) return lines[index].number;
  }
  return startLine;
}

function startsLineComment(language, char, next, text, index) {
  if (char === '/' && next === '/') return true;
  if (char === '#' && !['csharp'].includes(language)) return true;
  if (char === '-' && next === '-' && ['sql', 'haskell', 'lua'].includes(language)) return true;
  return text.startsWith('rem ', index) && language === 'shell';
}
