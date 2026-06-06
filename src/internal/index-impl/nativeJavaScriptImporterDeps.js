import{uniqueStrings}from'../../native-import-utils.js';
import{createNativeImportFromSyntaxAst}from'./createNativeImportFromSyntaxAst.js';import{declarationSemanticCoverage}from'./declarationSemanticCoverage.js';import{missingInjectedParserResult}from'./missingInjectedParserResult.js';import{nativeImporterAdapterCoverage}from'./nativeImporterAdapterCoverage.js';import{normalizeParserErrors}from'./normalizeParserErrors.js';
export function nativeJavaScriptImporterDeps() {
  return {
    createNativeImportFromSyntaxAst,
    declarationSemanticCoverage,
    missingInjectedParserResult,
    nativeImporterAdapterCoverage,
    normalizeParserErrors,
    uniqueStrings
  };
}
