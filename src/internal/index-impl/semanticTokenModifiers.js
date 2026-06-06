export function semanticTokenModifiers(bitset, modifiers = []) {
  const result = [];
  for (let index = 0; index < modifiers.length; index += 1) {
    if ((bitset & (1 << index)) > 0) result.push(modifiers[index]);
  }
  return result;
}
