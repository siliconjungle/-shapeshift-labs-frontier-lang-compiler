import { hashSemanticValue } from '@shapeshift-labs/frontier-lang-kernel';
import { caseSensitiveIdFragment, idFragment, uniqueRecordsById, uniqueStrings } from './native-import-utils.js';
import { maskNonCode } from './js-ts-semantic-scope-use-def-scan.js';

function resourceManagementRecordsForImport(imported, semanticIndex, options = {}) {
  const declarations = resourceManagementDeclarationsForImport(imported, semanticIndex);
  const records = declarations.map((declaration, index) => resourceManagementRegionRecord(imported, declaration, index, options));
  return {
    symbols: uniqueRecordsById(records.map((record) => record.symbol)),
    ownershipRegions: uniqueRecordsById(records.map((record) => record.region))
  };
}

function resourceManagementRuntimeRegionRecordsForImport(imported, semanticIndex, publicKeys = new Set()) {
  const declarations = resourceManagementDeclarationsForImport(imported, semanticIndex);
  const publicNames = new Set((semanticIndex?.symbols ?? []).filter((symbol) => symbol?.kind === 'export').map((symbol) => symbol.name));
  return declarations.map((declaration, index) => {
    const { region } = resourceManagementRegionRecord(imported, declaration, index);
    const runtimeOrderEvidence = region.metadata.runtimeOrderEvidence;
    const signatureHash = hashSemanticValue({
      kind: 'frontier.lang.projectRuntimeRegionSignature',
      regionKind: region.regionKind,
      runtimeKind: 'resource-management',
      runtimeOrderEvidence,
      declarationText: declaration.declarationText,
      initializerText: declaration.initializerText
    });
    return compactRecord({
      id: `runtime_region_${idFragment(region.id)}_${idFragment(signatureHash)}`,
      key: region.key,
      regionKind: region.regionKind,
      runtimeKind: 'resource-management',
      runtimeKinds: declaration.runtimeKinds,
      sourcePath: region.sourcePath,
      sourceHash: region.sourceHash,
      sourceSpan: region.sourceSpan,
      precision: region.precision,
      spanKind: region.metadata.spanKind,
      symbolId: declaration.ownerId,
      symbolName: declaration.ownerName,
      symbolKind: declaration.ownerKind,
      line: declaration.line,
      ordinal: declaration.ordinal,
      runtimeOrderEvidence,
      signatureHash,
      publicContract: publicKeys.has(runtimePublicKey(region.sourcePath, declaration.ownerName))
        || publicNames.has(declaration.ownerName) || undefined,
      factIds: [],
      evidenceIds: [`resource-management:${declaration.id}`]
    });
  });
}

function resourceManagementDeclarationsForImport(imported, semanticIndex) {
  const sourceText = nativeImportSourceText(imported);
  if (typeof sourceText !== 'string' || !sourceText.includes('using')) return [];
  const sourcePath = imported?.sourcePath ?? imported?.nativeSource?.sourcePath ?? imported?.nativeAst?.sourcePath;
  const language = imported?.language ?? imported?.nativeSource?.language ?? imported?.nativeAst?.language;
  const sourceHash = imported?.nativeSource?.sourceHash ?? imported?.nativeAst?.sourceHash ?? imported?.sourceHash;
  const masked = maskNonCode(sourceText).code;
  const lineStarts = lineStartsFor(sourceText);
  const scopes = braceScopes(masked, lineStarts);
  const rawDeclarations = usingDeclarationMatches(sourceText, masked, lineStarts).map((match) => {
    const scope = innermostScopeFor(scopes, match.start) ?? moduleScope(sourceText, lineStarts);
    const owner = ownerSymbolFor(semanticIndex?.symbols ?? [], sourcePath, match.line);
    return {
      ...match,
      id: `resource_${caseSensitiveIdFragment(`${sourcePath ?? 'memory'}:${match.start}:${match.end}:${match.name}`)}`,
      kind: 'resource-management',
      language,
      sourcePath,
      sourceHash,
      ownerId: owner?.id,
      ownerName: owner?.name ?? '(module)',
      ownerKind: owner?.kind ?? 'module',
      nativeAstNodeId: owner?.nativeAstNodeId,
      scopeId: scope.id,
      scopeStartLine: scope.startLine,
      scopeExitLine: scope.endLine,
      scopeStartColumn: scope.startColumn,
      scopeExitColumn: scope.endColumn,
      runtimeKinds: uniqueStrings(['resource-management', match.awaitUsing ? 'await-using' : 'using'])
    };
  });
  return assignResourceOrder(rawDeclarations);
}

