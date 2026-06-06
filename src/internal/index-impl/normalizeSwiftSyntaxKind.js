import{upperFirst}from'../../native-import-utils.js';
export function normalizeSwiftSyntaxKind(kind) {
  const text = String(kind)
    .replace(/^SwiftSyntax\./, '')
    .replace(/Syntax$/, '');
  const compact = text.replace(/[_\s.-]+/g, '').toLowerCase();
  const known = {
    sourcefile: 'SourceFile',
    importdecl: 'ImportDecl',
    classdecl: 'ClassDecl',
    structdecl: 'StructDecl',
    enumdecl: 'EnumDecl',
    protocoldecl: 'ProtocolDecl',
    actordecl: 'ActorDecl',
    extensiondecl: 'ExtensionDecl',
    typealiasdecl: 'TypeAliasDecl',
    associatedtypedecl: 'AssociatedTypeDecl',
    functiondecl: 'FunctionDecl',
    initializerdecl: 'InitializerDecl',
    initdecl: 'InitializerDecl',
    deinitializerdecl: 'DeinitializerDecl',
    deinitdecl: 'DeinitializerDecl',
    subscriptdecl: 'SubscriptDecl',
    operatordecl: 'OperatorDecl',
    precedencegroupdecl: 'PrecedenceGroupDecl',
    variabledecl: 'VariableDecl',
    patternbinding: 'PatternBinding',
    enumcasedecl: 'EnumCaseDecl',
    enumcaseelement: 'EnumCaseElement',
    macrodecl: 'MacroDecl',
    macroexpansiondecl: 'MacroExpansionDecl',
    freestandingmacroexpansion: 'FreestandingMacroExpansion',
    freestandingmacroexpansionsyntax: 'FreestandingMacroExpansion',
    attributemacroexpansion: 'AttributeMacroExpansion',
    ifconfigdecl: 'IfConfigDecl',
    ifconfigexpr: 'IfConfigExpr',
    unexpectednodes: 'UnexpectedNodes',
    missingtoken: 'MissingToken',
    skippedtoken: 'SkippedToken',
    error: 'Error'
  };
  if (known[compact]) return known[compact];
  if (/^[A-Z0-9_]+$/.test(text)) return text.toLowerCase().split('_').map(upperFirst).join('');
  return text;
}
