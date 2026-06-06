import{upperFirst}from'../../native-import-utils.js';
import{safeProjectionIdentifier}from'./safeProjectionIdentifier.js';
export function renderCProjectionStubs(declarations) {
  if (!declarations.length) return '';
  return declarations.map((declaration) => {
    const name = safeProjectionIdentifier(declaration.name);
    if (declaration.kind === 'function') return `void ${name}(void);`;
    if (declaration.kind === 'type' || declaration.kind === 'class') return `typedef struct ${upperFirst(name)} ${upperFirst(name)};`;
    return `extern const int ${name};`;
  }).join('\n');
}