function resourceManagementRegionRecord(imported, declaration, index, options = {}) {
  const key = [options.regionPrefix ?? 'source', declaration.sourcePath ?? 'memory', 'effect', `${declaration.ownerName}:resource-management:${declaration.name}#${declaration.ordinal}`].join('#');
  const runtimeOrderEvidence = resourceManagementRuntimeOrderEvidence(declaration);
  const signatureHash = hashSemanticValue({ kind: 'frontier.lang.resourceManagementRegionSignature', runtimeOrderEvidence });
  const symbolName = `${declaration.ownerName}:effect:resource-management#${declaration.ordinal}`;
  const region = {
    id: `region_${caseSensitiveIdFragment(key)}`,
    key,
    regionKind: 'effect',
    granularity: 'resource-management-declaration',
    language: declaration.language,
    sourcePath: declaration.sourcePath,
    sourceHash: declaration.sourceHash,
    symbolId: `symbol:${declaration.language ?? 'source'}:resource-management:${idFragment(key)}`,
    symbolName,
    symbolKind: 'effect',
    nativeAstNodeId: declaration.nativeAstNodeId,
    sourceSpan: sourceSpanForDeclaration(declaration, imported),
    precision: 'line',
    mergePolicy: 'effect-boundary-review-required',
    metadata: {
      semanticRegionTaxonomy: true,
      factKinds: declaration.runtimeKinds,
      factLine: declaration.line,
      predicate: 'effect',
      spanKind: 'resource-management-declaration',
      runtimeOrderEvidence,
      occurrenceOrdinal: declaration.ordinal,
      subjectId: declaration.ownerId,
      subjectName: declaration.ownerName,
      resourceManagementDeclaration: compactRecord({
        name: declaration.name,
        awaitUsing: declaration.awaitUsing || undefined,
        initializerText: declaration.initializerText,
        declarationText: declaration.declarationText,
        scopeExitLine: declaration.scopeExitLine
      })
    }
  };
  return {
    region,
    symbol: {
      id: region.symbolId,
      name: symbolName,
      kind: 'effect',
      language: declaration.language,
      nativeAstNodeId: declaration.nativeAstNodeId,
      sourceSpan: region.sourceSpan,
      signatureHash,
      ownershipRegionId: region.id,
      ownershipKey: region.key,
      ownershipRegionKind: 'effect',
      readiness: 'needs-review'
    }
  };
}

function resourceManagementRuntimeOrderEvidence(declaration) {
  return {
    schema: 'frontier.lang.runtimeOrderEvidence.v1',
    source: 'lexical-source-scan',
    subjectId: declaration.ownerId,
    regionKind: 'effect',
    runtimeKinds: declaration.runtimeKinds,
    line: declaration.line,
    resourceManagementOrder: declaration.scopeDeclarations.map((item) => compactRecord({
      kind: 'resource-management',
      name: item.name,
      declarationKind: item.awaitUsing ? 'await-using' : 'using',
      awaitUsing: item.awaitUsing || undefined,
      line: item.line,
      column: item.column,
      acquisitionOrderIndex: item.acquisitionOrderIndex,
      disposalOrderIndex: item.disposalOrderIndex,
      disposalOrder: 'reverse-lexical-scope',
      scopeStartLine: item.scopeStartLine,
      scopeExitLine: item.scopeExitLine,
      declarationText: item.declarationText,
      initializerText: item.initializerText,
      focusedDeclaration: item.id === declaration.id || undefined,
      disposalMethodPolicy: item.awaitUsing ? 'Symbol.asyncDispose-or-Symbol.dispose' : 'Symbol.dispose',
      staticResourceManagementEvidence: true,
      runtimeEquivalenceClaim: false,
      disposalEffectEquivalenceClaim: false,
      semanticEquivalenceClaim: false
    }))
  };
}

function usingDeclarationMatches(sourceText, masked, lineStarts) {
  const pattern = /(^|[^\w$])(?:(await)\s+)?using\s+([A-Za-z_$][\w$]*)\s*(?::[^=;\n]+)?=\s*/g;
  const records = [];
  for (const match of masked.matchAll(pattern)) {
    const start = match.index + match[1].length;
    const initializerStart = match.index + match[0].length;
    const end = statementEnd(masked, initializerStart);
    const location = lineColumnAt(lineStarts, start);
    records.push({
      start,
      end,
      line: location.line,
      column: location.column,
      name: match[3],
      awaitUsing: Boolean(match[2]),
      declarationText: normalizeText(sourceText.slice(start, end)),
      initializerText: normalizeText(sourceText.slice(initializerStart, end).replace(/;\s*$/, ''))
    });
  }
  return records;
}

