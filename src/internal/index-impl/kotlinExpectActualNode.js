import{kotlinPsiModifiers}from'./kotlinPsiModifiers.js';
export function kotlinExpectActualNode(node) {
  const modifiers = kotlinPsiModifiers(node);
  return modifiers.includes('expect') || modifiers.includes('actual');
}
