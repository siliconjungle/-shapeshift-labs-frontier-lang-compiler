import{createJavaScriptSyntaxImporterAdapter}from'../../native-js-ts-importers.js';
import{nativeJavaScriptImporterDeps}from'./nativeJavaScriptImporterDeps.js';
export function createEstreeNativeImporterAdapter(options = {}) {
  return createJavaScriptSyntaxImporterAdapter({
    id: 'frontier.estree-native-importer',
    language: 'javascript',
    parser: 'estree',
    supportedExtensions: ['.js', '.mjs', '.cjs', '.jsx'],
    astFormat: 'estree',
    ...options
  }, nativeJavaScriptImporterDeps());
}
