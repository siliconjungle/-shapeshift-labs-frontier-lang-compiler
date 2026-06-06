export function csharpRoslynRecoveredKind(kind) {
  return kind === 'IncompleteMember'
    || kind === 'SkippedTokensTrivia'
    || /Skipped|Missing|Bad|Incomplete/.test(String(kind));
}
