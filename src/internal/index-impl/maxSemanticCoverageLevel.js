export function maxSemanticCoverageLevel(left, right) {
  const ranks = { 'native-ast': 0, 'declaration-index': 1, 'semantic-index': 2 };
  const leftRank = ranks[left] ?? 0;
  const rightRank = ranks[right] ?? 0;
  return rightRank > leftRank ? right : left;
}
