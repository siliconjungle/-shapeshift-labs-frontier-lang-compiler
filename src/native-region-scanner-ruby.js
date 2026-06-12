import { nativeDeclaration, nativeImportDeclaration, sourceLines, splitParameters } from './native-region-scanner-core.js';
import { endKeywordBlockSpan } from './native-region-scanner-spans.js';

function scanRuby(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  const blockStack = [];
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^end\b/.test(trimmed)) {
      blockStack.pop();
      continue;
    }

    let match;
    if ((match = trimmed.match(/^(?:require|load)\s+['"]([^'"]+)['"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'Require', 'module'));
    } else if ((match = trimmed.match(/^module\s+([A-Za-z_]\w*(?:::[A-Za-z_]\w*)*)/))) {
      const name = qualifiedContainerName(blockStack, match[1]);
      declarations.push(nativeDeclaration(input, number, 'Module', 'module', name, {}, true, endSpanOptions(input, lines, index)));
      blockStack.push({ kind: 'module', name });
    } else if ((match = trimmed.match(/^class\s+([A-Za-z_]\w*(?:::[A-Za-z_]\w*)*)/))) {
      const name = qualifiedContainerName(blockStack, match[1]);
      declarations.push(nativeDeclaration(input, number, 'Class', 'class', name, {}, true, endSpanOptions(input, lines, index)));
      blockStack.push({ kind: 'class', name });
    } else if ((match = trimmed.match(/^def\s+(?:(self|[A-Za-z_]\w*(?:::[A-Za-z_]\w*)*)\.)?([A-Za-z_]\w*[!?=]?)\s*(?:\(([^)]*)\)|([^#=]*))?/))) {
      const owner = nearestContainer(blockStack);
      const target = rubyMethodTarget(owner, match[1], match[2]);
      declarations.push(nativeDeclaration(input, number, 'Def', target.owner ? 'method' : 'function', target.name, {
        parameters: splitParameters(match[3] ?? match[4]),
        methodName: match[2],
        ...(target.owner ? { owner: target.owner, receiverKind: target.receiverKind } : {})
      }, true, {
        ...endSpanOptions(input, lines, index),
        metadata: {
          methodName: match[2],
          ...(target.owner ? { owner: target.owner, receiverKind: target.receiverKind } : {})
        }
      }));
      blockStack.push({ kind: 'def', name: target.name });
    }
  }
  return declarations;
}

function endSpanOptions(input, lines, index) {
  return { span: endKeywordBlockSpan(input, lines, index) };
}

function qualifiedContainerName(blockStack, name) {
  if (name.includes('::')) return name;
  const owner = nearestContainer(blockStack);
  return owner?.kind === 'module' ? `${owner.name}::${name}` : name;
}

function nearestContainer(blockStack) {
  for (let index = blockStack.length - 1; index >= 0; index -= 1) {
    if (blockStack[index].kind === 'class' || blockStack[index].kind === 'module') return blockStack[index];
    if (blockStack[index].kind === 'def') return undefined;
  }
  return undefined;
}

function rubyMethodTarget(owner, receiver, methodName) {
  if (receiver && receiver !== 'self') return { name: `${receiver}.singleton.${methodName}`, owner: receiver, receiverKind: 'singleton' };
  if (receiver === 'self' && owner) return { name: `${owner.name}.singleton.${methodName}`, owner: owner.name, receiverKind: 'singleton' };
  if (owner) return { name: `${owner.name}.instance.${methodName}`, owner: owner.name, receiverKind: 'instance' };
  return { name: methodName };
}

export { scanRuby };
