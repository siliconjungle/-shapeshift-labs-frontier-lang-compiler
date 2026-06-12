import { upperFirst } from './native-import-utils.js';
import { nativeDeclaration, nativeImportDeclaration, sourceLines, splitParameters } from './native-region-scanner-core.js';
import { braceBlockSpan } from './native-region-scanner-spans.js';

function scanKotlin(input) {
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
      declarations.push(nativeDeclaration(input, number, 'PackageHeader', 'package', match[1], {}, false));
    } else if ((match = trimmed.match(/^import\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*(?:\.\*)?)(?:\s+as\s+[A-Za-z_]\w*)?$/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportDirective', 'package'));
    } else if ((match = trimmed.match(/^(?:(?:public|private|protected|internal|expect|actual|open|final|abstract|sealed|data|value)\s+)*(?:(enum|annotation)\s+)?(class|interface|object)\s+([A-Za-z_]\w*)/))) {
      const owner = nearestContainer(blockStack);
      const name = owner ? `${owner.name}.${match[3]}` : match[3];
      const hasBody = trimmed.includes('{');
      declarations.push(nativeDeclaration(input, number, kotlinDeclarationKind(match[2], match[1]), kotlinSymbolKind(match[2], match[1]), name, owner ? { owner: owner.name } : {}, hasBody, spanOptions(input, lines, index, hasBody)));
      if (hasBody) blockStack.push({ kind: match[2], name, bodyDepth: braceDepth + 1 });
    } else if ((match = trimmed.match(/^(?:(?:public|private|protected|internal|expect|actual|open|final|abstract|inline|tailrec|operator|infix|external|suspend|override)\s+)*fun\s+(?:<[^>]+>\s*)?(?:([A-Za-z_][\w.<>?]*)\.)?([A-Za-z_]\w*)\s*\(([^)]*)\)/))) {
      const owner = nearestContainer(blockStack);
      const receiverType = match[1];
      const target = kotlinFunctionTarget(owner, receiverType, match[2]);
      const hasBody = trimmed.includes('{') || trimmed.includes('=');
      declarations.push(nativeDeclaration(input, number, 'FunctionDeclaration', target.owner ? 'method' : 'function', target.name, {
        parameters: splitParameters(match[3]),
        methodName: match[2],
        ...(target.owner ? { owner: target.owner, receiverKind: target.receiverKind } : {}),
        ...(receiverType ? { receiverType } : {})
      }, hasBody, {
        ...spanOptions(input, lines, index, trimmed.includes('{')),
        metadata: {
          methodName: match[2],
          ...(target.owner ? { owner: target.owner, receiverKind: target.receiverKind } : {}),
          ...(receiverType ? { receiverType } : {})
        }
      }));
      if (trimmed.includes('{')) blockStack.push({ kind: 'function', name: target.name, bodyDepth: braceDepth + 1 });
    } else if ((match = trimmed.match(/^(?:(?:public|private|protected|internal|expect|actual)\s+)*typealias\s+([A-Za-z_]\w*)\s*=/))) {
      declarations.push(nativeDeclaration(input, number, 'TypeAliasDeclaration', 'type', match[1], {}, false));
    } else if ((match = trimmed.match(/^(?:(?:public|private|protected|internal|expect|actual|open|final|abstract|override|const|lateinit)\s+)*(?:val|var)\s+([A-Za-z_]\w*)\b/))) {
      declarations.push(nativeDeclaration(input, number, 'PropertyDeclaration', 'variable', match[1], {}, false));
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
    if (blockStack[index].kind === 'class' || blockStack[index].kind === 'interface' || blockStack[index].kind === 'object') return blockStack[index];
  }
  return undefined;
}

function kotlinFunctionTarget(owner, receiverType, methodName) {
  if (receiverType) return { name: `${receiverType}.extension.${methodName}`, owner: receiverType, receiverKind: 'extension' };
  if (owner) return { name: `${owner.name}.${methodName}`, owner: owner.name, receiverKind: 'member' };
  return { name: methodName };
}

function braceDelta(source) {
  return [...String(source ?? '')].reduce((delta, char) => delta + (char === '{' ? 1 : char === '}' ? -1 : 0), 0);
}

function kotlinDeclarationKind(kind, prefix) {
  if (prefix === 'enum') return 'EnumClassDeclaration';
  if (prefix === 'annotation') return 'AnnotationClassDeclaration';
  return `${upperFirst(kind)}Declaration`;
}

function kotlinSymbolKind(kind, prefix) {
  if (kind === 'interface') return 'interface';
  if (kind === 'object') return 'module';
  if (prefix === 'enum' || prefix === 'annotation') return 'type';
  return 'class';
}

export { scanKotlin };
