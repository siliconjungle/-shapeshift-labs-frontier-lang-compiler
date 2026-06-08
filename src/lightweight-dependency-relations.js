import { idFragment } from './native-import-utils.js';
import {
  addIdentifier,
  dependencyIdentifiers,
  dependencyScanRanges,
  emptyDependencySummary,
  isDependencyIdentifier,
  maskDependencyLine
} from './lightweight-dependency-language.js';
import { sourceLines } from './native-region-scanner-core.js';

export function lightweightDependencyRelations(input, declarations, documentId) {
  if (typeof input.sourceText !== 'string') return { relations: [], occurrences: [], facts: [], summary: emptyDependencySummary() };
  const lines = sourceLines(input.sourceText);
  const identifiers = declarationIdentifierMap(input, declarations, lines);
  const records = { relations: [], occurrences: [], facts: [], seen: new Set() };
  for (const scan of dependencyScanRanges(input, declarations, lines)) {
    scanDeclarationDependencies(input, documentId, scan, identifiers, lines, records);
  }
  return {
    relations: records.relations,
    occurrences: records.occurrences,
    facts: records.facts,
    summary: {
      total: records.relations.length,
      calls: records.relations.filter((relation) => relation.predicate === 'calls').length,
      uses: records.relations.filter((relation) => relation.predicate === 'uses').length,
      controlFlow: records.facts.filter((fact) => fact.predicate === 'controlFlow').length,
      effects: records.facts.filter((fact) => fact.predicate === 'effect').length,
      mutations: records.facts.filter((fact) => fact.predicate === 'mutation').length
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
  const line = lines[(declaration.span?.startLine ?? 1) - 1]?.line ?? '';
  for (const identifier of dependencyIdentifiers(input, declaration, line)) {
    addIdentifier(identifiers, identifier);
  }
  return [...identifiers];
}

function addIdentifierTarget(map, identifier, target) {
  if (!isDependencyIdentifier(identifier)) return;
  const existing = map.get(identifier) ?? [];
  if (!existing.some((entry) => entry.symbolId === target.symbolId)) existing.push(target);
  map.set(identifier, existing);
}

function scanDeclarationDependencies(input, documentId, scan, identifiers, lines, records) {
  const state = { inBlockComment: false };
  for (let lineNumber = scan.startLine; lineNumber <= scan.endLine; lineNumber += 1) {
    const scanLine = maskDependencyLine(input, lines[lineNumber - 1]?.line ?? '', state);
    addLightweightSemanticFacts(input, documentId, scan.declaration, scanLine, lineNumber, records);
    for (const match of scanLine.matchAll(/[A-Za-z_$][\w$]*/g)) {
      const name = match[0];
      if (!isDependencyIdentifier(name) || !identifiers.has(name)) continue;
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

function addLightweightSemanticFacts(input, documentId, declaration, line, lineNumber, records) {
  const text = String(line ?? '').trim();
  if (!text) return;
  for (const item of lightweightControlFlowKinds(text)) {
    addFactRecord(input, documentId, declaration, 'controlFlow', item, lineNumber, records);
  }
  for (const item of lightweightEffectKinds(text)) {
    addFactRecord(input, documentId, declaration, 'effect', item, lineNumber, records);
  }
  for (const item of lightweightMutationKinds(text)) {
    addFactRecord(input, documentId, declaration, 'mutation', item, lineNumber, records);
  }
}

function lightweightControlFlowKinds(line) {
  const kinds = [];
  if (/\b(if|else|switch|case|default)\b/.test(line)) kinds.push('branch');
  if (/\b(for|while|do)\b/.test(line)) kinds.push('loop');
  if (/\b(return|yield)\b/.test(line)) kinds.push('exit');
  if (/\b(throw|catch|finally|try)\b/.test(line)) kinds.push('exception');
  if (/\b(await|async)\b/.test(line)) kinds.push('async');
  return kinds;
}

function lightweightEffectKinds(line) {
  const kinds = [];
  if (/\bawait\b|import\s*\(/.test(line)) kinds.push('async');
  if (/\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/.test(line)) kinds.push('network');
  if (/\b(localStorage|sessionStorage|indexedDB|caches|cookie)\b/.test(line)) kinds.push('storage');
  if (/\b(setTimeout|setInterval|requestAnimationFrame|queueMicrotask)\s*\(/.test(line)) kinds.push('scheduler');
  if (/\b(console|process|Deno|Bun)\s*\./.test(line)) kinds.push('host');
  if (/\b(document|window|navigator|location|history)\s*\./.test(line)) kinds.push('browser');
  return kinds;
}

function lightweightMutationKinds(line) {
  const kinds = [];
  if (/\bdelete\s+[A-Za-z_$][\w$.[\]]*/.test(line)) kinds.push('delete');
  if (/(?:^|[^=!<>])=(?!=|>)/.test(line)) kinds.push('assignment');
  if (/\+\+|--|(?:\+=|-=|\*=|\/=|%=|\|\|=|&&=|\?\?=)/.test(line)) kinds.push('update');
  if (/\.(?:push|pop|shift|unshift|splice|sort|reverse|set|add|delete|clear)\s*\(/.test(line)) kinds.push('mutating-call');
  return kinds;
}

function addFactRecord(input, documentId, declaration, predicate, factKind, lineNumber, records) {
  const key = `${declaration.symbolId}|${predicate}|${factKind}|${lineNumber}`;
  if (records.seen.has(key)) return;
  records.seen.add(key);
  records.facts.push({
    id: `fact_${idFragment(declaration.symbolId)}_${predicate}_${idFragment(factKind)}_${lineNumber}`,
    predicate,
    subjectId: declaration.symbolId,
    value: {
      kind: factKind,
      line: lineNumber,
      sourcePath: input.sourcePath,
      documentId,
      confidence: 'lexical-source-scan'
    }
  });
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
    id: `fact_${idFragment(relationId)}_${records.facts.length + 1}_lightweight_dependency`,
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
