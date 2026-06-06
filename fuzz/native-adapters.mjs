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

export function createFuzzNativeAdapters() {
  return {
    estreeAdapter: createEstreeNativeImporterAdapter(),
    pythonAstAdapter: createPythonAstNativeImporterAdapter(),
    rustSynAdapter: createRustSynNativeImporterAdapter(),
    clangAstAdapter: createClangAstNativeImporterAdapter(),
    goAstAdapter: createGoAstNativeImporterAdapter(),
    javaAstAdapter: createJavaAstNativeImporterAdapter(),
    kotlinPsiAdapter: createKotlinPsiNativeImporterAdapter(),
    csharpRoslynAdapter: createCSharpRoslynNativeImporterAdapter(),
    swiftSyntaxAdapter: createSwiftSyntaxNativeImporterAdapter()
  };
}

export function allFuzzNativeAdapters(adapters) {
  return [
    adapters.estreeAdapter,
    adapters.pythonAstAdapter,
    adapters.rustSynAdapter,
    adapters.clangAstAdapter,
    adapters.goAstAdapter,
    adapters.javaAstAdapter,
    adapters.kotlinPsiAdapter,
    adapters.csharpRoslynAdapter,
    adapters.swiftSyntaxAdapter
  ];
}
