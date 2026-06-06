export function kotlinPsiProblemNode(node, kind) {
  return Boolean(
    node.hasError
    || node.containsDiagnostics
    || node.containsSkippedText
    || node.isMissing
    || kind === 'PsiErrorElement'
    || kind === 'KtErrorElement'
  );
}
