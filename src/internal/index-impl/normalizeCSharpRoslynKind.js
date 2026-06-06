import{upperFirst}from'../../native-import-utils.js';
export function normalizeCSharpRoslynKind(kind) {
  const text = String(kind)
    .replace(/^(?:Microsoft\.CodeAnalysis\.CSharp\.Syntax\.|Microsoft\.CodeAnalysis\.CSharp\.)/, '')
    .replace(/Syntax$/, '');
  const compact = text.replace(/[_\s.-]+/g, '').toLowerCase();
  if (compact === 'compilationunit') return 'CompilationUnit';
  if (compact === 'usingdirective') return 'UsingDirective';
  if (compact === 'namespacedeclaration') return 'NamespaceDeclaration';
  if (compact === 'filescopednamespacedeclaration') return 'FileScopedNamespaceDeclaration';
  if (compact === 'classdeclaration') return 'ClassDeclaration';
  if (compact === 'interfacedeclaration') return 'InterfaceDeclaration';
  if (compact === 'structdeclaration') return 'StructDeclaration';
  if (compact === 'recorddeclaration') return 'RecordDeclaration';
  if (compact === 'recordstructdeclaration') return 'RecordStructDeclaration';
  if (compact === 'enumdeclaration') return 'EnumDeclaration';
  if (compact === 'methoddeclaration') return 'MethodDeclaration';
  if (compact === 'constructordeclaration') return 'ConstructorDeclaration';
  if (compact === 'destructordeclaration') return 'DestructorDeclaration';
  if (compact === 'operatordeclaration') return 'OperatorDeclaration';
  if (compact === 'conversionoperatordeclaration') return 'ConversionOperatorDeclaration';
  if (compact === 'propertydeclaration') return 'PropertyDeclaration';
  if (compact === 'indexerdeclaration') return 'IndexerDeclaration';
  if (compact === 'fielddeclaration') return 'FieldDeclaration';
  if (compact === 'variabledeclarator') return 'VariableDeclarator';
  if (compact === 'eventdeclaration') return 'EventDeclaration';
  if (compact === 'eventfielddeclaration') return 'EventFieldDeclaration';
  if (compact === 'delegatedeclaration') return 'DelegateDeclaration';
  if (compact === 'enummemberdeclaration') return 'EnumMemberDeclaration';
  if (compact === 'attributelist') return 'AttributeList';
  if (compact === 'attribute') return 'Attribute';
  if (compact === 'parameter') return 'Parameter';
  if (compact === 'incompletemember') return 'IncompleteMember';
  if (compact === 'skippedtokenstrivia' || compact === 'skippedtokens') return 'SkippedTokensTrivia';
  if (compact.endsWith('directivetrivia')) return `${upperFirst(compact.slice(0, -'directivetrivia'.length))}DirectiveTrivia`;
  if (/^[A-Z0-9_]+$/.test(text)) return text.toLowerCase().split('_').map(upperFirst).join('');
  return text;
}
