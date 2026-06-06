import{reserveUniqueId}from'../../native-import-utils.js';
import{safeProjectionIdentifier}from'./safeProjectionIdentifier.js';
export function renderJavaScriptProjectionStubs(declarations) {
  const used = new Set();
  if (!declarations.length) return 'export {};';
  return declarations.map((declaration) => {
    const name = reserveUniqueId(safeProjectionIdentifier(declaration.name), used);
    if (declaration.kind === 'function') return `export function ${name}(...args) {\n  throw new Error('Frontier native source stub: implementation unavailable.');\n}`;
    if (declaration.kind === 'class') return `export class ${name} {}`;
    return `export const ${name} = undefined;`;
  }).join('\n\n');
}
