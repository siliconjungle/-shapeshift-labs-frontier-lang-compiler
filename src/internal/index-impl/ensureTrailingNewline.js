export function ensureTrailingNewline(value) {
  const text = String(value ?? '');
  return text.endsWith('\n') ? text : `${text}\n`;
}
