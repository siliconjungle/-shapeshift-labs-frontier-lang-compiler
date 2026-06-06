export function swiftSyntaxProblemNode(node, kind) {
  return Boolean(
    node.isMissing
    || node.hasError
    || node.containsDiagnostics
    || node.containsSkippedText
    || node.presence === 'missing'
    || kind === 'UnexpectedNodes'
    || kind === 'MissingToken'
    || kind === 'SkippedToken'
    || kind === 'Error'
  );
}
