import {
  nativeImportBindingDeclaration,
  nativeImportDeclaration
} from './native-region-scanner-core.js';

export function jsCommonJsHelperImportDeclarations(input, lineNumber, trimmed) {
  const match = trimmed.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:[A-Za-z_$][\w$]*\s*\.\s*)?__(importStar|importDefault)\(\s*require\(\s*(['"])([^'"]+)\3\s*\)\s*\)\s*;?$/);
  if (!match) return [];
  const localName = match[1], helper = `__${match[2]}`, importPath = match[4];
  const binding = helper === '__importStar'
    ? { localName, importedName: '*', namespace: localName, importKind: 'namespace' }
    : { localName, importedName: 'default', importKind: 'default' };
  const metadata = { commonJs: true, interopHelper: helper, importKind: binding.importKind };
  return [
    nativeImportDeclaration(input, lineNumber, importPath, 'CommonJsInteropHelperRequireDeclaration', 'module', {
      fields: { moduleOnly: true, importBindings: [binding], commonJs: true, interopHelper: helper },
      metadata: { moduleOnly: true, bindingCount: 1, ...metadata }
    }),
    nativeImportBindingDeclaration(input, lineNumber, importPath, binding, {
      metadata
    })
  ];
}
