import { jsControlKeyword, nativeDeclaration, nativeSignatureDeclaration, splitParameters } from './native-region-scanner-core.js';
import { jsInitializerKind, jsVariableHasBody } from './native-region-scanner-js-helpers.js';

function jsClassMemberDeclaration(input, lineNumber, declarationLine, className) {
  const method = jsClassMethodMatch(declarationLine);
  if (method && !jsControlKeyword(method.name)) return jsClassMethodDeclaration(input, lineNumber, method, className);
  const property = jsClassPropertyMatch(declarationLine);
  if (!property || jsControlKeyword(property.name)) return undefined;
  return jsClassPropertyDeclaration(input, lineNumber, property, className);
}

function jsInlineClassMemberDeclarations(input, lineNumber, declarationLine, className) {
  const open = declarationLine.indexOf('{');
  const close = declarationLine.lastIndexOf('}');
  if (open < 0 || close <= open) return [];
  const body = declarationLine.slice(open + 1, close);
  const declarations = [];
  const pattern = /((?:(?:public|private|protected|static|async|override|readonly|abstract|accessor|get|set)\s+)*)(?:async\s+)?(?:get\s+|set\s+)?(#?[A-Za-z_$][\w$]*)\??\s*(?:<[^({;]+>)?\s*\(([^)]*)\)\s*(?::\s*[^={;]+)?\s*(?:\{|=>)/g;
  for (const match of body.matchAll(pattern)) {
    const method = { modifiers: match[1], name: match[2], parameters: match[3], source: match[0] };
    if (!jsControlKeyword(method.name)) declarations.push(jsClassMethodDeclaration(input, lineNumber, method, className));
  }
  return declarations;
}

function jsClassMethodMatch(declarationLine) {
  const match = declarationLine.match(/^((?:(?:public|private|protected|static|async|override|readonly|abstract|accessor|get|set)\s+)*)(?:async\s+)?(?:get\s+|set\s+)?(#?[A-Za-z_$][\w$]*)\??\s*(?:<[^({;]+>)?\s*\(([^)]*)\)\s*(?::\s*[^={]+)?(?:\{|=>|$)/);
  if (!match) return undefined;
  return { modifiers: match[1], name: match[2], parameters: match[3], source: declarationLine };
}

function jsClassPropertyMatch(declarationLine) {
  const match = declarationLine.match(/^((?:(?:public|private|protected|static|readonly|declare|accessor)\s+)*)(#?[A-Za-z_$][\w$]*)[?!]?\s*(?::\s*([^=;{]+))?(?:[=;]|$)/);
  if (!match) return undefined;
  return { modifiers: match[1], name: match[2], source: declarationLine, valueType: match[3]?.trim() };
}

function jsClassMethodDeclaration(input, lineNumber, method, className) {
  const target = jsClassMemberTarget(className, method.modifiers, method.name);
  const hasBody = String(method.source ?? '').includes('{') || String(method.source ?? '').includes('=>');
  return (hasBody ? nativeDeclaration : nativeSignatureDeclaration)(input, lineNumber, 'MethodDefinition', 'method', target.name, {
    methodName: method.name,
    owner: className,
    receiverKind: target.receiverKind,
    accessorKind: jsAccessorKind(method.modifiers),
    modifiers: jsModifiers(method.modifiers),
    parameters: splitParameters(method.parameters)
  }, hasBody, { metadata: jsClassMemberMetadata(className, target, method.name, method.modifiers) });
}

function jsClassPropertyDeclaration(input, lineNumber, property, className) {
  const initializerKind = jsInitializerKind(property.source ?? '', property.name);
  const hasBody = jsVariableHasBody(initializerKind, property.source ?? '');
  const target = jsClassMemberTarget(className, property.modifiers, property.name);
  return nativeDeclaration(input, lineNumber, 'PropertyDefinition', initializerKind === 'function' ? 'function' : 'property', target.name, {
    propertyName: property.name,
    owner: className,
    receiverKind: target.receiverKind,
    valueType: property.valueType,
    initializerKind,
    modifiers: jsModifiers(property.modifiers)
  }, hasBody, {
    regionKind: initializerKind === 'function' ? 'body' : 'property',
    metadata: {
      initializerKind,
      ...jsClassMemberMetadata(className, target, property.name, property.modifiers)
    }
  });
}

function jsClassMemberTarget(className, modifiers, memberName) {
  const receiverKind = /\bstatic\b/.test(modifiers) ? 'static' : 'member';
  return {
    name: receiverKind === 'static' ? `${className}.static.${memberName}` : `${className}.${memberName}`,
    receiverKind
  };
}

function jsClassMemberMetadata(owner, target, memberName, modifiers) {
  return {
    owner,
    receiverKind: target.receiverKind,
    propertyName: memberName,
    methodName: memberName,
    modifiers: jsModifiers(modifiers),
    accessorKind: jsAccessorKind(modifiers)
  };
}

function jsAccessorKind(modifiers) {
  if (/\bget\b/.test(modifiers)) return 'get';
  if (/\bset\b/.test(modifiers)) return 'set';
  return undefined;
}

function jsModifiers(raw) {
  return String(raw ?? '').trim().split(/\s+/).filter(Boolean);
}

export { jsClassMemberDeclaration, jsInlineClassMemberDeclarations };
