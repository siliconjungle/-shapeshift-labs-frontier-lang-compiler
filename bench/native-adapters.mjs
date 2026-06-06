import {
  createClangAstNativeImporterAdapter,
  createCSharpRoslynNativeImporterAdapter,
  createEstreeNativeImporterAdapter,
  createGoAstNativeImporterAdapter,
  createJavaAstNativeImporterAdapter,
  createKotlinPsiNativeImporterAdapter,
  createPythonAstNativeImporterAdapter,
  createRustSynNativeImporterAdapter,
  createSwiftSyntaxNativeImporterAdapter
} from '../dist/index.js';

export function createBenchNativeAdapters() {
  return {
    estreeAdapter: createEstreeNativeImporterAdapter(),
    kotlinPsiAdapter: createKotlinPsiNativeImporterAdapter()
  };
}

export function createBenchMatrixAdapters(adapters) {
  return [
    adapters.estreeAdapter,
    createPythonAstNativeImporterAdapter(),
    createRustSynNativeImporterAdapter(),
    createClangAstNativeImporterAdapter(),
    createGoAstNativeImporterAdapter(),
    createJavaAstNativeImporterAdapter(),
    adapters.kotlinPsiAdapter,
    createCSharpRoslynNativeImporterAdapter(),
    createSwiftSyntaxNativeImporterAdapter()
  ];
}
