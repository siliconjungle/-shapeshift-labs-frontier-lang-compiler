import { countBy, uniqueRecordsById, uniqueStrings } from './native-import-utils.js';

function summarizeSemanticImportDependencies(imports) {
  return summarizeSemanticImportDependencyRelations((imports ?? [])
    .flatMap((imported) => imported?.semanticIndex?.relations ?? imported?.universalAst?.semanticIndex?.relations ?? []));
}

function summarizeSemanticImportDependencyRelations(relations) {
  const dependencyRelations = uniqueRecordsById((relations ?? []).filter(isDependencyRelation));
  const predicateKeys = dependencyRelations.map((relation) => semanticDependencyPredicateKey(relation.predicate));
  const byPredicate = countBy(predicateKeys);
  return {
    total: dependencyRelations.length,
    calls: byPredicate.calls ?? 0,
    uses: byPredicate.uses ?? 0,
    references: byPredicate.references ?? 0,
    imports: byPredicate.imports ?? 0,
    extends: byPredicate.extends ?? 0,
    implements: byPredicate.implements ?? 0,
    includes: byPredicate.includes ?? 0,
    requires: byPredicate.requires ?? 0,
    byPredicate,
    predicates: uniqueStrings(predicateKeys),
    ids: dependencyRelations.map((relation) => relation.id).filter(Boolean),
    sourceSymbolIds: uniqueStrings(dependencyRelations.map((relation) => relation.sourceId).filter(Boolean)),
    targetSymbolIds: uniqueStrings(dependencyRelations.map((relation) => relation.targetId).filter(Boolean))
  };
}

function isDependencyRelation(relation) {
  const predicate = String(relation?.predicate ?? '').toLowerCase();
  if (!predicate || predicate === 'defines' || predicate === 'definitionof') return false;
  return predicate === 'imports'
    || predicate === 'calls'
    || predicate === 'uses'
    || predicate.includes('reference')
    || predicate.includes('depend')
    || predicate.includes('require')
    || predicate.includes('include')
    || predicate.includes('extend')
    || predicate.includes('implement');
}

function semanticDependencyPredicateKey(predicate) {
  const value = String(predicate ?? 'unknown').toLowerCase();
  if (value.includes('call')) return 'calls';
  if (value.includes('reference')) return 'references';
  if (value.includes('import')) return 'imports';
  if (value.includes('depend')) return 'depends';
  if (value.includes('require')) return 'requires';
  if (value.includes('include')) return 'includes';
  if (value.includes('extend')) return 'extends';
  if (value.includes('implement')) return 'implements';
  if (value === 'uses') return 'uses';
  return value || 'unknown';
}

export {
  semanticDependencyPredicateKey,
  summarizeSemanticImportDependencies,
  summarizeSemanticImportDependencyRelations
};
