export function csharpRoslynProblemNode(node, kind) {
  return Boolean(
    node.containsDiagnostics
    || node.ContainsDiagnostics
    || node.containsSkippedText
    || node.ContainsSkippedText
    || node.isMissing
    || node.IsMissing
    || node.hasDiagnostics
    || node.HasDiagnostics
    || kind === 'IncompleteMember'
    || kind === 'SkippedTokensTrivia'
  );
}
