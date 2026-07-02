import{renderCAstWithSourceMap}from'@shapeshift-labs/frontier-lang-c';import{renderJavaScriptAstWithSourceMap}from'@shapeshift-labs/frontier-lang-javascript';import{renderPythonAstWithSourceMap}from'@shapeshift-labs/frontier-lang-python';import{renderRustAstWithSourceMap}from'@shapeshift-labs/frontier-lang-rust';import{renderSwiftUiAstWithSourceMap}from'@shapeshift-labs/frontier-lang-swiftui';import{renderTypeScriptAstWithSourceMap}from'@shapeshift-labs/frontier-lang-typescript';
export const sourceMapRenderers = Object.freeze({
  typescript: renderTypeScriptAstWithSourceMap,
  javascript: renderJavaScriptAstWithSourceMap,
  rust: renderRustAstWithSourceMap,
  python: renderPythonAstWithSourceMap,
  c: renderCAstWithSourceMap,
  swiftui: renderSwiftUiAstWithSourceMap
});
