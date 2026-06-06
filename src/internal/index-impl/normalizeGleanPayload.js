import{idFragment}from'../../native-import-utils.js';import{hashSemanticValue}from'@shapeshift-labs/frontier-lang-kernel';
import{externalSemanticBase}from'./externalSemanticBase.js';import{nameFromExternalSymbol}from'./nameFromExternalSymbol.js';import{normalizeArray}from'./normalizeArray.js';import{normalizeExternalSemanticLanguage}from'./normalizeExternalSemanticLanguage.js';import{normalizeExternalSymbolKind}from'./normalizeExternalSymbolKind.js';import{withExternalEmptyLoss}from'./withExternalEmptyLoss.js';

export function normalizeGleanPayload(payload, context) {
  const result = externalSemanticBase(context, { sourceFormat: 'glean', factStore: true });
  const root = context.projectRoot ?? payload.repo ?? payload.repository ?? payload.projectRoot;
  result.repository = root ? { root } : undefined;
  const documents = new Map();
  const symbols = new Map();
  const ensureDocument = (path, language, sourceHash) => {
    const normalizedPath = path ?? context.sourcePath ?? 'glean-facts';
    const id = `doc_${idFragment(normalizedPath)}`;
    if (!documents.has(id)) {
      const document = {
        id,
        path: normalizedPath,
        language: normalizeExternalSemanticLanguage(language ?? context.language),
        sourceHash: sourceHash ?? context.sourceHash,
        metadata: { format: 'glean', root }
      };
      documents.set(id, document);
      result.documents.push(document);
    }
    return documents.get(id);
  };
  const ensureSymbol = (fact, document, name, kind) => {
    const rawSymbol = firstString(name, fact.symbol, fact.key?.symbol, fact.key?.name, fact.id);
    const symbolId = `sym_${idFragment(document.id)}_${idFragment(rawSymbol ?? fact.predicate)}`;
    if (!symbols.has(symbolId)) {
      const symbol = {
        id: symbolId,
        scheme: 'glean',
        name: name ?? nameFromExternalSymbol(rawSymbol ?? fact.predicate),
        kind: normalizeExternalSymbolKind(kind ?? fact.kind ?? fact.key?.kind ?? fact.predicate),
        language: document.language,
        signatureHash: hashSemanticValue([fact.predicate, rawSymbol, fact.value?.signature]),
        metadata: {
          format: 'glean',
          predicate: fact.predicate,
          factId: fact.id,
          rawSymbol
        }
      };
      symbols.set(symbolId, symbol);
      result.symbols.push(symbol);
    }
    return symbols.get(symbolId);
  };
  for (const [index, fact] of collectGleanFacts(payload).entries()) {
    const path = gleanPath(fact) ?? context.sourcePath;
    const document = ensureDocument(path, gleanLanguage(fact, context), gleanSourceHash(fact, context));
    const name = gleanName(fact);
    const symbol = name ? ensureSymbol(fact, document, name, gleanKind(fact)) : undefined;
    const subjectId = symbol?.id ?? document.id;
    const factId = `fact_${idFragment(fact.predicate)}_${idFragment(fact.id ?? index + 1)}`;
    result.facts.push({
      id: factId,
      predicate: fact.predicate,
      subjectId,
      objectId: undefined,
      value: { key: fact.key, value: fact.value },
      metadata: { format: 'glean', factId: fact.id, schema: fact.schema }
    });
    const span = spanFromGleanFact(fact, document.path, document.sourceHash);
    if (symbol && span) {
      result.occurrences.push({
        id: `occ_${idFragment(factId)}`,
        documentId: document.id,
        symbolId: symbol.id,
        role: gleanRole(fact),
        span,
        metadata: { format: 'glean', predicate: fact.predicate, factId: fact.id }
      });
    }
    const relation = gleanRelation(fact, subjectId);
    if (relation) {
      const target = ensureSymbol(fact, document, relation.targetName, relation.targetKind);
      result.relations.push({
        id: `rel_${idFragment(factId)}_${idFragment(target.id)}`,
        sourceId: subjectId,
        predicate: relation.predicate,
        targetId: target.id,
        metadata: { format: 'glean', factId: fact.id, sourcePredicate: fact.predicate }
      });
    }
  }
  return withExternalEmptyLoss(result, context);
}

