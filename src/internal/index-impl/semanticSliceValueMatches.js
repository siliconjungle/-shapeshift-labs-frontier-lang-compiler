export function semanticSliceValueMatches(value, ref) {
  if (!value || !ref) return false;
  const left = String(value);
  const right = String(ref);
  return left === right || left.endsWith(`:${right}`) || left.includes(right);
}
