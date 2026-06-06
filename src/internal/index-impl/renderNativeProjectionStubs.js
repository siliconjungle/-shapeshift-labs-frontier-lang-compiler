import{ensureTrailingNewline}from'./ensureTrailingNewline.js';import{nativeProjectionStubHeader}from'./nativeProjectionStubHeader.js';import{renderCProjectionStubs}from'./renderCProjectionStubs.js';import{renderGenericProjectionStubs}from'./renderGenericProjectionStubs.js';import{renderJavaScriptProjectionStubs}from'./renderJavaScriptProjectionStubs.js';import{renderPythonProjectionStubs}from'./renderPythonProjectionStubs.js';import{renderRustProjectionStubs}from'./renderRustProjectionStubs.js';import{renderTypeScriptProjectionStubs}from'./renderTypeScriptProjectionStubs.js';
export function renderNativeProjectionStubs(context, declarations, options) {
  const language = String(context.language ?? 'source').toLowerCase();
  const header = nativeProjectionStubHeader(language, context, options);
  let body;
  if (language === 'typescript' || language === 'ts') body = renderTypeScriptProjectionStubs(declarations);
  else if (language === 'javascript' || language === 'js') body = renderJavaScriptProjectionStubs(declarations);
  else if (language === 'python' || language === 'py') body = renderPythonProjectionStubs(declarations);
  else if (language === 'rust' || language === 'rs') body = renderRustProjectionStubs(declarations);
  else if (language === 'c' || language === 'cpp' || language === 'c++' || language === 'h') body = renderCProjectionStubs(declarations);
  else body = renderGenericProjectionStubs(declarations, language);
  return ensureTrailingNewline([header, body].filter(Boolean).join('\n'));
}
