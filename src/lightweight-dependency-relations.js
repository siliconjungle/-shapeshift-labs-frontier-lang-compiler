import { idFragment } from './native-import-utils.js';
import { sourceLines } from './native-region-scanner-core.js';

const jsLikeLanguages = new Set(['javascript', 'typescript']);
const ignoredIdentifiers = new Set([
  'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default',
  'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for', 'from',
  'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'null', 'of',
  'return', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof',
  'undefined', 'var', 'void', 'while', 'with', 'yield'
]);

export function lightweightDependencyRelations(input, declarations, documentId) {
  if (!jsLikeLanguages.has(String(input.language ?? '').toLowerCase())) {
    return { relations: [], occurrences: [], facts: [], summary: emptySummary() };
  }
  const lines = sourceLines(input.sourceText);
  const identifiers = declarationIdentifierMap(input, declarations, lines);
  const records = { relations: [], occurrences: [], facts: [], seen: new Set() };
  for (const scan of declarationScanRanges(declarations, lines)) {
    scanDeclarationDependencies(input, documentId, scan, identifiers, lines, records);
  }
  return {
    relations: records.relations,
    occurrences: records.occurrences,
    facts: records.facts,
    summary: {
      total: records.relations.length,
      calls: records.relations.filter((relation) => relation.predicate === 'calls').length,
      uses: records.relations.filter((relation) => relation.predicate === 'uses').length
    }
  };
}

function declarationIdentifierMap(input, declarations, lines) {
  const identifiers = new Map();
  for (const declaration of declarations ?? []) {
    if (!declaration?.symbolId) continue;
    const target = {
      name: declaration.name,
      symbolId: declaration.symbolId,
      symbolKind: declaration.symbolKind,
      nodeId: declaration.nodeId,
      role: declaration.role
    };
    for (const identifier of identifiersForDeclaration(input, declaration, lines)) {
      addIdentifierTarget(identifiers, identifier, target);
    }
  }
  return identifiers;
}

function identifiersForDeclaration(input, declaration, lines) {
  const identifiers = new Set();
  addIdentifier(identifiers, declaration.name);
  const parts = String(declaration.name ?? '').split('.');
  addIdentifier(identifiers, parts[parts.length - 1]);
  if (declaration.role === 'import') {
    const line = lines[(declaration.span?.startLine ?? 1) - 1]?.line ?? '';
    for (const identifier of importLocalIdentifiers(line)) addIdentifier(identifiers, identifier);
    addIdentifier(identifiers, packageIdentifier(declaration.importPath ?? declaration.name));
  }
  return [...identifiers];
}

function importLocalIdentifiers(line) {
  const source = String(line ?? '');
  const identifiers = [];
  let match = source.match(/^import\s+([A-Za-z_$][\w$]*)\s+from\b/);
  if (match) identifiers.push(match[1]);
  match = source.match(/^import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\b/);
  if (match) identifiers.push(match[1]);
  match = source.match(/^import\s+[^,{]+,\s*\{([^}]+)\}\s+from\b/);
  if (match) identifiers.push(...namedImportIdentifiers(match[1]));
  match = source.match(/^import\s+\{([^}]+)\}\s+from\b/);
  if (match) identifiers.push(...namedImportIdentifiers(match[1]));
  return identifiers;
}

function namedImportIdentifiers(raw) {
  return String(raw ?? '')
    .split(',')
    .map((part) => part.trim().split(/\s+as\s+/i).pop()?.trim())
    .filter(Boolean);
}

function packageIdentifier(value) {
  const parts = String(value ?? '').split('/').filter(Boolean);
  const last = parts[parts.length - 1] ?? value;
  return String(last).replace(/[^A-Za-z0-9_$]/g, '');
}

function addIdentifierTarget(map, identifier, target) {
  if (!isIdentifier(identifier)) return;
  const existing = map.get(identifier) ?? [];
  if (!existing.some((entry) => entry.symbolId === target.symbolId)) existing.push(target);
  map.set(identifier, existing);
}

function addIdentifier(set, value) {
  if (isIdentifier(value)) set.add(value);
}

function isIdentifier(value) {
  const text = String(value ?? '');
  return /^[A-Za-z_$][\w$]*$/.test(text) && !ignoredIdentifiers.has(text);
}

function declarationScanRanges(declarations, lines) {
  return (declarations ?? [])
    .filter((declaration) => declaration?.symbolId && declaration.role !== 'import')
    .map((declaration) => ({
      declaration,
      startLine: declaration.span?.startLine ?? 1,
      endLine: declarationScanEndLine(declaration, lines)
    }));
}

