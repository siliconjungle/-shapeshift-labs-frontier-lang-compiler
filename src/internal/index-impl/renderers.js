import{renderCAst}from'@shapeshift-labs/frontier-lang-c';import{renderJavaScriptAst}from'@shapeshift-labs/frontier-lang-javascript';import{renderPythonAst}from'@shapeshift-labs/frontier-lang-python';import{renderRustAst}from'@shapeshift-labs/frontier-lang-rust';import{renderSwiftUiAst}from'@shapeshift-labs/frontier-lang-swiftui';import{renderTypeScriptAst}from'@shapeshift-labs/frontier-lang-typescript';
export const renderers = Object.freeze({
  typescript: renderTypeScriptAst,
  javascript: renderJavaScriptAst,
  rust: renderRustAst,
  python: renderPythonAst,
  c: renderCAst,
  swiftui: renderSwiftUiAst
});
