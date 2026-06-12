import { upperFirst } from './native-import-utils.js';
import { nativeDeclaration, nativeImportDeclaration, sourceLines, splitParameters } from './native-region-scanner-core.js';
import { braceBlockSpan } from './native-region-scanner-spans.js';

function scanScala(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  const blockStack = [];
  let braceDepth = 0;
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    const lineStartDepth = depthAfterLeadingClosers(trimmed, braceDepth);
    while (blockStack.length && blockStack[blockStack.length - 1].bodyDepth > lineStartDepth) blockStack.pop();

    let match;
    if ((match = trimmed.match(/^package\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)/))) {
      declarations.push(nativeDeclaration(input, number, 'PackageClause', 'package', match[1], {}, false));
    } else if ((match = trimmed.match(/^import\s+(.+?);?$/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1].trim(), 'Import', 'package'));
    } else if ((match = trimmed.match(/^(?:(?:private|protected|final|sealed|abstract|case|implicit|lazy|override|inline|transparent|open)\s+)*(class|trait|object|enum)\s+([A-Za-z_]\w*)/))) {
      const owner = nearestContainer(blockStack);
      const name = scalaContainerName(owner, match[1], match[2]);
      const hasBody = trimmed.includes('{') || trimmed.includes(':');
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[1])}Def`, scalaSymbolKind(match[1]), name, owner ? { owner: owner.name } : {}, hasBody, spanOptions(input, lines, index, trimmed.includes('{'))));
      if (trimmed.includes('{')) blockStack.push({ kind: match[1], name, bodyDepth: braceDepth + 1 });
    } else if ((match = trimmed.match(/^(?:(?:private|protected|final|implicit|override|inline)\s+)*def\s+([A-Za-z_]\w*)\s*(?:\[[^\]]+\])?\s*\(([^)]*)\)/))) {
      const owner = nearestContainer(blockStack);
      const target = scalaMethodTarget(owner, match[1]);
      const hasBody = trimmed.includes('{') || trimmed.includes('=');
      declarations.push(nativeDeclaration(input, number, 'DefDef', target.owner ? 'method' : 'function', target.name, {
        parameters: splitParameters(match[2]),
        methodName: match[1],
        ...(target.owner ? { owner: target.owner, receiverKind: target.receiverKind } : {})
      }, hasBody, {
        ...spanOptions(input, lines, index, trimmed.includes('{')),
        metadata: {
          methodName: match[1],
          ...(target.owner ? { owner: target.owner, receiverKind: target.receiverKind } : {})
        }
      }));
      if (trimmed.includes('{')) blockStack.push({ kind: 'function', name: target.name, bodyDepth: braceDepth + 1 });
    } else if ((match = trimmed.match(/^(?:(?:private|protected|final|implicit|opaque)\s+)*type\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'TypeDef', 'type', match[1], {}, false));
    } else if ((match = trimmed.match(/^(?:(?:private|protected|final|implicit|lazy|override|inline)\s+)*(?:val|var)\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'ValDef', 'variable', match[1], {}, false));
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
    if (['class', 'trait', 'object', 'enum'].includes(blockStack[index].kind)) return blockStack[index];
  }
  return undefined;
}

function scalaContainerName(owner, kind, name) {
  const base = kind === 'object' ? `${name}.object` : name;
  return owner ? `${owner.name}.${base}` : base;
}

function scalaMethodTarget(owner, methodName) {
  if (!owner) return { name: methodName };
  const receiverKind = owner.kind === 'object' ? 'object' : 'member';
  return { name: `${owner.name}.${methodName}`, owner: owner.name, receiverKind };
}

function braceDelta(source) {
  return [...String(source ?? '')].reduce((delta, char) => delta + (char === '{' ? 1 : char === '}' ? -1 : 0), 0);
}

function scalaSymbolKind(kind) {
  if (kind === 'trait') return 'trait';
  if (kind === 'object') return 'module';
  if (kind === 'enum') return 'type';
  return 'class';
}

export { scanScala };
