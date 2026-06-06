import{clangDeclarationAction}from'./clangDeclarationAction.js';import{clangDeclarationName}from'./clangDeclarationName.js';import{clangIncludePath}from'./clangIncludePath.js';import{declarationRecord}from'./declarationRecord.js';import{nativeNodeId}from'./nativeNodeId.js';
export function clangAstDeclaration(node, kind, nativeNodeId, input) {
  if (kind === 'FunctionDecl' || kind === 'CXXMethodDecl' || kind === 'FunctionTemplateDecl') {
    const name = clangDeclarationName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, kind === 'CXXMethodDecl' ? 'method' : 'function', clangDeclarationAction(node));
  }
  if (kind === 'ParmVarDecl') {
    const name = clangDeclarationName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'parameter', 'definition');
  }
  if (kind === 'RecordDecl' || kind === 'CXXRecordDecl' || kind === 'ClassTemplateDecl') {
    const name = clangDeclarationName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, kind === 'CXXRecordDecl' ? 'class' : 'type', clangDeclarationAction(node));
  }
  if (kind === 'FieldDecl') {
    const name = clangDeclarationName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'property', 'definition');
  }
  if (kind === 'TypedefDecl' || kind === 'TypeAliasDecl' || kind === 'TypeAliasTemplateDecl') {
    const name = clangDeclarationName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'type', 'definition');
  }
  if (kind === 'EnumDecl') {
    const name = clangDeclarationName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'type', clangDeclarationAction(node));
  }
  if (kind === 'EnumConstantDecl') {
    const name = clangDeclarationName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'enumMember', 'definition');
  }
  if (kind === 'VarDecl') {
    const name = clangDeclarationName(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'variable', clangDeclarationAction(node));
  }
  if (/IncludeDirective|InclusionDirective/.test(kind)) {
    const name = clangIncludePath(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'module', 'import');
  }
  if (/MacroDefinition|MacroExpansion|MacroInstantiation/.test(kind)) {
    const name = clangDeclarationName(node) ?? clangIncludePath(node);
    if (name) return declarationRecord(input, nativeNodeId, name, 'macro', 'definition');
  }
  return undefined;
}
