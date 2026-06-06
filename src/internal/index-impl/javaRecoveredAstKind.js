export function javaRecoveredAstKind(kind) {
  return kind === 'Erroneous'
    || /Error|Erroneous|Malformed|Recovered|Problem|Missing/.test(String(kind));
}
