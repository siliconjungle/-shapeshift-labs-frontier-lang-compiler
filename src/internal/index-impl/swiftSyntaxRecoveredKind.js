export function swiftSyntaxRecoveredKind(kind) {
  return kind === 'UnexpectedNodes'
    || kind === 'MissingToken'
    || kind === 'SkippedToken'
    || kind === 'Error'
    || /Unexpected|Missing|Skipped|Error/.test(String(kind));
}
