export function kotlinPsiRecoveredKind(kind) {
  return kind === 'PsiErrorElement'
    || kind === 'KtErrorElement'
    || /Error|Recovery|Incomplete|Missing|Skipped/.test(String(kind));
}
