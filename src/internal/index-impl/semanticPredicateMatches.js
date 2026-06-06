export function semanticPredicateMatches(value, fragments) {
  const predicate = String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  return fragments.some((fragment) => predicate.includes(fragment));
}
