import{upperFirst}from'../../native-import-utils.js';
export function normalizeJavaAstKind(kind) {
  const text = String(kind).replace(/^(?:com\.sun\.source\.tree\.|org\.eclipse\.jdt\.core\.dom\.|com\.github\.javaparser\.ast\.)/, '');
  const compact = text.replace(/[_\s.-]+/g, '').replace(/Tree$/, '').toLowerCase();
  if (compact === 'compilationunit' || compact === 'compilationunitnode') return 'CompilationUnit';
  if (compact === 'package' || compact === 'packagedeclaration' || compact === 'packageclause') return 'PackageDeclaration';
  if (compact === 'import' || compact === 'importdeclaration') return 'ImportDeclaration';
  if (compact === 'class' || compact === 'classdeclaration' || compact === 'normalclassdeclaration' || compact === 'classorinterfacedeclaration') return 'ClassDeclaration';
  if (compact === 'interface' || compact === 'interfacedeclaration' || compact === 'normalinterfacedeclaration') return 'InterfaceDeclaration';
  if (compact === 'enum' || compact === 'enumdeclaration') return 'EnumDeclaration';
  if (compact === 'record' || compact === 'recorddeclaration') return 'RecordDeclaration';
  if (compact === 'annotation' || compact === 'annotationdeclaration' || compact === 'annotationtypedeclaration' || compact === 'annotationinterface') return 'AnnotationDeclaration';
  if (compact === 'method' || compact === 'methoddeclaration') return 'MethodDeclaration';
  if (compact === 'constructor' || compact === 'constructordeclaration') return 'ConstructorDeclaration';
  if (compact === 'variable' || compact === 'variabledeclaration' || compact === 'variabledeclarator' || compact === 'variabletree') return 'VariableDeclarator';
  if (compact === 'field' || compact === 'fielddeclaration') return 'FieldDeclaration';
  if (compact === 'enumconstant' || compact === 'enumconstantdeclaration') return 'EnumConstantDeclaration';
  if (compact === 'parameter' || compact === 'formalparameter' || compact === 'receiverparameter') return 'Parameter';
  if (compact === 'modifiers' || compact === 'modifier') return 'Modifiers';
  if (compact === 'markerannotationexpr' || compact === 'singlememberannotationexpr' || compact === 'normalannotationexpr' || compact === 'annotationexpr') return 'Annotation';
  if (compact === 'erroneous' || compact === 'erroneoustree' || compact === 'malformed' || compact === 'error' || compact === 'errornode' || compact === 'problem' || compact === 'problemtree' || compact === 'recovered') return 'Erroneous';
  if (/^[A-Z0-9_]+$/.test(text)) return text.toLowerCase().split('_').map(upperFirst).join('');
  return text;
}
