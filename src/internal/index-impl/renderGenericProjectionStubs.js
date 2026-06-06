import{nativeProjectionLineComment}from'./nativeProjectionLineComment.js';
export function renderGenericProjectionStubs(declarations, language) {
  if (!declarations.length) return `${nativeProjectionLineComment(language)} no declarations available`;
  return declarations.map((declaration) => `${declaration.kind} ${declaration.name}`).join('\n');
}
