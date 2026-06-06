import{kotlinPsiModifiers}from'./kotlinPsiModifiers.js';
export function kotlinCoroutineNode(node, kind) {
  const modifiers = kotlinPsiModifiers(node);
  return modifiers.includes('suspend')
    || /Coroutine|Suspend/i.test(String(kind))
    || node.isSuspend === true
    || node.suspend === true;
}
