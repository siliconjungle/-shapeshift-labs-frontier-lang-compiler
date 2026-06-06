import{reserveUniqueId}from'../../native-import-utils.js';
import{safeProjectionIdentifier}from'./safeProjectionIdentifier.js';
export function renderTypeScriptProjectionStubs(declarations) {
  const used = new Set();
  if (!declarations.length) return 'export {};';
  return declarations.map((declaration) => {
    const name = reserveUniqueId(safeProjectionIdentifier(declaration.name), used);
    if (declaration.kind === 'function') return `export function ${name}(...args: unknown[]): never {\n  throw new Error('Frontier native source stub: implementation unavailable.');\n}`;
    if (declaration.kind === 'class') return `export class ${name} {}`;
    if (declaration.kind === 'interface') return `export interface ${name} {}`;
    if (declaration.kind === 'type' || declaration.kind === 'trait') return `export type ${name} = unknown;`;
    return `export const ${name}: unknown = undefined;`;
  }).join('\n\n');
}
