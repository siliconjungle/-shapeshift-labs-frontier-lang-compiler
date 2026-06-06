import{isKotlinPsiNode}from'./isKotlinPsiNode.js';
export function kotlinPsiRoot(value) {
  if (!value || typeof value !== 'object') return undefined;
  if (isKotlinPsiNode(value)) return value;
  if (isKotlinPsiNode(value.ast)) return value.ast;
  if (isKotlinPsiNode(value.root)) return value.root;
  if (isKotlinPsiNode(value.rootNode)) return value.rootNode;
  if (isKotlinPsiNode(value.ktFile)) return value.ktFile;
  if (isKotlinPsiNode(value.file)) return value.file;
  if (isKotlinPsiNode(value.sourceFile)) return value.sourceFile;
  if (Array.isArray(value.declarations) || Array.isArray(value.imports) || value.packageDirective) {
    return { kind: 'KtFile', ...value };
  }
  return undefined;
}
