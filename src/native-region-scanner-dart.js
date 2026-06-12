import { upperFirst } from './native-import-utils.js';
import { nativeDeclaration, nativeImportDeclaration, sourceLines, splitParameters } from './native-region-scanner-core.js';
import { braceBlockSpan } from './native-region-scanner-spans.js';

function scanDart(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  const blockStack = [];
  let braceDepth = 0;
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    const lineStartDepth = depthAfterLeadingClosers(trimmed, braceDepth);
    while (blockStack.length && blockStack[blockStack.length - 1].bodyDepth > lineStartDepth) blockStack.pop();

    let match;
    if ((match = trimmed.match(/^(?:import|export)\s+['"]([^'"]+)['"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'UriBasedDirective', 'library'));
    } else if ((match = trimmed.match(/^part\s+['"]([^'"]+)['"]/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'PartDirective', 'library'));
    } else if ((match = trimmed.match(/^(?:(?:abstract|base|final|interface|sealed)\s+)*(class|mixin|enum)\s+([A-Za-z_]\w*)/))) {
      const hasBody = trimmed.includes('{');
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Declaration`, dartSymbolKind(match[1]), match[2], {}, hasBody, spanOptions(input, lines, index, hasBody)));
      if (hasBody) blockStack.push({ kind: match[1], name: match[2], bodyDepth: braceDepth + 1 });
    } else if ((match = trimmed.match(/^extension(?:\s+([A-Za-z_]\w*))?\s+on\s+([A-Za-z_]\w*(?:<[^>]+>)?)\s*\{/))) {
      const name = match[1] ? `${match[1]}.extension` : `${match[2]}.extension`;
      declarations.push(nativeDeclaration(input, number, 'ExtensionDeclaration', 'implementation', name, {
        receiverType: match[2],
        ...(match[1] ? { extensionName: match[1] } : {})
      }, true, spanOptions(input, lines, index, true)));
      blockStack.push({ kind: 'extension', name, receiverType: match[2], bodyDepth: braceDepth + 1 });
    } else if ((match = trimmed.match(/^typedef\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'TypeAlias', 'type', match[1], {}, false));
    } else if ((match = trimmed.match(/^((?:(?:external|static)\s+)*)(?:[A-Za-z_]\w*(?:<[^>]+>)?\??|void)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:async\s*)?(?:\{|=>|;)/))) {
      const owner = nearestContainer(blockStack);
      const target = dartFunctionTarget(owner, match[1], match[2]);
      const hasBraceBody = trimmed.includes('{');
      declarations.push(nativeDeclaration(input, number, 'FunctionDeclaration', target.owner ? 'method' : 'function', target.name, {
        parameters: splitParameters(match[3]),
        ...(target.owner ? { owner: target.owner, methodName: match[2], receiverKind: target.receiverKind } : {}),
        ...(owner?.receiverType ? { receiverType: owner.receiverType } : {})
      }, hasBraceBody || trimmed.includes('=>'), {
        ...spanOptions(input, lines, index, hasBraceBody),
        metadata: {
          ...(target.owner ? { owner: target.owner, methodName: match[2], receiverKind: target.receiverKind } : {}),
          ...(owner?.receiverType ? { receiverType: owner.receiverType } : {})
        }
      }));
      if (hasBraceBody) blockStack.push({ kind: 'function', name: target.name, bodyDepth: braceDepth + 1 });
    } else if ((match = trimmed.match(/^(?:(?:static|external|late)\s+)*(?:const|final|var)\s+(?:[A-Za-z_]\w*(?:<[^>]+>)?\??\s+)?([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'VariableDeclaration', 'variable', match[1], {}, false));
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
    if (['class', 'mixin', 'enum', 'extension'].includes(blockStack[index].kind)) return blockStack[index];
  }
  return undefined;
}

function dartFunctionTarget(owner, modifiers, methodName) {
  if (!owner) return { name: methodName };
  if (owner.kind === 'extension') return { name: `${owner.name}.${methodName}`, owner: owner.name, receiverKind: 'extension' };
  const receiverKind = /\bstatic\b/.test(modifiers) ? 'static' : 'member';
  return { name: receiverKind === 'static' ? `${owner.name}.static.${methodName}` : `${owner.name}.${methodName}`, owner: owner.name, receiverKind };
}

function braceDelta(source) {
  return [...String(source ?? '')].reduce((delta, char) => delta + (char === '{' ? 1 : char === '}' ? -1 : 0), 0);
}

function dartSymbolKind(kind) {
  if (kind === 'mixin') return 'trait';
  if (kind === 'enum') return 'type';
  return 'class';
}

export { scanDart };
