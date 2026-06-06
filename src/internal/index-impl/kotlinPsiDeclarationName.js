import{kotlinPsiKind}from'./kotlinPsiKind.js';import{kotlinPsiName}from'./kotlinPsiName.js';import{kotlinPsiVariableNames}from'./kotlinPsiVariableNames.js';
export function kotlinPsiDeclarationName(node, kind = kotlinPsiKind(node)) {
  if (!node || typeof node !== 'object') return undefined;
  if (kind === 'KtPrimaryConstructor' || kind === 'KtSecondaryConstructor') return 'constructor';
  if (kind === 'KtClassInitializer') return 'init';
  if (kind === 'KtObjectDeclaration' && node.isCompanion === true && !node.name && !node.nameIdentifier) return 'companion object';
  for (const key of ['nameIdentifier', 'identifier', 'name', 'simpleName', 'classId', 'fqName', 'id']) {
    const name = kotlinPsiName(node[key]);
    if (name) return name;
  }
  const variable = kotlinPsiVariableNames(node)[0];
  if (variable) return variable;
  return undefined;
}
