export function addSet(set, value) {
  if (!value || set.has(value)) return false;
  set.add(value);
  return true;
}