function declarationScanEndLine(declaration, lines) {
  const startLine = declaration.span?.startLine ?? 1;
  if (!declaration.metadata?.hasBody || declaration.kind === 'ClassDeclaration') return startLine;
  return balancedRegionEndLine(lines, startLine);
}

function balancedRegionEndLine(lines, startLine) {
  const state = { inBlockComment: false, inTemplateString: false };
  let depth = 0;
  let opened = false;
  for (let index = Math.max(0, startLine - 1); index < lines.length; index += 1) {
    for (const char of maskReferenceLine(lines[index].line, state)) {
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

function scanDeclarationDependencies(input, documentId, scan, identifiers, lines, records) {
  const state = { inBlockComment: false, inTemplateString: false };
  for (let lineNumber = scan.startLine; lineNumber <= scan.endLine; lineNumber += 1) {
    const scanLine = maskReferenceLine(lines[lineNumber - 1]?.line ?? '', state);
    for (const match of scanLine.matchAll(/[A-Za-z_$][\w$]*/g)) {
      const name = match[0];
      if (ignoredIdentifiers.has(name) || !identifiers.has(name)) continue;
      const targets = identifiers.get(name).filter((target) => target.symbolId !== scan.declaration.symbolId);
      for (const target of targets) {
        addDependencyRecord(input, documentId, scan.declaration, target, {
          line: scanLine,
          lineNumber,
          startColumn: match.index + 1,
          name
        }, records);
      }
    }
  }
}

function addDependencyRecord(input, documentId, caller, target, occurrence, records) {
  const predicate = isCallReference(occurrence.line, occurrence.startColumn + occurrence.name.length - 1) ? 'calls' : 'uses';
  const key = `${caller.symbolId}|${predicate}|${target.symbolId}|${occurrence.lineNumber}|${occurrence.startColumn}`;
  if (records.seen.has(key)) return;
  records.seen.add(key);
  const relationId = `rel_${idFragment(caller.symbolId)}_${predicate}_${idFragment(target.symbolId)}_${occurrence.lineNumber}_${occurrence.startColumn}`;
  const occurrenceId = `occ_${idFragment(caller.nodeId)}_${predicate}_${idFragment(target.symbolId)}_${occurrence.lineNumber}_${occurrence.startColumn}`;
  const span = {
    sourceId: input.sourceHash,
    path: input.sourcePath,
    startLine: occurrence.lineNumber,
    endLine: occurrence.lineNumber,
    startColumn: occurrence.startColumn,
    endColumn: occurrence.startColumn + occurrence.name.length
  };
  records.relations.push({
    id: relationId,
    sourceId: caller.symbolId,
    predicate,
    targetId: target.symbolId,
    metadata: {
      scan: 'lightweight-dependency',
      confidence: 'lexical-reference',
      sourceDocumentId: documentId,
      sourceName: caller.name,
      targetName: target.name
    }
  });
  records.occurrences.push({
    id: occurrenceId,
    documentId,
    symbolId: target.symbolId,
    role: 'reference',
    span,
    nativeAstNodeId: caller.nodeId
  });
  records.facts.push({
    id: `fact_${idFragment(relationId)}_lightweight_dependency`,
    predicate: 'lightweightDependency',
    subjectId: caller.symbolId,
    value: {
      relationId,
      predicate,
      targetId: target.symbolId,
      line: occurrence.lineNumber,
      confidence: 'lexical-reference'
    }
  });
}

function isCallReference(line, afterIdentifierIndex) {
  return /^\s*\(/.test(String(line ?? '').slice(afterIdentifierIndex));
}

function maskReferenceLine(line, state) {
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
    if (state.inTemplateString) {
      output += ' ';
      if (char === '`' && !escaped) state.inTemplateString = false;
      escaped = char === '\\' && !escaped;
      continue;
    }
    if (quote) {
      output += ' ';
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === '/' && next === '/') break;
    if (char === '/' && next === '*') {
      output += '  ';
      index += 1;
      state.inBlockComment = true;
      continue;
    }
    if (char === '\'' || char === '"') {
      output += ' ';
      quote = char;
      continue;
    }
    if (char === '`') {
      output += ' ';
      state.inTemplateString = true;
      continue;
    }
    output += char;
  }
  return output;
}

function emptySummary() {
  return { total: 0, calls: 0, uses: 0 };
}
