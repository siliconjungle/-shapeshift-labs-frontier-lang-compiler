import { upperFirst } from './native-import-utils.js';
import { nativeDeclaration, nativeImportDeclaration, sourceLines, splitParameters } from './native-region-scanner-core.js';
import { braceBlockSpan } from './native-region-scanner-spans.js';

function scanPhp(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  const blockStack = [];
  let braceDepth = 0;
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim().replace(/^<\?php\s*/, '');
    const lineStartDepth = depthAfterLeadingClosers(trimmed, braceDepth);
    while (blockStack.length && blockStack[blockStack.length - 1].bodyDepth > lineStartDepth) blockStack.pop();

    let match;
    if ((match = trimmed.match(/^namespace\s+([A-Za-z_][\w\\]*)\s*;/))) {
      declarations.push(nativeDeclaration(input, number, 'NamespaceDefinition', 'namespace', match[1], {}, false));
    } else if ((match = trimmed.match(/^use\s+([A-Za-z_][\w\\]*)(?:\s+as\s+([A-Za-z_]\w*))?\s*;/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'UseDeclaration', 'namespace'));
    } else if ((match = trimmed.match(/^(?:(?:abstract|final|readonly)\s+)*(class|interface|trait|enum)\s+([A-Za-z_]\w*)/))) {
      const hasBody = trimmed.includes('{');
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Declaration`, phpSymbolKind(match[1]), match[2], {}, hasBody, spanOptions(input, lines, index, hasBody)));
      if (hasBody) blockStack.push({ kind: match[1], name: match[2], bodyDepth: braceDepth + 1 });
    } else if ((match = trimmed.match(/^((?:(?:public|protected|private|static|final|abstract)\s+)*)function\s+&?\s*([A-Za-z_]\w*)\s*\(([^)]*)\)/))) {
      const owner = nearestContainer(blockStack);
      const target = phpFunctionTarget(owner, match[1], match[2]);
      const hasBody = trimmed.includes('{');
      declarations.push(nativeDeclaration(input, number, 'FunctionDeclaration', target.owner ? 'method' : 'function', target.name, {
        parameters: splitParameters(match[3]),
        ...(target.owner ? { owner: target.owner, methodName: match[2], receiverKind: target.receiverKind } : {}),
        ...(match[1].trim() ? { modifiers: splitParameters(match[1].trim().replace(/\s+/g, ',')) } : {})
      }, hasBody, {
        ...spanOptions(input, lines, index, hasBody),
        metadata: {
          ...(target.owner ? { owner: target.owner, methodName: match[2], receiverKind: target.receiverKind } : {}),
          ...(match[1].trim() ? { modifiers: splitParameters(match[1].trim().replace(/\s+/g, ',')) } : {})
        }
      }));
      if (hasBody) blockStack.push({ kind: 'function', name: target.name, bodyDepth: braceDepth + 1 });
    }
    braceDepth = Math.max(0, braceDepth + braceDelta(line));
  }
  return declarations;
}

function spanOptions(input, lines, index, hasBraceBody) {
  return hasBraceBody ? { span: braceBlockSpan(input, lines, index) } : {};
}

function depthAfterLeadingClosers(trimmed, depth) {
  const closers = String(trimmed).match(/^}+/)?.[0].length ?? 0;
  return Math.max(0, depth - closers);
}

function nearestContainer(blockStack) {
  for (let index = blockStack.length - 1; index >= 0; index -= 1) {
    if (blockStack[index].kind === 'function') return undefined;
    if (['class', 'interface', 'trait', 'enum'].includes(blockStack[index].kind)) return blockStack[index];
  }
  return undefined;
}

function phpFunctionTarget(owner, modifiers, methodName) {
  if (!owner) return { name: methodName };
  const receiverKind = /\bstatic\b/.test(modifiers) ? 'static' : 'instance';
  return { name: receiverKind === 'static' ? `${owner.name}.static.${methodName}` : `${owner.name}.${methodName}`, owner: owner.name, receiverKind };
}

function braceDelta(source) {
  return [...String(source ?? '')].reduce((delta, char) => delta + (char === '{' ? 1 : char === '}' ? -1 : 0), 0);
}

function phpSymbolKind(kind) {
  if (kind === 'interface') return 'interface';
  if (kind === 'trait') return 'trait';
  if (kind === 'enum') return 'type';
  return 'class';
}

export { scanPhp };
