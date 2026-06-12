import { uniqueStrings, upperFirst } from './native-import-utils.js';
import { nativeDeclaration, nativeImportDeclaration, sourceLines, splitParameters } from './native-region-scanner-core.js';
import { braceBlockSpan } from './native-region-scanner-spans.js';

function scanCSharp(input) {
  const declarations = [];
  const lines = sourceLines(input.sourceText);
  const blockStack = [];
  let braceDepth = 0;
  for (const [index, { line, number }] of lines.entries()) {
    const trimmed = line.trim();
    const lineStartDepth = depthAfterLeadingClosers(trimmed, braceDepth);
    while (blockStack.length && blockStack[blockStack.length - 1].bodyDepth > lineStartDepth) blockStack.pop();

    let match;
    if ((match = trimmed.match(/^using\s+([A-Za-z_]\w*)\s*=\s*(.+?)\s*;/))) {
      declarations.push(nativeDeclaration(input, number, 'UsingAliasDirective', 'type', match[1], { target: match[2].trim() }, false));
    } else if ((match = trimmed.match(/^using\s+(?:static\s+)?([A-Za-z_][\w.]*)\s*;/))) {
      declarations.push(nativeImportDeclaration(input, number, match[1], 'UsingDirective', 'namespace'));
    } else if ((match = trimmed.match(/^namespace\s+([A-Za-z_][\w.]*)/))) {
      const hasBody = trimmed.includes('{');
      declarations.push(nativeDeclaration(input, number, 'NamespaceDeclaration', 'namespace', match[1], {}, hasBody, spanOptions(input, lines, index, hasBody)));
      if (hasBody) blockStack.push({ kind: 'namespace', name: match[1], bodyDepth: braceDepth + 1 });
    } else if ((match = trimmed.match(/^((?:(?:public|protected|private|internal|static|unsafe|new)\s+)*)delegate\s+(.+?)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*;/))) {
      declarations.push(nativeDeclaration(input, number, 'DelegateDeclaration', 'type', match[3], {
        returnType: match[2].trim(),
        parameters: splitParameters(match[4]),
        modifiers: csharpModifiers(match[1])
      }, false));
    } else if ((match = trimmed.match(/^((?:(?:public|protected|private|internal|abstract|sealed|static|partial|readonly|ref|unsafe)\s+)*)(class|interface|struct|enum|record(?:\s+(?:class|struct))?)\s+([A-Za-z_]\w*)/))) {
      const owner = nearestType(blockStack);
      const name = owner ? `${owner.name}.${match[3]}` : match[3];
      const hasBody = trimmed.includes('{');
      declarations.push(nativeDeclaration(input, number, csharpDeclarationKind(match[2]), csharpSymbolKind(match[2]), name, {
        csharpKind: match[2].replace(/\s+/g, ' '),
        modifiers: csharpModifiers(match[1]),
        ...(owner ? { owner: owner.name } : {})
      }, hasBody, spanOptions(input, lines, index, hasBody)));
      if (hasBody) blockStack.push({ kind: csharpTypeStackKind(match[2]), name, bodyDepth: braceDepth + 1 });
    } else if ((match = trimmed.match(/^((?:(?:public|protected|private|internal|static|virtual|override|async|partial|sealed|abstract|extern|new|unsafe|readonly)\s+)*)(?:[A-Za-z_][\w<>\[\].?,\s]*\??|void)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)\s*(?:=>.*|\{.*|;)?$/))) {
      const parameters = splitParameters(match[3]);
      const owner = nearestType(blockStack);
      const extensionReceiver = csharpExtensionReceiver(parameters);
      const target = csharpMethodTarget(owner, match[1], match[2], extensionReceiver);
      const hasBody = trimmed.includes('{') || trimmed.includes('=>');
      declarations.push(nativeDeclaration(input, number, extensionReceiver ? 'ExtensionMethodDeclaration' : 'MethodDeclaration', target.owner ? 'method' : 'function', target.name, {
        parameters,
        methodName: match[2],
        modifiers: csharpModifiers(match[1]),
        ...(target.owner ? { owner: target.owner, receiverKind: target.receiverKind } : {}),
        ...(extensionReceiver ? { extensionReceiver } : {})
      }, hasBody, {
        ...spanOptions(input, lines, index, trimmed.includes('{')),
        metadata: {
          methodName: match[2],
          modifiers: csharpModifiers(match[1]),
          ...(target.owner ? { owner: target.owner, receiverKind: target.receiverKind } : {}),
          ...(extensionReceiver ? { extensionReceiver } : {})
        }
      }));
      if (trimmed.includes('{')) blockStack.push({ kind: 'method', name: target.name, bodyDepth: braceDepth + 1 });
    } else if ((match = trimmed.match(/^((?:(?:public|protected|private|internal|static|virtual|override|abstract|sealed|new|unsafe)\s+)*)event\s+(.+?)\s+([A-Za-z_]\w*)\s*(?:[;{=]|=>)/))) {
      const owner = nearestType(blockStack);
      const name = owner ? `${owner.name}.${match[3]}` : match[3];
      declarations.push(nativeDeclaration(input, number, 'EventDeclaration', 'event', name, {
        eventType: match[2].trim(),
        accessors: csharpAccessors(trimmed),
        modifiers: csharpModifiers(match[1]),
        ...(owner ? { owner: owner.name, eventName: match[3] } : {})
      }, trimmed.includes('{'), spanOptions(input, lines, index, trimmed.includes('{'))));
    } else if ((match = trimmed.match(/^((?:(?:public|protected|private|internal|static|virtual|override|abstract|sealed|new|required|readonly|unsafe)\s+)*)([A-Za-z_][\w<>\[\].?,\s]*\??)\s+([A-Za-z_]\w*)\s*(?:\{|=>)/))) {
      const owner = nearestType(blockStack);
      const name = owner ? `${owner.name}.${match[3]}` : match[3];
      declarations.push(nativeDeclaration(input, number, 'PropertyDeclaration', 'property', name, {
        propertyType: match[2].trim(),
        accessors: csharpAccessors(trimmed),
        modifiers: csharpModifiers(match[1]),
        ...(owner ? { owner: owner.name, propertyName: match[3] } : {})
      }, trimmed.includes('{') || trimmed.includes('=>'), spanOptions(input, lines, index, trimmed.includes('{'))));
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
    if (['class', 'interface', 'struct', 'record'].includes(blockStack[index].kind)) return blockStack[index];
  }
  return undefined;
}

function csharpMethodTarget(owner, modifiers, methodName, extensionReceiver) {
  if (extensionReceiver) return { name: `${extensionReceiver.type}.extension.${methodName}`, owner: extensionReceiver.type, receiverKind: 'extension' };
  if (!owner) return { name: methodName };
  const receiverKind = /\bstatic\b/.test(modifiers) ? 'static' : 'member';
  return { name: receiverKind === 'static' ? `${owner.name}.static.${methodName}` : `${owner.name}.${methodName}`, owner: owner.name, receiverKind };
}

function csharpModifiers(raw) {
  return splitParameters(String(raw ?? '').trim().replace(/\s+/g, ','));
}

function csharpTypeStackKind(kind) {
  const normalized = String(kind).replace(/\s+/g, ' ');
  if (normalized.startsWith('record')) return 'record';
  if (normalized === 'enum') return 'enum';
  if (normalized === 'struct') return 'struct';
  if (normalized === 'interface') return 'interface';
  return 'class';
}

function csharpSymbolKind(kind) {
  const normalized = String(kind).replace(/\s+/g, ' ');
  if (normalized === 'interface') return 'interface';
  if (normalized === 'struct' || normalized === 'enum' || normalized.startsWith('record')) return 'type';
  return 'class';
}

function csharpDeclarationKind(kind) {
  const normalized = String(kind).replace(/\s+/g, ' ');
  if (normalized === 'record struct') return 'RecordStructDeclaration';
  if (normalized === 'record class') return 'RecordClassDeclaration';
  if (normalized === 'record') return 'RecordDeclaration';
  return `${upperFirst(normalized)}Declaration`;
}

function csharpExtensionReceiver(parameters) {
  const match = String(parameters?.[0] ?? '').match(/^this\s+(.+?)\s+([A-Za-z_]\w*)$/);
  return match ? { type: match[1].trim(), name: match[2] } : undefined;
}

function csharpAccessors(source) {
  return uniqueStrings([...String(source ?? '').matchAll(/\b(get|set|init|add|remove)\b/g)].map((match) => match[1]));
}

function braceDelta(source) {
  return [...String(source ?? '')].reduce((delta, char) => delta + (char === '{' ? 1 : char === '}' ? -1 : 0), 0);
}

export { scanCSharp };
