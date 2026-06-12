import { upperFirst } from './native-import-utils.js';
import { nativeDeclaration, nativeImportDeclaration, sourceLines, splitParameters, splitTypeParameters } from './native-region-scanner-core.js';
import { braceBlockSpan } from './native-region-scanner-spans.js';

function scanSwift(input) {
  const declarations = [];
  const protocols = new Set();
  const blockStack = [];
  const lines = sourceLines(input.sourceText);
  let braceDepth = 0;
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    const declarationLine = trimmed.replace(/^(?:@[A-Za-z_][\w.]+(?:\([^)]*\))?\s+)*/, '');
    const lineStartDepth = depthAfterLeadingClosers(declarationLine, braceDepth);
    while (blockStack.length && blockStack[blockStack.length - 1].bodyDepth > lineStartDepth) blockStack.pop();

    let match;
    if ((match = declarationLine.match(/^import\s+(?:(?:struct|class|enum|protocol|func|var)\s+)?([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'ImportDecl', 'module'));
    } else if ((match = declarationLine.match(/^((?:(?:public|private(?:\([^)]*\))?|fileprivate|internal|open|final|indirect)\s+)*)(struct|class|enum|protocol|actor)\s+([A-Za-z_]\w*)/))) {
      const owner = nearestSwiftOwner(blockStack);
      const name = owner ? `${owner.name}.${match[3]}` : match[3];
      if (match[2] === 'protocol') protocols.add(name);
      const hasBody = declarationLine.includes('{');
      declarations.push(nativeDeclaration(input, number, `${upperFirst(match[2])}Decl`, swiftSymbolKind(match[2]), name, {
        modifiers: swiftModifiers(match[1]),
        ...(owner ? { owner: owner.name } : {})
      }, hasBody, spanOptions(input, lines, index, hasBody)));
      if (hasBody) blockStack.push({ kind: swiftTypeStackKind(match[2]), name, bodyDepth: braceDepth + 1 });
    } else if ((match = declarationLine.match(/^((?:(?:public|private(?:\([^)]*\))?|fileprivate|internal|open)\s+)*)extension\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)(.*)$/))) {
      const extensionFields = parseSwiftExtensionTail(match[3]);
      const isProtocolExtension = protocols.has(match[2]) || /Protocol$/.test(match[2]);
      const receiverKind = isProtocolExtension ? 'protocolExtension' : 'extension';
      const name = `${match[2]}.${receiverKind}`;
      const hasBody = declarationLine.includes('{');
      declarations.push(nativeDeclaration(input, number, isProtocolExtension ? 'ProtocolExtensionDecl' : 'ExtensionDecl', 'implementation', name, {
        modifiers: swiftModifiers(match[1]),
        extendedType: match[2],
        receiverKind,
        ...extensionFields
      }, hasBody, spanOptions(input, lines, index, hasBody)));
      if (hasBody) blockStack.push({ kind: 'extension', name, receiverKind, receiverType: match[2], bodyDepth: braceDepth + 1 });
    } else if ((match = declarationLine.match(/^((?:(?:public|private(?:\([^)]*\))?|fileprivate|internal|open|static|class|mutating|nonmutating|override|required|convenience|isolated|nonisolated)\s+)*)(?:func\s+)([A-Za-z_]\w*|`[^`]+`)(?:\s*<([^>]+)>)?\s*\(([^)]*)\)/))) {
      const owner = nearestSwiftOwner(blockStack);
      const target = swiftMemberTarget(owner, match[1], unquoteSwiftIdentifier(match[2]));
      const hasBody = declarationLine.includes('{');
      declarations.push(nativeDeclaration(input, number, 'FunctionDecl', target.owner ? 'method' : 'function', target.name, {
        methodName: unquoteSwiftIdentifier(match[2]),
        modifiers: swiftModifiers(match[1]),
        typeParameters: splitTypeParameters(match[3]),
        parameters: splitParameters(match[4]),
        ...(target.owner ? { owner: target.owner, receiverKind: target.receiverKind, receiverType: target.receiverType } : {})
      }, hasBody, memberSpanOptions(input, lines, index, hasBody, target, unquoteSwiftIdentifier(match[2]), match[1])));
      if (hasBody) blockStack.push({ kind: 'method', name: target.name, bodyDepth: braceDepth + 1 });
    } else if ((match = declarationLine.match(/^((?:(?:public|private(?:\([^)]*\))?|fileprivate|internal|open|static|class|final|lazy|weak|unowned|override|required|nonisolated)\s+)*)(let|var)\s+([A-Za-z_]\w*)\b(?::\s*([^={]+))?/))) {
      const owner = nearestSwiftOwner(blockStack);
      const target = swiftMemberTarget(owner, match[1], match[3]);
      const hasBody = declarationLine.includes('{') || declarationLine.includes('=>');
      declarations.push(nativeDeclaration(input, number, 'PropertyDecl', 'property', target.name, {
        binding: match[2],
        modifiers: swiftModifiers(match[1]),
        valueType: match[4]?.trim(),
        ...(target.owner ? { owner: target.owner, receiverKind: target.receiverKind, receiverType: target.receiverType } : {})
      }, hasBody, memberSpanOptions(input, lines, index, hasBody, target, match[3], match[1])));
    } else if ((match = declarationLine.match(/^(?:(?:public|private(?:\([^)]*\))?|fileprivate|internal|open)\s+)*typealias\s+([A-Za-z_]\w*)\b(?:\s*=\s*(.+))?/))) {
      const owner = nearestSwiftOwner(blockStack);
      const name = owner ? `${owner.name}.${match[1]}` : match[1];
      declarations.push(nativeDeclaration(input, number, 'TypealiasDecl', 'type', name, {
        target: match[2]?.trim(),
        ...(owner ? { owner: owner.name } : {})
      }, false));
    }
    braceDepth = Math.max(0, braceDepth + braceDelta(line));
  }
  return declarations;
}

function spanOptions(input, lines, index, hasBraceBody) {
  return hasBraceBody ? { span: braceBlockSpan(input, lines, index) } : {};
}

function memberSpanOptions(input, lines, index, hasBody, target, methodName, modifiers) {
  return {
    ...spanOptions(input, lines, index, hasBody),
    metadata: {
      methodName,
      modifiers: swiftModifiers(modifiers),
      ...(target.owner ? { owner: target.owner, receiverKind: target.receiverKind, receiverType: target.receiverType } : {})
    }
  };
}

function depthAfterLeadingClosers(trimmed, depth) {
  const closers = String(trimmed).match(/^}+/)?.[0].length ?? 0;
  return Math.max(0, depth - closers);
}

function nearestSwiftOwner(blockStack) {
  for (let index = blockStack.length - 1; index >= 0; index -= 1) {
    if (blockStack[index].kind === 'method') return undefined;
    if (['actor', 'class', 'enum', 'extension', 'protocol', 'struct'].includes(blockStack[index].kind)) return blockStack[index];
  }
  return undefined;
}

function swiftMemberTarget(owner, modifiers, memberName) {
  if (!owner) return { name: memberName };
  if (owner.kind === 'extension') {
    if (/\b(?:static|class)\b/.test(modifiers)) {
      return { name: `${owner.name}.static.${memberName}`, owner: owner.name, receiverKind: 'static', receiverType: owner.receiverType };
    }
    return { name: `${owner.name}.${memberName}`, owner: owner.name, receiverKind: owner.receiverKind, receiverType: owner.receiverType };
  }
  const receiverKind = /\b(?:static|class)\b/.test(modifiers) ? 'static' : 'member';
  return { name: receiverKind === 'static' ? `${owner.name}.static.${memberName}` : `${owner.name}.${memberName}`, owner: owner.name, receiverKind };
}

function swiftModifiers(raw) {
  return splitParameters(String(raw ?? '').trim().replace(/\s+/g, ','));
}

function swiftTypeStackKind(kind) {
  return String(kind).replace(/\s+/g, ' ');
}

function braceDelta(source) {
  return [...String(source ?? '')].reduce((delta, char) => delta + (char === '{' ? 1 : char === '}' ? -1 : 0), 0);
}

function parseSwiftExtensionTail(rawTail) {
  let tail = String(rawTail ?? '').split('{')[0].trim();
  const fields = {};
  const whereMatch = tail.match(/\bwhere\b(.+)$/);
  if (whereMatch) {
    fields.constraints = whereMatch[1].trim();
    tail = tail.slice(0, whereMatch.index).trim();
  }
  if (tail.startsWith(':')) {
    fields.conformances = tail.slice(1).split(',').map((part) => part.trim()).filter(Boolean);
  }
  return fields;
}

function unquoteSwiftIdentifier(identifier) {
  return String(identifier).replace(/^`|`$/g, '');
}

function swiftSymbolKind(kind) {
  if (kind === 'protocol') return 'protocol';
  if (kind === 'extension') return 'implementation';
  if (kind === 'struct' || kind === 'enum' || kind === 'actor') return 'type';
  return 'class';
}

export { scanSwift };
