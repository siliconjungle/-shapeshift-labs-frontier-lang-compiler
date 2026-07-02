import{toCAst}from'@shapeshift-labs/frontier-lang-c';import{toJavaScriptAst}from'@shapeshift-labs/frontier-lang-javascript';import{toPythonAst}from'@shapeshift-labs/frontier-lang-python';import{toRustAst}from'@shapeshift-labs/frontier-lang-rust';import{toSwiftUiAst}from'@shapeshift-labs/frontier-lang-swiftui';import{toTypeScriptAst}from'@shapeshift-labs/frontier-lang-typescript';
export const projectors = Object.freeze({
  typescript: toTypeScriptAst,
  javascript: toJavaScriptAst,
  rust: toRustAst,
  python: toPythonAst,
  c: toCAst,
  swiftui: toSwiftUiAst
});
