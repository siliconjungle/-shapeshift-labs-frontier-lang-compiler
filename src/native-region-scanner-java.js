import { upperFirst } from './native-import-utils.js';
import { nativeDeclaration, nativeImportDeclaration, sourceLines, splitParameters, splitTypeParameters } from './native-region-scanner-core.js';
import { braceBlockSpan } from './native-region-scanner-spans.js';

function scanJava(input) {
  const declarations = [];
  const blockStack = [];
  const lines = sourceLines(input.sourceText);
  let braceDepth = 0;
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    const lineStartDepth = depthAfterLeadingClosers(trimmed, braceDepth);
    while (blockStack.length && blockStack[blockStack.length - 1].bodyDepth > lineStartDepth) blockStack.pop();

    let match;
    if ((match = trimmed.match(/^package\s+([A-Za-z_][\w.]*);/))) {
      declarations.push(nativeDeclaration(input, number, 'PackageDeclaration', 'package', match[1], {}, false));
    } else if ((match = trimmed.match(/^import\s+(?:static\s+)?([A-Za-z_][\w.*]*);/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportDeclaration', 'package'));
    } else if ((match = trimmed.match(/^((?:(?:public|protected|private|abstract|final|static|sealed|non-sealed)\s+)*)(class|interface|enum|record|@interface)\s+([A-Za-z_$][\w$]*)/))) {
      const owner = nearestType(blockStack);
      const name = owner ? `${owner.name}.${match[3]}` : match[3];
      const kind = match[2] === '@interface' ? 'AnnotationDeclaration' : `${upperFirst(match[2])}Declaration`;
      const hasBody = trimmed.includes('{');
      declarations.push(nativeDeclaration(input, number, kind, javaSymbolKind(match[2]), name, {
        modifiers: javaModifiers(match[1]),
        ...(owner ? { owner: owner.name } : {})
      }, hasBody, spanOptions(input, lines, index, hasBody)));
      if (hasBody) blockStack.push({ kind: javaTypeStackKind(match[2]), name, bodyDepth: braceDepth + 1 });
    } else if ((match = trimmed.match(/^((?:(?:public|protected|private|abstract|final|static|synchronized|native)\s+)*)(?:<([^>]+)>\s+)?[A-Za-z_$][\w$<>\[\].?,\s]*\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*(?:throws\s+[^{]+)?(?:\{.*|;)?$/))) {
      const owner = nearestType(blockStack);
      const target = javaMethodTarget(owner, match[1], match[3]);
      const hasBody = trimmed.includes('{');
      declarations.push(nativeDeclaration(input, number, 'MethodDeclaration', target.owner ? 'method' : 'function', target.name, {
        methodName: match[3],
        modifiers: javaModifiers(match[1]),
        typeParameters: splitTypeParameters(match[2]),
        parameters: splitParameters(match[4]),
        ...(target.owner ? { owner: target.owner, receiverKind: target.receiverKind } : {})
      }, hasBody, {
        ...spanOptions(input, lines, index, hasBody),
        metadata: {
          methodName: match[3],
          modifiers: javaModifiers(match[1]),
          ...(target.owner ? { owner: target.owner, receiverKind: target.receiverKind } : {})
        }
      }));
      if (hasBody) blockStack.push({ kind: 'method', name: target.name, bodyDepth: braceDepth + 1 });
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

function nearestType(blockStack) {
  for (let index = blockStack.length - 1; index >= 0; index -= 1) {
    if (blockStack[index].kind === 'method') return undefined;
    if (['class', 'interface', 'enum', 'record', 'annotation'].includes(blockStack[index].kind)) return blockStack[index];
  }
  return undefined;
}

function javaMethodTarget(owner, modifiers, methodName) {
  if (!owner) return { name: methodName };
  const receiverKind = /\bstatic\b/.test(modifiers) ? 'static' : 'member';
  return { name: receiverKind === 'static' ? `${owner.name}.static.${methodName}` : `${owner.name}.${methodName}`, owner: owner.name, receiverKind };
}

function javaModifiers(raw) {
  return splitParameters(String(raw ?? '').trim().replace(/\s+/g, ','));
}

function javaTypeStackKind(kind) {
  if (kind === '@interface') return 'annotation';
  return String(kind).replace(/\s+/g, ' ');
}

function braceDelta(source) {
  return [...String(source ?? '')].reduce((delta, char) => delta + (char === '{' ? 1 : char === '}' ? -1 : 0), 0);
}

function javaSymbolKind(kind) {
  if (kind === 'interface' || kind === '@interface') return 'interface';
  if (kind === 'enum' || kind === 'record') return 'type';
  return 'class';
}

export { scanJava };