function assignResourceOrder(declarations) {
  const byScope = new Map();
  for (const declaration of declarations) {
    const group = byScope.get(declaration.scopeId) ?? [];
    group.push(declaration);
    byScope.set(declaration.scopeId, group);
  }
  for (const group of byScope.values()) {
    group.sort((left, right) => left.start - right.start);
    group.forEach((declaration, index) => {
      declaration.acquisitionOrderIndex = index + 1;
      declaration.disposalOrderIndex = group.length - index;
      declaration.ordinal = index + 1;
      declaration.scopeDeclarations = group;
    });
  }
  return declarations;
}

function ownerSymbolFor(symbols, sourcePath, line) {
  return symbols
    .filter((symbol) => symbol?.definitionSpan?.path === sourcePath || !sourcePath)
    .filter((symbol) => symbol?.definitionSpan?.startLine <= line && symbol?.definitionSpan?.endLine >= line)
    .filter((symbol) => symbol?.metadata?.ownershipRegionKind === 'body' || /function|method|constructor|class/.test(String(symbol.kind ?? '').toLowerCase()))
    .sort((left, right) => spanSize(left.definitionSpan) - spanSize(right.definitionSpan))[0];
}

function braceScopes(masked, lineStarts) {
  const scopes = [];
  const stack = [];
  for (let index = 0; index < masked.length; index += 1) {
    const char = masked[index];
    if (char === '{') {
      const location = lineColumnAt(lineStarts, index);
      stack.push({ start: index, startLine: location.line, startColumn: location.column });
    } else if (char === '}' && stack.length) {
      const open = stack.pop();
      const location = lineColumnAt(lineStarts, index);
      scopes.push({ ...open, end: index, endLine: location.line, endColumn: location.column, id: `scope:${open.start}:${index}` });
    }
  }
  return scopes;
}

function innermostScopeFor(scopes, offset) {
  return scopes
    .filter((scope) => scope.start < offset && scope.end > offset)
    .sort((left, right) => (left.end - left.start) - (right.end - right.start))[0];
}

function moduleScope(sourceText, lineStarts) {
  return { id: 'scope:module', startLine: 1, startColumn: 1, endLine: lineStarts.length, endColumn: String(sourceText).length - lineStarts[lineStarts.length - 1] + 1 };
}

function sourceSpanForDeclaration(declaration, imported) {
  return {
    sourceId: declaration.sourceHash,
    path: declaration.sourcePath ?? imported?.sourcePath ?? imported?.nativeSource?.sourcePath,
    startLine: declaration.line,
    endLine: declaration.line,
    startColumn: declaration.column,
    endColumn: declaration.column + Math.max(1, declaration.declarationText.length)
  };
}

function lineStartsFor(sourceText) {
  const starts = [0];
  for (let index = 0; index < sourceText.length; index += 1) if (sourceText[index] === '\n') starts.push(index + 1);
  return starts;
}

function lineColumnAt(lineStarts, offset) {
  let lineIndex = 0;
  while (lineIndex + 1 < lineStarts.length && lineStarts[lineIndex + 1] <= offset) lineIndex += 1;
  return { line: lineIndex + 1, column: offset - lineStarts[lineIndex] + 1 };
}

function statementEnd(masked, start) {
  for (let index = start, depth = 0; index < masked.length; index += 1) {
    const char = masked[index];
    if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth = Math.max(0, depth - 1);
    else if (char === ';' && depth === 0) return index + 1;
    else if ((char === '\n' || char === '\r') && depth === 0) return index;
  }
  return masked.length;
}

function runtimePublicKey(sourcePath, symbolName) { return sourcePath && symbolName ? `${sourcePath}\0${symbolName}` : undefined; }
function nativeImportSourceText(imported) { return imported?.metadata?.sourcePreservation?.sourceText ?? imported?.nativeSource?.metadata?.sourcePreservation?.sourceText ?? imported?.nativeAst?.metadata?.sourcePreservation?.sourceText ?? imported?.universalAst?.metadata?.sourcePreservation?.sourceText ?? imported?.sourceText; }
function spanSize(span) { return Math.max(0, Number(span?.endLine ?? 0) - Number(span?.startLine ?? 0)); }
function normalizeText(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function compactRecord(record) { return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)); }

export { resourceManagementRecordsForImport, resourceManagementRuntimeRegionRecordsForImport };
