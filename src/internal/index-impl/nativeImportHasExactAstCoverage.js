export function nativeImportHasExactAstCoverage(imported) {
  if (imported?.metadata?.nativeImportLossSummary?.exactAst === true) return true;
  if (imported?.adapter?.coverage?.exactAst === true && !(imported?.losses?.length)) return true;
  return false;
}
