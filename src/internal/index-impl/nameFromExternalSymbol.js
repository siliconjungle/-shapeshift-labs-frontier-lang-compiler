export function nameFromExternalSymbol(symbol) {
  const value = String(symbol ?? 'symbol');
  const cleaned = value
    .replace(/^symbol:[^:]+:/, '')
    .replace(/[`'"]/g, '')
    .split(/[\/#.:() +]+/)
    .filter(Boolean)
    .at(-1);
  return cleaned || value;
}
