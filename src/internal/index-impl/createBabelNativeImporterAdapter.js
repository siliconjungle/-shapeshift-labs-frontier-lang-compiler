import{createJavaScriptSyntaxImporterAdapter}from'../../native-js-ts-importers.js';
import{nativeJavaScriptImporterDeps}from'./nativeJavaScriptImporterDeps.js';
export function createBabelNativeImporterAdapter(options = {}) {
  return createJavaScriptSyntaxImporterAdapter({
    id: 'frontier.babel-native-importer',
    language: 'javascript',
    parser: 'babel',
    supportedExtensions: ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx'],
    astFormat: 'babel',
    defaultParserOptions: {
      errorRecovery: true,
      ranges: true,
      sourceType: 'unambiguous',
      plugins: ['typescript', 'jsx']
    },
    ...options
  }, nativeJavaScriptImporterDeps());
}