function collectGleanFacts(payload) {
  const facts = [];
  const addFact = (fact, predicate) => {
    if (!fact || typeof fact !== 'object') return;
    facts.push(normalizeGleanFact({
      ...fact,
      predicate: fact.predicate ?? fact.predicateName ?? predicate ?? fact.name
    }));
  };
  const addFactGroup = (group, predicate) => {
    if (!group || typeof group !== 'object') return false;
    const groupPredicate = group.predicate ?? group.predicateName ?? group.name ?? predicate;
    if (!groupPredicate) return false;
    const groupedFacts = [...normalizeArray(group.facts), ...normalizeArray(group.results)];
    if (!groupedFacts.length) return false;
    for (const fact of groupedFacts) addFact(fact, groupPredicate);
    return true;
  };
  const topLevelGroup = !Array.isArray(payload) && addFactGroup(payload);
  if (!topLevelGroup) {
    for (const entry of Array.isArray(payload) ? payload : []) {
      if (!addFactGroup(entry)) addFact(entry);
    }
  }
  if (!topLevelGroup) {
    for (const fact of normalizeArray(payload.facts)) {
      if (!addFactGroup(fact)) addFact(fact);
    }
    for (const fact of normalizeArray(payload.results)) {
      if (!addFactGroup(fact)) addFact(fact);
    }
  }
  for (const [predicate, entries] of Object.entries(payload.predicates ?? payload.factsByPredicate ?? {})) {
    for (const entry of normalizeArray(entries)) facts.push(normalizeGleanFact({ predicate, ...entry }));
  }
  return facts.filter((fact) => fact.predicate);
}

function normalizeGleanFact(fact) {
  const key = fact.key ?? fact.value?.key ?? fact.data?.key ?? fact;
  const value = fact.value?.value ?? fact.val ?? fact.data?.value ?? fact.value;
  return {
    id: fact.id ?? fact.factId ?? fact.fact_id,
    predicate: fact.predicate ?? fact.predicateName ?? fact.name,
    key,
    value,
    schema: fact.schema ?? fact.schemaId,
    symbol: fact.symbol,
    kind: fact.kind
  };
}

function gleanPath(fact) {
  return firstString(fact.key?.file?.key?.name, fact.key?.file?.key?.path, fact.key?.file?.name, fact.key?.file?.path, fact.key?.path, fact.key?.uri, fact.value?.file?.path, fact.value?.path);
}

function gleanLanguage(fact, context) {
  return firstString(fact.key?.language, fact.value?.language, context.language);
}

function gleanSourceHash(fact, context) {
  return firstString(fact.key?.file?.key?.hash, fact.key?.file?.hash, fact.key?.sourceHash, fact.value?.sourceHash, context.sourceHash);
}

function gleanName(fact) {
  return firstString(fact.key?.name, fact.key?.decl?.name, fact.key?.target?.name, fact.key?.function?.name, fact.key?.className, fact.value?.name, fact.symbol);
}

function gleanKind(fact) {
  const predicate = String(fact.predicate ?? '').toLowerCase();
  if (predicate.includes('function') || predicate.includes('method')) return 'function';
  if (predicate.includes('class')) return 'class';
  if (predicate.includes('module')) return 'module';
  if (predicate.includes('variable') || predicate.includes('local')) return 'variable';
  return firstString(fact.key?.kind, fact.value?.kind, fact.kind);
}

function gleanRole(fact) {
  const predicate = String(fact.predicate ?? '').toLowerCase();
  if (predicate.includes('reference') || predicate.includes('use')) return 'reference';
  if (predicate.includes('import')) return 'import';
  if (predicate.includes('definition') || predicate.includes('declaration') || predicate.includes('decl')) return 'definition';
  return 'definition';
}

function spanFromGleanFact(fact, path, sourceHash) {
  const range = fact.key?.range ?? fact.key?.loc ?? fact.key?.location ?? fact.value?.range ?? fact.value?.location;
  const start = range?.start ?? range;
  const end = range?.end ?? range;
  const line = numberValue(start?.line ?? start?.lineStart ?? range?.line);
  const column = numberValue(start?.column ?? start?.character ?? start?.col ?? range?.column);
  if (line === undefined || column === undefined) return undefined;
  return {
    sourceId: sourceHash,
    path,
    startLine: line + 1,
    startColumn: column + 1,
    endLine: numberValue(end?.line ?? end?.lineEnd ?? line) + 1,
    endColumn: numberValue(end?.column ?? end?.character ?? end?.col ?? column) + 1
  };
}

function gleanRelation(fact, sourceId) {
  const predicate = String(fact.predicate ?? '').toLowerCase();
  const targetName = firstString(fact.key?.target?.name, fact.key?.callee?.name, fact.key?.parent?.name, fact.value?.target?.name, fact.value?.callee?.name, fact.value?.parent?.name);
  if (!targetName) return undefined;
  const relationPredicate = predicate.includes('call') ? 'calls' : predicate.includes('parent') || predicate.includes('inherit') ? 'extends' : 'references';
  return { predicate: relationPredicate, sourceId, targetName, targetKind: fact.key?.target?.kind ?? fact.value?.target?.kind };
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

function numberValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}
