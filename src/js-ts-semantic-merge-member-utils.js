function normalizeMemberText(text, kind) {
  const normalized = String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
  if (kind === 'object') return normalized.replace(/,\s*$/, '');
  if (kind === 'interface' || kind === 'type' || kind === 'class') return normalized.replace(/;\s*$/, '');
  return normalized;
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map(String))];
}

export {
  normalizeMemberText,
  uniqueStrings
};
