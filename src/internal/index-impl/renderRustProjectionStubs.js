import{upperFirst}from'../../native-import-utils.js';
import{safeProjectionIdentifier}from'./safeProjectionIdentifier.js';
export function renderRustProjectionStubs(declarations) {
  if (!declarations.length) return '';
  return declarations.map((declaration) => {
    const name = safeProjectionIdentifier(declaration.name);
    if (declaration.kind === 'function') return `pub fn ${name}() {\n    unimplemented!(\"Frontier native source stub\");\n}`;
    if (declaration.kind === 'type' || declaration.kind === 'class') return `pub struct ${upperFirst(name)};`;
    return `pub const ${name.toUpperCase()}: () = ();`;
  }).join('\n\n');
}
