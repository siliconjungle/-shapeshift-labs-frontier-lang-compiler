import{normalizeKotlinPsiKind}from'./normalizeKotlinPsiKind.js';
export function kotlinPsiKind(node) {
  if (!node || typeof node !== 'object') return undefined;
  const declared = node.kind ?? node.nodeType ?? node.elementType ?? node.psiKind ?? node._type ?? node.type;
  if (typeof declared === 'string') return normalizeKotlinPsiKind(declared);
  if (Array.isArray(node.declarations) || Array.isArray(node.imports) || node.packageDirective) return 'KtFile';
  if (node.fqName || node.packageFqName) return 'KtPackageDirective';
  if (node.importedFqName || node.importedReference) return 'KtImportDirective';
  if (node.classKind || node.primaryConstructor || node.superTypeListEntries) return 'KtClass';
  if (node.funKeyword || node.valueParameters || node.bodyExpression) return 'KtNamedFunction';
  if (node.valOrVarKeyword || node.delegateExpression || node.initializer) return 'KtProperty';
  return undefined;
}
