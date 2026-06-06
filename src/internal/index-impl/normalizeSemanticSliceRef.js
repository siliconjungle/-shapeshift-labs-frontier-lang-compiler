export function normalizeSemanticSliceRef(ref, prefix) {
  const text = String(ref ?? '');
  return text.startsWith(`${prefix}:`) ? text.slice(prefix.length + 1) : text;
}
